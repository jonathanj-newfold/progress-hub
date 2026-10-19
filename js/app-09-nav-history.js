// ═══════════════════════════════════════════════════════════════════════════
// Back / Forward navigation between pages.
//
// Progress Hub opens in its own window, so there is no browser Back button.
// This keeps a history of the pages you visit (showPage wrapper) and adds:
//   • a right-click menu with Back / Forward and quick links to Dashboard, Team View, Data and Settings
//   • mouse side buttons (Back / Forward) and Alt+Left / Alt+Right
// Right-click keeps the normal browser menu inside text fields and whenever
// text is selected, so copy / paste still works.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';
  const MAX=50;
  let hist=['dashboard'],idx=0,busy=false;
  const origShowPage=window.showPage;
  if(typeof origShowPage!=='function')return;

  function label(name){
    const b=document.getElementById('nav-'+name);
    const t=b?b.textContent.replace(/\s+/g,' ').trim():'';
    return t||name.charAt(0).toUpperCase()+name.slice(1);
  }
  function current(){
    for(const n of (typeof PAGE_IDS!=='undefined'?PAGE_IDS:[])){
      const el=document.getElementById('page-'+n);
      if(el&&el.style.display!=='none')return n;
    }
    return hist[idx];
  }

  window.showPage=function(name){
    const r=origShowPage.apply(this,arguments);
    if(!busy&&hist[idx]!==name){
      hist=hist.slice(0,idx+1);
      hist.push(name);
      if(hist.length>MAX)hist.shift();
      idx=hist.length-1;
    }
    return r;
  };

  function go(step){
    const t=idx+step;
    if(t<0||t>=hist.length)return false;
    busy=true;
    try{idx=t;origShowPage(hist[idx]);}finally{busy=false;}
    return true;
  }
  window.navBack=function(){return go(-1);};
  window.navForward=function(){return go(1);};

  // ── Right-click menu ──────────────────────────────────────────────────────
  let menu=null;
  function closeMenu(){if(menu){menu.remove();menu=null;}}
  function item(text,hint,enabled,fn){
    const b=document.createElement('button');
    b.type='button';b.className='nh-item';b.disabled=!enabled;
    const s=document.createElement('span');s.textContent=text;
    const h=document.createElement('span');h.className='nh-hint';h.textContent=hint||'';
    b.appendChild(s);b.appendChild(h);
    b.addEventListener('click',()=>{closeMenu();fn();});
    return b;
  }
  function openMenu(x,y){
    closeMenu();
    menu=document.createElement('div');
    menu.className='nh-menu';
    const back=idx>0,fwd=idx<hist.length-1;
    menu.appendChild(item('← Back'+(back?' to '+label(hist[idx-1]):''),'Alt+←',back,()=>go(-1)));
    menu.appendChild(item('→ Forward'+(fwd?' to '+label(hist[idx+1]):''),'Alt+→',fwd,()=>go(1)));
    const sep=document.createElement('div');sep.className='nh-sep';menu.appendChild(sep);
    const cur=current();
    menu.appendChild(item('Dashboard','',cur!=='dashboard',()=>{if(typeof goDashboard==='function')goDashboard();else window.showPage('dashboard');}));
    menu.appendChild(item('Team View','',cur!=='team',()=>window.showPage('team')));
    menu.appendChild(item('Data','',cur!=='survey',()=>window.showPage('survey')));
    menu.appendChild(item('Settings','',cur!=='settings',()=>window.showPage('settings')));
    document.body.appendChild(menu);
    const r=menu.getBoundingClientRect();
    menu.style.left=Math.max(4,Math.min(x,window.innerWidth-r.width-4))+'px';
    menu.style.top=Math.max(4,Math.min(y,window.innerHeight-r.height-4))+'px';
  }

  function wantsNativeMenu(e){
    const t=e.target;
    if(t&&t.closest&&t.closest('input,textarea,select,[contenteditable="true"]'))return true;
    const sel=window.getSelection&&window.getSelection();
    return !!(sel&&String(sel).length>0);
  }
  document.addEventListener('contextmenu',e=>{
    if(e.target&&e.target.closest&&e.target.closest('.nh-menu')){e.preventDefault();return;}
    if(wantsNativeMenu(e)){closeMenu();return;}
    e.preventDefault();
    openMenu(e.clientX,e.clientY);
  });
  document.addEventListener('mousedown',e=>{if(menu&&!e.target.closest('.nh-menu'))closeMenu();},true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&menu){closeMenu();return;}
    if(e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){
      if(e.target&&e.target.closest&&e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
      e.preventDefault();go(e.key==='ArrowLeft'?-1:1);
    }
  });
  // Mouse side buttons: 3 = back, 4 = forward
  document.addEventListener('mouseup',e=>{
    if(e.button===3){e.preventDefault();go(-1);}
    else if(e.button===4){e.preventDefault();go(1);}
  });
  window.addEventListener('blur',closeMenu);
  window.addEventListener('scroll',closeMenu,true);
  window.addEventListener('resize',closeMenu);
})();
