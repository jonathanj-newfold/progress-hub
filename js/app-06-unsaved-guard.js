// ── Unsaved-changes guard ─────────────────────────────────────────────────
// Pressing Escape or clicking the dark area outside an editable popup used to either do
// nothing or throw the edits away. For every popup registered below, a dismiss like that now
// asks first when something was changed: Save / Discard / Keep editing. If nothing was
// changed it just closes. The explicit Cancel / Close / X buttons are untouched (they still
// mean "discard"), except the threshold editor's Cancel which already asked before.
//
// "Changed" is detected by snapshotting every field in the popup the moment it opens and
// comparing on dismiss — so new popups only need a registration line. Popups whose state
// isn't just form fields (the threshold editor's draft, the password boxes) pass isDirty.
// Popups that apply each change immediately (working-days calendars, avatar picker, theme
// picker) have nothing to lose and aren't guarded.
(function(){
  'use strict';
  const guards={};
  const snaps={};
  const stack=[]; // open overlays, most recently opened last (so Escape closes the top one)
  const PROMPT_ID='unsaved-guard-modal';
  let pending=null;
  let downTarget=null;

  const $=id=>document.getElementById(id);
  const isOpen=el=>!!el&&el.classList.contains('open');
  function snapshot(root){
    const out=[];
    root.querySelectorAll('input,textarea,select').forEach(f=>{
      if(f.type==='file'||f.type==='button'||f.type==='submit')return;
      out.push((f.type==='checkbox'||f.type==='radio')?(f.checked?'1':'0'):f.value);
    });
    return out.join('\u0001');
  }
  function register(id,cfg){
    guards[id]=Object.assign({id,closeAfterSave:true},cfg);
  }
  function isDirty(g){
    if(typeof g.isDirty==='function')return !!g.isDirty();
    const el=$(g.id);
    return !!el&&snaps[g.id]!==undefined&&snapshot(el)!==snaps[g.id];
  }

  // Track which overlays are open (and since when) so we know which is on top.
  function onClassChange(el){
    const open=isOpen(el);
    const i=stack.indexOf(el);
    if(open&&i===-1){stack.push(el);if(guards[el.id])snaps[el.id]=snapshot(el);}
    if(!open&&i!==-1){stack.splice(i,1);delete snaps[el.id];}
  }
  function watch(el){
    if(el.__ugWatched)return;
    el.__ugWatched=true;
    new MutationObserver(()=>onClassChange(el)).observe(el,{attributes:true,attributeFilter:['class']});
    onClassChange(el);
  }
  function watchAll(){document.querySelectorAll('.modal-overlay,.ann-overlay').forEach(watch);}
  function topOpen(){
    for(let i=stack.length-1;i>=0;i--){if(isOpen(stack[i]))return stack[i];}
    return null;
  }

  function showPrompt(g){
    pending=g;
    const p=$(PROMPT_ID);if(!p)return;
    p.classList.add('open');
    const b=$('ug-save-btn');if(b)setTimeout(()=>b.focus(),30);
  }
  function hidePrompt(){
    const p=$(PROMPT_ID);if(p)p.classList.remove('open');
    pending=null;
  }
  function requestDismiss(g){
    if(isDirty(g))showPrompt(g);
    else g.discard();
  }

  window.ugKeep=function(){hidePrompt();};
  window.ugDiscard=function(){
    const g=pending;hidePrompt();
    if(g)try{g.discard();}catch(e){}
  };
  window.ugSave=async function(){
    const g=pending;hidePrompt();
    if(!g)return;
    try{await g.save();}catch(e){console.warn('[unsaved-guard] save failed',e);}
    // A save that fails validation leaves the popup open with its edits; one that succeeds but
    // keeps the popup open (thresholds, password) gets closed here.
    const el=$(g.id);
    if(g.closeAfterSave&&isOpen(el)&&!isDirty(g))try{g.discard();}catch(e){}
  };
  // Lets a popup's own close function (e.g. the threshold editor's Cancel) use the same prompt.
  window.phUnsavedPrompt=function(id){const g=guards[id];if(!g)return false;showPrompt(g);return true;};

  // Escape: prompt → keep editing; otherwise act on the top-most open popup if it's guarded.
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    const prompt=$(PROMPT_ID);
    if(isOpen(prompt)){e.preventDefault();e.stopImmediatePropagation();hidePrompt();return;}
    const top=topOpen();
    if(!top||!guards[top.id])return; // not ours — existing handlers deal with it
    e.preventDefault();e.stopImmediatePropagation();
    requestDismiss(guards[top.id]);
  },true);

  // Backdrop click: only counts when the mouse was pressed AND released on the backdrop, so
  // dragging a text selection out of a field never dismisses (or loses) anything.
  document.addEventListener('mousedown',e=>{downTarget=e.target;},true);
  document.addEventListener('click',function(e){
    const t=e.target;
    if(!t||!t.id||!guards[t.id]||!isOpen(t))return;
    e.stopImmediatePropagation();
    if(downTarget===t)requestDismiss(guards[t.id]);
    downTarget=null;
  },true);

  // ── Registrations (functions are looked up lazily — they live in the other scripts) ──
  register('rename-member-modal',{save:()=>confirmRenameMember(),discard:()=>closeRenameMemberModal()});
  register('add-member-modal',{save:()=>confirmAddMember(),discard:()=>closeAddMemberModal()});
  register('new-period-modal',{save:()=>createPeriod(),discard:()=>closeModal()});
  register('edit-row-modal',{save:()=>saveEditRow(),discard:()=>closeEditModal()});
  register('ann-modal',{save:()=>saveAnn(),discard:()=>closeAnnModal()});
  register('thresh-editor-modal',{isDirty:()=>threshEditorDirty,save:()=>applyThreshEditor(),discard:()=>closeThreshEditor(true)});
  register('security-modal',{
    isDirty:()=>{const a=$('sec-pw1'),b=$('sec-pw2');return !!((a&&a.value)||(b&&b.value));},
    save:()=>securitySavePassword(),discard:()=>closeSecurityModal()
  });
  // Pick-and-confirm popups: nothing typed, so they just close on Escape / backdrop.
  register('delete-member-data-modal',{isDirty:()=>false,save:()=>{},discard:()=>closeDeleteMemberDataModal()});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchAll);else watchAll();
})();
