/**
 * app-07-simulator.js
 * "What-if simulator" page. Lets you stack hypothetical CSAT scores (1 → 5 in
 * 0.5 steps), AR Yes/No answers and AHT chats on top of the ACTIVE period and
 * see the projected CSAT / AR / AHT / Final KPI, their grades and the KPI-point
 * swing — before anything real happens.
 *
 * Read-only by design: it only reads state/thresholds/weights through the same
 * helpers the dashboard uses (csatBreakdown, gradeCSAT, weightCSAT, …) so the
 * numbers always match the real dashboard. Nothing is ever written to storage.
 * The scenario lives in memory and resets when you change period or hit Reset.
 *
 * Layout trick: the input fields are rendered ONCE (renderSimulator) and only
 * the result areas are re-rendered (simRefresh) — so typing in a field never
 * loses focus and a click on a chip is never swallowed by a re-render.
 */

const SIM={
  pk:'',
  who:'',               // '' = my own dashboard, otherwise a team member's raw agent name
  csat:{},               // {'4.5': count}
  ar:{yes:0,no:0},
  aht:[],                // [{sec,count}]
  cnt:1,arCnt:1,         // how many surveys each click adds
  ahtMin:10,ahtSec:0,ahtCnt:1,
  baseChats:null,        // null = auto-detect from the period's AHT log
  nCsat:10,nAr:10,nAht:10 // "next N" horizon for the target tables
};
const SIM_SCORES=[1,1.5,2,2.5,3,3.5,4,4.5,5];

// ── Baseline (what's actually logged for the active period) ──────────────
function simAutoChats(p){
  const agents=getAHTLoggedAgents(p);
  const stats=agents.map(a=>getMemberAHTStats(p,a)).filter(Boolean);
  if(stats.length){
    const per=stats.map(s=>s.totalChats>0?s.totalChats:(s.days||1));
    return Math.max(1,Math.round(per.reduce((a,b)=>a+b,0)/per.length));
  }
  const entries=Object.values(p.dailyAHT||{}).map(normAHTEntry).filter(e=>e.aht>0);
  if(entries.length){
    const c=entries.reduce((a,e)=>a+(e.count||0),0);
    return c>0?c:entries.length;
  }
  return (p.monthlyAHT>0||p.aht>0)?1:0;
}
function simBase(){
  const p=getPeriod(activePeriodKey);
  const who=SIM.who;
  const surveys=who?(p.surveys||[]).filter(s=>(s.agent||'').trim()===who):(p.surveys||[]);
  const cs=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
  const cb=csatBreakdown(cs);
  const arR=surveys.filter(s=>s.ar==='yes'||s.ar==='no');
  const dist={};  // real survey count per score (same 0.5 buckets as the dashboard)
  cs.forEach(s=>{const k=String(Math.round(Number(s.csat)*2)/2);dist[k]=(dist[k]||0)+1;});
  let sec,auto;
  if(who){
    const st=getMemberAHTStats(p,who);
    sec=st?Math.round(st.avgSec):0;
    auto=st?(st.totalChats>0?st.totalChats:(st.days||1)):0;
  }else{
    sec=computeAHTSec()||0;
    auto=simAutoChats(p);
  }
  let chats=SIM.baseChats!==null?SIM.baseChats:auto;
  if(sec>0&&chats<1)chats=1;
  return{
    p,cb,dist,rps:cb.surveys>0?cb.ratingsPerSurvey:2,
    yes:arR.filter(s=>s.ar==='yes').length,arTotal:arR.length,
    sec,chats:sec>0?chats:0,autoChats:auto,
    custom:who?Math.round(customMetricBreakdown(activePeriodKey,'team').reduce((a,r)=>a+r.pts,0)*100)/100:scoredCustomMetricsWeight(p)
  };
}
function simScn(){return{csat:SIM.csat,ar:SIM.ar,aht:SIM.aht};}
function simEmpty(){return{csat:{},ar:{yes:0,no:0},aht:[]};}
// Copy of a scenario with one extra item stacked on — used for the chip previews.
function simWith(sc,type,val,count){
  const c=JSON.parse(JSON.stringify(sc));
  if(type==='csat'){const k=String(val);c.csat[k]=(c.csat[k]||0)+count;}
  else if(type==='ar'){c.ar[val]=(c.ar[val]||0)+count;}
  else if(type==='aht'){c.aht.push({sec:val,count});}
  return c;
}

// ── Projection: same formulas the dashboard uses ─────────────────────────
// Grading context: your own dashboard uses the period's thresholds/weights; a team
// member is graded exactly like their Team View dashboard (Team thresholds).
function simCtx(){
  if(SIM.who){
    return{team:true,gC:gradeCSATTeam,gA:gradeARTeam,gH:gradeAHTTeam,
      wC:weightCSATTeam,wA:weightARTeam,wH:weightAHTTeam,
      tiers:{csat:TEAM_CSAT_THRESHOLDS,ar:TEAM_AR_THRESHOLDS,aht:TEAM_AHT_THRESHOLDS},
      W:m=>stockInScope(m,'team')?(KPI_WEIGHTS[m]||{}):{}};
  }
  return{team:false,gC:gradeCSAT,gA:gradeAR,gH:gradeAHT,
    wC:weightCSAT,wA:weightAR,wH:weightAHT,
    tiers:{csat:(activeThresh&&activeThresh.csat)||CSAT_THRESHOLDS,ar:(activeThresh&&activeThresh.ar)||AR_THRESHOLDS,aht:(activeThresh&&activeThresh.aht)||AHT_THRESHOLDS},
    W:m=>((activeThresh&&activeThresh.weights)||KPI_WEIGHTS)[m]||{}};
}
function simTiers(m){return simCtx().tiers[m];}
function simProject(b,sc){
  let addSum=0,addN=0;
  Object.keys(sc.csat).forEach(k=>{const c=sc.csat[k];addSum+=Number(k)*c*b.rps;addN+=c*b.rps;});
  const cSum=b.cb.sum+addSum,cN=b.cb.n+addN;
  const csat=cN>0?cSum/cN:null;
  const yes=b.yes+sc.ar.yes,tot=b.arTotal+sc.ar.yes+sc.ar.no;
  const ar=tot>0?yes/tot*100:null;
  let ahtW=b.sec>0?b.chats:0,ahtS=b.sec>0?b.sec*b.chats:0;
  sc.aht.forEach(e=>{ahtW+=e.count;ahtS+=e.sec*e.count;});
  const aht=ahtW>0?Math.round(ahtS/ahtW):0;
  const X=simCtx();
  const wc=X.wC(csat),wa=X.wA(ar),wh=X.wH(aht);
  const hasAny=csat!==null||ar!==null||aht>0||b.custom>0;
  const kpi=hasAny?wc+wa+wh+b.custom:null;
  const dist=Object.assign({},b.dist);
  Object.keys(sc.csat).forEach(k=>{dist[k]=(dist[k]||0)+sc.csat[k];});
  return{
    dist,csat,ar,aht,cSum,cN,yes,tot,ahtW,ahtS,wc,wa,wh,kpi,
    nSurv:b.cb.surveys+Object.keys(sc.csat).reduce((a,k)=>a+sc.csat[k],0),
    gc:csat!==null?X.gC(csat):null,
    ga:ar!==null?X.gA(ar):null,
    gh:aht>0?X.gH(aht):null,
    gk:kpi!==null?kpiScoreGrade(kpi):null
  };
}

// ── Formatting ───────────────────────────────────────────────────────────
const simFmt={
  csat:v=>v==null?'—':fmtCsat(v),
  ar:v=>v==null?'—':v.toFixed(2)+'%',
  aht:v=>v>0?fmtSec(v):'—',
  kpi:v=>v==null?'—':v.toFixed(2)+'%'
};
function simPill(g,label){
  return g?`<span class="grade-pill ${g.cls}">${escHtml(label||g.grade)}</span>`:'';
}
function simSigned(n,dp,unit){
  if(Math.abs(n)<0.0005)return `<span class="sim-delta sim-flat">±0${unit||''}</span>`;
  const cls=n>0?'sim-up':'sim-down';
  return `<span class="sim-delta ${cls}">${n>0?'+':'−'}${Math.abs(n).toFixed(dp)}${unit||''}</span>`;
}
// Delta between two metric values (lowerBetter flips the colour for AHT).
function simMetricDelta(cur,proj,dp,lowerBetter,fmt){
  if(cur==null||proj==null||(lowerBetter&&(!cur||!proj)))return '';
  const d=proj-cur;
  if(Math.abs(d)<(dp>=3?0.0005:0.005))return `<span class="sim-delta sim-flat">no change</span>`;
  const good=lowerBetter?d<0:d>0;
  const txt=fmt?fmt(Math.abs(d)):Math.abs(d).toFixed(dp);
  return `<span class="sim-delta ${good?'sim-up':'sim-down'}">${d>0?'▲':'▼'} ${txt}</span>`;
}
function simKpiDelta(n){return simSigned(n,2,' pts');}

// ── Actions (all global so events.js data-ph-* attributes can call them) ──
function simSet(k,v){
  const str=String(v==null?'':v).trim();
  let n=parseFloat(str);
  if(!isFinite(n)||n<0)n=0;
  if(k==='baseChats'){SIM.baseChats=str===''?null:Math.floor(n);}
  else if(['nCsat','nAr','nAht'].includes(k)){SIM[k]=Math.max(0,Math.min(999,Math.floor(n)));}
  else if(['cnt','arCnt','ahtCnt'].includes(k)){SIM[k]=Math.max(1,Math.min(999,Math.floor(n)));}
  else SIM[k]=n;
  simRefresh();
}
// After you finish typing, show the value actually used (e.g. 0 becomes 1).
function simNorm(k,el){
  if(!el||SIM[k]===undefined)return;
  el.value=SIM[k]===null?'':SIM[k];
}
function simAddCSAT(score){
  const k=String(score);
  SIM.csat[k]=(SIM.csat[k]||0)+SIM.cnt;
  simRefresh();
}
function simAddAR(which){
  if(which!=='yes'&&which!=='no')return;
  SIM.ar[which]+=SIM.arCnt;
  simRefresh();
}
function simAddAHT(sec){
  const s=sec>0?Math.round(sec):Math.round(SIM.ahtMin*60+SIM.ahtSec);
  if(!(s>0)){if(typeof showToast==='function')showToast('Enter an AHT first (minutes / seconds)');return;}
  const hit=SIM.aht.find(e=>e.sec===s);
  if(hit)hit.count+=SIM.ahtCnt;else SIM.aht.push({sec:s,count:SIM.ahtCnt});
  simRefresh();
}
function simRemove(type,key){
  if(type==='csat')delete SIM.csat[String(key)];
  else if(type==='ar')SIM.ar[key]=0;
  else if(type==='aht')SIM.aht.splice(Number(key),1);
  simRefresh();
}
function simWho(v){
  SIM.who=v||'';
  simClear();SIM.baseChats=null;
  renderSimulator();
}
// Open the simulator for one team member (used by the button in their dashboard).
function simOpenFor(name){
  SIM.who=name||'';
  simClear();SIM.baseChats=null;
  showPage('simulator');
}
// Everyone who can be simulated in the active period (same list Team View shows).
function simMembers(){
  const set=new Set(getAgentNamesForPeriod(activePeriodKey));
  try{getManualMembers().forEach(n=>{if(n)set.add(n);});}catch(e){}
  return[...set].filter(Boolean).sort((a,b)=>prettifyAgentName(a).localeCompare(prettifyAgentName(b)));
}
function simClear(){SIM.csat={};SIM.ar={yes:0,no:0};SIM.aht=[];}
function simReset(){
  simClear();SIM.baseChats=null;
  const el=document.getElementById('sim-in-base');if(el)el.value='';
  simRefresh();
}
function simScenarioText(){
  const b=simBase(),cur=simProject(b,simEmpty()),pr=simProject(b,simScn());
  const [y,m]=activePeriodKey.split('-').map(Number);
  const items=simItemsText();
  const L=[`What-if — ${SIM.who?prettifyAgentName(SIM.who)+' · ':''}${periodLabel(m,y)}`,items.length?('Scenario: '+items.join(', ')):'Scenario: (none — current numbers)'];
  L.push(`CSAT: ${simFmt.csat(cur.csat)} → ${simFmt.csat(pr.csat)}${pr.gc?' ('+pr.gc.grade+')':''}`);
  L.push(`AR: ${simFmt.ar(cur.ar)} → ${simFmt.ar(pr.ar)}${pr.ga?' ('+pr.ga.grade+')':''}`);
  L.push(`AHT: ${simFmt.aht(cur.aht)} → ${simFmt.aht(pr.aht)}${pr.gh?' ('+pr.gh.grade+')':''}`);
  L.push(`Final KPI: ${simFmt.kpi(cur.kpi)} → ${simFmt.kpi(pr.kpi)}${pr.gk?' ('+pr.gk.label+')':''}`);
  return L.join('\n');
}
function simItemsText(){
  const out=[];
  Object.keys(SIM.csat).sort((a,b)=>a-b).forEach(k=>out.push(`${SIM.csat[k]}× CSAT ${k}`));
  if(SIM.ar.yes)out.push(`${SIM.ar.yes}× AR Yes`);
  if(SIM.ar.no)out.push(`${SIM.ar.no}× AR No`);
  SIM.aht.forEach(e=>out.push(`${e.count}× chat @ ${fmtSec(e.sec)}`));
  return out;
}
function simCopy(){
  const txt=simScenarioText();
  const done=()=>{if(typeof showToast==='function')showToast('Scenario copied');};
  try{navigator.clipboard.writeText(txt).then(done,()=>{});}catch(e){}
}

// ── Page shell (rendered once per open / period change) ──────────────────
function renderSimulator(){
  const root=document.getElementById('sim-root');
  if(!root)return;
  if(SIM.pk!==activePeriodKey){simClear();SIM.baseChats=null;SIM.pk=activePeriodKey;}
  const members=simMembers();
  if(SIM.who&&!members.includes(SIM.who)){SIM.who='';simClear();SIM.baseChats=null;}
  const [y,m]=activePeriodKey.split('-').map(Number);
  const lbl=(m>=1&&m<=12)?periodLabel(m,y):activePeriodKey;
  const numIn=(id,key,val,w)=>`<input class="sim-input" id="${id}" type="number" min="0" step="1" value="${val}" style="width:${w||70}px" data-ph-input="simSet('${key}', this.value)" data-ph-change="simNorm('${key}', this)">`;
  root.innerHTML=`
  <div class="page-header">
    <h1>What-if simulator</h1>
    <p>Stack pretend surveys and chats on top of this period and see where CSAT, AR, AHT and the Final KPI would land. Nothing here is saved.</p>
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap">
      <label class="sim-lbl" for="sim-who">Simulate for</label>
      <select class="sim-input" id="sim-who" style="min-width:200px" data-ph-change="simWho(this.value)">
        <option value=""${SIM.who?'':' selected'}>My dashboard</option>
        ${members.length?`<optgroup label="Team members">${members.map(n=>`<option value="${escHtml(n)}"${n===SIM.who?' selected':''}>${escHtml(prettifyAgentName(n))}</option>`).join('')}</optgroup>`:''}
      </select>
      ${SIM.who?`<span class="sim-note" style="margin:0">Graded with the Team thresholds, same as their Team View dashboard.</span>`:''}
    </div>
    <div style="display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap">
      <button class="period-nav-btn" data-ph-click="shiftPeriod(-1)" title="Previous month"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
      <button class="period-badge period-badge-btn" style="margin-top:0" data-ph-click="openReelPicker(this)" title="Click to jump to a month/year">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span class="period-label-sync">${escHtml(lbl)}</span>
      </button>
      <button class="period-nav-btn" data-ph-click="shiftPeriod(1)" title="Next month"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>
      <span style="flex:1"></span>
      <button class="btn btn-ghost" data-ph-click="simCopy()">Copy scenario</button>
      <button class="btn btn-danger" data-ph-click="simReset()">Reset</button>
    </div>
  </div>

  <div class="sim-grid" id="sim-summary"></div>

  <div class="panel" style="margin-bottom:1rem">
    <div class="panel-header"><div><div class="panel-title">Your scenario</div><div class="panel-subtitle">Everything you've stacked on top of the real numbers. Click ✕ to remove an item.</div></div></div>
    <div class="sim-body" id="sim-list"></div>
  </div>

  <div class="sim-cols">
    <div class="panel">
      <div class="panel-header"><div><div class="panel-title">CSAT survey</div><div class="panel-subtitle">Click a score to add it as a new survey</div></div></div>
      <div class="sim-body">
        <div class="sim-row"><label class="sim-lbl" for="sim-in-cnt">Surveys per click</label>${numIn('sim-in-cnt','cnt',SIM.cnt)}</div>
        <div class="sim-chips" id="sim-csat-chips"></div>
        <div class="sim-sub">What it takes to move up</div><div class="sim-note" style="margin:-2px 0 8px">Set 0 to see how many in a row you need.</div>
        <div class="sim-row"><label class="sim-lbl" for="sim-in-ncsat">Over the next</label>${numIn('sim-in-ncsat','nCsat',SIM.nCsat,60)}<span class="sim-lbl">surveys</span></div>
        <div id="sim-csat-need"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div><div class="panel-title">Agent Resolution</div><div class="panel-subtitle">Add a Yes or a No answer</div></div></div>
      <div class="sim-body">
        <div class="sim-row"><label class="sim-lbl" for="sim-in-arcnt">Answers per click</label>${numIn('sim-in-arcnt','arCnt',SIM.arCnt)}</div>
        <div class="sim-yn" id="sim-ar-chips"></div>
        <div class="sim-sub">What it takes to move up</div><div class="sim-note" style="margin:-2px 0 8px">Set 0 to see how many in a row you need.</div>
        <div class="sim-row"><label class="sim-lbl" for="sim-in-nar">Over the next</label>${numIn('sim-in-nar','nAr',SIM.nAr,60)}<span class="sim-lbl">AR surveys</span></div>
        <div id="sim-ar-need"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div><div class="panel-title">AHT</div><div class="panel-subtitle">Add chats at a given handle time</div></div></div>
      <div class="sim-body">
        <div class="sim-row" style="flex-wrap:wrap">
          <label class="sim-lbl" for="sim-in-min">AHT</label>
          ${numIn('sim-in-min','ahtMin',SIM.ahtMin,56)}<span class="sim-lbl">m</span>
          ${numIn('sim-in-sec','ahtSec',SIM.ahtSec,56)}<span class="sim-lbl">s</span>
          <span class="sim-lbl">×</span>
          ${numIn('sim-in-ahtcnt','ahtCnt',SIM.ahtCnt,56)}<span class="sim-lbl">chats</span>
          <button class="btn btn-primary" data-ph-click="simAddAHT(0)">Add</button>
        </div>
        <div class="sim-sub">Or add one at a tier cutoff</div>
        <div class="sim-chips" id="sim-aht-chips"></div>
        <div class="sim-row" style="margin-top:12px"><label class="sim-lbl" for="sim-in-base">Chats already logged</label>
          <input class="sim-input" id="sim-in-base" type="number" min="0" step="1" placeholder="auto" style="width:80px" data-ph-input="simSet('baseChats', this.value)" data-ph-change="simNorm('baseChats', this)">
        </div>
        <div class="sim-note" id="sim-aht-base"></div>
        <div class="sim-sub">What it takes to move up</div><div class="sim-note" style="margin:-2px 0 8px">Set 0 to see how many in a row you need.</div>
        <div class="sim-row"><label class="sim-lbl" for="sim-in-naht">Over the next</label>${numIn('sim-in-naht','nAht',SIM.nAht,60)}<span class="sim-lbl">chats</span></div>
        <div id="sim-aht-need"></div>
      </div>
    </div>
  </div>`;
  simRefresh();
}

// ── Result areas (re-rendered on every change; inputs are never touched) ──
function simRefresh(){
  if(!document.getElementById('sim-summary'))return;
  const b=simBase(),sc=simScn();
  const cur=simProject(b,simEmpty()),pr=simProject(b,sc);
  simDrawSummary(b,cur,pr);
  simDrawList();
  simDrawCSAT(b,sc,pr);
  simDrawAR(b,sc,pr);
  simDrawAHT(b,sc,pr);
}

function simTile(label,color,valHtml,pill,nowHtml,deltaHtml,extra){
  return `<div class="sim-tile" style="--sim-c:${color}">
    <div class="sim-tile-label">${label}</div>
    <div class="sim-tile-val">${valHtml}</div>
    <div>${pill||''}${deltaHtml||''}</div>
    <div class="sim-tile-now">${nowHtml}</div>${extra||''}</div>`;
}
// ── Live counts shown inside the CSAT / AR / AHT tiles ───────────────────
// Real number + a green "+n" for whatever the scenario has stacked on top.
function simStatRow(label,col,cnt,add,max){
  const w=max>0?Math.max(cnt?3:0,Math.round(cnt/max*100)):0;
  return `<div class="sim-stat"><span class="sim-stat-k" style="color:${col}">${label}</span><div class="sim-stat-bar"><div style="width:${w}%;background:${col}"></div></div><span class="sim-stat-n">${cnt}</span><span class="sim-stat-add">${add>0?'+'+add:''}</span></div>`;
}
function simStatHead(label,total,add){
  return `<div class="sim-stat-head"><span>${label}</span><span><b>${total}</b>${add>0?` <span class="sim-up">+${add}</span>`:''}</span></div>`;
}
function simCsatStats(b,pr){
  const sim=simScn().csat;
  const scores=[5,4.5,4,3.5,3,2.5,2,1.5,1];
  const cnt=sc=>pr.dist[String(sc)]||0;
  const max=Math.max(1,...scores.map(cnt));
  const added=pr.nSurv-b.cb.surveys;
  const rows=scores.filter(sc=>Number.isInteger(sc)||cnt(sc)>0).map(sc=>{
    const col=sc>=4.9?'var(--green)':sc>=4.5?'var(--accent)':sc>=4?'var(--amber)':'var(--red)';
    return simStatRow(Number.isInteger(sc)?sc+' ★':String(sc),col,cnt(sc),sim[String(sc)]||0,max);
  }).join('');
  return `<div class="sim-stats">${simStatHead('Surveys',pr.nSurv,added)}${rows}</div>`;
}
function simArStats(b,pr){
  const sc=simScn().ar,no=pr.tot-pr.yes,max=Math.max(1,pr.yes,no);
  return `<div class="sim-stats">${simStatHead('Responses',pr.tot,sc.yes+sc.no)}`+
    simStatRow('Yes','var(--green)',pr.yes,sc.yes,max)+
    simStatRow('No','var(--red)',no,sc.no,max)+`</div>`;
}
function simAhtStats(b,pr){
  const base=b.sec>0?b.chats:0,added=pr.ahtW-base;
  const tot=pr.ahtS>0?fmtSec(Math.round(pr.ahtS)):'—';
  const baseTot=b.sec>0?fmtSec(Math.round(b.sec*b.chats)):'—';
  return `<div class="sim-stats">${simStatHead('Chats',pr.ahtW,added)}`+
    `<div class="sim-stat-line"><span>Total handle time</span><span><b>${tot}</b></span></div>`+
    (added>0?`<div class="sim-stat-line"><span>Logged only</span><span>${base} chats · ${baseTot}</span></div>`:'')+
    `</div>`;
}

function simDrawSummary(b,cur,pr){
  const el=document.getElementById('sim-summary');
  const cls=g=>g?g.gcls:'';
  const kpiExtra=`<div class="sim-tile-now" style="margin-top:6px">${[
    ['CSAT',cur.wc,pr.wc],['AR',cur.wa,pr.wa],['AHT',cur.wh,pr.wh]
  ].map(r=>`${r[0]} ${r[1]===r[2]?r[2]:r[1]+'→'+r[2]}`).join(' · ')}${b.custom?` · Custom ${b.custom}`:''}</div>`;
  el.innerHTML=
    simTile('CSAT','var(--accent)',`<span class="${cls(pr.gc)}">${simFmt.csat(pr.csat)}</span>`,simPill(pr.gc),`now ${simFmt.csat(cur.csat)}`,simMetricDelta(cur.csat,pr.csat,3,false),simCsatStats(b,pr))+
    simTile('Agent Resolution','var(--green)',`<span class="${cls(pr.ga)}">${simFmt.ar(pr.ar)}</span>`,simPill(pr.ga),`now ${simFmt.ar(cur.ar)}`,simMetricDelta(cur.ar,pr.ar,2,false,v=>v.toFixed(2)+'%'),simArStats(b,pr))+
    simTile('AHT','var(--teal)',`<span class="${cls(pr.gh)}">${simFmt.aht(pr.aht)}</span>`,simPill(pr.gh),`now ${simFmt.aht(cur.aht)}`,simMetricDelta(cur.aht,pr.aht,0,true,v=>fmtSec(v)),simAhtStats(b,pr))+
    simTile('Final KPI','var(--purple)',`<span class="${cls(pr.gk)}">${simFmt.kpi(pr.kpi)}</span>`,simPill(pr.gk,pr.gk&&pr.gk.label),`now ${simFmt.kpi(cur.kpi)}`,(cur.kpi!=null&&pr.kpi!=null)?simKpiDelta(pr.kpi-cur.kpi):'',kpiExtra);
}

function simDrawList(){
  const el=document.getElementById('sim-list');
  const tags=[];
  Object.keys(SIM.csat).sort((a,b)=>a-b).forEach(k=>tags.push(
    `<span class="sim-tag"><span><b style="color:var(--accent)">CSAT</b> ${k} × ${SIM.csat[k]}</span><button title="Remove" data-ph-click="simRemove('csat', '${k}')">✕</button></span>`));
  ['yes','no'].forEach(w=>{if(SIM.ar[w])tags.push(
    `<span class="sim-tag"><span><b style="color:var(--green)">AR</b> ${w==='yes'?'Yes':'No'} × ${SIM.ar[w]}</span><button title="Remove" data-ph-click="simRemove('ar', '${w}')">✕</button></span>`);});
  SIM.aht.forEach((e,i)=>tags.push(
    `<span class="sim-tag"><span><b style="color:var(--teal)">AHT</b> ${fmtSec(e.sec)} × ${e.count}</span><button title="Remove" data-ph-click="simRemove('aht', ${i})">✕</button></span>`));
  el.innerHTML=tags.length?`<div class="sim-tags">${tags.join('')}</div>`
    :`<div class="sim-note" style="margin:0">Nothing stacked yet — the tiles above show your real numbers. Pick a score, a Yes/No or an AHT below.</div>`;
}

function simChip(top,val,gcls,sub,onclick,title){
  return `<button class="sim-chip" title="${escHtml(title||'')}" data-ph-click="${onclick}"><span class="sim-chip-top">${top}</span><span class="sim-chip-val ${gcls||''}">${val}</span><span class="sim-chip-sub">${sub}</span></button>`;
}
function simChipDelta(n){
  if(Math.abs(n)<0.005)return `<span class="sim-flat">±0 pts</span>`;
  return `<span class="${n>0?'sim-up':'sim-down'}">${n>0?'+':'−'}${Math.abs(n).toFixed(2)} pts</span>`;
}

function simDrawCSAT(b,sc,pr){
  document.getElementById('sim-csat-chips').innerHTML=SIM_SCORES.map(s=>{
    const r=simProject(b,simWith(sc,'csat',s,SIM.cnt));
    const dk=(r.kpi!=null&&pr.kpi!=null)?r.kpi-pr.kpi:0;
    return simChip(s,simFmt.csat(r.csat),r.gc?r.gc.gcls:'',simChipDelta(dk),`simAddCSAT(${s})`,
      `${SIM.cnt}× ${s} → CSAT ${simFmt.csat(r.csat)}${r.gc?' ('+r.gc.grade+')':''}`);
  }).join('');
  // Targets: average score needed over the next N surveys, per better tier
  const th=simTiers('csat'),W=simCtx().W('csat'),N=SIM.nCsat;
  const gi=pr.gc?th.findIndex(t=>t.grade===pr.gc.grade):th.length-1;
  const better=th.slice(0,Math.max(gi,0)).filter(t=>t.min>0).reverse();
  const add=N*b.rps;
  const head=`Starting from <b>${simFmt.csat(pr.csat)}</b> over <b>${pr.nSurv}</b> survey${pr.nSurv===1?'':'s'}${pr.gc?' · '+simPill(pr.gc):''}`;
  const cur=th[gi];
  let keep='';
  if(N>0&&pr.csat!==null&&cur&&cur.min>0){
    const x=(cur.min*(pr.cN+add)-pr.cSum)/add;
    keep=x<=1?`Stay at ${escHtml(cur.grade)}: any score keeps you there`
      :`Stay at ${escHtml(cur.grade)}: next ${N} must average ≥ <b>${x.toFixed(2)}</b>`;
  }
  document.getElementById('sim-csat-need').innerHTML=simNeedBlock(head,keep,better,t=>{
    if(N===0)return simStreakCSAT(t,pr,b);
    const x=(t.min*(pr.cN+add)-pr.cSum)/add;
    return x<=5.00001
      ?{ok:true,txt:`next ${N}: avg ≥ <b>${Math.max(x,1).toFixed(2)}</b> / survey`}
      :{ok:false,txt:t.min>=5?`can't be reached with ${N} more`
        :`not within ${N} more — needs <b>${Math.ceil((t.min*pr.cN-pr.cSum)/(b.rps*(5-t.min))-1e-9)}</b> perfect 5${Math.ceil((t.min*pr.cN-pr.cSum)/(b.rps*(5-t.min))-1e-9)===1?'':'s'} in a row`};
  },t=>(W[t.grade]||0)-pr.wc,'Already at the top CSAT grade.');
}

function simDrawAR(b,sc,pr){
  document.getElementById('sim-ar-chips').innerHTML=['yes','no'].map(w=>{
    const r=simProject(b,simWith(sc,'ar',w,SIM.arCnt));
    const dk=(r.kpi!=null&&pr.kpi!=null)?r.kpi-pr.kpi:0;
    return simChip(w==='yes'?'Yes':'No',simFmt.ar(r.ar),r.ga?r.ga.gcls:'',simChipDelta(dk),`simAddAR('${w}')`,
      `${SIM.arCnt}× ${w} → AR ${simFmt.ar(r.ar)}${r.ga?' ('+r.ga.grade+')':''}`);
  }).join('');
  const th=simTiers('ar'),W=simCtx().W('ar'),N=SIM.nAr;
  const gi=pr.ga?th.findIndex(t=>t.grade===pr.ga.grade):th.length-1;
  const better=th.slice(0,Math.max(gi,0)).filter(t=>t.min>0).reverse();
  const head=`Starting from <b>${pr.yes}</b> Yes / <b>${pr.tot-pr.yes}</b> No = <b>${simFmt.ar(pr.ar)}</b>${pr.ga?' · '+simPill(pr.ga):''}`;
  const cur=th[gi];
  let keep='';
  if(N>0&&pr.ar!==null&&cur&&cur.min>0){
    const y=Math.max(0,Math.ceil(cur.min/100*(pr.tot+N)-pr.yes-1e-9));
    keep=y<=0?`Stay at ${escHtml(cur.grade)}: any answers keep you there`
      :`Stay at ${escHtml(cur.grade)}: at most <b>${Math.max(0,N-y)}</b> No in the next ${N}`;
  }
  document.getElementById('sim-ar-need').innerHTML=simNeedBlock(head,keep,better,t=>{
    if(N===0)return simStreakAR(t,pr);
    const y=Math.max(0,Math.ceil(t.min/100*(pr.tot+N)-pr.yes-1e-9));
    return y<=N
      ?{ok:true,txt:`<b>${y}</b> Yes out of the next ${N}`}
      :{ok:false,txt:t.min>=100||t.min<=pr.ar?`can't be reached with ${N} more`
        :`not within ${N} more — needs <b>${Math.ceil((t.min*pr.tot-100*pr.yes)/(100-t.min)-1e-9)}</b> Yes in a row`};
  },t=>(W[t.grade]||0)-pr.wa,'Already at the top AR grade.');
}

function simDrawAHT(b,sc,pr){
  const th=simTiers('aht'),W=simCtx().W('aht'),N=SIM.nAht;
  // Preset chips: one chat right at each tier's cutoff (+ one slower than the last cutoff)
  const finite=th.filter(t=>isFinite(t.max));
  const presets=finite.map(t=>({sec:Math.round(t.max),label:t.grade,pre:'≤'}));
  if(finite.length&&th.some(t=>!isFinite(t.max))){
    const last=finite[finite.length-1];
    presets.push({sec:Math.round(last.max)+180,label:th[th.length-1].grade,pre:'~'});
  }
  document.getElementById('sim-aht-chips').innerHTML=presets.map(p=>{
    const r=simProject(b,simWith(sc,'aht',p.sec,SIM.ahtCnt));
    const dk=(r.kpi!=null&&pr.kpi!=null)?r.kpi-pr.kpi:0;
    return simChip(`<span style="font-size:11px">${p.pre} ${fmtSec(p.sec)}</span>`,simFmt.aht(r.aht),r.gh?r.gh.gcls:'',simChipDelta(dk),`simAddAHT(${p.sec})`,
      `${SIM.ahtCnt}× chat at ${fmtSec(p.sec)} (${p.label}) → AHT ${simFmt.aht(r.aht)}`);
  }).join('');
  const note=document.getElementById('sim-aht-base');
  note.textContent=b.sec>0
    ?`Baseline: ${fmtSec(b.sec)} average over ${b.chats} chat${b.chats===1?'':'s'}${SIM.baseChats!==null?' (your override)':' (auto-detected from the AHT log)'}. More logged chats means a new chat moves the average less.`
    :'No AHT logged for this period — the simulated chats are averaged on their own.';
  const gi=pr.gh?th.findIndex(t=>t.grade===pr.gh.grade):th.length-1;
  const better=th.slice(0,Math.max(gi,0)).reverse();
  const head=pr.aht>0?`Starting from <b>${simFmt.aht(pr.aht)}</b> over <b>${pr.ahtW}</b> chat${pr.ahtW===1?'':'s'}${pr.gh?' · '+simPill(pr.gh):''}`:'No AHT yet — add a chat above';
  const cur=th[gi];
  let keep='';
  if(N>0&&pr.aht>0&&cur&&isFinite(cur.max)){
    const x=(cur.max*(pr.ahtW+N)-pr.ahtS)/N;
    keep=x>0?`Stay at ${escHtml(cur.grade)}: next ${N} can average up to <b>${fmtSec(Math.floor(x))}</b>`
      :`Stay at ${escHtml(cur.grade)}: not possible any more`;
  }
  document.getElementById('sim-aht-need').innerHTML=simNeedBlock(head,keep,better,t=>{
    if(N===0)return simStreakAHT(t,pr);
    const x=(t.max*(pr.ahtW+N)-pr.ahtS)/N;
    return x>0
      ?{ok:true,txt:`next ${N}: avg ≤ <b>${fmtSec(Math.floor(x))}</b> / chat`}
      :{ok:false,txt:`can't be reached in ${N} more chats — try a bigger number`};
  },t=>(W[t.grade]||0)-pr.wh,'Already at the top AHT grade.');
}

// ── Streak mode (horizon = 0): "how many in a row to reach this grade" ──
function simPlural(n,w){return n+' '+w+(n===1?'':'s');}
function simStreakAR(t,pr){
  if(t.min>=100)return{ok:false,txt:`can't be reached`};
  const M=Math.max(1,Math.ceil((t.min*pr.tot-100*pr.yes)/(100-t.min)-1e-9));
  return{ok:true,txt:`needs <b>${M}</b> Yes in a row`};
}
function simStreakCSAT(t,pr,b){
  if(t.min>=5)return{ok:false,txt:`can't be reached`};
  const M=Math.max(1,Math.ceil((t.min*pr.cN-pr.cSum)/(b.rps*(5-t.min))-1e-9));
  return{ok:true,txt:`needs <b>${M}</b> perfect 5${M===1?'':'s'} in a row`};
}
// AHT has no "best possible" chat, so the streak uses the AHT typed in the m/s boxes.
function simStreakAHT(t,pr){
  const a=SIM.ahtMin*60+SIM.ahtSec;
  if(!(a>0))return{ok:false,txt:`type an AHT in the boxes above first`};
  if(a>=t.max)return{ok:false,txt:`can't be reached at ${fmtSec(a)} per chat`};
  const M=Math.max(1,Math.ceil((pr.ahtS-t.max*pr.ahtW)/(t.max-a)-1e-9));
  return{ok:true,txt:`needs <b>${M}</b> chat${M===1?'':'s'} at ${fmtSec(a)} in a row`};
}

// Shared "what does it take" block: live starting point, headroom for the
// current grade, then one row per better tier (nearest first).
function simNeedBlock(head,keep,tiers,solve,gain,topMsg){
  const rows=tiers.length?`<table class="sim-need">${tiers.map(t=>{
    const s=solve(t),g=gain(t);
    return `<tr><td style="width:1%;white-space:nowrap"><span class="grade-pill ${t.cls}">${escHtml(t.grade)}</span></td>
      <td style="${s.ok?'':'color:var(--text-muted)'}">${s.txt}</td>
      <td style="text-align:right;white-space:nowrap">${g?simSigned(g,2,' pts'):''}</td></tr>`;
  }).join('')}</table>`:`<div class="sim-note">${topMsg}</div>`;
  return `<div class="sim-from">${head}</div>${keep?`<div class="sim-keep">${keep}</div>`:''}${rows}`;
}

// ── Keep the page live when real data/period changes while it is open ────
(function(){
  if(typeof renderDashboard!=='function')return;
  const orig=renderDashboard;
  renderDashboard=function(){
    const r=orig.apply(this,arguments);
    try{
      const pg=document.getElementById('page-simulator');
      if(pg&&pg.style.display!=='none'){
        if(SIM.pk!==activePeriodKey)renderSimulator();else simRefresh();
      }
    }catch(e){console.warn('[simulator] refresh failed',e);}
    return r;
  };
})();
