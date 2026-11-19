// ── Manual survey entry (v3.15.98.0) ─────────────────────────────────────────
// "Add survey" (one) and "Add in bulk" (many) on the Survey page. Rows are written in the
// exact same shape the paste import produces and go through the same steps: duplicate Interaction
// IDs are merged/skipped (mergeSurveyGaps), the period comes from each row's date, names are
// de-duplicated, then state is saved and every view re-rendered.
const MS_LAST_AGENT_KEY='ph_ms_last_agent';
let _msChannel='Message',_msAR='';

function msEsc(s){return escHtml(s);}
function msNowStr(){
  const d=new Date();
  // Default to "now" when working in the current month, otherwise the 1st of the viewed month.
  const cur=periodKey(d.getMonth()+1,d.getFullYear());
  if(typeof activePeriodKey!=='undefined'&&activePeriodKey&&activePeriodKey!==cur){
    const [y,m]=activePeriodKey.split('-').map(Number);
    return m+'/1/'+String(y).slice(2)+' 12:00 PM';
  }
  let h=d.getHours();const ap=h>=12?'PM':'AM';h=h%12||12;
  return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2)+' '+h+':'+String(d.getMinutes()).padStart(2,'0')+' '+ap;
}
function msLastAgent(){try{return localStorage.getItem(MS_LAST_AGENT_KEY)||'';}catch(e){return '';}}
function msRememberAgent(n){try{if(n)localStorage.setItem(MS_LAST_AGENT_KEY,n);}catch(e){}}
// Reuse an existing spelling of the same name (case-insensitive) so no duplicate tile appears.
function msCanonAgent(name){
  const t=String(name||'').trim();if(!t)return '';
  const hit=getAllAgentNamesGlobal().find(n=>n.toLowerCase()===t.toLowerCase());
  return hit||t;
}
function msNormId(v){
  let t=String(v||'').trim();
  if(!t)return 'NOT_SET';
  if(/^\d+$/.test(t))return 'I-'+t;
  if(/^i-\d+$/i.test(t))return 'I-'+t.slice(2);
  return t;
}
// Returns normalized date text or '' when it isn't a real date.
function msCheckDate(v){
  const t=normalizeSurveyDate(String(v||'').trim());
  const m=t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if(!m)return '';
  const mo=+m[1],d=+m[2];
  if(mo<1||mo>12||d<1||d>31)return '';
  return t;
}
function msRatingOptions(sel){
  return '<option value="">—</option>'+[5,4,3,2,1].map(n=>`<option value="${n}"${String(sel)===String(n)?' selected':''}>${n}</option>`).join('');
}
function msCsatText(q1,q2,date){
  const a=q1===''?null:Number(q1),b=q2===''?null:Number(q2);
  const c=computeCSAT(a,b,date);
  return c===null?'—':c.toFixed(2);
}
function msBuildRow(f){
  const q1=f.q1===''||f.q1==null?null:Number(f.q1);
  const q2=f.q2===''||f.q2==null?null:Number(f.q2);
  const ar=f.ar==='yes'||f.ar==='no'?f.ar:'none';
  return{
    agent:f.agent,queue:'',id:f.id,channel:f.channel,q1,q2,
    comment:ar==='yes'?'Yes':ar==='no'?'No':'',
    csat:computeCSAT(q1,q2,f.date),ar,date:f.date
  };
}

// Same commit rules as parseSurvey(): per period, same-ID rows fill gaps or count as duplicates.
function addManualSurveys(rows){
  let added=0,updated=0,dups=0;
  const tally={},maps={};
  rows.forEach(r=>{
    const pk=_periodKeyOfDate(r.date)||activePeriodKey;
    tally[pk]=(tally[pk]||0)+1;
    const p=getPeriod(pk);
    if(!maps[pk]){
      maps[pk]=new Map();
      p.surveys.forEach(sv=>{if(sv.id&&sv.id.trim().toUpperCase()!=='NOT_SET'&&!maps[pk].has(sv.id))maps[pk].set(sv.id,sv);});
    }
    const isNotSet=!r.id||r.id.trim().toUpperCase()==='NOT_SET';
    if(!isNotSet&&maps[pk].has(r.id)){
      if(mergeSurveyGaps(maps[pk].get(r.id),r))updated++;else dups++;
      return;
    }
    if(!isNotSet)maps[pk].set(r.id,r);
    p.surveys.push(r);
    added++;
  });
  if(added||updated){
    autoMergeDuplicateAgentNames();
    autoMigratePersonalAHTLog();
    saveState();
    // Same as the import: jump to the month the new surveys belong to.
    const top=Object.keys(tally).sort((a,b)=>tally[b]-tally[a])[0];
    if(top&&top!==activePeriodKey){const [y,m]=top.split('-').map(Number);setActivePeriod(m,y);}
    renderDashboard();
    renderSurveyTable();
    if(typeof refreshWdayBadge==='function')refreshWdayBadge();
  }
  return{added,updated,dups};
}
function msDoneToast(res){
  showToast(res.added+' survey'+(res.added!==1?'s':'')+' added'+(res.updated?' · '+res.updated+' updated':'')+(res.dups?' · '+res.dups+' duplicate'+(res.dups!==1?'s':'')+' skipped':''));
}
function msFillAgentList(){
  const dl=document.getElementById('ms-agent-list');
  if(dl)dl.innerHTML=getAllAgentNamesGlobal().sort((a,b)=>a.localeCompare(b)).map(n=>`<option value="${msEsc(n)}"></option>`).join('');
}

// ── Single survey window ─────────────────────────────────────────────────────
function msPaint(){
  document.querySelectorAll('#ms-channel [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===_msChannel));
  document.querySelectorAll('#ms-ar [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===_msAR));
}
function msPickChannel(v){_msChannel=v;msPaint();}
function msPickAR(v){_msAR=(_msAR===v)?'':v;msPaint();}
function msUpdateCsat(){
  const el=document.getElementById('ms-csat');if(!el)return;
  el.textContent=msCsatText(document.getElementById('ms-q1').value,document.getElementById('ms-q2').value,document.getElementById('ms-date').value);
}
function msSetError(msg){
  const e=document.getElementById('ms-error');
  e.textContent=msg||'';e.style.display=msg?'block':'none';
}
function openManualSurvey(){
  msFillAgentList();
  document.getElementById('ms-agent').value=msLastAgent();
  document.getElementById('ms-id').value='';
  document.getElementById('ms-q1').innerHTML=msRatingOptions('');
  document.getElementById('ms-q2').innerHTML=msRatingOptions('');
  document.getElementById('ms-date').value=msNowStr();
  _msChannel='Message';_msAR='';
  msPaint();msUpdateCsat();msSetError('');
  document.getElementById('manual-survey-modal').classList.add('open');
  setTimeout(()=>{const f=document.getElementById(msLastAgent()?'ms-id':'ms-agent');if(f)f.focus();},30);
}
function closeManualSurvey(){document.getElementById('manual-survey-modal').classList.remove('open');}
function saveManualSurvey(another){
  const agent=msCanonAgent(document.getElementById('ms-agent').value);
  const date=msCheckDate(document.getElementById('ms-date').value);
  if(!agent){msSetError('Enter the support name.');return;}
  if(!date){msSetError('Enter a valid date, like 11/19/26 2:15 PM.');return;}
  const row=msBuildRow({
    agent,id:msNormId(document.getElementById('ms-id').value),channel:_msChannel,
    q1:document.getElementById('ms-q1').value,q2:document.getElementById('ms-q2').value,ar:_msAR,date
  });
  const res=addManualSurveys([row]);
  if(!res.added&&!res.updated){const _pk=(_periodKeyOfDate(date)||activePeriodKey).split('-');msSetError('Interaction '+row.id+' is already in '+periodLabel(+_pk[1],+_pk[0])+'. Nothing was added.');return;}
  msRememberAgent(agent);
  msDoneToast(res);
  if(another){
    document.getElementById('ms-agent').value=agent;
    document.getElementById('ms-id').value='';
    document.getElementById('ms-q1').innerHTML=msRatingOptions('');
    document.getElementById('ms-q2').innerHTML=msRatingOptions('');
    _msAR='';msPaint();msUpdateCsat();msSetError('');msFillAgentList();
    document.getElementById('ms-id').focus();
  }else closeManualSurvey();
}

// ── Bulk window ──────────────────────────────────────────────────────────────
function bsRowHtml(v){
  v=v||{};
  return `<tr class="bs-row">
    <td><input type="text" class="bs-agent" list="ms-agent-list" value="${msEsc(v.agent||'')}" placeholder="Name" data-ph-input="bsRefresh()"></td>
    <td><input type="text" class="bs-id" value="${msEsc(v.id||'')}" placeholder="I-..." data-ph-input="bsRefresh()"></td>
    <td><select class="bs-channel"><option${v.channel==='Voice'?'':' selected'}>Message</option><option${v.channel==='Voice'?' selected':''}>Voice</option></select></td>
    <td><select class="bs-q1" data-ph-change="bsRefresh()">${msRatingOptions(v.q1||'')}</select></td>
    <td><select class="bs-q2" data-ph-change="bsRefresh()">${msRatingOptions(v.q2||'')}</select></td>
    <td><div class="bs-csat">—</div></td>
    <td><select class="bs-ar"><option value="">—</option><option value="yes"${v.ar==='yes'?' selected':''}>Yes</option><option value="no"${v.ar==='no'?' selected':''}>No</option></select></td>
    <td><input type="text" class="bs-date" value="${msEsc(v.date||'')}" placeholder="M/D/YY h:mm AM" data-ph-input="bsRefresh()"></td>
    <td class="bs-x"><button type="button" class="icon-btn danger" title="Remove row" data-ph-click="bsRemoveRow(this)"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></td>
  </tr>`;
}
function bsReadRow(tr){
  const g=c=>tr.querySelector(c).value;
  return{agent:g('.bs-agent').trim(),id:g('.bs-id').trim(),channel:g('.bs-channel'),q1:g('.bs-q1'),q2:g('.bs-q2'),ar:g('.bs-ar'),date:g('.bs-date').trim()};
}
function bsIsBlank(f){return !f.agent&&!f.id&&!f.q1&&!f.q2&&!f.ar;}
function bsRefresh(){
  let ready=0;
  document.querySelectorAll('#bs-tbody tr').forEach(tr=>{
    const f=bsReadRow(tr);
    const d=msCheckDate(f.date);
    tr.querySelector('.bs-csat').textContent=msCsatText(f.q1,f.q2,d||f.date);
    tr.classList.remove('bs-bad');
    if(!bsIsBlank(f)&&f.agent&&d)ready++;
  });
  document.getElementById('bs-count').textContent=ready+' ready';
  document.getElementById('bs-save-label').textContent='Save '+ready+' survey'+(ready!==1?'s':'');
}
function bsAddRow(v){
  if(!v||typeof v!=='object'){
    const rows=document.querySelectorAll('#bs-tbody tr');
    const last=rows.length?bsReadRow(rows[rows.length-1]):null;
    v=last?{agent:last.agent,channel:last.channel,date:last.date}:{agent:msLastAgent(),date:msNowStr()};
  }
  document.getElementById('bs-tbody').insertAdjacentHTML('beforeend',bsRowHtml(v));
  bsRefresh();
}
function bsDuplicateLast(){
  const rows=document.querySelectorAll('#bs-tbody tr');
  if(!rows.length){bsAddRow({agent:msLastAgent(),date:msNowStr()});return;}
  const f=bsReadRow(rows[rows.length-1]);
  bsAddRow({agent:f.agent,channel:f.channel,date:f.date,q1:f.q1,q2:f.q2,ar:f.ar});
}
function bsRemoveRow(btn){
  const tr=btn.closest('tr');if(tr)tr.remove();
  if(!document.querySelectorAll('#bs-tbody tr').length)bsAddRow({agent:msLastAgent(),date:msNowStr()});
  bsRefresh();
}
function openBulkSurvey(){
  msFillAgentList();
  document.getElementById('bs-tbody').innerHTML='';
  for(let i=0;i<3;i++)document.getElementById('bs-tbody').insertAdjacentHTML('beforeend',bsRowHtml({agent:msLastAgent(),date:msNowStr()}));
  bsRefresh();msSetBulkError('');
  document.getElementById('bulk-survey-modal').classList.add('open');
  setTimeout(()=>{const f=document.querySelector('#bs-tbody .bs-id');if(f)f.focus();},30);
}
function closeBulkSurvey(){document.getElementById('bulk-survey-modal').classList.remove('open');}
function msSetBulkError(msg){const e=document.getElementById('bs-error');e.textContent=msg||'';e.style.display=msg?'block':'none';}
function saveBulkSurveys(){
  const good=[],goodTr=[];let bad=0,lastAgent='';
  document.querySelectorAll('#bs-tbody tr').forEach(tr=>{
    const f=bsReadRow(tr);
    if(bsIsBlank(f))return;
    const date=msCheckDate(f.date);
    if(!f.agent||!date){tr.classList.add('bs-bad');bad++;return;}
    const agent=msCanonAgent(f.agent);lastAgent=agent;
    good.push(msBuildRow({agent,id:msNormId(f.id),channel:f.channel,q1:f.q1,q2:f.q2,ar:f.ar,date}));
    goodTr.push(tr);
  });
  if(!good.length){msSetBulkError(bad?'Every filled row needs a support name and a valid date. Rows to fix are outlined in red.':'Nothing to save. Fill in at least one row.');return;}
  const res=addManualSurveys(good);
  msRememberAgent(lastAgent);
  msDoneToast(res);
  if(bad){
    goodTr.forEach(tr=>tr.remove());
    bsRefresh();
    msSetBulkError(bad+' row'+(bad!==1?'s':'')+' still need a support name or a valid date. The saved rows were removed.');
  }else closeBulkSurvey();
}

document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  ['manual-survey-modal','bulk-survey-modal'].forEach(id=>{
    const m=document.getElementById(id);
    if(m&&m.classList.contains('open'))m.classList.remove('open');
  });
});
