const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEFAULT_CSAT_THRESHOLDS=[
  {grade:'Exceptional',min:4.95,cls:'grade-exceptional',gcls:'gc-exceptional'},
  {grade:'Good',min:4.92,cls:'grade-good',gcls:'gc-good'},
  {grade:'Average',min:4.88,cls:'grade-average',gcls:'gc-average'},
  {grade:'Satisfactory',min:4.85,cls:'grade-satisfactory',gcls:'gc-satisfactory'},
  {grade:'Needs improvement',min:0,cls:'grade-needs',gcls:'gc-needs'}
];
const DEFAULT_AR_THRESHOLDS=[
  {grade:'Exceptional',min:92,cls:'grade-exceptional',gcls:'gc-exceptional'},
  {grade:'Good',min:89,cls:'grade-good',gcls:'gc-good'},
  {grade:'Average',min:86,cls:'grade-average',gcls:'gc-average'},
  {grade:'Satisfactory',min:83,cls:'grade-satisfactory',gcls:'gc-satisfactory'},
  {grade:'Needs improvement',min:0,cls:'grade-needs',gcls:'gc-needs'}
];
const DEFAULT_AHT_THRESHOLDS=[
  {grade:'Exceptional',max:1303,cls:'grade-exceptional',gcls:'gc-exceptional'},
  {grade:'Good',max:1403,cls:'grade-good',gcls:'gc-good'},
  {grade:'Average',max:1509,cls:'grade-average',gcls:'gc-average'},
  {grade:'Satisfactory',max:1643,cls:'grade-satisfactory',gcls:'gc-satisfactory'},
  {grade:'Needs improvement',max:Infinity,cls:'grade-needs',gcls:'gc-needs'}
];

let CSAT_THRESHOLDS=DEFAULT_CSAT_THRESHOLDS.map(t=>({...t}));
let AR_THRESHOLDS=DEFAULT_AR_THRESHOLDS.map(t=>({...t}));
let AHT_THRESHOLDS=DEFAULT_AHT_THRESHOLDS.map(t=>({...t}));

// Team-page thresholds — separate from the dashboard's own CSAT_THRESHOLDS/AR_THRESHOLDS/
// AHT_THRESHOLDS above. These only grade the Team View tiles and the per-member detail
// popup; they never affect the main dashboard, history, or month-summary grading.
let TEAM_CSAT_THRESHOLDS=DEFAULT_CSAT_THRESHOLDS.map(t=>({...t}));
let TEAM_AR_THRESHOLDS=DEFAULT_AR_THRESHOLDS.map(t=>({...t}));
let TEAM_AHT_THRESHOLDS=DEFAULT_AHT_THRESHOLDS.map(t=>({...t}));

// KPI weights: points awarded per grade per metric
const DEFAULT_KPI_WEIGHTS={
  csat:{Exceptional:50,Good:47.5,Average:42.5,Satisfactory:40},
  ar:  {Exceptional:35,Good:33.25,Average:29.75,Satisfactory:28},
  aht: {Exceptional:15,Good:14.25,Average:12.75,Satisfactory:12}
};
let KPI_WEIGHTS=JSON.parse(JSON.stringify(DEFAULT_KPI_WEIGHTS));
// Custom-metric scoring, set by the user in Edit Thresholds (never auto-derived):
// { [metricId]: { cut:[4 cutoffs|null], pts:{Exceptional,Good,Average,Satisfactory} } }
let CUSTOM_SCORING={};

let state={};
let activePeriodKey='';
let goals={csat:null,ar:null,aht:null,kpi:null};
let editingRowIdx=null;
let heatmapMode='surveys';
let lastCheckedIdx=null;

function periodKey(m,y){return y+'-'+String(m).padStart(2,'0')}
function periodLabel(m,y){return MONTHS[m-1]+' '+y}
function fmtSec(s){s=Math.round(s);return Math.floor(s/60)+'m '+(s%60)+'s'}
function escHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// CSAT rule (matches the team leader's report): a response counts toward CSAT only when
// BOTH rating questions (knowledge + courtesy) were answered. A response with just one
// rating still counts toward Survey Count and AR, but has csat=null (left out of every CSAT
// figure). q1/q2 are always kept on the row, so this rule can be relaxed later without
// losing data. Exception window: Aug-Sep 2026 allowed a Q1-only response to count; from
// CSAT_SINGLE_RATING_TO onward both ratings are required again.
// CSAT is displayed truncated (not rounded) to 3 decimals: 4.9496 -> "4.949". The tiny epsilon only
// guards against float noise (e.g. 4.95*1000 = 4949.999...); grading still uses the raw average.
function fmtCsat(v){const n=Number(v);return(Math.trunc(n*1000+(n<0?-1e-9:1e-9))/1000).toFixed(3);}
const CSAT_REQUIRE_BOTH_RATINGS=true;
// Within [FROM, TO) a response with only Q1 answered still counts toward CSAT
// (averaging whatever ratings are present). Every other month requires both ratings.
const CSAT_SINGLE_RATING_FROM='2026-08';
const CSAT_SINGLE_RATING_TO='2026-10'; // exclusive: Oct 2026 and later require both ratings

function _periodKeyOfDate(dateStr){
  const str=String(dateStr||'');
  let m=str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if(m){let y=+m[3];if(y<100)y+=2000;return y+'-'+String(+m[1]).padStart(2,'0');}
  m=str.match(/(\d{4})-(\d{2})/);
  if(m)return m[1]+'-'+m[2];
  return null;
}
function _requireBothFor(periodKey){
  if(!CSAT_REQUIRE_BOTH_RATINGS)return false;
  return !(periodKey&&periodKey>=CSAT_SINGLE_RATING_FROM&&periodKey<CSAT_SINGLE_RATING_TO);
}

function computeCSAT(q1,q2,dateStr){
  const vals=[q1,q2].filter(v=>v!==null&&v!==undefined&&v!==''&&!isNaN(v)).map(Number);
  if(!vals.length)return null;
  if(vals.length===1&&_requireBothFor(_periodKeyOfDate(dateStr)))return null;
  return vals.reduce((a,v)=>a+v,0)/vals.length;
}

// Enforces the rule above on stored data (runs on load and after a JSON import).
// Before the cutoff month: rows with one rating get csat=null. From the cutoff
// month: a row with one rating gets csat=that rating. Rows with both ratings but
// a missing csat get it recomputed. Rows with no q1/q2 at all are left untouched.
function backfillSingleRatingCSAT(st){
  let fixed=0;
  Object.keys(st||{}).forEach(k=>{
    const p=st[k];
    if(!p||!Array.isArray(p.surveys))return;
    const both=_requireBothFor(k);
    p.surveys.forEach(sv=>{
      const has1=_validRating(sv.q1),has2=_validRating(sv.q2);
      const hasCsat=sv.csat!==null&&sv.csat!==undefined&&!isNaN(sv.csat);
      if(has1!==has2){
        const only=Number(has1?sv.q1:sv.q2);
        if(both){if(hasCsat){sv.csat=null;fixed++;}}
        else if(!hasCsat||Number(sv.csat)!==only){sv.csat=only;fixed++;}
      }else if(has1&&has2&&!hasCsat){
        sv.csat=(Number(sv.q1)+Number(sv.q2))/2;fixed++;
      }
    });
  });
  return fixed;
}

// ── CSAT formula ────────────────────────────────────────────────────────────
//   Knowledge score = Knowledge scores / Knowledge surveys completed
//   Courtesy score  = Courtesy scores  / Courtesy surveys completed
//   Overall CSAT    = (Knowledge scores + Courtesy scores)
//                     / (Knowledge surveys completed + Courtesy surveys completed)
// i.e. every individual rating counts once. Only responses with BOTH ratings
// answered count (they have a csat), so this equals the mean of those responses'
// scores. Older rows with a csat but no q1/q2 count as a single rating.
function _validRating(v){return v!==null&&v!==undefined&&v!==''&&!isNaN(v);}
function csatRatingsOf(sv){
  if(!sv||!_validRating(sv.csat))return{sum:0,n:0,k:0,kN:0,c:0,cN:0};
  let k=0,kN=0,c=0,cN=0;
  if(_validRating(sv.q1)){k=Number(sv.q1);kN=1;}
  if(_validRating(sv.q2)){c=Number(sv.q2);cN=1;}
  if(!kN&&!cN)return{sum:Number(sv.csat),n:1,k:0,kN:0,c:0,cN:0};
  return{sum:k+c,n:kN+cN,k,kN,c,cN};
}
function csatBreakdown(surveys){
  let sum=0,n=0,kS=0,kN=0,cS=0,cN=0,counted=0;
  (surveys||[]).forEach(sv=>{
    if(!_validRating(sv.csat))return;
    const r=csatRatingsOf(sv);
    sum+=r.sum;n+=r.n;kS+=r.k;kN+=r.kN;cS+=r.c;cN+=r.cN;counted++;
  });
  return{overall:n?sum/n:null,knowledge:kN?kS/kN:null,courtesy:cN?cS/cN:null,
    sum,n,kSum:kS,kN,cSum:cS,cN,surveys:counted,ratingsPerSurvey:counted?n/counted:1};
}
function calcCSAT(surveys){return csatBreakdown(surveys).overall;}

let _rosterStateReady=false;
function loadState(){
  try{state=JSON.parse(localStorage.getItem('kpi_tracker_v3')||'{}')}catch(e){state={}}
  _rosterStateReady=true;
  const fixed=backfillSingleRatingCSAT(state);
  if(fixed>0){try{localStorage.setItem('kpi_tracker_v3',JSON.stringify(state));}catch(e){}}
}
function saveState(){localStorage.setItem('kpi_tracker_v3',JSON.stringify(state))}
function getPeriod(key){if(!state[key])state[key]={surveys:[],aht:0,annotations:{},dailyAHT:{},monthlyAHT:0};if(!state[key].annotations)state[key].annotations={};if(!state[key].dailyAHT)state[key].dailyAHT={};if(!state[key].dailyAHTByMember)state[key].dailyAHTByMember={};if(!state[key].monthlyAHTByMember)state[key].monthlyAHTByMember={};if(state[key].monthlyAHT===undefined)state[key].monthlyAHT=0;if(!state[key].customMetrics)state[key].customMetrics={};return state[key]}

// ── Custom KPI metrics ────────────────────────────────────────────────────
// User-defined metrics that sit alongside the built-in CSAT/AR/AHT ones —
// added and removed anytime from Settings. A definition (name/unit/target)
// is global and applies to every period; the values you log for it are
// stored per period, one number per date, the same shape as dailyAHT.
let CUSTOM_METRIC_DEFS=[];
const CM_GRADES=['Exceptional','Good','Average','Satisfactory'];
const CM_GRADE_CLS={Exceptional:'grade-exceptional',Good:'grade-good',Average:'grade-average',Satisfactory:'grade-satisfactory','Needs improvement':'grade-needs'};
function blankCustomScoring(){return{cut:[null,null,null,null],pts:{Exceptional:0,Good:0,Average:0,Satisfactory:0}};}
function normCustomScoring(sc){
  const b=blankCustomScoring();
  if(!sc)return b;
  if(Array.isArray(sc.cut))b.cut=[0,1,2,3].map(i=>{const v=parseFloat(sc.cut[i]);return isNaN(v)?null:v;});
  if(sc.pts)CM_GRADES.forEach(g=>{const v=parseFloat(sc.pts[g]);b.pts[g]=(isNaN(v)||v<0)?0:v;});
  return b;
}
function loadCustomMetricDefs(){
  try{CUSTOM_METRIC_DEFS=JSON.parse(localStorage.getItem('kpi_custom_metrics_v1')||'[]');}catch(e){CUSTOM_METRIC_DEFS=[];}
  if(!Array.isArray(CUSTOM_METRIC_DEFS))CUSTOM_METRIC_DEFS=[];
  migrateLegacyCustomMetricScoring();
}
// Older builds stored scoring on the metric itself (scored/weight/thresholds) and
// rescaled CSAT/AR/AHT weights on the side. Move it into CUSTOM_SCORING so it shows
// up in Edit Thresholds. CSAT/AR/AHT weights are left exactly as they are stored.
function migrateLegacyCustomMetricScoring(){
  let moved=false;
  CUSTOM_METRIC_DEFS.forEach(def=>{
    if(def.scored===undefined&&def.weight===undefined&&def.thresholds===undefined)return;
    if(def.scored&&Array.isArray(def.thresholds)&&def.thresholds.length===4&&!CUSTOM_SCORING[def.id]){
      const w=parseFloat(def.weight)||0;
      const r=x=>Math.round(x*100)/100;
      CUSTOM_SCORING[def.id]=normCustomScoring({
        cut:def.thresholds.map(t=>def.direction==='lower'?t.max:t.min),
        pts:{Exceptional:w,Good:r(w*0.95),Average:r(w*0.85),Satisfactory:r(w*0.80)}
      });
    }
    delete def.scored;delete def.weight;delete def.thresholds;
    moved=true;
  });
  if(moved){saveCustomMetricDefs();saveThresholds();}
}
function saveCustomMetricDefs(){
  try{localStorage.setItem('kpi_custom_metrics_v1',JSON.stringify(CUSTOM_METRIC_DEFS));}catch(e){}
}
function getCustomMetricDef(id){return CUSTOM_METRIC_DEFS.find(m=>m.id===id)||null}
// Where a metric counts: 'dashboard' (main dashboard = whole team), 'team' (team members'
// tiles and dashboards) or 'both'. Metrics saved before this option existed count in both.
function cmScopeOf(def){return(def&&(def.scope==='dashboard'||def.scope==='team'))?def.scope:'both';}
function customMetricInScope(def,ctx){const s=cmScopeOf(def);return s==='both'||s===(ctx==='team'?'team':'dashboard');}
const CM_SCOPE_LABELS={both:'Dashboard + team members',dashboard:'Main dashboard only',team:'Team members only'};
function setCustomMetricScope(id,scope){
  const def=getCustomMetricDef(id);
  if(!def)return;
  def.scope=(scope==='dashboard'||scope==='team')?scope:'both';
  saveCustomMetricDefs();
  renderCustomMetricsSettings();
  renderCustomMetricsSection();
  renderDashboard();
  if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none')renderTeamView();
  showToast('"'+def.name+'": '+CM_SCOPE_LABELS[cmScopeOf(def)]);
}
function addCustomMetricDef(name,unit,direction,target,scope){
  const id='cm_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const t=(target===''||target===null||target===undefined||isNaN(parseFloat(target)))?null:parseFloat(target);
  CUSTOM_METRIC_DEFS.push({id,name:String(name||'').trim(),unit:String(unit||'').trim(),direction:direction==='lower'?'lower':'higher',target:t,scope:(scope==='dashboard'||scope==='team')?scope:'both'});
  saveCustomMetricDefs();
  return id;
}
function removeCustomMetricDef(id){
  CUSTOM_METRIC_DEFS=CUSTOM_METRIC_DEFS.filter(m=>m.id!==id);
  delete CUSTOM_SCORING[id];
  saveCustomMetricDefs();
  saveThresholds();
}
// ── Scoring a custom metric into the Final KPI Score ──────────────────────
// Everything here comes from what you type in Edit Thresholds: a tab per
// metric for its 4 grade cutoffs, and the KPI Weights tab for the points each
// grade is worth. A metric contributes nothing until both are filled in, and
// CSAT/AR/AHT weights are never touched when metrics are added or removed.
// scope: pass activeThresh (or any getThresholdsForPeriod result) to read the
// per-month values, or null for the global ones.
function customScoringFor(id,scope){
  const c=(scope&&scope.custom)||CUSTOM_SCORING;
  return normCustomScoring(c[id]);
}
function customMetricIsScored(sc){return sc.cut.some(v=>v!==null)&&CM_GRADES.some(g=>sc.pts[g]>0);}
// Grades one value. Higher-is-better metrics need avg >= cutoff, lower-is-better
// need avg <= cutoff. Blank cutoffs are skipped. Returns null if no cutoffs set.
function customMetricGrade(def,avg,sc){
  if(avg===null||avg===undefined||isNaN(avg))return null;
  if(!sc||!sc.cut.some(v=>v!==null))return null;
  const lower=def.direction==='lower';
  for(let i=0;i<4;i++){
    const c=sc.cut[i];
    if(c===null)continue;
    if(lower?avg<=c:avg>=c)return CM_GRADES[i];
  }
  return 'Needs improvement';
}
function weightCustomMetric(def,avg,sc){
  const g=customMetricGrade(def,avg,sc);
  if(!g||g==='Needs improvement')return 0;
  return sc.pts[g]||0;
}
// Final-KPI points from every custom metric for one period (active-period scoring).
// Custom metrics are logged period-wide (no per-agent breakdown), so every member
// gets the same custom points. History, Weekly, Month Summary and the forecasts add
// the same points through customMetricsPoints(pk) below.
function scoredCustomMetricsWeight(period){
  const total=CUSTOM_METRIC_DEFS.filter(d=>customMetricInScope(d,'dashboard')).reduce((a,def)=>a+weightCustomMetric(def,customMetricAvg(period,def.id),customScoringFor(def.id,activeThresh)),0);
  return Math.round(total*100)/100;
}
// Custom-metric points for one period, graded with the scoring that applies to
// that period (its month override if it has one, else global). Only metrics with
// cutoffs + points set are returned. Used by the Team View / member dashboard.
function customMetricBreakdown(pk,ctx){
  const period=getPeriod(pk);
  const th=getThresholdsForPeriod(pk);
  return CUSTOM_METRIC_DEFS.filter(d=>customMetricInScope(d,ctx)).map(def=>{
    const sc=customScoringFor(def.id,th);
    const avg=customMetricAvg(period,def.id);
    return{def,sc,avg,grade:customMetricGrade(def,avg,sc),pts:weightCustomMetric(def,avg,sc),max:sc.pts.Exceptional||0,on:customMetricIsScored(sc)};
  }).filter(r=>r.on);
}
// ctx: 'dashboard' (default — main dashboard, History, Weekly, Month Summary, forecasts)
// or 'team' (team members' tiles and dashboards). Only metrics whose scope includes
// that side are counted.
function customMetricsPoints(pk,ctx){
  return Math.round(customMetricBreakdown(pk,ctx).reduce((a,r)=>a+r.pts,0)*100)/100;
}
// Points from custom metrics that were logged on one specific day (for daily KPI trends).
function customMetricsPointsForDay(pk,dk,ctx){
  const period=getPeriod(pk);
  const th=getThresholdsForPeriod(pk);
  let total=0;
  CUSTOM_METRIC_DEFS.filter(d=>customMetricInScope(d,ctx)).forEach(def=>{
    const v=(period.customMetrics&&period.customMetrics[def.id]||{})[dk];
    if(v===undefined||v===null||isNaN(v))return;
    const sc=customScoringFor(def.id,th);
    if(customMetricIsScored(sc))total+=weightCustomMetric(def,v,sc);
  });
  return Math.round(total*100)/100;
}
// Points from custom metrics logged on any of the given dates (a week): the values
// logged on those dates are averaged and graded with the period's own scoring — the
// same rule the dashboard uses for the whole month.
function customMetricsPointsForDays(pk,dks,ctx){
  const period=getPeriod(pk);
  const th=getThresholdsForPeriod(pk);
  const set=new Set(dks);
  let total=0;
  CUSTOM_METRIC_DEFS.filter(d=>customMetricInScope(d,ctx)).forEach(def=>{
    const sc=customScoringFor(def.id,th);
    if(!customMetricIsScored(sc))return;
    const map=(period.customMetrics&&period.customMetrics[def.id])||{};
    const vals=Object.keys(map).filter(dk=>set.has(dk)).map(dk=>map[dk]).filter(v=>v!==null&&v!==undefined&&!isNaN(v));
    if(!vals.length)return;
    total+=weightCustomMetric(def,vals.reduce((a,v)=>a+v,0)/vals.length,sc);
  });
  return Math.round(total*100)/100;
}
// Running month-to-date custom points through one date (Day Lookup): values logged on or
// before that date are averaged and graded with the period's own scoring.
function customMetricsPointsThrough(pk,dk,ctx){
  const period=getPeriod(pk);
  const th=getThresholdsForPeriod(pk);
  let total=0;
  CUSTOM_METRIC_DEFS.filter(d=>customMetricInScope(d,ctx)).forEach(def=>{
    const sc=customScoringFor(def.id,th);
    if(!customMetricIsScored(sc))return;
    const map=(period.customMetrics&&period.customMetrics[def.id])||{};
    const vals=Object.keys(map).filter(d=>d<=dk).map(d=>map[d]).filter(v=>v!==null&&v!==undefined&&!isNaN(v));
    if(!vals.length)return;
    total+=weightCustomMetric(def,vals.reduce((a,v)=>a+v,0)/vals.length,sc);
  });
  return Math.round(total*100)/100;
}
// True when a period has at least one value logged for a metric that is set up to score.
function customMetricsHaveData(pk,ctx){
  if(!state[pk])return false;
  const period=getPeriod(pk);
  const th=getThresholdsForPeriod(pk);
  return CUSTOM_METRIC_DEFS.filter(d=>customMetricInScope(d,ctx)).some(def=>{
    if(!customMetricIsScored(customScoringFor(def.id,th)))return false;
    const map=(period.customMetrics&&period.customMetrics[def.id])||{};
    return Object.keys(map).some(dk=>map[dk]!==null&&map[dk]!==undefined&&!isNaN(map[dk]));
  });
}
// Year-to-date custom points: the average of each month's custom points, counting only
// months that actually have custom values logged (so months from before a metric existed
// don't drag the average down).
function customMetricsPointsYTD(keys,ctx){
  const ks=keys.filter(k=>customMetricsHaveData(k,ctx));
  if(!ks.length)return 0;
  return Math.round(ks.reduce((a,k)=>a+customMetricsPoints(k,ctx),0)/ks.length*100)/100;
}
function getCustomMetricMap(period,metricId){
  if(!period.customMetrics)period.customMetrics={};
  if(!period.customMetrics[metricId])period.customMetrics[metricId]={};
  return period.customMetrics[metricId];
}
function setCustomMetricValue(period,metricId,dateKey,value){
  getCustomMetricMap(period,metricId)[dateKey]=value;
  saveState();
}
function deleteCustomMetricValue(period,metricId,dateKey){
  delete getCustomMetricMap(period,metricId)[dateKey];
  saveState();
}
function customMetricEntries(period,metricId){
  const map=getCustomMetricMap(period,metricId);
  return Object.keys(map).sort().map(dk=>({dk,value:map[dk]}));
}
function customMetricAvg(period,metricId){
  const entries=customMetricEntries(period,metricId);
  if(!entries.length)return null;
  return entries.reduce((a,e)=>a+e.value,0)/entries.length;
}
// Simple on/off-target read against the metric's own target — there's no
// multi-tier grading here the way CSAT/AR/AHT have, just met-or-not.
function customMetricStatus(def,avg){
  if(avg===null||def.target===null||def.target===undefined)return null;
  const meets=def.direction==='lower'?avg<=def.target:avg>=def.target;
  return meets?{label:'On target',cls:'grade-good'}:{label:'Below target',cls:'grade-needs'};
}
function todayDateKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function fmtCMDateDisplay(dk){const d=new Date(dk+'T00:00:00');return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}

// ── Team View helpers ────────────────────────────────────────────────────
// Team members are auto-detected from the `agent` field already parsed off
// every imported survey row — no separate roster to maintain.
// ── Manually added team members ──────────────────────────────────────────
// A roster of names you add by hand from Team View. They show up as tiles (and in the
// AHT member dropdown) even before any surveys exist. Once surveys arrive for the same
// person, autoMergeDuplicateAgentNames folds the imported name into the roster spelling,
// so the tile just fills in with data — no duplicate.
const MANUAL_MEMBERS_KEY='kpi_manual_members_v1';
// ── Manual team roster — kept PER MONTH ──────────────────────────────────
// A member you add by hand belongs to the month you were on when you added them
// (stored as {'YYYY-MM':[names]}), so they only show up in that month — plus any
// month where they have surveys or AHT/chat logs of their own. The old build kept
// one global list (MANUAL_MEMBERS_KEY); it's migrated once, see _readRosterMap.
const MANUAL_ROSTER_KEY='kpi_manual_members_v2';
function _rosterPeriod(){try{if(typeof activePeriodKey!=='undefined'&&activePeriodKey)return activePeriodKey;}catch(e){}return '';}
function _writeRosterMap(map){try{localStorage.setItem(MANUAL_ROSTER_KEY,JSON.stringify(map));}catch(e){}}
function _memberHasAnyData(name){
  const c=_memberCanon(name);
  return Object.keys(state||{}).some(k=>{
    const p=state[k];if(!p)return false;
    if((p.surveys||[]).some(sv=>_memberCanon(sv.agent||'')===c))return true;
    if(Object.keys(p.dailyAHTByMember||{}).some(a=>_memberCanon(a)===c))return true;
    return Object.keys(p.monthlyAHTByMember||{}).some(a=>_memberCanon(a)===c);
  });
}
// Names from the old global list (or an old export): anyone who already has data in some
// month keeps showing in exactly those months on their own, so only people with no data
// anywhere need pinning — they go to the current calendar month.
function _pinLegacyRosterNames(map,names){
  const now=new Date(),cur=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  (names||[]).forEach(n=>{
    if(typeof n!=='string'||!n.trim()||_memberHasAnyData(n))return;
    const l=map[cur]=map[cur]||[];
    if(!l.some(x=>_memberCanon(x)===_memberCanon(n)))l.push(n);
  });
}
function _readRosterMap(){
  let raw=null;
  try{raw=localStorage.getItem(MANUAL_ROSTER_KEY);}catch(e){}
  if(raw!==null){
    try{const o=JSON.parse(raw);return(o&&typeof o==='object'&&!Array.isArray(o))?o:{};}catch(e){return {};}
  }
  if(!_rosterStateReady)return {};   // data not loaded yet — migrate on a later call
  const map={};
  try{const a=JSON.parse(localStorage.getItem(MANUAL_MEMBERS_KEY)||'[]');if(Array.isArray(a))_pinLegacyRosterNames(map,a);}catch(e){}
  _writeRosterMap(map);
  return map;
}
function getManualMembers(periodKey){
  const l=_readRosterMap()[periodKey||_rosterPeriod()];
  return Array.isArray(l)?l.filter(n=>typeof n==='string'&&n.trim()):[];
}
// Everyone on any month's manual roster (for rename / merge / export pickers — not for display).
function getManualMembersAll(){
  const set=new Set();
  Object.values(_readRosterMap()).forEach(l=>{if(Array.isArray(l))l.forEach(n=>{if(typeof n==='string'&&n.trim())set.add(n);});});
  return [...set];
}
function saveManualMembers(list,periodKey){
  const k=periodKey||_rosterPeriod();if(!k)return;
  const map=_readRosterMap();
  if(list&&list.length)map[k]=list;else delete map[k];
  _writeRosterMap(map);
}
function _editRosterEverywhere(fn){
  const map=_readRosterMap();
  Object.keys(map).forEach(k=>{
    const out=fn(Array.isArray(map[k])?map[k]:[]);
    if(out&&out.length)map[k]=out;else delete map[k];
  });
  _writeRosterMap(map);
}
// One comparison key for "the same person", whatever way the name was typed or imported:
// "jonathan.juarez", "Jonathan  Juarez", "JONATHAN JUAREZ" and "Juarez, Jonathan" all match.
function _memberCanon(n){
  let s=(n==null?'':String(n)).trim();
  if(s.includes(',')){const parts=s.split(',').map(x=>x.trim()).filter(Boolean);if(parts.length===2)s=parts[1]+' '+parts[0];else s=parts.join(' ');}
  s=prettifyAgentName(s);
  try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}
  return s.toLowerCase().replace(/[._]+/g,' ').replace(/\s+/g,' ').trim();
}
function addManualMember(name){
  const n=(name||'').trim().replace(/\s+/g,' ');
  if(!n)return {ok:false,msg:'Enter a name'};
  const canon=_memberCanon(n);
  if(getManualMembers().some(m=>_memberCanon(m)===canon))return {ok:false,msg:`"${n}" is already on the team for this month`};
  // Already detected from this month's surveys / AHT logs? Then they're on the team already.
  const exists=getAgentNamesForAHTGrid(activePeriodKey).some(m=>_memberCanon(m)===canon);
  const list=getManualMembers();list.push(n);saveManualMembers(list);
  // If a survey-detected variant exists (e.g. "jonathan.juarez"), fold it into the typed name.
  try{if(autoMergeDuplicateAgentNames().length)saveState();}catch(e){}
  return {ok:true,msg:exists?`"${n}" was already detected this month — now pinned to the team`:`Added "${n}" to this month's team`};
}
function removeManualMember(name){
  saveManualMembers(getManualMembers().filter(m=>m!==name));
}
function openAddMemberModal(){
  const modal=document.getElementById('add-member-modal');
  const input=document.getElementById('add-member-name');
  if(input)input.value='';
  if(modal)modal.classList.add('open');
  if(input)setTimeout(()=>input.focus(),50);
}
function closeAddMemberModal(){
  const modal=document.getElementById('add-member-modal');
  if(modal)modal.classList.remove('open');
}
function confirmAddMember(){
  const input=document.getElementById('add-member-name');
  const r=addManualMember(input?input.value:'');
  if(!r.ok){showToast(r.msg);return;}
  closeAddMemberModal();
  showToast(r.msg);
  refreshAfterMemberChange();
}
function removeManualMemberClick(name){
  if(!name)return;
  removeManualMember(name);
  showToast(`Removed "${name}" from this month's manual list (any surveys or AHT logs are untouched)`);
  refreshAfterMemberChange();
}
// ── Delete a member's data for chosen months ─────────────────────────────
// Surveys and AHT/chat logs live in separate places, so deleting surveys alone leaves the
// member's AHT behind (and their tile with it). This wipes everything stored for one member
// in the months you pick: surveys, daily + monthly AHT/chat logs, their working-days
// calendar and their team-scorecard extra scores. AHT/chat logs are kept unless "Also delete AHT / chat logs" is ticked.
let _delMemberTarget='';
function _sameMember(a,b){return _memberCanon(a)===_memberCanon(b);}
function _isPersonalLogMember(name){return _sameMember(name,'Jonathan Juarez');}
function _memberVariantsInPeriod(p,name){
  const v=new Set([name]);
  (p.surveys||[]).forEach(s=>{const a=(s.agent||'').trim();if(a&&_sameMember(a,name))v.add(a);});
  Object.keys(p.dailyAHTByMember||{}).forEach(a=>{if(_sameMember(a,name))v.add(a);});
  Object.keys(p.monthlyAHTByMember||{}).forEach(a=>{if(_sameMember(a,name))v.add(a);});
  return [...v];
}
function _memberDataByPeriod(name){
  const out=[];
  let scx=null;try{scx=getScExtra();}catch(e){}
  Object.keys(state).sort().reverse().forEach(key=>{
    const p=state[key];if(!p)return;
    const [y,m]=key.split('-');
    const vars=_memberVariantsInPeriod(p,name);
    const surveys=(p.surveys||[]).filter(s=>_sameMember(s.agent||'',name)).length;
    let ahtDays=0,monthly=false,wdays=false,scores=false;
    vars.forEach(a=>{
      if(p.dailyAHTByMember&&p.dailyAHTByMember[a])ahtDays+=Object.keys(p.dailyAHTByMember[a]).length;
      if(p.monthlyAHTByMember&&p.monthlyAHTByMember[a])monthly=true;
      try{const w=localStorage.getItem('wdays-member-'+encodeURIComponent(a)+'-'+y+'-'+m);if(w&&JSON.parse(w).length)wdays=true;}catch(e){}
      const pv=scx&&scx.values&&scx.values[key];
      if(pv)Object.keys(pv).forEach(sc=>Object.keys(pv[sc]||{}).forEach(mid=>{if(pv[sc][mid]&&pv[sc][mid][a]!==undefined)scores=true;}));
    });
    if(surveys||ahtDays||monthly||wdays||scores)out.push({key,label:periodLabel(parseInt(m),parseInt(y)),surveys,ahtDays,monthly,wdays,scores});
  });
  return out;
}
function openDeleteMemberDataModal(name){
  if(!name)return;
  _delMemberTarget=name;
  const rows=_memberDataByPeriod(name);
  const list=document.getElementById('dmd-periods');
  document.getElementById('dmd-title').textContent='Delete data — '+prettifyAgentName(name);
  if(list){
    list.innerHTML=rows.length?rows.map(r=>{
      const bits=[];
      if(r.surveys)bits.push(r.surveys+' survey'+(r.surveys!==1?'s':''));
      if(r.ahtDays)bits.push(r.ahtDays+' AHT day'+(r.ahtDays!==1?'s':''));
      if(r.monthly)bits.push('month AHT total');
      if(r.wdays)bits.push('working days');
      if(r.scores)bits.push('scorecard scores');
      return `<label class="export-month-row"><input type="checkbox" class="dmd-cb" value="${escHtml(r.key)}" ${r.key===activePeriodKey?'checked':''}><span class="export-month-name">${escHtml(r.label)}</span><span class="export-month-meta">${bits.join(' · ')}</span></label>`;
    }).join(''):'<div style="font-size:12px;color:var(--text-muted);padding:8px 0">No stored data for this member in any month.</div>';
  }
  const extra=document.getElementById('dmd-extra');
  if(extra){
    let h=`<label class="export-month-row"><input type="checkbox" id="dmd-delete-aht"><span class="export-month-name">Also delete AHT / chat logs</span><span class="export-month-meta">otherwise AHT is kept${_isPersonalLogMember(name)?' (the personal-log option below only applies when this is ticked)':''}</span></label>`;
    if(getManualMembersAll().some(m=>_sameMember(m,name)))h+=`<label class="export-month-row"><input type="checkbox" id="dmd-remove-roster"><span class="export-month-name">Also remove from my manual team list (all months)</span></label>`;
    if(_isPersonalLogMember(name))h+=`<label class="export-month-row"><input type="checkbox" id="dmd-clear-personal" checked><span class="export-month-name">Also clear my personal AHT log for those months</span><span class="export-month-meta">otherwise it's copied back automatically</span></label>`;
    extra.innerHTML=h;
  }
  const modal=document.getElementById('delete-member-data-modal');
  if(modal)modal.classList.add('open');
}
function closeDeleteMemberDataModal(){
  const modal=document.getElementById('delete-member-data-modal');
  if(modal)modal.classList.remove('open');
  _delMemberTarget='';
}
function toggleAllDeleteMemberPeriods(on){
  document.querySelectorAll('.dmd-cb').forEach(cb=>{cb.checked=on;});
}
function confirmDeleteMemberData(){
  const name=_delMemberTarget;if(!name)return;
  const keys=[...document.querySelectorAll('.dmd-cb:checked')].map(cb=>cb.value);
  const rmRoster=!!(document.getElementById('dmd-remove-roster')||{}).checked;
  const keepAht=!(document.getElementById('dmd-delete-aht')||{}).checked;
  const clrPersonal=!!(document.getElementById('dmd-clear-personal')||{}).checked&&!keepAht;
  if(!keys.length&&!rmRoster){showToast('Pick at least one month');return;}
  const who=prettifyAgentName(name);
  const msg=keys.length
    ?(keepAht
      ?`Permanently delete ${who}'s surveys, working days and scorecard scores for ${keys.length} month${keys.length!==1?'s':''}? Their AHT/chat logs will be kept. This can't be undone.`
      :`Permanently delete ${who}'s surveys, AHT/chat logs, working days and scorecard scores for ${keys.length} month${keys.length!==1?'s':''}? This can't be undone.`)
    :`Remove ${who} from your manual team list?`;
  if(!confirm(msg))return;
  let scx=null;try{scx=getScExtra();}catch(e){}
  let scxChanged=false;
  keys.forEach(key=>{
    const p=state[key];if(!p)return;
    const [y,m]=key.split('-');
    const vars=_memberVariantsInPeriod(p,name);
    p.surveys=(p.surveys||[]).filter(s=>!_sameMember(s.agent||'',name));
    vars.forEach(a=>{
      if(!keepAht){
        if(p.dailyAHTByMember)delete p.dailyAHTByMember[a];
        if(p.monthlyAHTByMember)delete p.monthlyAHTByMember[a];
      }
      try{localStorage.removeItem('wdays-member-'+encodeURIComponent(a)+'-'+y+'-'+m);}catch(e){}
      const pv=scx&&scx.values&&scx.values[key];
      if(pv)Object.keys(pv).forEach(sc=>Object.keys(pv[sc]||{}).forEach(mid=>{if(pv[sc][mid]&&pv[sc][mid][a]!==undefined){delete pv[sc][mid][a];scxChanged=true;}}));
    });
    if(clrPersonal&&_isPersonalLogMember(name))p.dailyAHT={};
    // keep the legacy stored AHT in step (computeAHTSec only reads the active period live)
    const saveKey=activePeriodKey;
    try{p.aht=0;activePeriodKey=key;p.aht=computeAHTSec();}finally{activePeriodKey=saveKey;}
  });
  if(scxChanged)try{saveScExtra(scx);}catch(e){}
  if(rmRoster)_editRosterEverywhere(l=>l.filter(n=>!_sameMember(n,name)));
  saveState();
  closeDeleteMemberDataModal();
  const mdm=document.getElementById('member-dashboard-modal');if(mdm)mdm.classList.remove('open');
  const q=id=>{const el=document.getElementById(id);if(el)el.classList.remove('open');};
  q('tile-survey-modal');q('member-detail-modal');
  showToast(keys.length?`Deleted ${who}'s data for ${keys.length} month${keys.length!==1?'s':''}${keepAht?' (AHT kept)':''}`:`Removed ${who} from the manual list`);
  ['renderTeamView','renderDashboard','renderSurveyTable','populateAHTMemberSelect','renderAHTMemberGrid','updateAHT','renderAHTImportedTable','renderDailyAHTList','updateTeamNavState'].forEach(fn=>{try{if(typeof window[fn]==='function')window[fn]();}catch(e){}});
  if(typeof renderHistory==='function'&&document.getElementById('page-history')&&document.getElementById('page-history').style.display!=='none')try{renderHistory();}catch(e){}
}
function refreshAfterMemberChange(){
  if(typeof renderTeamView==='function')renderTeamView();
  if(typeof populateAHTMemberSelect==='function')populateAHTMemberSelect();
  if(typeof renderAHTMemberGrid==='function')renderAHTMemberGrid();
  if(typeof updateTeamNavState==='function')updateTeamNavState();
}
function getAllAgentNamesGlobal(){
  const set=new Set(getManualMembersAll());
  Object.keys(state).forEach(k=>{
    const p=state[k];
    if(!p||!Array.isArray(p.surveys))return;
    p.surveys.forEach(s=>{const n=(s.agent||'').trim();if(n)set.add(n);});
  });
  return [...set];
}
// Distinct member names for ONE period — surveys plus anyone with only AHT/chat
// logs. Scoped to the active period (not the whole history) so a lone member's
// import, or old test data sitting in some other month, can't unlock Team View
// on its own — the unlock now reflects who's actually in the period you're on.
function getAgentNamesForPeriod(key){
  const set=new Set(getAgentsForPeriod(key).keys());
  const p=getPeriod(key);
  getAHTLoggedAgents(p).forEach(n=>{if(n&&getMemberAHTStats(p,n))set.add(n);});
  return set;
}
// Who the AHT & Chat Count grid lists for ONE period — same rule Team View uses:
// people with surveys or AHT/chat logs in that period, plus the manually pinned
// roster. (getAllAgentNamesGlobal pulls in everyone from every month, which is why
// September-only members were showing up while logging October.)
function getAgentNamesForAHTGrid(periodKey){
  const set=new Set(getAgentNamesForPeriod(periodKey));
  getManualMembers(periodKey).forEach(n=>{if(n)set.add(n);});
  return [...set];
}
function teamViewUnlocked(){
  if(typeof activePeriodKey==='undefined'||!activePeriodKey)return getAllAgentNamesGlobal().length>=2;
  return getAgentNamesForPeriod(activePeriodKey).size>=2;
}
// Prettifies a raw agent key for DISPLAY only — e.g. "jonathan.juarez" ->
// "Jonathan Juarez". Names that already contain a space are assumed to be
// properly formatted already and are left untouched. This never touches the
// underlying stored value, only what's rendered on screen, so lookups/filters
// that key off the raw agent string keep working unchanged.
function prettifyAgentName(raw){
  const n=(raw||'').trim();
  if(!n||n.includes(' '))return n;
  return n.split(/[._-]+/).filter(Boolean)
    .map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase())
    .join(' ');
}
// ── Rename a team member across all history ──────────────────────────────
// Fixes typo'd/inconsistent raw agent values (e.g. a dropped first letter
// during import) by rewriting every survey + AHT log that used the old key,
// in every period, to the new one. If the new name already has data in a
// given period, entries are merged rather than overwritten.
let _renameMemberTarget='';
function openRenameMemberModal(oldName){
  if(!oldName)return;
  _renameMemberTarget=oldName;
  const oldInput=document.getElementById('rename-member-old');
  const newInput=document.getElementById('rename-member-new');
  if(oldInput)oldInput.value=oldName;
  if(newInput)newInput.value=prettifyAgentName(oldName);
  const modal=document.getElementById('rename-member-modal');
  if(modal)modal.classList.add('open');
  if(newInput)setTimeout(()=>{newInput.focus();newInput.select();},50);
}
function closeRenameMemberModal(){
  const modal=document.getElementById('rename-member-modal');
  if(modal)modal.classList.remove('open');
  _renameMemberTarget='';
}
function renameAgentGlobally(oldName,newName){
  Object.keys(state).forEach(key=>{
    const p=state[key];
    if(!p)return;
    if(Array.isArray(p.surveys)){
      p.surveys.forEach(s=>{if((s.agent||'').trim()===oldName)s.agent=newName;});
    }
    if(p.dailyAHTByMember&&p.dailyAHTByMember[oldName]){
      if(!p.dailyAHTByMember[newName])p.dailyAHTByMember[newName]={};
      Object.keys(p.dailyAHTByMember[oldName]).forEach(dk=>{
        if(!p.dailyAHTByMember[newName][dk])p.dailyAHTByMember[newName][dk]=p.dailyAHTByMember[oldName][dk];
      });
      delete p.dailyAHTByMember[oldName];
    }
    if(p.monthlyAHTByMember&&p.monthlyAHTByMember[oldName]){
      if(!p.monthlyAHTByMember[newName])p.monthlyAHTByMember[newName]=p.monthlyAHTByMember[oldName];
      delete p.monthlyAHTByMember[oldName];
    }
  });
  // Working-days calendar and team-scorecard scores are stored outside `state`, keyed by name —
  // carry them across too, otherwise merging two spellings silently drops them.
  try{
    let scx=null;try{scx=getScExtra();}catch(e){}
    let scxChanged=false;
    Object.keys(state).forEach(key=>{
      const [y,m]=key.split('-');
      try{
        const ok='wdays-member-'+encodeURIComponent(oldName)+'-'+y+'-'+m;
        const nk='wdays-member-'+encodeURIComponent(newName)+'-'+y+'-'+m;
        const ov=localStorage.getItem(ok);
        if(ov!==null&&ok!==nk){
          const oa=JSON.parse(ov);const nv=localStorage.getItem(nk);
          const na=nv?JSON.parse(nv):[];
          if(Array.isArray(oa)){
            const seen=new Set((Array.isArray(na)?na:[]).map(x=>JSON.stringify(x)));
            const out=Array.isArray(na)?na.slice():[];
            oa.forEach(x=>{if(!seen.has(JSON.stringify(x)))out.push(x);});
            localStorage.setItem(nk,JSON.stringify(out));
          }
          localStorage.removeItem(ok);
        }
      }catch(e){}
      const pv=scx&&scx.values&&scx.values[key];
      if(pv)Object.keys(pv).forEach(sc=>Object.keys(pv[sc]||{}).forEach(mid=>{
        const row=pv[sc][mid];
        if(row&&row[oldName]!==undefined){if(row[newName]===undefined)row[newName]=row[oldName];delete row[oldName];scxChanged=true;}
      }));
    });
    if(scxChanged)saveScExtra(scx);
  }catch(e){}
  saveState();
  try{_editRosterEverywhere(_r=>_r.includes(oldName)?_r.map(m=>m===oldName?newName:m).filter((m,i,a)=>a.indexOf(m)===i):_r);}catch(e){}
  try{const _o=_avKey(oldName),_n=_avKey(newName);if(_o!==_n){const _m=_avMap();if(_m[_o]&&!_m[_n]){_m[_n]=_m[_o];delete _m[_o];localStorage.setItem(MEMBER_AVATAR_KEY,JSON.stringify(_m));}const _pm=_photoMap();if(_pm[_o]&&!_pm[_n]){_pm[_n]=_pm[_o];delete _pm[_o];localStorage.setItem(MEMBER_PHOTO_KEY,JSON.stringify(_pm));}}}catch(e){}
}
// ── Auto-merge duplicate agent names ─────────────────────────────────────
// Different raw agent keys can end up meaning the same person — e.g. a
// manual entry stored as "Jonathan Juarez" alongside a survey-import value
// like "jonathan.juarez" that prettifies to the same display name. Rather
// than making someone hunt these down and rename them by hand, this scans
// every raw key in use (surveys + per-member AHT logs) across all periods,
// groups the ones that share a prettified name, and folds each group into
// one canonical key via the existing renameAgentGlobally merge logic. Runs
// automatically on load and after every import, so it stays fixed even as
// new data comes in. Safe to run repeatedly — a no-op once everything's
// already merged.
function autoMergeDuplicateAgentNames(){
  const raws=new Set();
  Object.keys(state).forEach(key=>{
    const p=state[key];
    if(!p)return;
    (p.surveys||[]).forEach(s=>{const a=(s.agent||'').trim();if(a)raws.add(a);});
    Object.keys(p.dailyAHTByMember||{}).forEach(a=>raws.add(a));
    Object.keys(p.monthlyAHTByMember||{}).forEach(a=>raws.add(a));
  });
  getManualMembersAll().forEach(a=>raws.add(a));
  const groups={};
  raws.forEach(raw=>{
    const canon=_memberCanon(raw);
    (groups[canon]=groups[canon]||[]).push(raw);
  });
  const merged=[];
  Object.values(groups).forEach(list=>{
    if(list.length<2)return;
    // Prefer an already-correctly-formatted variant as the target (one that
    // equals its own prettified form and has a space); otherwise fall back
    // to the prettified form of whichever variant came first.
    // A name you typed into the manual team list always wins, so the pinned tile keeps its spelling.
    const manual=getManualMembersAll();
    let target=list.find(r=>manual.includes(r));
    if(!target)target=list.find(r=>r.includes(' ')&&!r.includes(',')&&r===prettifyAgentName(r));
    if(!target)target=_memberCanon(list[0]).replace(/(^|\s)\S/g,c=>c.toUpperCase());
    list.forEach(raw=>{
      if(raw!==target){renameAgentGlobally(raw,target);merged.push([raw,target]);}
    });
  });
  return merged;
}
function confirmRenameMember(){
  const newInput=document.getElementById('rename-member-new');
  const newName=((newInput&&newInput.value)||'').trim();
  const oldName=_renameMemberTarget;
  if(!oldName)return;
  if(!newName){showToast('Enter a name');return;}
  if(newName!==oldName)renameAgentGlobally(oldName,newName);
  closeRenameMemberModal();
  showToast(newName===oldName?'No change made':`Renamed "${oldName}" → "${newName}"`);
  if(typeof renderTeamView==='function')renderTeamView();
  if(typeof renderDashboard==='function')renderDashboard();
  if(typeof renderSurveyTable==='function')renderSurveyTable();
  if(typeof populateAHTMemberSelect==='function')populateAHTMemberSelect();
  if(typeof renderAHTMemberGrid==='function')renderAHTMemberGrid();
  if(typeof updateTeamNavState==='function')updateTeamNavState();
}
// ── Auto-migrate the legacy personal AHT log ─────────────────────────────
// p.dailyAHT is Jonathan's own solo AHT/chat-count log, from before
// per-member tracking existed — it was always his data alone, never a
// generic "pick who this belongs to" log. So instead of asking which team
// member it belongs to, this copies it straight into the "Jonathan Juarez"
// per-member entry (creating it if it doesn't exist yet), filling in only
// days that member doesn't already have. The personal log itself is never
// touched, so anything else still reading p.dailyAHT directly keeps working.
// Runs automatically on load and after every import, same as the name merge.
function autoMigratePersonalAHTLog(){
  const target='Jonathan Juarez';
  let daysCopied=0;
  Object.keys(state).forEach(key=>{
    const p=state[key];
    const personal=p&&p.dailyAHT;
    if(!personal)return;
    const dkKeys=Object.keys(personal);
    if(!dkKeys.length)return;
    if(!p.dailyAHTByMember)p.dailyAHTByMember={};
    if(!p.dailyAHTByMember[target])p.dailyAHTByMember[target]={};
    dkKeys.forEach(dk=>{
      if(!p.dailyAHTByMember[target][dk]){
        p.dailyAHTByMember[target][dk]=personal[dk];
        daysCopied++;
      }
    });
  });
  if(daysCopied)saveState();
  return daysCopied;
}
// Groups one period's surveys by agent name → Map<name, survey[]>
function getAgentsForPeriod(key){
  const surveys=getPeriod(key).surveys||[];
  const map=new Map();
  surveys.forEach(s=>{
    const n=(s.agent||'').trim();
    if(!n)return;
    if(!map.has(n))map.set(n,[]);
    map.get(n).push(s);
  });
  return map;
}
function updateTeamNavState(){
  const navEl=document.getElementById('nav-team');
  if(!navEl)return;
  // Team View is always available in the side nav (it no longer waits for 2+ detected
  // members) — members can be added by hand, and surveys fill in the rest automatically.
  navEl.style.display='';
  navEl.classList.remove('nav-locked');
  const lockIcon=document.getElementById('nav-team-lock');
  if(lockIcon)lockIcon.style.display='none';
  navEl.title='';
}

// ── Where CSAT / AR / AHT count toward the Final KPI ─────────────────────────
// Same idea as a custom metric's scope: 'both' (default), 'dashboard' (main dashboard
// only) or 'team' (team members only). An out-of-scope metric still shows its tile and
// grade; it just contributes 0 points to the Final KPI on the side it's excluded from.
let STOCK_SCOPE={csat:'both',ar:'both',aht:'both'};
const STOCK_LABELS={csat:'CSAT',ar:'AR',aht:'AHT'};
function stockScopeOf(m){const s=STOCK_SCOPE[m];return(s==='dashboard'||s==='team')?s:'both';}
function stockInScope(m,ctx){const s=stockScopeOf(m);return s==='both'||s===(ctx==='team'?'team':'dashboard');}
function loadStockScope(){
  try{
    const t=JSON.parse(localStorage.getItem('kpi_stock_scope_v1')||'null');
    if(t&&typeof t==='object')['csat','ar','aht'].forEach(k=>{STOCK_SCOPE[k]=(t[k]==='dashboard'||t[k]==='team')?t[k]:'both';});
  }catch(e){}
}
function saveStockScope(){try{localStorage.setItem('kpi_stock_scope_v1',JSON.stringify(STOCK_SCOPE));}catch(e){}}
// Copy of a weights object with out-of-scope stock metrics zeroed for one side.
function scopeWeights(w,ctx){
  const o=Object.assign({},w);
  ['csat','ar','aht'].forEach(k=>{if(!stockInScope(k,ctx))o[k]=Object.keys(w[k]||{}).reduce((a,g)=>(a[g]=0,a),{});});
  return o;
}
// 'CSAT + AR + AHT + QA' style label of what feeds the Final KPI on one side.
function kpiFormulaLabel(ctx){
  return['csat','ar','aht'].filter(k=>stockInScope(k,ctx)).map(k=>STOCK_LABELS[k])
    .concat(CUSTOM_METRIC_DEFS.filter(d=>customMetricInScope(d,ctx)&&customMetricIsScored(customScoringFor(d.id,getThresholdsForPeriod(activePeriodKey)))).map(d=>d.name)).join(' + ')||'—';
}
function loadThresholds(){
  loadStockScope();
  try{
    const t=JSON.parse(localStorage.getItem('kpi_thresholds_v1')||'null');
    if(t){
      if(t.csat)CSAT_THRESHOLDS=t.csat.map((v,i)=>({...DEFAULT_CSAT_THRESHOLDS[i],...v}));
      if(t.ar)AR_THRESHOLDS=t.ar.map((v,i)=>({...DEFAULT_AR_THRESHOLDS[i],...v}));
      if(t.aht)AHT_THRESHOLDS=t.aht.map((v,i)=>({...DEFAULT_AHT_THRESHOLDS[i],...v}));
      if(t.weights)KPI_WEIGHTS=Object.assign(JSON.parse(JSON.stringify(DEFAULT_KPI_WEIGHTS)),{
        csat:Object.assign({},DEFAULT_KPI_WEIGHTS.csat,t.weights.csat),
        ar:Object.assign({},DEFAULT_KPI_WEIGHTS.ar,t.weights.ar),
        aht:Object.assign({},DEFAULT_KPI_WEIGHTS.aht,t.weights.aht)
      });
      if(t.custom&&typeof t.custom==='object'){
        CUSTOM_SCORING={};
        Object.keys(t.custom).forEach(k=>{CUSTOM_SCORING[k]=normCustomScoring(t.custom[k]);});
      }
    }
  }catch(e){}
}
function saveThresholds(){
  const data={
    csat:CSAT_THRESHOLDS.map(t=>({grade:t.grade,min:t.min})),
    ar:AR_THRESHOLDS.map(t=>({grade:t.grade,min:t.min})),
    aht:AHT_THRESHOLDS.map(t=>({grade:t.grade,max:t.max===Infinity?null:t.max})),
    weights:{csat:{...KPI_WEIGHTS.csat},ar:{...KPI_WEIGHTS.ar},aht:{...KPI_WEIGHTS.aht}},
    custom:JSON.parse(JSON.stringify(CUSTOM_SCORING))
  };
  localStorage.setItem('kpi_thresholds_v1',JSON.stringify(data));
}

// ── Team-page thresholds (separate storage, separate from the dashboard's) ────
function loadTeamThresholds(){
  try{
    const t=JSON.parse(localStorage.getItem('kpi_team_thresholds_v1')||'null');
    if(t){
      if(t.csat)TEAM_CSAT_THRESHOLDS=t.csat.map((v,i)=>({...DEFAULT_CSAT_THRESHOLDS[i],...v}));
      if(t.ar)TEAM_AR_THRESHOLDS=t.ar.map((v,i)=>({...DEFAULT_AR_THRESHOLDS[i],...v}));
      if(t.aht)TEAM_AHT_THRESHOLDS=t.aht.map((v,i)=>({...DEFAULT_AHT_THRESHOLDS[i],...v,max:v.max===null?Infinity:v.max}));
    }
  }catch(e){}
}
function saveTeamThresholds(){
  const data={
    csat:TEAM_CSAT_THRESHOLDS.map(t=>({grade:t.grade,min:t.min})),
    ar:TEAM_AR_THRESHOLDS.map(t=>({grade:t.grade,min:t.min})),
    aht:TEAM_AHT_THRESHOLDS.map(t=>({grade:t.grade,max:t.max===Infinity?null:t.max}))
  };
  localStorage.setItem('kpi_team_thresholds_v1',JSON.stringify(data));
}
// Grading helpers scoped to the team page — used by renderTeamView() and
// openMemberSurveyList() only, never by the main dashboard.
function gradeCSATTeam(s){return gradeCSATWith(s,TEAM_CSAT_THRESHOLDS);}
function gradeARTeam(p){return gradeARWith(p,TEAM_AR_THRESHOLDS);}
function gradeAHTTeam(s){return gradeAHTWith(s,TEAM_AHT_THRESHOLDS);}
// KPI score for the team page: same point-per-grade weights as the dashboard
// (KPI_WEIGHTS), but the grade each metric falls into is looked up against
// the team's own thresholds above, so the resulting score matches what the
// team tile grade pills show, not the dashboard's grading.
function weightCSATTeam(avg){if(avg===null||!stockInScope('csat','team'))return 0;return (KPI_WEIGHTS.csat||{})[gradeCSATTeam(avg).grade]||0;}
function weightARTeam(pct){if(pct===null||!stockInScope('ar','team'))return 0;return (KPI_WEIGHTS.ar||{})[gradeARTeam(pct).grade]||0;}
function weightAHTTeam(sec){if(!sec||sec<=0||!stockInScope('aht','team'))return 0;return (KPI_WEIGHTS.aht||{})[gradeAHTTeam(sec).grade]||0;}

// ── Per-month threshold overrides ─────────────────────────────────────────────
// Storage key: 'kpi_monthly_thresholds_v1'
// Structure: { "2026-06": { csat:[...], ar:[...], aht:[...], weights:{...} }, ... }

let _monthlyThreshCache=null;
function loadMonthlyThresholds(){
  if(_monthlyThreshCache)return _monthlyThreshCache;
  try{_monthlyThreshCache=JSON.parse(localStorage.getItem('kpi_monthly_thresholds_v1')||'{}');}catch(e){_monthlyThreshCache={};}
  return _monthlyThreshCache;
}
function saveMonthlyThresholds(all){
  _monthlyThreshCache=all;
  localStorage.setItem('kpi_monthly_thresholds_v1',JSON.stringify(all));
}
// Returns the effective threshold arrays for a given periodKey (falls back to global)
function getThresholdsForPeriod(pk){
  const all=loadMonthlyThresholds();
  const ov=all[pk];
  if(!ov) return {csat:CSAT_THRESHOLDS,ar:AR_THRESHOLDS,aht:AHT_THRESHOLDS,weights:scopeWeights(KPI_WEIGHTS,'dashboard'),custom:CUSTOM_SCORING};
  const csat=ov.csat?ov.csat.map((v,i)=>({...DEFAULT_CSAT_THRESHOLDS[i],...v})):CSAT_THRESHOLDS;
  const ar=ov.ar?ov.ar.map((v,i)=>({...DEFAULT_AR_THRESHOLDS[i],...v})):AR_THRESHOLDS;
  const aht=ov.aht?ov.aht.map((v,i)=>({...DEFAULT_AHT_THRESHOLDS[i],...v,max:v.max===null?Infinity:v.max})):AHT_THRESHOLDS;
  const weights=scopeWeights(ov.weights?Object.assign(JSON.parse(JSON.stringify(KPI_WEIGHTS)),ov.weights):KPI_WEIGHTS,'dashboard');
  const custom=Object.assign({},CUSTOM_SCORING,ov.custom||{});
  // A month override that holds an empty (not scored) entry for a metric — typically saved
  // before that metric's grades/points were set — shouldn't hide the scoring set globally.
  Object.keys(custom).forEach(id=>{
    if(!customMetricIsScored(normCustomScoring(custom[id]))&&CUSTOM_SCORING[id]&&customMetricIsScored(normCustomScoring(CUSTOM_SCORING[id])))custom[id]=CUSTOM_SCORING[id];
  });
  return {csat,ar,aht,weights,custom};
}
// Saves an override for a period. Pass null to clear it (revert to global).
function setMonthlyThresholdOverride(pk,data){
  const all=loadMonthlyThresholds();
  if(data===null){delete all[pk];}else{all[pk]=data;}
  saveMonthlyThresholds(all);
}
function hasMonthlyOverride(pk){
  const all=loadMonthlyThresholds();
  return !!all[pk];
}
function getMonthlyOverrideRaw(pk){
  return (loadMonthlyThresholds())[pk]||null;
}

// Grading helpers that accept explicit threshold arrays (used for historical periods)
function gradeCSATWith(s,thresholds){for(const t of thresholds)if(s>=t.min)return t;return thresholds[thresholds.length-1];}
function gradeARWith(p,thresholds){for(const t of thresholds)if(p>=t.min)return t;return thresholds[thresholds.length-1];}
function gradeAHTWith(s,thresholds){for(const t of thresholds)if(s<=t.max)return t;return thresholds[thresholds.length-1];}
// ─────────────────────────────────────────────────────────────────────────────

function loadGoals(){}

function initYearSelect(){
  const sel=document.getElementById('year-sel');sel.innerHTML='';
  const y=new Date().getFullYear();
  for(let i=y-3;i<=y+2;i++){const o=document.createElement('option');o.value=i;o.textContent=i;if(i===y)o.selected=true;sel.appendChild(o);}
}

function setActivePeriod(m,y){
  activePeriodKey=periodKey(m,y);
  applyActivePeriodThresholds(); // load this month's threshold overrides (or global fallback)
  document.getElementById('month-sel').value=m;
  document.getElementById('year-sel').value=y;
  updatePeriodNavButtons();
  if(typeof updateTeamNavState==='function')updateTeamNavState();
  if(typeof refreshWdayBadge==='function')refreshWdayBadge();
  const lbl=periodLabel(m,y);
  document.getElementById('period-label-header').textContent=lbl;
  document.querySelectorAll('.period-label-sync').forEach(el=>el.textContent=lbl);
  const p=getPeriod(activePeriodKey);
  document.getElementById('aht-input').value=p.aht||'';
  // Set daily AHT date input to today (or last day of period month if historical)
  const [py,pm]=activePeriodKey.split('-').map(Number);
  const now=new Date();
  const isCurrentMonth=now.getFullYear()===py&&(now.getMonth()+1)===pm;
  const defaultDate=isCurrentMonth
    ? localDateKey(now)
    : localDateKey(new Date(py,pm-1,new Date(py,pm,0).getDate()));
  const dateInput=document.getElementById('daily-aht-date');
  if(dateInput)dateInput.value=defaultDate;
  if(typeof setAHTManualDate==='function')setAHTManualDate(defaultDate);
  updateAHT();
  renderDailyAHTList();
  renderAHTImportedTable();
  renderDashboard();
  renderSurveyTable();
  // Re-render whichever page is currently visible
  if(document.getElementById('page-weekly')&&document.getElementById('page-weekly').style.display!=='none')renderWeeklyView();
  if(document.getElementById('page-monthsummary')&&document.getElementById('page-monthsummary').style.display!=='none')renderMonthSummary();
  if(document.getElementById('page-history')&&document.getElementById('page-history').style.display!=='none')renderHistory();
  if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none')renderTeamView();
  // A member's dashboard popup is open? Reload it for the newly selected month.
  try{
    const _mdm=document.getElementById('member-dashboard-modal');
    const _mdn=document.getElementById('member-dash-name');
    if(_mdm&&_mdm.classList.contains('open')&&_mdn&&_mdn.dataset.agent&&typeof openMemberDashboard==='function')openMemberDashboard(_mdn.dataset.agent);
  }catch(e){}
  saveState();
}
function changePeriod(){
  const m=parseInt(document.getElementById('month-sel').value);
  const y=parseInt(document.getElementById('year-sel').value);
  setActivePeriod(m,y);
}

// Enable/disable the prev/next arrows at the year-sel's range boundary.
// shiftPeriod() (defined in app-04) is what actually moves the period;
// this just keeps the sidebar's arrow buttons from stepping past what
// year-sel supports.
function updatePeriodNavButtons(){
  const ySel=document.getElementById('year-sel');
  if(!ySel||!ySel.options.length)return;
  const minY=Math.min(...Array.from(ySel.options).map(o=>parseInt(o.value)));
  const [y,m]=activePeriodKey.split('-').map(Number);
  // Next is capped at the real current month — there's no data beyond "now",
  // so once the active period reaches it the forward arrow just stops.
  const now=new Date();
  const curY=now.getFullYear(),curM=now.getMonth()+1;
  const prevDisabled=(y===minY&&m===1);
  const nextDisabled=(y===curY&&m===curM)||(y>curY);
  // Every prev/next month button on every page (dashboard, weekly, history,
  // month summary, etc.) shares the same shiftPeriod() handler, so sync them
  // all here rather than just the two id'd ones in the sidebar header.
  document.querySelectorAll('[data-ph-click="shiftPeriod(-1)"]').forEach(b=>b.disabled=prevDisabled);
  document.querySelectorAll('[data-ph-click="shiftPeriod(1)"]').forEach(b=>b.disabled=nextDisabled);
}

// Grade helpers
// activeThresh holds the resolved thresholds for the currently-rendered period.
// It is set by applyActivePeriodThresholds() whenever the period changes.
let activeThresh={csat:null,ar:null,aht:null,weights:null,custom:null};
function applyActivePeriodThresholds(){
  const t=getThresholdsForPeriod(activePeriodKey);
  activeThresh.csat=t.csat;
  activeThresh.ar=t.ar;
  activeThresh.aht=t.aht;
  activeThresh.weights=t.weights;
  activeThresh.custom=t.custom;
}
function gradeCSAT(s){const th=activeThresh.csat||CSAT_THRESHOLDS;for(const t of th)if(s>=t.min)return t;return th[th.length-1];}
function gradeAR(p){const th=activeThresh.ar||AR_THRESHOLDS;for(const t of th)if(p>=t.min)return t;return th[th.length-1];}
function gradeAHT(s){const th=activeThresh.aht||AHT_THRESHOLDS;for(const t of th)if(s<=t.max)return t;return th[th.length-1];}

function needed5sForCSAT(target,surveys){
  const b=csatBreakdown(surveys);
  const rps=Math.max(1,Math.round(b.ratingsPerSurvey)); // ratings added by one new survey
  let sum=b.sum,t=b.n,n=0;
  while(n<9999){if(t>0&&sum/t>=target)break;sum+=5*rps;t+=rps;n++;}
  return n>=9999?'many':n;
}
function neededYesForAR(target,surveys){
  let yes=surveys.filter(sv=>sv.ar==='yes').length;
  let total=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no').length;
  let n=0;
  while(n<9999){if(total>0&&yes/total*100>=target)break;yes++;total++;n++;}
  return n>=9999?'many':n;
}

// Average CSAT score needed per remaining day to reach target grade.
// Projects how many surveys per day at what avg score would close the gap.
// Returns null when not computable; a value > 5 means unreachable.
function avgCSATNeededPerDay(targetMin,csatSurveys,remainingDays){
  if(!remainingDays||remainingDays<=0||!csatSurveys.length)return null;
  const cb=csatBreakdown(csatSurveys);
  const currentSum=cb.sum,ratingsPerSurvey=cb.ratingsPerSurvey;
  const currentCount=csatSurveys.length;
  // Use actual daily avg based on working days elapsed
  const rd=getRemainingDaysForActivePeriod();
  const daysElapsed=rd.usingWorkingDays
    ?loadWorkingDays().filter(d=>d<=(new Date().getDate())).length
    :new Date().getDate();
  const dailyRate=daysElapsed>0?currentCount/daysElapsed:currentCount;
  const projectedNewCount=Math.round(dailyRate*remainingDays);
  if(projectedNewCount<=0)return null;
  // Solve: (currentSum + projectedNewCount * x) / (currentCount + projectedNewCount) >= targetMin
  // Pooled formula: work in ratings, each new survey adds ratingsPerSurvey ratings
  const newRatings=projectedNewCount*ratingsPerSurvey;
  const needed=(targetMin*(cb.n+newRatings)-currentSum)/newRatings;
  return{avgNeeded:needed,perDay:dailyRate};
}

// Average YES rate needed per remaining day (expressed as surveys/day at what hit rate)
// Returns null when not computable; pctNeeded > 100 means unreachable.
function avgARNeededPerDay(targetMin,surveys,remainingDays){
  if(!remainingDays||remainingDays<=0)return null;
  const arResponded=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  if(!arResponded.length)return null;
  const currentYes=surveys.filter(sv=>sv.ar==='yes').length;
  const currentTotal=arResponded.length;
  const rd=getRemainingDaysForActivePeriod();
  const daysElapsed=rd.usingWorkingDays
    ?loadWorkingDays().filter(d=>d<=(new Date().getDate())).length
    :new Date().getDate();
  const dailyRate=daysElapsed>0?currentTotal/daysElapsed:currentTotal;
  const projectedNewTotal=Math.round(dailyRate*remainingDays);
  if(projectedNewTotal<=0)return null;
  // Solve: (currentYes + projectedNewTotal * x) / (currentTotal + projectedNewTotal) >= targetMin/100
  const needed=(targetMin/100*(currentTotal+projectedNewTotal)-currentYes)/projectedNewTotal;
  return{pctNeeded:needed*100,perDay:dailyRate};
}

// AHT
// AHT — compute running average from daily entries; fall back to legacy single value
// Normalize a dailyAHT entry — handles legacy plain-number and new {aht,count} format
function normAHTEntry(v){
  if(v&&typeof v==='object')return{aht:v.aht||0,count:v.count||0};
  return{aht:v||0,count:0};
}

// ── Per-member AHT / chat count ──────────────────────────────────────────
// Kept in its own p.dailyAHTByMember{agent:{dateKey:{aht,count}}} store,
// completely separate from p.dailyAHT (which stays Jonathan's own personal
// daily AHT log exactly as before) — so none of the existing heatmap,
// sparkline, weekly/month-summary, forecast or badge code needs to change.
function getMemberDailyAHTMap(period,agent){
  if(!period.dailyAHTByMember)period.dailyAHTByMember={};
  if(!period.dailyAHTByMember[agent])period.dailyAHTByMember[agent]={};
  return period.dailyAHTByMember[agent];
}
// Delete one member's AHT/chat entry for a day. For the personal-log member the same day
// also lives in the legacy p.dailyAHT, and autoMigratePersonalAHTLog() copies that back
// into the member entry on every load/import — so both copies must go or the day returns.
function _deleteMemberDayAHT(p,agent,dk){
  if(p.dailyAHTByMember&&p.dailyAHTByMember[agent])delete p.dailyAHTByMember[agent][dk];
  if(_isPersonalLogMember(agent)&&p.dailyAHT)delete p.dailyAHT[dk];
}
function getMemberAHTEntries(period,agent){
  const daily=(period.dailyAHTByMember&&period.dailyAHTByMember[agent])||{};
  return Object.entries(daily)
    .map(([dk,v])=>({dk,...normAHTEntry(v)}))
    .filter(e=>e.aht>0)
    .sort((a,b)=>a.dk.localeCompare(b.dk));
}
// Weighted-average AHT + total chats for one member across a period. Returns null if no data.
// A saved "for the month" running total (period.monthlyAHTByMember[agent]) always takes
// priority over day-by-day entries — same override pattern as the legacy p.monthlyAHT.
// That lets someone log daily most months but switch to one running number on a month
// they can't keep up with the day-by-day grid, without losing whatever daily rows exist.
function getMemberAHTStats(period,agent){
  const monthly=(period.monthlyAHTByMember&&period.monthlyAHTByMember[agent])||null;
  if(monthly&&monthly.aht>0){
    return{avgSec:monthly.aht,totalChats:monthly.count||0,days:null,isMonthly:true};
  }
  const entries=getMemberAHTEntries(period,agent);
  if(!entries.length)return null;
  const totalChats=entries.reduce((a,e)=>a+(e.count||0),0);
  const weightUnits=entries.reduce((a,e)=>a+(e.count||1),0);
  const weightedSum=entries.reduce((a,e)=>a+e.aht*(e.count||1),0);
  return{avgSec:weightedSum/weightUnits,totalChats,days:entries.length};
}
// Union of every agent name with either daily or monthly-total AHT/chat data logged.
function getAHTLoggedAgents(period){
  const set=new Set(Object.keys(period.dailyAHTByMember||{}));
  Object.keys(period.monthlyAHTByMember||{}).forEach(a=>{
    const v=period.monthlyAHTByMember[a];
    if(v&&v.aht>0)set.add(a);
  });
  return[...set];
}
// Day-by-day team AHT trend — for each date, the simple average of every
// member's AHT entry that day (mirrors computeAHTSec's per-member averaging,
// just broken out by day instead of collapsed to one period-long number).
// Used to feed the dashboard sparkline when the tile itself is showing the
// team average rather than your own personal daily log.
function getTeamAHTDailyTrend(period){
  const byDay={};
  const memberMap=period.dailyAHTByMember||{};
  Object.values(memberMap).forEach(agentDaily=>{
    Object.entries(agentDaily).forEach(([dk,v])=>{
      const e=normAHTEntry(v);
      if(e.aht>0){
        if(!byDay[dk])byDay[dk]=[];
        byDay[dk].push(e.aht);
      }
    });
  });
  return Object.keys(byDay).sort().map(dk=>({dk,aht:byDay[dk].reduce((a,b)=>a+b,0)/byDay[dk].length}));
}
// The per-day AHT numbers behind the dashboard AHT tile, as {dk:{aht,count}}.
// Same source order as computeAHTSec: member logs first (each day = the average
// of every member's AHT that day, chats added up), else the legacy personal log.
// Anything that lists or colours "AHT by day" should use this, not p.dailyAHT.
function getTileDailyAHTMap(period){
  const trend=getTeamAHTDailyTrend(period);
  if(!trend.length)return period.dailyAHT||{};
  const chats={};
  Object.values(period.dailyAHTByMember||{}).forEach(m=>Object.entries(m).forEach(([dk,v])=>{
    const e=normAHTEntry(v);
    if(e.aht>0)chats[dk]=(chats[dk]||0)+(e.count||0);
  }));
  const out={};
  trend.forEach(t=>{out[t.dk]={aht:Math.round(t.aht),count:chats[t.dk]||0};});
  return out;
}
function deleteMemberAHT(agent,dateKey){
  const periodKey=dateKey.slice(0,7);
  const p=getPeriod(periodKey);
  _deleteMemberDayAHT(p,agent,dateKey);
  saveState();
  if(periodKey===activePeriodKey){
    if(typeof renderTeamView==='function')renderTeamView();
    if(typeof updateAHT==='function')updateAHT();
    if(typeof renderDashboard==='function')renderDashboard();
  }
  if(typeof openMemberSurveyList==='function')openMemberSurveyList(agent);
  showToast('AHT entry removed');
}
// Removes a member's "for the month" running total (from the member popup),
// falling back to whatever daily entries that member has, if any.
function deleteMemberMonthlyAHT(agent){
  const p=getPeriod(activePeriodKey);
  if(p.monthlyAHTByMember)delete p.monthlyAHTByMember[agent];
  saveState();
  if(typeof renderTeamView==='function')renderTeamView();
  if(typeof updateAHT==='function')updateAHT();
  if(typeof renderAHTImportedTable==='function')renderAHTImportedTable();
  if(typeof renderDashboard==='function')renderDashboard();
  if(typeof renderAHTMemberGrid==='function')renderAHTMemberGrid();
  if(typeof openMemberSurveyList==='function')openMemberSurveyList(agent);
  showToast('Month total removed');
}
// Populates the manual-entry "For" dropdown (legacy, kept for compat if
// present) with auto-detected agent names, and refreshes the per-member
// AHT/chat-count entry grid below it.
function populateAHTMemberSelect(){
  const sel=document.getElementById('aht-manual-agent');
  if(sel){
    const names=getAllAgentNamesGlobal().sort((a,b)=>a.localeCompare(b));
    const cur=sel.value;
    sel.innerHTML='<option value="">My own (unassigned)</option>'+names.map(n=>`<option value="${escHtml(n)}">${escHtml(prettifyAgentName(n))}</option>`).join('');
    if(names.includes(cur))sel.value=cur;
  }
  if(typeof renderAHTMemberGrid==='function')renderAHTMemberGrid();
}

// ── Per-member AHT/chat-count entry grid ─────────────────────────────────────
// One row per auto-detected team member (+ "My own"), each with its own
// chats/AHT inputs for whatever date is selected above. Replaces the old
// single date/chats/aht/agent-dropdown form with a quicker row-per-member
// layout so a whole day's numbers can be logged in one pass.
let _ahtGridRows=[];
// 'daily' = one row per day per member (original behavior). 'monthly' = one
// running total per member for the whole active period — for when there
// isn't time to log every day, this can be updated anytime as the month goes.
let ahtEntryMode='daily';
function setAHTEntryMode(mode){
  if(mode!=='daily'&&mode!=='monthly')return;
  ahtEntryMode=mode;
  const dailyBtn=document.getElementById('aht-mode-daily-btn');
  const monthlyBtn=document.getElementById('aht-mode-monthly-btn');
  [dailyBtn,monthlyBtn].forEach(b=>{
    if(!b)return;
    const active=b.id==='aht-mode-daily-btn'?mode==='daily':mode==='monthly';
    b.classList.toggle('active',active);
    b.style.background=active?'var(--accent)':'transparent';
    b.style.color=active?'#fff':'var(--text-muted)';
  });
  const dateRow=document.getElementById('aht-daily-date-row');
  if(dateRow)dateRow.style.display=mode==='daily'?'flex':'none';
  const hint=document.getElementById('aht-mode-hint');
  if(hint)hint.textContent=mode==='daily'
    ?'Pick a day, then log each team member\'s chats & AHT for that day.'
    :'Enter one running total per person for the whole month — edit it anytime as the month goes on; it overrides that person\'s daily rows while set.';
  renderAHTMemberGrid();
}
function renderAHTMemberGrid(){
  if(ahtEntryMode==='monthly'){renderAHTMemberGridMonthly();return;}
  const wrap=document.getElementById('aht-member-grid-wrap');
  if(!wrap)return;
  const dateInput=document.getElementById('aht-manual-date');
  let dk=(dateInput&&dateInput.dataset.value)||'';
  if(!dk){
    // Default to today so the grid is usable right away — the date stays editable.
    if(dateInput&&typeof setAHTManualDate==='function'){
      const now=new Date();
      dk=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
      setAHTManualDate(dk);
      return; // setAHTManualDate re-invokes renderAHTMemberGrid()
    }
    wrap.innerHTML='<div style="font-size:12px;color:var(--text-muted);font-style:italic;padding:10px 2px">Pick a date above to log chats &amp; AHT for each team member.</div>';
    _ahtGridRows=[];
    return;
  }
  const periodKey=dk.slice(0,7);
  const p=getPeriod(periodKey);
  const d=new Date(dk+'T00:00:00');
  const dateLabel=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  const names=getAgentNamesForAHTGrid(periodKey).sort((a,b)=>a.localeCompare(b));
  // No blank "My own (unassigned)" row — every entry, including Jonathan's,
  // is logged against a detected agent name so it all feeds the same
  // per-member team average instead of the separate personal AHT log.
  const rows=names.map(n=>({agent:n,label:prettifyAgentName(n)}));
  _ahtGridRows=rows.map(r=>({agent:r.agent,dk}));

  const rowsHtml=rows.map((r,i)=>{
    const existing=(p.dailyAHTByMember&&p.dailyAHTByMember[r.agent]&&p.dailyAHTByMember[r.agent][dk])||null;
    const norm=existing?normAHTEntry(existing):null;
    const chatsVal=norm&&norm.count?norm.count:'';
    const ahtVal=norm&&norm.aht?fmtSec(norm.aht):'';
    const initials=r.label.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?';
    const stats=getMemberAHTStats(p,r.agent);
    const ctx=stats?(stats.isMonthly?`Month total entered · avg ${fmtSec(stats.avgSec)} (overrides daily rows)`:`${stats.days}d logged this month · avg ${fmtSec(stats.avgSec)}`):'No data yet this month';
    return `<div class="aht-grid-row" style="display:grid;grid-template-columns:28px 1fr 92px 112px 26px 30px 30px;align-items:center;gap:10px;padding:8px 10px;border-top:1px solid var(--border)">
      ${memberAvatarHTML(r.agent,26,false)}
      <div style="min-width:0">
        <div style="font-size:12.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(r.label)}</div>
        <div style="font-size:10px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ctx}</div>
      </div>
      <input type="number" min="1" placeholder="Chats (opt.)" value="${chatsVal}" class="aht-grid-chats" data-idx="${i}" style="width:92px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:6px;font-family:var(--mono);font-size:12px" data-ph-keydown="if(event.key==='Enter')saveAHTGridRow(${i})">
      <input type="text" placeholder="5m 30s or 5 30" value="${ahtVal}" class="aht-grid-aht" data-idx="${i}" data-ph-blur="normalizeAHTField(this)" style="width:112px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:6px;font-family:var(--mono);font-size:12px" data-ph-keydown="if(event.key==='Enter')saveAHTGridRow(${i})">
      <button class="icon-btn" title="Rename this member" data-agent="${escHtml(r.agent)}" data-ph-click="openRenameMemberModal(this.dataset.agent)"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="icon-btn" title="Save" data-ph-click="saveAHTGridRow(${i})"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></button>
      ${norm?`<button class="icon-btn danger" title="Remove this entry" data-ph-click="deleteAHTGridRow(${i})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>`:'<span></span>'}
    </div>`;
  }).join('');

  wrap.innerHTML=`<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--surface3);font-size:11px;color:var(--text-muted)">
      <span>Logging chats &amp; AHT for <strong style="color:var(--text)">${dateLabel}</strong></span>
      <span id="aht-grid-status"></span>
    </div>
    ${rows.length?rowsHtml:'<div style="padding:12px 10px;font-size:12px;color:var(--text-muted);font-style:italic">No team members in this month yet — import surveys with an agent name (including your own) or add a member to start logging chats &amp; AHT.</div>'}
  </div>`;
}
function _ahtGridSetStatus(msg,color){
  const el=document.getElementById('aht-grid-status');
  if(el){el.style.color=color||'var(--text-muted)';el.textContent=msg;}
}
function saveAHTGridRow(i){
  const row=_ahtGridRows[i];
  if(!row)return;
  const{agent,dk}=row;
  const chatsInput=document.querySelector(`.aht-grid-chats[data-idx="${i}"]`);
  const ahtInput=document.querySelector(`.aht-grid-aht[data-idx="${i}"]`);
  // Chat count is optional — blank saves as 0 (AHT-only entry). A filled-in count must be valid.
  const chatsRaw=((chatsInput&&chatsInput.value)||'').trim();
  const chats=chatsRaw===''?0:parseInt(chatsRaw,10);
  const ahtSec=parseAHTInput(ahtInput&&ahtInput.value);
  if(chatsRaw!==''&&(isNaN(chats)||chats<=0)){_ahtGridSetStatus('Chat count must be a positive number (or leave it blank).','#f87171');chatsInput&&chatsInput.focus();return;}
  if(!ahtSec||ahtSec<=0){_ahtGridSetStatus('Enter a valid AHT (e.g. 5m 30s, 5 30, or 330).','#f87171');ahtInput&&ahtInput.focus();return;}
  const periodKey=dk.slice(0,7);
  const p=getPeriod(periodKey);
  const label=(new Date(dk+'T00:00:00')).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  if(agent){
    const memberDaily=getMemberDailyAHTMap(p,agent);
    memberDaily[dk]={aht:ahtSec,count:chats};
  } else {
    p.dailyAHT[dk]={aht:ahtSec,count:chats};
  }
  saveState();
  if(periodKey===activePeriodKey){
    if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none'&&typeof renderTeamView==='function')renderTeamView();
    updateAHT();
    renderDailyAHTList();
    renderAHTImportedTable();
    if(typeof renderDashboard==='function')renderDashboard();
  }
  renderAHTMemberGrid();
  _ahtGridSetStatus(`✓ ${label} saved for ${agent||'My own'}`,'#4ade80');
}
function deleteAHTGridRow(i){
  const row=_ahtGridRows[i];
  if(!row)return;
  const{agent,dk}=row;
  const periodKey=dk.slice(0,7);
  const p=getPeriod(periodKey);
  if(agent){
    _deleteMemberDayAHT(p,agent,dk);
  } else if(p.dailyAHT){
    delete p.dailyAHT[dk];
  }
  saveState();
  if(periodKey===activePeriodKey){
    if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none'&&typeof renderTeamView==='function')renderTeamView();
    updateAHT();
    renderDailyAHTList();
    renderAHTImportedTable();
    if(typeof renderDashboard==='function')renderDashboard();
  }
  renderAHTMemberGrid();
  showToast('Entry removed');
}

// ── "For the month" running-total grid ───────────────────────────────────
// Same idea as the daily grid, but one row per member with a single chats +
// AHT pair for the whole active period instead of one per date. Saving
// overwrites the previous total, so it's meant to be edited repeatedly
// (e.g. updated every few days with the latest running numbers) rather than
// requiring the final month-end figure up front.
let _ahtGridRowsMonthly=[];
function renderAHTMemberGridMonthly(){
  const wrap=document.getElementById('aht-member-grid-wrap');
  if(!wrap)return;
  const periodKey=activePeriodKey;
  const p=getPeriod(periodKey);
  const [py,pm]=periodKey.split('-').map(Number);
  const names=getAgentNamesForAHTGrid(periodKey).sort((a,b)=>a.localeCompare(b));
  const rows=names.map(n=>({agent:n,label:prettifyAgentName(n)}));
  _ahtGridRowsMonthly=rows.map(r=>({agent:r.agent}));

  const rowsHtml=rows.map((r,i)=>{
    const existing=(p.monthlyAHTByMember&&p.monthlyAHTByMember[r.agent])||null;
    const norm=existing?normAHTEntry(existing):null;
    const chatsVal=norm&&norm.count?norm.count:'';
    const ahtVal=norm&&norm.aht?fmtSec(norm.aht):'';
    const initials=r.label.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?';
    const dailyCount=getMemberAHTEntries(p,r.agent).length;
    const ctx=norm?'Running month total (overrides daily rows)':(dailyCount?`${dailyCount} daily ${dailyCount===1?'entry':'entries'} logged — add a month total to switch`:'No data yet this month');
    return `<div class="aht-grid-row" style="display:grid;grid-template-columns:28px 1fr 100px 112px 26px 30px 30px;align-items:center;gap:10px;padding:8px 10px;border-top:1px solid var(--border)">
      ${memberAvatarHTML(r.agent,26,false)}
      <div style="min-width:0">
        <div style="font-size:12.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(r.label)}</div>
        <div style="font-size:10px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ctx}</div>
      </div>
      <input type="number" min="1" placeholder="Total chats (opt.)" value="${chatsVal}" class="aht-grid-chats-m" data-idx="${i}" style="width:100px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:6px;font-family:var(--mono);font-size:12px" data-ph-keydown="if(event.key==='Enter')saveAHTGridRowMonthly(${i})">
      <input type="text" placeholder="Avg AHT" value="${ahtVal}" class="aht-grid-aht-m" data-idx="${i}" data-ph-blur="normalizeAHTField(this)" style="width:112px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:6px;font-family:var(--mono);font-size:12px" data-ph-keydown="if(event.key==='Enter')saveAHTGridRowMonthly(${i})">
      <button class="icon-btn" title="Rename this member" data-agent="${escHtml(r.agent)}" data-ph-click="openRenameMemberModal(this.dataset.agent)"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="icon-btn" title="Save" data-ph-click="saveAHTGridRowMonthly(${i})"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></button>
      ${norm?`<button class="icon-btn danger" title="Remove month total" data-ph-click="deleteAHTGridRowMonthly(${i})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>`:'<span></span>'}
    </div>`;
  }).join('');

  wrap.innerHTML=`<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--surface3);font-size:11px;color:var(--text-muted)">
      <span>Running totals for <strong style="color:var(--text)">${periodLabel(pm,py)}</strong> — save again anytime to update the running number</span>
      <span id="aht-grid-status"></span>
    </div>
    ${rows.length?rowsHtml:'<div style="padding:12px 10px;font-size:12px;color:var(--text-muted);font-style:italic">No team members in this month yet — import surveys with an agent name (including your own) or add a member to start logging chats &amp; AHT.</div>'}
  </div>`;
}
function saveAHTGridRowMonthly(i){
  const row=_ahtGridRowsMonthly[i];
  if(!row)return;
  const{agent}=row;
  const chatsInput=document.querySelector(`.aht-grid-chats-m[data-idx="${i}"]`);
  const ahtInput=document.querySelector(`.aht-grid-aht-m[data-idx="${i}"]`);
  // Chat count is optional — blank saves as 0 (AHT-only entry). A filled-in count must be valid.
  const chatsRaw=((chatsInput&&chatsInput.value)||'').trim();
  const chats=chatsRaw===''?0:parseInt(chatsRaw,10);
  const ahtSec=parseAHTInput(ahtInput&&ahtInput.value);
  if(chatsRaw!==''&&(isNaN(chats)||chats<=0)){_ahtGridSetStatus('Chat count must be a positive number (or leave it blank).','#f87171');chatsInput&&chatsInput.focus();return;}
  if(!ahtSec||ahtSec<=0){_ahtGridSetStatus('Enter a valid AHT (e.g. 5m 30s, 5 30, or 330).','#f87171');ahtInput&&ahtInput.focus();return;}
  const p=getPeriod(activePeriodKey);
  if(!p.monthlyAHTByMember)p.monthlyAHTByMember={};
  p.monthlyAHTByMember[agent]={aht:ahtSec,count:chats};
  saveState();
  if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none'&&typeof renderTeamView==='function')renderTeamView();
  updateAHT();
  renderAHTImportedTable();
  if(typeof renderDashboard==='function')renderDashboard();
  renderAHTMemberGrid();
  _ahtGridSetStatus(`✓ Month total saved for ${agent}`,'#4ade80');
}
function deleteAHTGridRowMonthly(i){
  const row=_ahtGridRowsMonthly[i];
  if(!row)return;
  const{agent}=row;
  const p=getPeriod(activePeriodKey);
  if(p.monthlyAHTByMember)delete p.monthlyAHTByMember[agent];
  saveState();
  if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none'&&typeof renderTeamView==='function')renderTeamView();
  updateAHT();
  renderAHTImportedTable();
  if(typeof renderDashboard==='function')renderDashboard();
  renderAHTMemberGrid();
  showToast('Month total removed — back to daily entries (if any)');
}

// Main-dashboard AHT = simple average of each team member's own AHT (each
// member's own value is already weighted by their chat count internally via
// getMemberAHTStats — this just averages those per-member numbers across the
// team, so one member's volume doesn't skew the team number). Falls back to
// your own personal log / manual override only when no member data exists
// yet (e.g. before Team View is unlocked).
function computeAHTSec(){
  const p=getPeriod(activePeriodKey);
  const memberAgents=getAHTLoggedAgents(p);
  const memberAvgs=memberAgents
    .map(a=>getMemberAHTStats(p,a))
    .filter(Boolean)
    .map(s=>s.avgSec);
  if(memberAvgs.length){
    return Math.round(memberAvgs.reduce((a,b)=>a+b,0)/memberAvgs.length);
  }
  // Monthly override takes priority when set
  if(p.monthlyAHT&&p.monthlyAHT>0)return p.monthlyAHT;
  // Fall back to daily entries weighted/simple average (your own log)
  const daily=p.dailyAHT||{};
  const entries=Object.values(daily).map(normAHTEntry).filter(e=>e.aht>0);
  if(!entries.length)return p.aht||0; // legacy fallback
  const hasWeights=entries.some(e=>e.count>0);
  if(hasWeights){
    const totalCalls=entries.reduce((a,e)=>a+(e.count||1),0);
    const weightedSum=entries.reduce((a,e)=>a+e.aht*(e.count||1),0);
    return Math.round(weightedSum/totalCalls);
  }
  return Math.round(entries.reduce((a,e)=>a+e.aht,0)/entries.length);
}

// Remaining days (working days if a calendar is set, else calendar days) left
// in the active period — only meaningful when the active period is the real
// current month, since "remaining" has no meaning for a closed past period.
function getRemainingDaysForActivePeriod(){
  const [y,m]=activePeriodKey.split('-').map(Number);
  const now=new Date();
  const isCurrentMonth=now.getFullYear()===y&&(now.getMonth()+1)===m;
  if(!isCurrentMonth)return{remainingDays:0,isCurrentMonth:false,usingWorkingDays:false};
  const dayOfMonth=now.getDate();
  const wd=loadWorkingDays();
  if(wd.length>0){
    return{remainingDays:wd.filter(d=>d>dayOfMonth).length,isCurrentMonth:true,usingWorkingDays:true};
  }
  const daysInMonth=new Date(y,m,0).getDate();
  return{remainingDays:Math.max(0,daysInMonth-dayOfMonth),isCurrentMonth:true,usingWorkingDays:false};
}

// Wraps getRemainingDaysForActivePeriod() with a "today" fallback.
// If remainingDays===0 but we're still in the current month, returns a
// 1-day window so projection badges show "today" instead of vanishing.
function getProjectionWindow(){
  const rd=getRemainingDaysForActivePeriod();
  if(rd.remainingDays===0&&rd.isCurrentMonth){
    return{remainingDays:1,isCurrentMonth:true,usingWorkingDays:rd.usingWorkingDays,todayOnly:true};
  }
  return{...rd,todayOnly:false};
}

// Average daily AHT (seconds) needed across `remainingDays` to pull the
// period average down to targetMaxSec. Returns null when there isn't enough
// data to project (no daily entries, monthly override active, or no days
// left). A returned value <= 0 means the target is no longer mathematically
// reachable within the remaining days at the current pace/volume.
// Shared projection base for ONE member — the single rule every "avg AHT needed per
// day" number follows, matching getMemberAHTStats (the headline AHT):
//   • a saved "for the month" total (monthlyAHTByMember) OVERRIDES the daily rows;
//   • remove the monthly total and the daily rows are read again.
// Returns {W,S,P}: W = chats so far, S = AHT-seconds * chats so far, P = chats expected
// over the remaining days (same pace as so far). null = nothing to project from.
function _ahtProjBase(p,agent,remainingDays,elapsedDays,todayOnly){
  const monthly=(p.monthlyAHTByMember&&p.monthlyAHTByMember[agent])||null;
  if(monthly&&monthly.aht>0){
    let el=(elapsedDays>0)?elapsedDays:new Date().getDate();
    el=Math.max(1,el-(todayOnly?1:0));
    if(monthly.count>0)return{W:monthly.count,S:monthly.aht*monthly.count,P:remainingDays*monthly.count/el};
    return{W:el,S:monthly.aht*el,P:remainingDays};
  }
  const entries=getMemberAHTEntries(p,agent);
  if(!entries.length)return null;
  if(entries.some(e=>e.count>0)){
    const W=entries.reduce((a,e)=>a+(e.count||1),0);
    const S=entries.reduce((a,e)=>a+e.aht*(e.count||1),0);
    return{W,S,P:remainingDays*W/entries.length};
  }
  return{W:entries.length,S:entries.reduce((a,e)=>a+e.aht,0),P:remainingDays};
}
// Average daily AHT (seconds) needed across `remainingDays` to pull the period AHT down
// to targetMaxSec. Main dashboard = average of every member's AHT (same as computeAHTSec),
// so this solves for the one daily AHT that, posted by everyone for the remaining days,
// brings that team average to the target. With a single member it equals the member math.
// null = can't project; <=0 = out of reach.
function neededDailyAHTForThreshold(targetMaxSec,remainingDays){
  if(!remainingDays||remainingDays<=0)return null;
  const p=getPeriod(activePeriodKey);
  const bases=getAHTLoggedAgents(p).map(a=>{
    const w=(typeof getMemberProjectionWindow==='function')?getMemberProjectionWindow(a):{};
    return _ahtProjBase(p,a,remainingDays,w.daysElapsed,w.todayOnly);
  }).filter(Boolean);
  if(bases.length){
    const a0=bases.reduce((a,b)=>a+b.S/(b.W+b.P),0)/bases.length;
    const b0=bases.reduce((a,b)=>a+b.P/(b.W+b.P),0)/bases.length;
    if(!(b0>0))return null;
    return(targetMaxSec-a0)/b0;
  }
  // No member data yet — fall back to your own personal daily log
  const daily=p.dailyAHT||{};
  const entries=Object.values(daily).map(normAHTEntry).filter(e=>e.aht>0);
  if(p.monthlyAHT&&p.monthlyAHT>0&&!entries.length)return null;
  if(!entries.length)return null;
  const hasWeights=entries.some(e=>e.count>0);
  if(hasWeights){
    const totalCalls=entries.reduce((a,e)=>a+(e.count||1),0);
    const weightedSum=entries.reduce((a,e)=>a+e.aht*(e.count||1),0);
    const projectedCalls=remainingDays*totalCalls/entries.length;
    if(projectedCalls<=0)return null;
    return(targetMaxSec*(totalCalls+projectedCalls)-weightedSum)/projectedCalls;
  }
  const sum=entries.reduce((a,e)=>a+e.aht,0);
  return(targetMaxSec*(entries.length+remainingDays)-sum)/remainingDays;
}

function updateAHT(){
  const sec=computeAHTSec();
  // Sync legacy field so old code paths (exports, modals) still work
  if(activePeriodKey) getPeriod(activePeriodKey).aht=sec;
  document.getElementById('aht-display').textContent=sec>0?fmtSec(sec):'— m — s';
  const secEl=document.getElementById('aht-sec-display');
  if(secEl) secEl.textContent=sec>0?sec+'s':'';
  if(sec>0){
    const g=gradeAHT(sec);
    document.getElementById('aht-badge').innerHTML='<div class="grade-pill '+g.cls+'">'+g.grade+'</div>';
    document.getElementById('aht-display').className='aht-display '+g.gcls;
    document.getElementById('aht-display').style.color='';
    renderAHTProgressBar(sec);
  } else {
    document.getElementById('aht-badge').innerHTML='';
    document.getElementById('aht-display').className='aht-display';
    document.getElementById('aht-display').style.color='var(--teal)';
    document.getElementById('aht-progress-wrap').style.display='none';
    const needEl=document.getElementById('aht-need');
    if(needEl)needEl.style.display='none';
  }
  if(activePeriodKey){saveState();}
  renderAHTThresh(sec);
  renderAHTTrend(sec);
  renderGoalProgressBar('aht',sec,null);
}

// Parse AHT input. Accepts:
//   "5m 30s" / "5m30s" / "5m 30" / "5 30s"  → 5m 30s
//   "5 30"  (minutes SPACE seconds)          → 5m 30s
//   "5:30"                                   → 5m 30s
//   "5m" / "30s"                             → minutes only / seconds only
//   "330"   (single plain number)            → seconds (330s = 5m 30s)
function parseAHTInput(raw){
  const s=(raw||'').trim().replace(/\s+/g,' ');
  if(!s)return 0;
  // "19m 37s" / "19m37s" / "19m 37" / "19 37s"
  const msFull=s.match(/^(\d+)\s*m?\s*(\d+)\s*s?$/i);
  if(msFull&&(/m/i.test(s)||/\s/.test(s)))return parseInt(msFull[1],10)*60+parseInt(msFull[2],10);
  // "19m" only
  const mOnly=s.match(/^(\d+)\s*m$/i);
  if(mOnly)return parseInt(mOnly[1],10)*60;
  // "37s" only
  const sOnly=s.match(/^(\d+)\s*s$/i);
  if(sOnly)return parseInt(sOnly[1],10);
  // "19:37" colon-separated
  const colon=s.match(/^(\d+):(\d{1,2})$/);
  if(colon)return parseInt(colon[1],10)*60+parseInt(colon[2],10);
  // single plain number — treat as seconds
  const plain=s.match(/^\d+$/);
  return plain?parseInt(s,10):0;
}

// Tidy an AHT field once you leave it: "5 30" / "330" / "5:30" → "5m 30s".
// Leaves the text alone if it can't be understood, so nothing is lost.
function normalizeAHTField(el){
  if(!el||typeof el.value!=='string')return;
  const sec=parseAHTInput(el.value);
  if(sec>0)el.value=fmtSec(sec);
}

function deleteDailyAHT(dateKey){
  const p=getPeriod(activePeriodKey);
  delete p.dailyAHT[dateKey];
  saveState();
  updateAHT();
  renderDailyAHTList();
  renderAHTImportedTable();
  renderDashboard();
}

// ── AHT bulk import from daily stats report ────────────────────────────────────
const MONTH_MAP_AHT={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function _ahtParseDateLine(s){
  const m=s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/);
  if(!m)return null;
  const mon=MONTH_MAP_AHT[m[1].toLowerCase().slice(0,3)];
  if(!mon)return null;
  const day=parseInt(m[2]),yr=parseInt(m[3]);
  return`${yr}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
function _ahtParseRaw(raw){
  // Returns array of {dateKey, periodKey, chats, ahtSec} for valid entries, plus skippedNoData count
  const lines=raw.split('\n').map(l=>l.trim());
  const parsed=[];
  let skippedNoData=0,parseErrors=[];
  let i=0;
  while(i<lines.length){
    const dateKey=_ahtParseDateLine(lines[i]);
    if(!dateKey){i++;continue;}
    // Collect up to 9 data rows, stopping at next date line
    const rows=[];
    let j=i+1;
    while(rows.length<9&&j<lines.length){
      if(_ahtParseDateLine(lines[j]))break;
      rows.push(lines[j]);
      j++;
    }
    i=j;
    if(rows.length<3){skippedNoData++;continue;}
    const chatsRaw=rows[0];
    const ahtRaw=rows[2];
    // Skip rest/no-data days
    if(!chatsRaw||chatsRaw==='-'||!ahtRaw||ahtRaw==='-'){skippedNoData++;continue;}
    const chats=parseInt(chatsRaw);
    const ahtSec=parseAHTInput(ahtRaw);
    if(isNaN(chats)||chats<=0||ahtSec<=0){parseErrors.push(dateKey+': "'+chatsRaw+'" / "'+ahtRaw+'"');continue;}
    const pk=dateKey.slice(0,7); // "YYYY-MM"
    parsed.push({dateKey,periodKey:pk,chats,ahtSec});
  }
  return{parsed,skippedNoData,parseErrors};
}

let _ahtImportPending=null; // holds parsed result for confirm step

function ahtImportClearPreview(){
  document.getElementById('aht-import-preview').style.display='none';
  document.getElementById('aht-import-preview').innerHTML='';
  document.getElementById('aht-import-status').innerHTML='';
  _ahtImportPending=null;
  const confirmBtn=document.getElementById('aht-confirm-btn');
  const confirmLabel=document.getElementById('aht-confirm-btn-label');
  if(confirmBtn)confirmBtn.disabled=true;
  if(confirmLabel)confirmLabel.textContent='Confirm import';
}
function ahtImportClearAll(){
  document.getElementById('aht-import-input').value='';
  ahtImportClearPreview();
}

function previewAHTImport(){
  const raw=document.getElementById('aht-import-input').value;
  const statusEl=document.getElementById('aht-import-status');
  const previewEl=document.getElementById('aht-import-preview');
  statusEl.innerHTML='';
  previewEl.style.display='none';
  previewEl.innerHTML='';
  _ahtImportPending=null;

  if(!raw.trim()){
    statusEl.innerHTML='<span style="color:var(--amber)">Paste some data first.</span>';
    const confirmBtn=document.getElementById('aht-confirm-btn');
    const confirmLabel=document.getElementById('aht-confirm-btn-label');
    if(confirmBtn)confirmBtn.disabled=true;
    if(confirmLabel)confirmLabel.textContent='Confirm import';
    return;
  }

  const {parsed,skippedNoData,parseErrors}=_ahtParseRaw(raw);
  if(!parsed.length){
    statusEl.innerHTML='<span style="color:var(--red)">No valid data found. Check the format.</span>';
    const confirmBtn=document.getElementById('aht-confirm-btn');
    const confirmLabel=document.getElementById('aht-confirm-btn-label');
    if(confirmBtn)confirmBtn.disabled=true;
    if(confirmLabel)confirmLabel.textContent='Confirm import';
    return;
  }

  // Group by period
  const byPeriod={};
  parsed.forEach(e=>{
    if(!byPeriod[e.periodKey])byPeriod[e.periodKey]=[];
    byPeriod[e.periodKey].push(e);
  });

  // For each entry, check if it already exists in storage
  const enriched=parsed.map(e=>{
    const existing=(state[e.periodKey]||{}).dailyAHT||{};
    const isDup=!!existing[e.dateKey];
    return{...e,isDup};
  });
  const dups=enriched.filter(e=>e.isDup);
  const fresh=enriched.filter(e=>!e.isDup);
  const periodKeys=Object.keys(byPeriod).sort();

  // Build preview HTML
  const MONTH_NAMES=['January','February','March','April','May','June','July','August','September','October','November','December'];
  function fmtPeriodKey(pk){const[y,m]=pk.split('-');return MONTH_NAMES[parseInt(m)-1]+' '+y;}

  let html=`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px">`;
  html+=`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:10px">📋 Import Preview</div>`;

  // Period summary
  html+=`<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">`;
  periodKeys.forEach(pk=>{
    const entries=byPeriod[pk];
    const dupCount=entries.filter(e=>e.isDup).length;
    const freshCount=entries.length-dupCount;
    html+=`<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px;min-width:140px">
      <div style="font-size:12px;font-weight:600;color:var(--teal)">${fmtPeriodKey(pk)}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${entries.length} day${entries.length!==1?'s':''} found</div>
      <div style="font-size:11px;color:#4ade80">✓ ${freshCount} new</div>
      ${dupCount?`<div style="font-size:11px;color:var(--amber)">⚠ ${dupCount} already exist</div>`:''}
    </div>`;
  });
  html+=`</div>`;

  // Entries table
  html+=`<div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;overflow:hidden">
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead><tr style="background:var(--surface3)">
        <th style="text-align:left;padding:6px 10px;color:var(--text-muted);font-weight:600">Date</th>
        <th style="text-align:right;padding:6px 10px;color:var(--text-muted);font-weight:600">Chats</th>
        <th style="text-align:right;padding:6px 10px;color:var(--text-muted);font-weight:600">AHT</th>
        <th style="text-align:center;padding:6px 10px;color:var(--text-muted);font-weight:600">Status</th>
      </tr></thead>
      <tbody>`;
  enriched.forEach(e=>{
    const d=new Date(e.dateKey+'T00:00:00');
    const label=d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    const status=e.isDup
      ?`<span style="color:var(--amber);font-weight:600">⚠ duplicate</span>`
      :`<span style="color:#4ade80">✓ new</span>`;
    html+=`<tr style="border-top:1px solid var(--border)${e.isDup?';background:rgba(245,158,11,0.05)':''}">
      <td style="padding:5px 10px;font-family:var(--mono);color:var(--text-dim)">${label}</td>
      <td style="padding:5px 10px;text-align:right;font-family:var(--mono)">${e.chats}</td>
      <td style="padding:5px 10px;text-align:right;font-family:var(--mono);color:var(--teal)">${fmtSec(e.ahtSec)}</td>
      <td style="padding:5px 10px;text-align:center">${status}</td>
    </tr>`;
  });
  html+=`</tbody></table></div>`;

  // Skip/error summary
  if(skippedNoData||parseErrors.length){
    html+=`<div style="font-size:11px;color:var(--text-muted);margin-top:8px">`;
    if(skippedNoData)html+=`${skippedNoData} rest day${skippedNoData!==1?'s':''} skipped (no data). `;
    if(parseErrors.length)html+=`${parseErrors.length} parse error${parseErrors.length!==1?'s':''}: ${parseErrors.slice(0,2).join(', ')}${parseErrors.length>2?'…':''}`;
    html+=`</div>`;
  }

  // Action buttons
  html+=`<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">`;
  if(fresh.length){
    html+=`<button class="btn btn-primary" data-action="commitAHTImport(false)" style="background:var(--teal-dim);border-color:rgba(20,184,166,0.4);color:var(--teal)">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      Import ${fresh.length} new day${fresh.length!==1?'s':''}${dups.length?' (skip duplicates)':''}
    </button>`;
  }
  if(dups.length){
    html+=`<button class="btn btn-ghost" data-action="commitAHTImport(true)" style="color:var(--amber);border-color:rgba(245,158,11,0.3)">
      ↺ Replace duplicates too (${dups.length})
    </button>`;
  }
  if(!fresh.length&&!dups.length){
    html+=`<span style="font-size:12px;color:var(--text-muted);padding:6px 0">Nothing to import.</span>`;
  }
  html+=`</div></div>`;

  previewEl.innerHTML=html;
  previewEl.style.display='block';
  _ahtImportPending={enriched,periodKeys,skippedNoData,parseErrors};

  // Sync the fixed Confirm button below the textarea with the live preview
  const confirmBtn=document.getElementById('aht-confirm-btn');
  const confirmLabel=document.getElementById('aht-confirm-btn-label');
  if(confirmBtn){
    if(fresh.length){
      confirmBtn.disabled=false;
      if(confirmLabel)confirmLabel.textContent=`Confirm import (${fresh.length} new)`;
    } else {
      confirmBtn.disabled=true;
      if(confirmLabel)confirmLabel.textContent='Confirm import';
    }
  }
}

function commitAHTImport(replaceDups){
  if(!_ahtImportPending)return;
  const {enriched,periodKeys,skippedNoData}=_ahtImportPending;
  const statusEl=document.getElementById('aht-import-status');
  const previewEl=document.getElementById('aht-import-preview');

  let imported=0,skipped=0,replaced=0;
  enriched.forEach(e=>{
    if(e.isDup&&!replaceDups){skipped++;return;}
    const p=getPeriod(e.periodKey);
    if(!p.dailyAHT)p.dailyAHT={};
    const wasExisting=!!p.dailyAHT[e.dateKey];
    p.dailyAHT[e.dateKey]={aht:e.ahtSec,count:e.chats};
    if(wasExisting)replaced++;else imported++;
  });

  saveState();
  autoMigratePersonalAHTLog();
  if(periodKeys.length===1){
    const [y,m]=periodKeys[0].split('-').map(Number);
    if(periodKeys[0]!==activePeriodKey){
      setActivePeriod(m,y);
      showToast(`Switched to ${periodKeys[0]} and imported AHT data`);
    } else {
      updateAHT();
      renderDailyAHTList();
      renderAHTImportedTable();
      renderDashboard();
      if(typeof refreshWdayBadge==='function')refreshWdayBadge();
    }
  } else {
    // Multi-period — just refresh current view
    updateAHT();
    renderDailyAHTList();
    renderAHTImportedTable();
    renderDashboard();
    if(typeof refreshWdayBadge==='function')refreshWdayBadge();
    showToast(`AHT data imported across ${periodKeys.length} periods`);
  }

  let msg=`✓ ${imported} day${imported!==1?'s':''} imported`;
  if(replaced)msg+=` · ${replaced} replaced`;
  if(skipped)msg+=` · ${skipped} duplicate${skipped!==1?'s':''} skipped`;
  if(skippedNoData)msg+=` · ${skippedNoData} rest day${skippedNoData!==1?'s':''} skipped`;
  statusEl.innerHTML=`<span style="color:var(--teal)">${msg}</span>`;
  previewEl.style.display='none';
  previewEl.innerHTML='';
  document.getElementById('aht-import-input').value='';
  const confirmBtn=document.getElementById('aht-confirm-btn');
  const confirmLabel=document.getElementById('aht-confirm-btn-label');
  if(confirmBtn)confirmBtn.disabled=true;
  if(confirmLabel)confirmLabel.textContent='Confirm import';
  _ahtImportPending=null;
}

function parseAHTImport(){previewAHTImport();} // legacy alias

// ── Manual single-day AHT entry (simple date/chats/aht form) ────────────────
function addManualAHTEntry(){
  const dateEl=document.getElementById('aht-manual-date');
  const chatsEl=document.getElementById('aht-manual-chats');
  const ahtEl=document.getElementById('aht-manual-aht');
  const agentEl=document.getElementById('aht-manual-agent');
  const statusEl=document.getElementById('aht-manual-status');
  const setStatus=(msg,color)=>{if(statusEl){statusEl.style.color=color||'var(--text-muted)';statusEl.textContent=msg;}};

  const dateKey=(dateEl&&dateEl.dataset.value)||'';
  const chatsRaw=((chatsEl&&chatsEl.value)||'').trim();
  const chats=chatsRaw===''?0:parseInt(chatsRaw,10);
  const ahtSec=parseAHTInput(ahtEl&&ahtEl.value);
  const agent=(agentEl&&agentEl.value||'').trim();

  if(!dateKey){setStatus('Pick a date first.','#f87171');if(dateEl&&typeof openAHTDatePicker==='function')openAHTDatePicker(dateEl);return;}
  if(chatsRaw!==''&&(isNaN(chats)||chats<=0)){setStatus('Chat count must be a positive number (or leave it blank).','#f87171');chatsEl&&chatsEl.focus();return;}
  if(!ahtSec||ahtSec<=0){setStatus('Enter a valid AHT (e.g. 5m 30s, 5 30, 5:30, or 330).','#f87171');ahtEl&&ahtEl.focus();return;}

  const periodKey=dateKey.slice(0,7); // "YYYY-MM"
  const p=getPeriod(periodKey);
  const d=new Date(dateKey+'T00:00:00');
  const label=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});

  if(agent){
    // Logged for a specific team member — kept separate from your own AHT log.
    const memberDaily=getMemberDailyAHTMap(p,agent);
    const wasExisting=!!memberDaily[dateKey];
    memberDaily[dateKey]={aht:ahtSec,count:chats};
    saveState();
    if(periodKey===activePeriodKey){
      if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none')renderTeamView();
      // Member AHT now feeds the main dashboard average — refresh it too.
      updateAHT();
      renderDashboard();
    }
    setStatus(`✓ ${label} ${wasExisting?'updated':'added'} for ${agent}`,'#4ade80');
  } else {
    const wasExisting=!!p.dailyAHT[dateKey];
    p.dailyAHT[dateKey]={aht:ahtSec,count:chats};
    saveState();
    if(periodKey===activePeriodKey){
      updateAHT();
      renderDailyAHTList();
      renderAHTImportedTable();
      renderDashboard();
      setStatus(`✓ ${label} ${wasExisting?'updated':'added'}`,'#4ade80');
    } else {
      const [y,m]=periodKey.split('-').map(Number);
      setStatus(`✓ Saved to ${periodLabel(m,y)} — switch month to view`,'#4ade80');
    }
  }

  // Clear chats/AHT for the next entry but keep the date (and selected member) for quick back-to-back logging
  if(chatsEl)chatsEl.value='';
  if(ahtEl)ahtEl.value='';
  chatsEl&&chatsEl.focus();
}

// ── AHT imported table — selection state ────────────────────────────────────
let _ahtSelIdx=null;      // last-clicked row's dk (keyboard target)
let _ahtAnchorDk=null;    // shift-click anchor
let _ahtLastCbDk=null;    // last checkbox-clicked dk (for shift range)

function renderAHTImportedTable(){
  const wrap=document.getElementById('aht-imported-table-wrap');
  const badge=document.getElementById('aht-imported-total-badge');
  if(!wrap)return;
  _ahtSelIdx=null; _ahtAnchorDk=null; _ahtLastCbDk=null;

  const p=getPeriod(activePeriodKey);
  const daily=p.dailyAHT||{};
  const memberMap=p.dailyAHTByMember||{};
  // Combine Jonathan's own (unassigned) entries with every team member's
  // entries so anything logged in the grid above — under any row — shows up
  // here. Each row is tagged with its agent; per-member figures still stay
  // out of the personal dashboard/heatmap/forecast math elsewhere.
  // autoMigratePersonalAHTLog() (see app-01, near load) copies every day of
  // this legacy personal log into the "Jonathan Juarez" member entry without
  // clearing the original — by design, so anything still reading p.dailyAHT
  // directly keeps working. That means a day that's been migrated exists in
  // both places; skip it here so it isn't shown twice as "My own" AND
  // "Jonathan Juarez". A day that somehow hasn't been migrated yet still
  // shows up under "My own" rather than silently vanishing.
  const jjEntries=memberMap['Jonathan Juarez']||{};
  const ownEntries=Object.entries(daily).filter(([dk])=>!jjEntries[dk]).map(([dk,v])=>({dk,agent:'',...normAHTEntry(v)}));
  const memberEntries=Object.entries(memberMap).flatMap(([agent,byDate])=>
    Object.entries(byDate||{}).map(([dk,v])=>({dk,agent,...normAHTEntry(v)})));
  const entries=ownEntries.concat(memberEntries)
    .filter(e=>e.aht>0)
    .sort((a,b)=>a.dk===b.dk?(a.agent||'').localeCompare(b.agent||''):a.dk.localeCompare(b.dk));

  if(!entries.length){
    wrap.innerHTML='<div style="font-size:12px;color:var(--text-muted);padding:10px 0;font-style:italic">No AHT data imported for this period.</div>';
    if(badge)badge.textContent='';
    return;
  }

  // Totals
  const totalChats=entries.reduce((a,e)=>a+(e.count||0),0);
  const weightedSum=entries.reduce((a,e)=>a+e.aht*(e.count||1),0);
  const totalWeight=entries.reduce((a,e)=>a+(e.count||1),0);
  const avgAHT=Math.round(weightedSum/totalWeight);
  if(badge)badge.textContent=`${entries.length} days · ${totalChats} chats · avg ${fmtSec(avgAHT)}`;

  // Build table via DOM
  const outerDiv=document.createElement('div');
  outerDiv.style.cssText='overflow-x:auto;border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-top:8px';

  const table=document.createElement('table');
  table.style.cssText='width:100%;border-collapse:collapse;font-size:12px';
  table.id='aht-imported-tbody-table';

  // Header
  const thead=document.createElement('thead');
  thead.innerHTML=`<tr style="background:var(--surface3)">
    <th style="width:28px;padding:7px 8px 7px 12px"><input type="checkbox" id="aht-sel-all" title="Select all" style="opacity:0;pointer-events:none;transition:opacity .15s" data-change="ahtToggleSelectAll(this.checked)"></th>
    <th style="text-align:left;padding:7px 12px;color:var(--text-muted);font-weight:600;font-size:11px">Date</th>
    <th style="text-align:left;padding:7px 12px;color:var(--text-muted);font-weight:600;font-size:11px">Agent</th>
    <th style="text-align:right;padding:7px 12px;color:var(--text-muted);font-weight:600;font-size:11px">Chats</th>
    <th style="text-align:right;padding:7px 12px;color:var(--text-muted);font-weight:600;font-size:11px">AHT</th>
    <th style="text-align:center;padding:7px 12px;color:var(--text-muted);font-weight:600;font-size:11px">Grade</th>
    <th style="padding:7px 12px"></th>
  </tr>`;
  table.appendChild(thead);

  const tbody=document.createElement('tbody');
  tbody.id='aht-imported-tbody';

  entries.forEach(({dk,agent,aht,count},i)=>{
    const d=new Date(dk+'T00:00:00');
    const label=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    const g=gradeAHT(aht);
    const rowKey=`${agent||''}|${dk}`;
    const agentLabel=agent?escHtml(prettifyAgentName(agent)):'My own';
    const tr=document.createElement('tr');
    tr.dataset.dk=dk;
    tr.dataset.agent=agent||'';
    tr.dataset.rowkey=rowKey;
    tr.style.cssText='border-top:1px solid var(--border);cursor:pointer';
    tr.innerHTML=`
      <td style="padding:6px 8px 6px 12px"><input type="checkbox" class="aht-row-cb" data-dk="${dk}" data-agent="${agent?escHtml(agent):''}" data-rowkey="${rowKey}" style="opacity:0;pointer-events:none;transition:opacity .15s" data-action="ahtHandleCb(this,event)"></td>
      <td style="padding:6px 12px;font-family:var(--mono);color:var(--text-dim)">${label}</td>
      <td style="padding:6px 12px;color:${agent?'var(--text)':'var(--text-muted)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px">${agentLabel}</td>
      <td style="padding:6px 12px;text-align:right;font-family:var(--mono)">${count>0?count:'—'}</td>
      <td style="padding:6px 12px;text-align:right;font-family:var(--mono);font-weight:600" class="${g.gcls}">${fmtSec(aht)}</td>
      <td style="padding:6px 12px;text-align:center"><span class="grade-pill ${g.cls}" style="font-size:10px;padding:1px 7px">${g.grade}</span></td>
      <td style="padding:6px 12px;text-align:right"><button class="icon-btn danger" title="Delete" data-action="event.stopPropagation();deleteDailyAHTAndRefresh(this.closest('tr'))"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></td>`;
    let _ahtTrDragging=false;
    tr.addEventListener('mousedown',()=>{_ahtTrDragging=false;});
    tr.addEventListener('mousemove',()=>{_ahtTrDragging=true;});
    tr.onclick=(e)=>{
      if(_ahtTrDragging)return;
      if(e.target.closest('button,input'))return;
      ahtSelectRow(rowKey,tr,e.shiftKey);
    };
    tbody.appendChild(tr);
  });

  // Totals row
  const avgG=gradeAHT(avgAHT);
  const totTr=document.createElement('tr');
  totTr.style.cssText='border-top:2px solid var(--border);background:var(--surface2)';
  totTr.innerHTML=`
    <td></td>
    <td style="padding:7px 12px;font-weight:600;color:var(--text-muted);font-size:11px">TOTAL / AVG</td>
    <td></td>
    <td style="padding:7px 12px;text-align:right;font-family:var(--mono);font-weight:600">${totalChats}</td>
    <td style="padding:7px 12px;text-align:right;font-family:var(--mono);font-weight:700" class="${avgG.gcls}">${fmtSec(avgAHT)}</td>
    <td style="padding:7px 12px;text-align:center"><span class="grade-pill ${avgG.cls}" style="font-size:10px;padding:1px 7px">${avgG.grade}</span></td>
    <td></td>`;
  tbody.appendChild(totTr);

  table.appendChild(tbody);
  outerDiv.appendChild(table);

  // Bulk delete bar
  const bulkBar=document.createElement('div');
  bulkBar.id='aht-bulk-bar';
  bulkBar.style.cssText='display:none;margin-top:6px;gap:8px;align-items:center';
  bulkBar.innerHTML=`<button class="btn btn-ghost" style="font-size:12px;padding:4px 10px;color:var(--red);border-color:rgba(239,68,68,0.3)" data-action="ahtBulkDelete()">
    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
    <span id="aht-bulk-label">Delete selected</span>
  </button>`;

  wrap.innerHTML='';
  wrap.appendChild(outerDiv);
  wrap.appendChild(bulkBar);
}

function ahtSelectRow(rowKey,tr,shiftKey){
  const allRows=[...document.querySelectorAll('#aht-imported-tbody tr[data-rowkey]')];
  if(shiftKey&&_ahtAnchorDk!==null){
    const anchorRow=allRows.find(r=>r.dataset.rowkey===_ahtAnchorDk);
    const anchorPos=anchorRow?allRows.indexOf(anchorRow):-1;
    const currentPos=allRows.indexOf(tr);
    if(anchorPos!==-1){
      const start=Math.min(anchorPos,currentPos);
      const end=Math.max(anchorPos,currentPos);
      allRows.forEach((r,pos)=>{
        if(pos>=start&&pos<=end){
          r.classList.add('survey-row-selected');
          const cb=r.querySelector('.aht-row-cb');
          if(cb)cb.checked=true;
        }
      });
      _ahtSelIdx=rowKey;
      ahtUpdateBulkBar();
      return;
    }
  }
  const cb=tr.querySelector('.aht-row-cb');
  const wasChecked=cb?cb.checked:false;
  // Clear highlights, re-apply to still-checked rows
  allRows.forEach(r=>r.classList.remove('survey-row-selected'));
  if(wasChecked&&_ahtSelIdx===rowKey){
    if(cb)cb.checked=false;
    _ahtSelIdx=null; _ahtAnchorDk=null;
  } else {
    if(cb)cb.checked=true;
    _ahtSelIdx=rowKey; _ahtAnchorDk=rowKey;
    tr.classList.add('survey-row-selected');
  }
  allRows.forEach(r=>{const c=r.querySelector('.aht-row-cb');if(c&&c.checked)r.classList.add('survey-row-selected');});
  _ahtLastCbDk=rowKey;
  ahtUpdateBulkBar();
}

function ahtHandleCb(cb,e){
  e.stopPropagation();
  const rowKey=cb.dataset.rowkey;
  const allCbs=[...document.querySelectorAll('.aht-row-cb')];
  if(e.shiftKey&&_ahtLastCbDk!==null){
    const clickedPos=allCbs.indexOf(cb);
    const anchorCb=allCbs.find(c=>c.dataset.rowkey===_ahtLastCbDk);
    const anchorPos=anchorCb?allCbs.indexOf(anchorCb):-1;
    if(anchorPos!==-1){
      const start=Math.min(clickedPos,anchorPos);
      const end=Math.max(clickedPos,anchorPos);
      allCbs.forEach((c,pos)=>{if(pos>=start&&pos<=end)c.checked=cb.checked;});
    }
  }
  const tr=cb.closest('tr');
  if(tr){
    if(cb.checked){tr.classList.add('survey-row-selected');_ahtSelIdx=rowKey;_ahtAnchorDk=rowKey;}
    else{tr.classList.remove('survey-row-selected');if(_ahtSelIdx===rowKey){_ahtSelIdx=null;_ahtAnchorDk=null;}}
  }
  _ahtLastCbDk=rowKey;
  ahtUpdateBulkBar();
}

function ahtToggleSelectAll(checked){
  _ahtLastCbDk=null;
  document.querySelectorAll('.aht-row-cb').forEach(cb=>{
    cb.checked=checked;
    const tr=cb.closest('tr');
    if(tr){checked?tr.classList.add('survey-row-selected'):tr.classList.remove('survey-row-selected');}
  });
  if(!checked){_ahtSelIdx=null;_ahtAnchorDk=null;}
  ahtUpdateBulkBar();
}

function ahtUpdateBulkBar(){
  const cbs=[...document.querySelectorAll('.aht-row-cb:checked')];
  const bar=document.getElementById('aht-bulk-bar');
  const label=document.getElementById('aht-bulk-label');
  const selAll=document.getElementById('aht-sel-all');
  const all=[...document.querySelectorAll('.aht-row-cb')];
  // Sync row highlights — always force-clear then re-apply
  document.querySelectorAll('#aht-imported-tbody tr[data-rowkey]').forEach(tr=>{
    const cb=tr.querySelector('.aht-row-cb');
    const sel=cb&&cb.checked;
    tr.classList.toggle('survey-row-selected',!!sel);
    tr.style.background=sel?'':''; // reset any stale inline background
  });
  // Show/hide checkboxes
  all.forEach(cb=>{
    const show=cb.checked||cbs.length>0;
    cb.style.opacity=show?'1':'0';
    cb.style.pointerEvents=show?'auto':'none';
  });
  if(selAll){
    selAll.style.opacity=cbs.length>0?'1':'0';
    selAll.style.pointerEvents=cbs.length>0?'auto':'none';
    selAll.indeterminate=cbs.length>0&&cbs.length<all.length;
    selAll.checked=cbs.length>0&&cbs.length===all.length;
  }
  if(bar){
    bar.style.display=cbs.length>0?'flex':'none';
    if(label)label.textContent=`Delete selected (${cbs.length})`;
  }
}

function _ahtDeleteEntry(p,agent,dk){
  if(agent){
    _deleteMemberDayAHT(p,agent,dk);
  } else if(p.dailyAHT){
    delete p.dailyAHT[dk];
  }
}

function ahtBulkDelete(){
  const cbs=[...document.querySelectorAll('.aht-row-cb:checked')];
  if(!cbs.length)return;
  if(!confirm(`Delete ${cbs.length} AHT entr${cbs.length!==1?'ies':'y'}?`))return;
  const p=getPeriod(activePeriodKey);
  cbs.forEach(cb=>_ahtDeleteEntry(p,cb.dataset.agent||'',cb.dataset.dk));
  _ahtSelIdx=null;_ahtAnchorDk=null;_ahtLastCbDk=null;
  saveState();updateAHT();renderDailyAHTList();renderAHTImportedTable();renderDashboard();
}

function deleteDailyAHTAndRefresh(trOrDk){
  const p=getPeriod(activePeriodKey);
  // Accepts either the row element (agent-aware) or, for backward
  // compatibility, a bare date-key string (treated as Jonathan's own entry).
  if(trOrDk&&trOrDk.dataset){
    _ahtDeleteEntry(p,trOrDk.dataset.agent||'',trOrDk.dataset.dk);
  } else {
    _ahtDeleteEntry(p,'',trOrDk);
  }
  saveState();
  updateAHT();
  renderDailyAHTList();
  renderAHTImportedTable();
  renderDashboard();
}


function renderDailyAHTList(){
  const listEl=document.getElementById('daily-aht-list');
  const avgEl=document.getElementById('aht-running-avg');
  const avgValEl=document.getElementById('aht-running-avg-val');
  const countBadgeEl=document.getElementById('daily-aht-entry-count');
  if(!listEl)return;
  const p=getPeriod(activePeriodKey);
  const daily=p.dailyAHT||{};
  const entries=Object.entries(daily)
    .map(([dk,v])=>({dk,  ...normAHTEntry(v)}))
    .filter(e=>e.aht>0)
    .sort((a,b)=>b.dk.localeCompare(a.dk));
  if(countBadgeEl){
    if(entries.length>0){countBadgeEl.style.display='inline';countBadgeEl.textContent=entries.length+' '+(entries.length===1?'entry':'entries');}
    else{countBadgeEl.style.display='none';}
  }
  if(!entries.length){
    listEl.innerHTML='<div style="font-size:11px;color:var(--text-muted);padding:4px 0;font-style:italic">No daily entries yet</div>';
    if(avgEl)avgEl.style.display='none';
    return;
  }
  const hasWeights=entries.some(e=>e.count>0);
  listEl.innerHTML=entries.map(({dk,aht,count})=>{
    const g=gradeAHT(aht);
    const d=new Date(dk+'T00:00:00');
    const label=(d.getMonth()+1)+'/'+(d.getDate());
    const countBadge=count>0
      ?`<span style="font-size:10px;color:var(--text-muted);margin-left:4px">${count}c</span>`
      :'';
    return`<div class="daily-aht-list-item">
      <span class="daily-aht-list-date">${label}</span>
      <span class="daily-aht-list-val ${g.gcls}">${fmtSec(aht)}${countBadge}</span>
      <button class="daily-aht-del" data-action="event.stopPropagation();deleteDailyAHT('${dk}')" title="Remove">✕</button>
    </div>`;
  }).join('');
  // Running avg — weighted if counts available, simple otherwise
  let avg;
  if(hasWeights){
    const totalCalls=entries.reduce((a,e)=>a+(e.count||1),0);
    const weightedSum=entries.reduce((a,e)=>a+e.aht*(e.count||1),0);
    avg=Math.round(weightedSum/totalCalls);
  } else {
    avg=Math.round(entries.reduce((a,e)=>a+e.aht,0)/entries.length);
  }
  const g=gradeAHT(avg);
  const avgLabel=hasWeights
    ?`weighted avg · ${entries.reduce((a,e)=>a+(e.count||0),0)} chats`
    :`${entries.length}d avg`;
  if(avgEl)avgEl.style.display='flex';
  if(avgValEl)avgValEl.innerHTML=`<span class="${g.gcls}">${fmtSec(avg)}</span> <span style="font-size:10px;color:var(--text-muted);margin-left:4px">(${avgLabel})</span>`;
}

function renderAHTProgressBar(sec){
  // Find which threshold we're in and progress to next better one
  const wrap=document.getElementById('aht-progress-wrap');
  // AHT: lower=better. Find next better threshold (lower max)
  const needEl=document.getElementById('aht-need');
  const currentG=gradeAHT(sec);
  const currentIdx=AHT_THRESHOLDS.findIndex(t=>t.grade===currentG.grade);
  if(currentIdx<=0){wrap.style.display='none';if(needEl)needEl.style.display='none';return;}
  const nextBetter=AHT_THRESHOLDS[currentIdx-1];
  const isOpenEndedTier=currentIdx>=AHT_THRESHOLDS.length-1;
  const prevThresh=isOpenEndedTier?sec+500:AHT_THRESHOLDS[currentIdx].max;
  // Progress: how far we've come from prevThresh down to nextBetter.max
  const range=prevThresh-nextBetter.max;
  const progress=Math.max(0,Math.min(100,(prevThresh-sec)/range*100));
  // Label: for the open-ended worst tier there's no real upper boundary to
  // show, so display the actual current AHT instead of the sec+500 placeholder
  // used internally for the progress-bar math.
  const leftLabel=isOpenEndedTier?fmtSec(sec):fmtSec(prevThresh);
  wrap.style.display='block';
  wrap.innerHTML=`<div class="progress-bar-label"><span>${currentG.grade} (${leftLabel}) → ${nextBetter.grade} (${fmtSec(nextBetter.max)})</span><span>${Math.round(progress)}%</span></div>
    <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${progress}%;background:var(--teal)"></div></div>`;
  if(needEl){
    const cutSec=sec-nextBetter.max;
    if(cutSec>0){
      needEl.style.display='block';
      needEl.innerHTML='Cut <span>'+fmtSec(cutSec)+'</span> for <span>'+nextBetter.grade+'</span>';
    } else {
      needEl.style.display='none';
    }
  }
}

// Parse date string to day key "YYYY-MM-DD"
// YYYY-MM-DD from the *local* calendar date. toISOString() converts to UTC first, which
// shifts the date back a day for anyone ahead of UTC (e.g. Philippines, UTC+8) before 8am
// and for local-midnight dates like "last day of the month".
function localDateKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function parseDateKey(dateStr){
  if(!dateStr)return null;
  const m=dateStr.match(/(\d+)\/(\d+)\/(\d+)/);
  if(!m){console.warn('[KPI] parseDateKey: unrecognized date format:',dateStr);return null;}
  const mo=m[1].padStart(2,'0'),d=m[2].padStart(2,'0');
  let yr=m[3];if(yr.length===2)yr='20'+yr;
  return yr+'-'+mo+'-'+d;
}
function fmtDayLabel(key){
  const [y,mo,d]=key.split('-');
  return MONTHS[parseInt(mo)-1].slice(0,3)+' '+parseInt(d);
}

// Get previous period key
function prevPeriodKey(key){
  const [y,m]=key.split('-').map(Number);
  if(m===1)return (y-1)+'-12';
  return y+'-'+String(m-1).padStart(2,'0');
}

// Trend arrow helper
function trendArrow(current,prev,invertDirection,neutralThreshold){
  if(current===null||prev===null||prev===undefined)return '';
  const diff=current-prev;
  // Scale-aware dead-zone: CSAT(1-5)→0.005, AR%(0-100)→0.05, KPI%→0.1, AHT(seconds)→1
  const threshold=neutralThreshold!==undefined?neutralThreshold:
    (Math.abs(current)<=5?0.005:Math.abs(current)<=100?0.05:1);
  if(Math.abs(diff)<threshold)return '<span class="trend-arrow trend-neutral">→</span>';
  const up=diff>0;
  const good=invertDirection?!up:up; // AHT: lower is better so invert
  const cls=good?'trend-up':'trend-down';
  const arrow=up?'↑':'↓';
  const absDiff=Math.abs(diff);
  const label=absDiff<10?absDiff.toFixed(2):absDiff.toFixed(1);
  return `<span class="trend-arrow ${cls}">${arrow}${label}</span>`;
}

function getPrevPeriodStats(){
  const prevKey=prevPeriodKey(activePeriodKey);
  if(!state[prevKey])return null;
  const p=state[prevKey];
  const surveys=p.surveys||[];
  const csatSurveys=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  const avgCSAT=csatSurveys.length>0?calcCSAT(csatSurveys):null;
  const arResponded=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arYes=surveys.filter(sv=>sv.ar==='yes').length;
  const arPct=arResponded.length>0?arYes/arResponded.length*100:null;
  const ahtSec=p.aht||0;
  const pt=getThresholdsForPeriod(prevKey);
  const wc=avgCSAT!==null?(pt.weights.csat[gradeCSATWith(avgCSAT,pt.csat).grade]||0):0;
  const wa=arPct!==null?(pt.weights.ar[gradeARWith(arPct,pt.ar).grade]||0):0;
  const wh=(ahtSec>0)?(pt.weights.aht[gradeAHTWith(ahtSec,pt.aht).grade]||0):0;
  const cmPts=customMetricsPoints(prevKey);
  const kpi=(avgCSAT!==null||arPct!==null||ahtSec>0||cmPts>0)?wc+wa+wh+cmPts:null;
  return{csat:avgCSAT,ar:arPct,aht:ahtSec||null,kpi,total:surveys.length};
}

function renderAHTTrend(sec){
  const prev=getPrevPeriodStats();
  const prevAHT=prev?prev.aht:null;
  document.getElementById('aht-trend').innerHTML=trendArrow(sec||null,prevAHT,true);
}

// Daily stats per period
function getDailyStats(surveys){
  const days={};
  surveys.forEach(sv=>{
    const dk=parseDateKey(sv.date);
    if(!dk)return;
    if(!days[dk])days[dk]={surveys:[]};
    days[dk].surveys.push(sv);
  });
  return days;
}

// Sparkline canvas drawing
// All sparkline canvases share this CSS-pixel footprint (see the <canvas
// width="120" height="28"> markup). On a high-DPI/Retina screen, drawing
// straight into a 120x28 backing store and letting the browser upscale it
// to fill that same on-screen box is what makes the lines look blurry —
// so instead we size the actual bitmap to the screen's device pixel ratio
// and scale the drawing context back down to logical 120x28 coordinates,
// giving a crisp line at any pixel density while all the existing drawing
// math (which assumes a 120x28 space) stays unchanged.
const SPARK_CSS_W=120,SPARK_CSS_H=28;
function ensureHiDPISparkCanvas(canvas){
  const dpr=window.devicePixelRatio||1;
  const targetW=Math.round(SPARK_CSS_W*dpr),targetH=Math.round(SPARK_CSS_H*dpr);
  if(canvas.width!==targetW||canvas.height!==targetH){
    canvas.width=targetW;
    canvas.height=targetH;
  }
  if(canvas.style.width!==SPARK_CSS_W+'px'){
    canvas.style.width=SPARK_CSS_W+'px';
    canvas.style.height=SPARK_CSS_H+'px';
  }
  const ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return ctx;
}
function drawNoDataSparkline(canvasId){
  const canvas=document.getElementById(canvasId);
  if(!canvas)return;
  canvas._sparkPoints=null;
  const ctx=ensureHiDPISparkCanvas(canvas);
  const w=SPARK_CSS_W,h=SPARK_CSS_H,pad=2;
  ctx.clearRect(0,0,w,h);
  const midY=h/2;
  ctx.save();
  ctx.setLineDash([3,4]);
  ctx.strokeStyle='rgba(128,128,128,0.35)';
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(pad,midY);
  ctx.lineTo(w-pad,midY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font='7px sans-serif';
  ctx.fillStyle='rgba(128,128,128,0.5)';
  ctx.textAlign='center';
  ctx.fillText('no data',w/2,midY-3);
  ctx.restore();
}
function drawSparkline(canvasId,data,color,opts){
  const canvas=document.getElementById(canvasId);
  if(!canvas)return;
  const ctx=ensureHiDPISparkCanvas(canvas);
  const w=SPARK_CSS_W,h=SPARK_CSS_H,pad=2;
  ctx.clearRect(0,0,w,h);
  if(!data||data.length<2){drawNoDataSparkline(canvasId);canvas._sparkPoints=null;return;}
  const min=Math.min(...data),max=Math.max(...data);
  const range=max-min||1;
  ctx.beginPath();
  const points=[];
  data.forEach((v,i)=>{
    const x=pad+(i/(data.length-1))*(w-pad*2);
    const y=h-pad-((v-min)/range)*(h-pad*2);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    points.push({x,y,value:v});
  });
  ctx.strokeStyle=color||'#3b82f6';
  ctx.lineWidth=1.5;
  ctx.lineJoin='round';
  ctx.stroke();
  // Dot at last point
  const lx=w-pad,ly=h-pad-((data[data.length-1]-min)/range)*(h-pad*2);
  ctx.beginPath();ctx.arc(lx,ly,2.5,0,Math.PI*2);ctx.fillStyle=color||'#3b82f6';ctx.fill();
  // Stash hover data for the tooltip. labels/formatValue are optional —
  // without them the tooltip just shows the raw value.
  const labels=(opts&&opts.labels)||[];
  const formatValue=(opts&&opts.formatValue)||(v=>String(v));
  canvas._sparkPoints=points.map((p,i)=>({...p,label:labels[i]||'',display:formatValue(p.value)}));
  canvas._sparkMeta={title:(opts&&opts.title)||'',color:color||'#3b82f6'};
  bindSparklineHover(canvas);
}

// One shared floating tooltip bubble, reused across every sparkline canvas.
function getSparklineTooltipEl(){
  let el=document.getElementById('spark-tooltip');
  if(!el){
    el=document.createElement('div');
    el.id='spark-tooltip';
    el.style.cssText='position:fixed;z-index:9999;pointer-events:none;display:none;background:var(--surface3,#1e2530);border:1px solid var(--border,#333);color:var(--text,#fff);font-size:11px;font-family:var(--font,sans-serif);padding:4px 8px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.35);white-space:nowrap;line-height:1.4';
    document.body.appendChild(el);
  }
  return el;
}
// Attaches (once per canvas) the mousemove/mouseleave handlers that read
// canvas._sparkPoints — set fresh on every drawSparkline call — to show the
// date + value under the cursor.
function bindSparklineHover(canvas){
  if(canvas._sparkHoverBound)return;
  canvas._sparkHoverBound=true;
  canvas.style.cursor='pointer';
  canvas.title='Click for full trend';
  canvas.addEventListener('click',e=>{
    e.stopPropagation(); // don't also trigger the parent card's own click handler
    openSparklineDetail(canvas);
  });
  const tip=getSparklineTooltipEl();
  canvas.addEventListener('mousemove',e=>{
    const pts=canvas._sparkPoints;
    if(!pts||!pts.length){tip.style.display='none';return;}
    const rect=canvas.getBoundingClientRect();
    const scaleX=SPARK_CSS_W/rect.width;
    const mx=(e.clientX-rect.left)*scaleX;
    let nearest=pts[0],bestDist=Math.abs(pts[0].x-mx);
    for(let i=1;i<pts.length;i++){
      const d=Math.abs(pts[i].x-mx);
      if(d<bestDist){bestDist=d;nearest=pts[i];}
    }
    tip.innerHTML=(nearest.label?`<div style="color:var(--text-muted);font-size:10px">${escHtml(nearest.label)}</div>`:'')+`<div style="font-weight:600">${escHtml(nearest.display)}</div>`;
    tip.style.display='block';
    tip.style.left=(e.clientX+12)+'px';
    tip.style.top=(e.clientY-30)+'px';
  });
  canvas.addEventListener('mouseleave',()=>{tip.style.display='none';});
}

// Short date/month labels for sparkline tooltips.
function fmtSparkDate(dk){
  const d=new Date(dk+'T00:00:00');
  if(isNaN(d))return dk;
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
// Short "Mon YYYY" form of periodLabel — the reel column here is only 104px
// wide (see .reel-frame), and the full "January 2026" style label wraps
// inside a reel-item, overlapping the row above/below it. Abbreviating the
// month keeps every label on one line.
function periodLabelShort(m,y){return (MONTHS[m-1]?MONTHS[m-1].slice(0,3):'?')+' '+y}
function fmtSparkMonth(mk){
  const [y,m]=String(mk).split('-').map(Number);
  if(!(m>=1&&m<=12))return String(mk);
  return periodLabelShort(m,y);
}

// ── Sparkline click-to-expand: bigger line chart + full date list in a modal ──
const SPARK_CHART_CSS_W=420,SPARK_CHART_CSS_H=200;
function ensureHiDPIChartCanvas(canvas,cssW,cssH){
  const dpr=window.devicePixelRatio||1;
  const targetW=Math.round(cssW*dpr),targetH=Math.round(cssH*dpr);
  if(canvas.width!==targetW||canvas.height!==targetH){canvas.width=targetW;canvas.height=targetH;}
  if(canvas.style.width!==cssW+'px'){canvas.style.width=cssW+'px';canvas.style.height=cssH+'px';}
  const ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return ctx;
}
function openSparklineDetail(canvas){
  const pts=canvas._sparkPoints;
  if(!pts||pts.length<2)return; // nothing to show for a "no data" sparkline
  const meta=canvas._sparkMeta||{};
  const titleEl=document.getElementById('spark-chart-title');
  if(titleEl)titleEl.textContent=meta.title||'Trend';
  drawSparklineDetailChart(pts,meta.color||'#3b82f6');
  const listEl=document.getElementById('spark-chart-list');
  if(listEl){
    listEl.innerHTML=pts.slice().reverse().map(p=>
      `<div style="display:flex;justify-content:space-between;padding:7px 10px;border-bottom:1px solid var(--border);font-size:12px">
        <span style="color:var(--text-dim);font-family:var(--mono)">${escHtml(p.label||'')}</span>
        <span style="font-weight:600;font-family:var(--mono)">${escHtml(p.display)}</span>
      </div>`).join('');
  }
  const modal=document.getElementById('spark-chart-modal');
  if(modal)modal.classList.add('open');
}
function drawSparklineDetailChart(pts,color){
  const canvas=document.getElementById('spark-chart-canvas');
  if(!canvas)return;
  const w=SPARK_CHART_CSS_W,h=SPARK_CHART_CSS_H;
  const ctx=ensureHiDPIChartCanvas(canvas,w,h);
  ctx.clearRect(0,0,w,h);
  const padL=42,padR=10,padT=14,padB=22;
  const plotW=w-padL-padR,plotH=h-padT-padB;
  const values=pts.map(p=>p.value);
  const min=Math.min(...values),max=Math.max(...values);
  const range=(max-min)||1;
  const xAt=i=>padL+(pts.length>1?(i/(pts.length-1))*plotW:plotW/2);
  const yAt=v=>padT+plotH-((v-min)/range)*plotH;

  // Gridlines + value labels at min/mid/max
  ctx.font='9px sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
  [min,(min+max)/2,max].forEach(v=>{
    const y=yAt(v);
    ctx.strokeStyle='rgba(255,255,255,0.08)';
    ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.45)';
    ctx.fillText(v.toFixed(Number.isInteger(v)?0:2),padL-6,y);
  });

  // Area fill under the line
  ctx.beginPath();
  pts.forEach((p,i)=>{const x=xAt(i),y=yAt(p.value);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
  ctx.lineTo(xAt(pts.length-1),padT+plotH);
  ctx.lineTo(xAt(0),padT+plotH);
  ctx.closePath();
  ctx.fillStyle=color+'1f';
  ctx.fill();

  // Line
  ctx.beginPath();
  pts.forEach((p,i)=>{const x=xAt(i),y=yAt(p.value);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();

  // Dots (also used as hover hit-points)
  const chartPoints=pts.map((p,i)=>({x:xAt(i),y:yAt(p.value),label:p.label,display:p.display}));
  chartPoints.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();});

  // X-axis: first / middle / last date labels only, to avoid clutter
  ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='rgba(255,255,255,0.45)';
  const labelIdxs=[...new Set(pts.length<=2?[0,pts.length-1]:[0,Math.floor((pts.length-1)/2),pts.length-1])];
  labelIdxs.forEach(i=>ctx.fillText(pts[i].label||'',xAt(i),padT+plotH+6));

  canvas._chartPoints=chartPoints;
  bindSparkChartHover(canvas);
}
// Hover/tap on the expanded chart — reuses the same floating tooltip bubble
// as the small sparklines (getSparklineTooltipEl), scaled to the bigger canvas.
function bindSparkChartHover(canvas){
  if(canvas._chartHoverBound)return;
  canvas._chartHoverBound=true;
  const tip=getSparklineTooltipEl();
  const showAt=(clientX,clientY)=>{
    const pts=canvas._chartPoints;
    if(!pts||!pts.length)return;
    const rect=canvas.getBoundingClientRect();
    const scaleX=SPARK_CHART_CSS_W/rect.width;
    const mx=(clientX-rect.left)*scaleX;
    let nearest=pts[0],bestDist=Math.abs(pts[0].x-mx);
    for(let i=1;i<pts.length;i++){
      const d=Math.abs(pts[i].x-mx);
      if(d<bestDist){bestDist=d;nearest=pts[i];}
    }
    tip.innerHTML=(nearest.label?`<div style="color:var(--text-muted);font-size:10px">${escHtml(nearest.label)}</div>`:'')+`<div style="font-weight:600">${escHtml(nearest.display)}</div>`;
    tip.style.display='block';
    tip.style.left=(clientX+12)+'px';
    tip.style.top=(clientY-30)+'px';
  };
  canvas.addEventListener('mousemove',e=>showAt(e.clientX,e.clientY));
  canvas.addEventListener('mouseleave',()=>{tip.style.display='none';});
  canvas.addEventListener('touchstart',e=>{const t=e.touches[0];if(t)showAt(t.clientX,t.clientY);},{passive:true});
}

// Progress bar toward next threshold
function renderProgressBar(wrapId,current,thresholds,colorVar,labelFn,invertDir){
  const wrap=document.getElementById(wrapId);
  if(!wrap||current===null)return;
  if(invertDir){
    // AHT handled separately
    return;
  }
  const currentG=thresholds.find(t=>current>=t.min);
  if(!currentG){wrap.style.display='none';return;}
  const currentIdx=thresholds.findIndex(t=>t.grade===currentG.grade);
  if(currentIdx<=0){
    // Already at top
    wrap.style.display='block';
    wrap.innerHTML=`<div class="progress-bar-wrap"><div class="progress-bar-label"><span>🏆 At top grade</span><span>100%</span></div><div class="progress-bar-track"><div class="progress-bar-fill" style="width:100%;background:${colorVar}"></div></div></div>`;
    return;
  }
  const nextBetter=thresholds[currentIdx-1];
  const prevFloor=thresholds[currentIdx].min;
  const range=nextBetter.min-prevFloor;
  const progress=Math.max(0,Math.min(100,(current-prevFloor)/range*100));
  wrap.style.display='block';
  wrap.innerHTML=`<div class="progress-bar-label"><span>${currentG.grade} (${labelFn(prevFloor)}) → ${nextBetter.grade} (${labelFn(nextBetter.min)})</span><span>${Math.round(progress)}%</span></div>
    <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${progress}%;background:${colorVar}"></div></div>`;
}

function renderGoalProgressBar(type,current,next){
  // Renders in the goal section, not here
}

// Heatmap mode switcher
function setHeatmapMode(mode){
  heatmapMode=mode;
  ['surveys','csat','ar','aht'].forEach(m=>{
    const btn=document.getElementById('htab-'+m);
    if(btn)btn.classList.toggle('active',m===mode);
  });
  const surveys=getPeriod(activePeriodKey).surveys;
  renderHeatmap(surveys);
}

// Calendar heatmap
function renderHeatmap(surveys,_heatmapKey){
  const container=document.getElementById('heatmap-container');
  const legend=document.getElementById('heatmap-legend');
  if(!container)return;
  const _renderKey=_heatmapKey||activePeriodKey;
  const [y,m]=_renderKey.split('-').map(Number);
  // Update modal title
  const titleEl=document.getElementById('cal-heatmap-modal-title');
  if(titleEl)titleEl.textContent=`${['January','February','March','April','May','June','July','August','September','October','November','December'][m-1]} ${y} — Calendar Heatmap`;
  const daysInMonth=new Date(y,m,0).getDate();
  const firstDay=new Date(y,m-1,1).getDay();

  // Build per-day data
  const dayData={};
  surveys.forEach(sv=>{
    const dk=parseDateKey(sv.date);
    if(!dk)return;
    if(!dayData[dk])dayData[dk]={count:0,csatSum:0,csatN:0,arYes:0,arN:0};
    dayData[dk].count++;
    if(sv.csat!==null&&!isNaN(sv.csat)){const _r=csatRatingsOf(sv);dayData[dk].csatSum+=_r.sum;dayData[dk].csatN+=_r.n;}
    if(sv.ar==='yes'){dayData[dk].arYes++;dayData[dk].arN++;}
    else if(sv.ar==='no'){dayData[dk].arN++;}
  });

  // Color scheme per mode
  let cellColor,tooltipFn,legendItems,legendLabel;
  if(heatmapMode==='surveys'){
    const allCounts=Object.values(dayData).map(d=>d.count);
    const maxCount=allCounts.length?Math.max(...allCounts):1;
    const colors=['#1d2229','rgba(59,130,246,0.25)','rgba(59,130,246,0.45)','rgba(59,130,246,0.7)','#3b82f6'];
    cellColor=dk=>{const d=dayData[dk];if(!d||!d.count)return colors[0];return colors[Math.min(Math.ceil((d.count/maxCount)*4),4)];};
    tooltipFn=dk=>{const d=dayData[dk];const c=d?d.count:0;return c?`${fmtDayLabel(dk)}: ${c} survey${c!==1?'s':''}`:fmtDayLabel(dk)+': no data';};
    legendItems=colors;legendLabel=['Less','More'];
  } else if(heatmapMode==='csat'){
    // Color by CSAT grade
    const gradeColors={'Exceptional':'#00b050','Good':'#92d050','Average':'#ffff00','Satisfactory':'#ffc000','Needs improvement':'#ff0000'};
    cellColor=dk=>{const d=dayData[dk];if(!d||!d.csatN)return '#1d2229';const avg=d.csatSum/d.csatN;return gradeColors[gradeCSAT(avg).grade]||'#1d2229';};
    tooltipFn=dk=>{const d=dayData[dk];if(!d||!d.csatN)return fmtDayLabel(dk)+': no CSAT data';const avg=d.csatSum/d.csatN;return `${fmtDayLabel(dk)}: CSAT ${fmtCsat(avg)} (${gradeCSAT(avg).grade})`;};
    legendItems=[{c:'#00b050',l:'Exceptional'},{c:'#92d050',l:'Good'},{c:'#ffff00',l:'Average'},{c:'#ffc000',l:'Satisfactory'},{c:'#ff0000',l:'Needs impr.'}];
    legendLabel=null;
  } else if(heatmapMode==='aht'){
    // Use per-day dailyAHT entries when available; fall back to period-level AHT for all active days
    const periodAHTSec=getPeriod(_renderKey).aht||0;
    const dailyAHTMap=getTileDailyAHTMap(getPeriod(_renderKey));
    const hasDailyData=Object.keys(dailyAHTMap).length>0;
    const gradeColors={'Exceptional':'#00b050','Good':'#92d050','Average':'#ffff00','Satisfactory':'#ffc000','Needs improvement':'#ff0000'};
    const getAHTSec=dk=>{const e=dailyAHTMap[dk];if(!e)return 0;return normAHTEntry(e).aht||0;};
    cellColor=dk=>{
      const d=dayData[dk];
      if(!d||!d.count)return '#1d2229';
      const s=getAHTSec(dk);
      if(s>0) return gradeColors[gradeAHT(s).grade]||'#6b7280';
      if(!hasDailyData&&periodAHTSec>0) return gradeColors[gradeAHT(periodAHTSec).grade]||'#6b7280';
      return 'rgba(20,184,166,0.25)'; // active day but no AHT logged
    };
    tooltipFn=dk=>{
      const d=dayData[dk];
      if(!d||!d.count)return fmtDayLabel(dk)+': no data';
      const s=getAHTSec(dk);
      if(s>0){
        const g=gradeAHT(s);
        return`${fmtDayLabel(dk)}: AHT ${fmtSec(s)} — ${g.grade}`;
      }
      if(!hasDailyData&&periodAHTSec>0){
        const g=gradeAHT(periodAHTSec);
        return`${fmtDayLabel(dk)}: Period AHT ${fmtSec(periodAHTSec)} — ${g.grade} (${d.count} survey${d.count!==1?'s':''})`;
      }
      return`${fmtDayLabel(dk)}: active (${d.count} survey${d.count!==1?'s':''}) · no AHT logged`;
    };
    legendItems=[{c:'#00b050',l:'Exceptional'},{c:'#92d050',l:'Good'},{c:'#ffff00',l:'Average'},{c:'#ffc000',l:'Satisfactory'},{c:'#ff0000',l:'Needs impr.'}];
    legendLabel=null;
  } else {
    // AR mode
    const gradeColors={'Exceptional':'#00b050','Good':'#92d050','Average':'#ffff00','Satisfactory':'#ffc000','Needs improvement':'#ff0000'};
    cellColor=dk=>{const d=dayData[dk];if(!d||!d.arN)return '#1d2229';const pct=d.arYes/d.arN*100;return gradeColors[gradeAR(pct).grade]||'#1d2229';};
    tooltipFn=dk=>{const d=dayData[dk];if(!d||!d.arN)return fmtDayLabel(dk)+': no AR data';const pct=d.arYes/d.arN*100;return `${fmtDayLabel(dk)}: AR ${pct.toFixed(1)}% (${gradeAR(pct).grade})`;};
    legendItems=[{c:'#00b050',l:'Exceptional'},{c:'#92d050',l:'Good'},{c:'#ffff00',l:'Average'},{c:'#ffc000',l:'Satisfactory'},{c:'#ff0000',l:'Needs impr.'}];
    legendLabel=null;
  }

  const hasAny=Object.keys(dayData).length>0;
  if(!hasAny){
    container.innerHTML='<p style="font-size:12px;color:var(--text-muted);padding:8px 0">No data to display yet.</p>';
    legend.innerHTML='';return;
  }

  let html='<div style="display:flex;gap:3px;align-items:flex-start">';
  const dayNames=['Su','Mo','Tu','We','Th','Fr','Sa'];
  html+='<div style="display:flex;flex-direction:column;gap:3px;padding-top:0">';
  dayNames.forEach(d=>html+=`<div style="width:16px;height:16px;font-size:9px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;font-family:var(--mono)">${d}</div>`);
  html+='</div>';

  const totalCells=firstDay+daysInMonth;
  const numWeeks=Math.ceil(totalCells/7);
  for(let w=0;w<numWeeks;w++){
    html+='<div style="display:flex;flex-direction:column;gap:3px">';
    for(let d=0;d<7;d++){
      const dayNum=w*7+d-firstDay+1;
      if(dayNum<1||dayNum>daysInMonth){html+='<div style="width:16px;height:16px;"></div>';continue;}
      const dk=y+'-'+String(m).padStart(2,'0')+'-'+String(dayNum).padStart(2,'0');
      const color=cellColor(dk);
      const tooltip=tooltipFn(dk);
      const ann=(getPeriod(_renderKey).annotations||{})[dk];
      const annStyle=ann?'position:relative':'';
      const annDot=ann?`<div class="ann-dot" title="📌 ${ann}"></div>`:'';
      html+=`<div class="heatmap-cell" style="background:${color};${annStyle}" title="${tooltip}${ann?' · 📌 '+ann:''}">${annDot}</div>`;
    }
    html+='</div>';
  }
  html+='</div>';
  container.innerHTML=html;

  // Legend
  if(legendLabel){
    legend.innerHTML=`<span>${legendLabel[0]}</span>`;
    legendItems.forEach(c=>legend.innerHTML+=`<div class="heatmap-legend-cell" style="background:${c};border:1px solid var(--border)"></div>`);
    legend.innerHTML+=`<span>${legendLabel[1]}</span>`;
  } else {
    legend.innerHTML='';
    legendItems.forEach(item=>legend.innerHTML+=`<div style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--text-muted)"><div style="width:10px;height:10px;border-radius:2px;background:${item.c};flex-shrink:0"></div>${item.l}</div>`);
  }
  renderHeatmapStats(surveys);
}

// ── Heatmap sidebar stats ─────────────────────────────────────────────────────
function renderHeatmapStats(surveys){
  const sidebar=document.getElementById('heatmap-stats');
  if(!sidebar)return;
  if(!surveys||!surveys.length){sidebar.innerHTML='';return;}

  const days=getDailyStats(surveys);
  const dkeys=Object.keys(days).sort();
  if(!dkeys.length){sidebar.innerHTML='';return;}

  // Per-day stats
  const dayData=dkeys.map(dk=>{
    const ds=days[dk].surveys;
    const csatDs=ds.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const arDs=ds.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arY=ds.filter(sv=>sv.ar==='yes').length;
    return{
      dk,
      count:ds.length,
      csat:csatDs.length?calcCSAT(csatDs):null,
      ar:arDs.length?arY/arDs.length*100:null
    };
  });

  // Best / worst / most active
  const withCsat=dayData.filter(d=>d.csat!==null);
  const withAR=dayData.filter(d=>d.ar!==null);
  const bestCsatDay=withCsat.length?withCsat.reduce((a,b)=>b.csat>a.csat?b:a):null;
  const worstCsatDay=withCsat.length?withCsat.reduce((a,b)=>b.csat<a.csat?b:a):null;
  const bestARDay=withAR.length?withAR.reduce((a,b)=>b.ar>a.ar?b:a):null;
  const worstARDay=withAR.length?withAR.reduce((a,b)=>b.ar<a.ar?b:a):null;
  const busiestDay=dayData.reduce((a,b)=>b.count>a.count?b:a);
  const quietestDay=dayData.reduce((a,b)=>b.count<a.count?b:a);
  const activeDays=dkeys.length;
  const streak=calcStreak(surveys);

  // Weekly volume bars (group by ISO week within the month)
  const weekCounts={};
  dkeys.forEach(dk=>{
    const d=new Date(dk);
    const dayOfMonth=d.getDate();
    const wk=Math.ceil(dayOfMonth/7);
    if(!weekCounts[wk])weekCounts[wk]=0;
    weekCounts[wk]+=days[dk].surveys.length;
  });
  const weekEntries=Object.entries(weekCounts).sort((a,b)=>a[0]-b[0]);
  const maxWk=Math.max(...weekEntries.map(([,v])=>v))||1;

  function statRow(icon,label,val,sub,color){
    return`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:5px">
        <span style="font-size:12px">${icon}</span>
        <span style="font-size:11px;color:var(--text-muted)">${label}</span>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;font-weight:600;font-family:var(--mono);color:${color||'var(--text)'}">${val}</div>
        ${sub?`<div style="font-size:10px;color:var(--text-muted)">${sub}</div>`:''}
      </div>
    </div>`;
  }

  const weekBars=weekEntries.map(([wk,cnt])=>{
    const pct=Math.round(cnt/maxWk*100);
    return`<div style="display:flex;align-items:center;gap:6px">
      <span style="font-size:10px;color:var(--text-muted);width:14px;flex-shrink:0">W${wk}</span>
      <div style="flex:1;height:8px;background:var(--surface3);border-radius:4px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:var(--orange);border-radius:4px;transition:width .3s"></div>
      </div>
      <span style="font-size:10px;font-family:var(--mono);color:var(--text-dim);min-width:22px;text-align:right">${cnt}</span>
    </div>`;
  }).join('');

  const gcColor={'gc-exceptional':'#00b050','gc-good':'#92d050','gc-average':'#ffff00','gc-satisfactory':'#ffc000','gc-needs':'#ff0000'};

  // Mode-specific stats
  let modeStats='';
  if(heatmapMode==='surveys'){
    const totalSurveys=surveys.length;
    const avgPerDay=(totalSurveys/activeDays).toFixed(1);
    modeStats=`
      ${statRow('📋','Total',totalSurveys,'','var(--orange)')}
      ${statRow('📆','Active days',activeDays,'','var(--teal)')}
      ${statRow('⚡','Avg / day',avgPerDay,'','var(--text)')}
      ${statRow('🔥','Busiest day',busiestDay.count,fmtDayLabel(busiestDay.dk),'var(--orange)')}
      ${activeDays>1?statRow('🔕','Quietest day',quietestDay.count,fmtDayLabel(quietestDay.dk),'var(--text-dim)'):''}
      ${streak>1?statRow('⛓️','Streak',streak+'d','consecutive','var(--green)'):''}`;
  } else if(heatmapMode==='csat'){
    const csatSurveys=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const avg=csatSurveys.length?calcCSAT(csatSurveys):null;
    const g=avg!==null?gradeCSAT(avg):null;
    modeStats=`
      ${avg!==null?statRow('😊','Period avg',fmtCsat(avg),'',gcColor[g.gcls]||'var(--text)'):''}
      ${bestCsatDay?statRow('⭐','Best day',fmtCsat(bestCsatDay.csat),fmtDayLabel(bestCsatDay.dk),'#4ade80'):''}
      ${worstCsatDay&&withCsat.length>1?statRow('📉','Lowest day',fmtCsat(worstCsatDay.csat),fmtDayLabel(worstCsatDay.dk),'#f87171'):''}
      ${statRow('📋','Responses',csatSurveys.length,'with CSAT score','var(--text-dim)')}`;
  } else if(heatmapMode==='aht'){
    const ahtSec=getPeriod(activePeriodKey).aht||0;
    const dailyAHTMap=getTileDailyAHTMap(getPeriod(activePeriodKey));
    const dailyEntries=Object.entries(dailyAHTMap).map(([dk,v])=>({dk,...normAHTEntry(v)})).filter(e=>e.aht>0).sort((a,b)=>a.dk.localeCompare(b.dk));
    const g=ahtSec>0?gradeAHT(ahtSec):null;
    const gcColorMap={'gc-exceptional':'#00b050','gc-good':'#92d050','gc-average':'#ffff00','gc-satisfactory':'#ffc000','gc-needs':'#ff0000'};
    let ahtBestDay=null,ahtWorstDay=null;
    if(dailyEntries.length){
      ahtBestDay=dailyEntries.reduce((a,b)=>b.aht<a.aht?b:a);  // lower AHT = better
      ahtWorstDay=dailyEntries.reduce((a,b)=>b.aht>a.aht?b:a);
    }
    modeStats=`
      ${ahtSec>0?statRow('⏱','Running avg',fmtSec(ahtSec),'',gcColorMap[g.gcls]||'var(--teal)'):'<div style="font-size:11px;color:var(--text-muted);padding:4px 0">No AHT logged yet.<br>Add daily entries in the AHT card.</div>'}
      ${g?statRow('🏅','Grade',g.grade,'',gcColorMap[g.gcls]||'var(--text)'):''}
      ${dailyEntries.length?statRow('📅','Days logged',dailyEntries.length,'','var(--teal)'):''}
      ${ahtBestDay?statRow('⭐','Best day',fmtSec(ahtBestDay.aht),new Date(ahtBestDay.dk+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}),'#4ade80'):''}
      ${ahtWorstDay&&dailyEntries.length>1?statRow('📉','Worst day',fmtSec(ahtWorstDay.aht),new Date(ahtWorstDay.dk+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}),'#f87171'):''}
      ${statRow('📋','Total surveys',surveys.length,'','var(--orange)')}
      ${!dailyEntries.length&&ahtSec>0?'<div style="font-size:10px;color:var(--text-muted);margin-top:6px;line-height:1.5">Showing period-level AHT. Add daily entries in the AHT card to see per-day colors.</div>':''}`;
  } else {
    const arR=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arY=surveys.filter(sv=>sv.ar==='yes').length;
    const arPct=arR.length?arY/arR.length*100:null;
    const g=arPct!==null?gradeAR(arPct):null;
    modeStats=`
      ${arPct!==null?statRow('✅','Period rate',arPct.toFixed(1)+'%','',gcColor[g.gcls]||'var(--text)'):''}
      ${bestARDay?statRow('⭐','Best day',bestARDay.ar.toFixed(1)+'%',fmtDayLabel(bestARDay.dk),'#4ade80'):''}
      ${worstARDay&&withAR.length>1?statRow('📉','Lowest day',worstARDay.ar.toFixed(1)+'%',fmtDayLabel(worstARDay.dk),'#f87171'):''}
      ${statRow('🟢','Yes',arY,'responses','var(--green)')}
      ${statRow('🔴','No',arR.length-arY,'responses','var(--red)')}`;
  }

  sidebar.innerHTML=`
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">
        ${heatmapMode==='surveys'?'Volume stats':heatmapMode==='csat'?'CSAT stats':heatmapMode==='aht'?'AHT stats':'AR stats'}
      </div>
      ${modeStats}
    </div>
    ${weekEntries.length>1?`
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px">Weekly volume</div>
      <div style="display:flex;flex-direction:column;gap:5px">${weekBars}</div>
    </div>`:''}`;
}

// Streak counter: consecutive days with at least 1 survey (ending today or most recent active day)
function calcStreak(surveys){
  const days={};
  // Only count days that have at least one valid CSAT entry
  surveys.filter(sv=>sv.csat!==null&&!isNaN(sv.csat)).forEach(sv=>{
    const dk=parseDateKey(sv.date);
    if(dk)days[dk]=true;
  });
  const keys=Object.keys(days).sort().reverse();
  if(!keys.length)return 0;
  let streak=1;
  for(let i=0;i<keys.length-1;i++){
    const d1=new Date(keys[i]),d2=new Date(keys[i+1]);
    const diff=(d1-d2)/(1000*60*60*24);
    if(diff===1)streak++;
    else break;
  }
  return streak;
}

// Pace warning: are you on track for the month?
function calcPace(surveys){
  const [y,m]=activePeriodKey.split('-').map(Number);
  const now=new Date();
  const isCurrentMonth=now.getFullYear()===y&&(now.getMonth()+1)===m;
  if(!isCurrentMonth)return null;
  const daysInMonth=new Date(y,m,0).getDate();
  const dayOfMonth=now.getDate();
  // FIX 1: include the remaining fraction of today (hours still left today)
  // so the last day of the month doesn't project as if it's already over.
  const hourFraction=(24-now.getHours())/24;
  const daysRemaining=(daysInMonth-dayOfMonth)+hourFraction;
  const days=getDailyStats(surveys);
  const activeDays=Object.keys(days).length;
  if(activeDays===0)return{status:'behind',msg:'No data yet'};
  const dailyRate=surveys.length/activeDays;
  const projected=Math.round(surveys.length+dailyRate*daysRemaining);
  // Compare against last month (unfiltered, same as current surveys passed in)
  const prevKey=prevPeriodKey(activePeriodKey);
  const prevSurveys=(state[prevKey]||{surveys:[]}).surveys;
  const prevTotal=prevSurveys.length;
  if(prevTotal===0)return{status:'ok',msg:`On pace for ~${projected} surveys`};
  if(projected>=prevTotal)return{status:'ok',msg:`On pace for ~${projected} (last: ${prevTotal})`};
  const pct=Math.round((projected/prevTotal)*100);
  if(pct>=80)return{status:'warn',msg:`~${projected} projected (${pct}% of last ${prevTotal})`};
  return{status:'behind',msg:`~${projected} projected (${pct}% of last ${prevTotal})`};
}

// Running daily average
function renderDailyAverage(surveys){
  const stripEl=document.getElementById('daily-avg-strip');
  if(stripEl)stripEl.style.display=(typeof _showDailyAvgStrip==='undefined'||_showDailyAvgStrip)?'':'none';
  const days=getDailyStats(surveys);
  const keys=Object.keys(days);
  const numDays=keys.length;
  document.getElementById('davg-days').textContent=numDays||'—';

  if(numDays===0){
    document.getElementById('davg-csat').textContent='—';
    document.getElementById('davg-ar').textContent='—';
    document.getElementById('davg-count').textContent='—';
    document.getElementById('pace-badge-strip').innerHTML='';
    return;
  }
  // Daily CSAT averages then average those
  const dailyCSATs=keys.map(dk=>{
    const s=days[dk].surveys.filter(sv=>sv.csat!==null&&!isNaN(sv.csat));
    return s.length>0?calcCSAT(s):null;
  }).filter(v=>v!==null);
  if(dailyCSATs.length>0){
    const avgDailyCsat=dailyCSATs.reduce((a,v)=>a+v,0)/dailyCSATs.length;
    const g=gradeCSAT(avgDailyCsat);
    document.getElementById('davg-csat').textContent=fmtCsat(avgDailyCsat);
    document.getElementById('davg-csat').className='daily-avg-val '+g.gcls;
    document.getElementById('davg-csat').style.color='';
  } else {
    document.getElementById('davg-csat').textContent='—';
    document.getElementById('davg-csat').className='daily-avg-val';
    document.getElementById('davg-csat').style.color='var(--text-muted)';
  }

  // Daily AR averages
  const dailyARs=keys.map(dk=>{
    const s=days[dk].surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const y=days[dk].surveys.filter(sv=>sv.ar==='yes').length;
    return s.length>0?y/s.length*100:null;
  }).filter(v=>v!==null);
  if(dailyARs.length>0){
    const avgDailyAR=dailyARs.reduce((a,v)=>a+v,0)/dailyARs.length;
    const g=gradeAR(avgDailyAR);
    document.getElementById('davg-ar').textContent=avgDailyAR.toFixed(2)+'%';
    document.getElementById('davg-ar').className='daily-avg-val '+g.gcls;
    document.getElementById('davg-ar').style.color='';
  } else {
    document.getElementById('davg-ar').textContent='—';
    document.getElementById('davg-ar').className='daily-avg-val';
    document.getElementById('davg-ar').style.color='var(--text-muted)';
  }

  const avgDailyCount=(surveys.length/numDays).toFixed(2);
  document.getElementById('davg-count').textContent=avgDailyCount;

  // Pace
  const pace=calcPace(surveys);
  const paceEl=document.getElementById('pace-badge-strip');
  if(pace){
    const cls=pace.status==='ok'?'pace-ok':pace.status==='warn'?'pace-warn':'pace-behind';
    const icon=pace.status==='ok'?'✓':pace.status==='warn'?'⚠':'↓';
    paceEl.innerHTML=`<div class="pace-badge ${cls}">${icon} ${pace.msg}</div>`;
  } else {
    paceEl.innerHTML='<span style="font-size:11px;color:var(--text-muted)">Past period</span>';
  }
}

function getAllPeriodStats(){
  return Object.entries(state).map(([key,p])=>{
    const surveys=p.surveys||[];
    if(!surveys.length)return null;
    const csatSurveys=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const avgCSAT=csatSurveys.length?calcCSAT(csatSurveys):null;
    const arResp=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arYes=surveys.filter(sv=>sv.ar==='yes').length;
    const arPct=arResp.length?arYes/arResp.length*100:null;
    const ahtSec=p.aht||null;
    // Use per-period thresholds for accurate historical KPI
    const pt=getThresholdsForPeriod(key);
    const csatG=avgCSAT!==null?gradeCSATWith(avgCSAT,pt.csat):null;
    const arG=arPct!==null?gradeARWith(arPct,pt.ar):null;
    const ahtG=(ahtSec&&ahtSec>0)?gradeAHTWith(ahtSec,pt.aht):null;
    const wc=csatG?(pt.weights.csat[csatG.grade]||0):0;
    const wa=arG?(pt.weights.ar[arG.grade]||0):0;
    const wh=ahtG?(pt.weights.aht[ahtG.grade]||0):0;
    const cmPts=customMetricsPoints(key);
    const kpi=(avgCSAT!==null||arPct!==null||(ahtSec&&ahtSec>0))?wc+wa+wh+cmPts:null;
    const days=getDailyStats(surveys);
    const dkeys=Object.keys(days);

    // Best CSAT day
    let bestDayCsat=null,bestDayCsatLabel='';
    dkeys.forEach(dk=>{
      const ds=days[dk].surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
      if(!ds.length)return;
      const avg=calcCSAT(ds);
      if(bestDayCsat===null||avg>bestDayCsat){bestDayCsat=avg;bestDayCsatLabel=fmtDayLabel(dk)+' ('+key.slice(0,7)+')';}
    });

    // Best AR day
    let bestDayAR=null,bestDayARLabel='';
    dkeys.forEach(dk=>{
      const ds=days[dk].surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
      if(!ds.length)return;
      const yes=days[dk].surveys.filter(sv=>sv.ar==='yes').length;
      const pct=yes/ds.length*100;
      if(bestDayAR===null||pct>bestDayAR){bestDayAR=pct;bestDayARLabel=fmtDayLabel(dk)+' ('+key.slice(0,7)+')';}
    });

    // Best day count
    let bestDayCount=0,bestDayCountLabel='';
    dkeys.forEach(dk=>{
      const cnt=days[dk].surveys.length;
      if(cnt>bestDayCount){bestDayCount=cnt;bestDayCountLabel=fmtDayLabel(dk)+' ('+key.slice(0,7)+')';}
    });

    // Best single week (7-day blocks by day-of-month grouping)
    const weekCounts={};
    dkeys.forEach(dk=>{
      const dayNum=parseInt(dk.split('-')[2]);
      const wk=Math.ceil(dayNum/7);
      weekCounts[wk]=(weekCounts[wk]||0)+days[dk].surveys.length;
    });
    const bestWeekCount=Object.keys(weekCounts).length?Math.max(...Object.values(weekCounts)):0;
    const bestWeekNum=Object.keys(weekCounts).find(w=>weekCounts[w]===bestWeekCount)||null;
    const bestWeekLabel=bestWeekNum?'Week '+bestWeekNum+' ('+key.slice(0,7)+')':'';

    // Longest streak of days with NO sub-5 CSAT survey
    // A "clean" day = every CSAT survey that day is exactly 5
    // We look for the longest run of consecutive active days where all CSAT scores are 5
    let longestCleanStreak=0,curClean=0,prevDk=null;
    dkeys.sort().forEach(dk=>{
      const ds=days[dk].surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
      const hasBelow5=ds.some(s=>s.csat<5);
      const isConsec=prevDk?(()=>{const d1=new Date(dk),d2=new Date(prevDk);return(d1-d2)/(86400000)===1;})():true;
      if(ds.length>0&&!hasBelow5&&isConsec){curClean++;longestCleanStreak=Math.max(longestCleanStreak,curClean);}
      else{curClean=(ds.length>0&&!hasBelow5)?1:0;longestCleanStreak=Math.max(longestCleanStreak,curClean);}
      if(ds.length>0)prevDk=dk;
    });

    // Active days count (for "most active month")
    const activeDays=dkeys.length;

    const streak=calcStreak(surveys);
    const [y,m]=key.split('-').map(Number);
    return{
      key,label:periodLabel(m,y),
      csat:avgCSAT,ar:arPct,aht:ahtSec,kpi,
      total:surveys.length,activeDays,
      bestDayCsat,bestDayCsatLabel,
      bestDayAR,bestDayARLabel,
      bestDayCount,bestDayCountLabel,
      bestWeekCount,bestWeekLabel,
      longestCleanStreak,
      streak
    };
  }).filter(Boolean);
}

// ── Year-to-Date aggregation ──────────────────────────────────────────────────
function getYTDStats(year){
  const y=year||parseInt(activePeriodKey.split('-')[0]);
  const keys=Object.keys(state).filter(k=>{
    const [ky]=k.split('-');
    if(parseInt(ky)!==y)return false;
    const p=state[k];
    // Include month if it has surveys OR AHT data
    const hasSurveys=(p.surveys||[]).length>0;
    const hasAHT=p.monthlyAHT>0||Object.values(p.dailyAHT||{}).some(v=>normAHTEntry(v).aht>0)||p.aht>0;
    return hasSurveys||hasAHT;
  }).sort();
  if(!keys.length)return null;
  let allSurveys=[],totalAHTSec=0,ahtWeight=0;
  keys.forEach(k=>{
    const p=state[k];
    if(!p)return;
    (p.surveys||[]).forEach(sv=>allSurveys.push({...sv,_period:k}));
    // Compute AHT for this period using dailyAHT
    const periodAHT=(()=>{
      if(p.monthlyAHT&&p.monthlyAHT>0)return{sec:p.monthlyAHT,w:1};
      const daily=p.dailyAHT||{};
      const entries=Object.values(daily).map(normAHTEntry).filter(e=>e.aht>0);
      if(entries.length){
        const hasW=entries.some(e=>e.count>0);
        if(hasW){const tw=entries.reduce((a,e)=>a+(e.count||1),0);return{sec:Math.round(entries.reduce((a,e)=>a+e.aht*(e.count||1),0)/tw),w:tw};}
        return{sec:Math.round(entries.reduce((a,e)=>a+e.aht,0)/entries.length),w:entries.length};
      }
      if(p.aht&&p.aht>0)return{sec:p.aht,w:1};
      return null;
    })();
    if(periodAHT){totalAHTSec+=periodAHT.sec*periodAHT.w;ahtWeight+=periodAHT.w;}
  });
  const total=allSurveys.length;
  const csatS=allSurveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  const avgCSAT=csatS.length?calcCSAT(csatS):null;
  const arR=allSurveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arY=allSurveys.filter(sv=>sv.ar==='yes').length;
  const arPct=arR.length?arY/arR.length*100:null;
  const avgAHT=ahtWeight?Math.round(totalAHTSec/ahtWeight):0;
  const wc=weightCSAT(avgCSAT),wa=weightAR(arPct),wh=weightAHT(avgAHT);
  const custom=customMetricsPointsYTD(keys);
  const kpi=(avgCSAT!==null||arPct!==null||avgAHT>0)?wc+wa+wh+custom:null;
  return{year:y,keys,months:keys.length,total,avgCSAT,arPct,arY,arTotal:arR.length,avgAHT,kpi,custom,allSurveys};
}

// ── YTD Strip renderer ────────────────────────────────────────────────────────
function showMonthDetail(k){
  const p=state[k];if(!p)return;
  const surveys=p.surveys||[];
  const [yy,mm]=k.split('-');
  document.getElementById('mdm-title').textContent=MONTHS[parseInt(mm)-1]+' '+yy;
  document.getElementById('mdm-total').textContent=surveys.length;
  const csatS=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  const avgCSAT=csatS.length?calcCSAT(csatS):null;
  const arR=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arY=surveys.filter(sv=>sv.ar==='yes').length;
  const arPct=arR.length?arY/arR.length*100:null;
  // Full AHT resolution: monthlyAHT override → dailyAHT weighted avg → legacy p.aht
  const ahtSec=(()=>{
    if(p.monthlyAHT&&p.monthlyAHT>0)return p.monthlyAHT;
    const daily=p.dailyAHT||{};
    const entries=Object.values(daily).map(normAHTEntry).filter(e=>e.aht>0);
    if(entries.length){
      const hasW=entries.some(e=>e.count>0);
      if(hasW){const tw=entries.reduce((a,e)=>a+(e.count||1),0);return Math.round(entries.reduce((a,e)=>a+e.aht*(e.count||1),0)/tw);}
      return Math.round(entries.reduce((a,e)=>a+e.aht,0)/entries.length);
    }
    return p.aht||0;
  })();
  const wc=weightCSAT(avgCSAT),wa=weightAR(arPct),wh=weightAHT(ahtSec);
  const kpi=(avgCSAT!==null||arPct!==null||ahtSec>0)?wc+wa+wh+customMetricsPoints(k):null;

  const csatEl=document.getElementById('mdm-csat');
  if(avgCSAT!==null){csatEl.textContent=fmtCsat(avgCSAT);csatEl.className='gc-'+gradeCSAT(avgCSAT).cls.replace('grade-','');}
  else{csatEl.textContent='—';csatEl.className='';}

  const arEl=document.getElementById('mdm-ar');
  if(arPct!==null){arEl.textContent=arPct.toFixed(2)+'%';arEl.className='gc-'+gradeAR(arPct).cls.replace('grade-','');}
  else{arEl.textContent='—';arEl.className='';}

  const ahtEl=document.getElementById('mdm-aht');
  if(ahtSec>0){ahtEl.textContent=fmtSec(ahtSec);ahtEl.className='gc-'+gradeAHT(ahtSec).cls.replace('grade-','');}
  else{ahtEl.textContent='—';ahtEl.className='';}

  const kpiEl=document.getElementById('mdm-kpi');
  if(kpi!==null){kpiEl.textContent=kpi.toFixed(2)+'%';kpiEl.className='gc-'+kpiScoreGrade(kpi).cls.replace('grade-','');}
  else{kpiEl.textContent='—';kpiEl.className='';}

  document.getElementById('mdm-open-btn').onclick=function(){closeMonthDetail();switchToPeriod(k);};
  document.getElementById('month-detail-modal').classList.add('open');
}
function closeMonthDetail(){document.getElementById('month-detail-modal').classList.remove('open')}
document.getElementById('month-detail-modal').addEventListener('click',function(e){if(e.target===this)closeMonthDetail()});

function renderYTDStrip(year){
  const strip=document.getElementById('ytd-strip');
  if(typeof _showYTDStrip!=='undefined'&&!_showYTDStrip){
    if(strip)strip.style.display='none';
    return;
  }
  const curY=parseInt(activePeriodKey.split('-')[0]);
  const y=year||curY;
  const ytd=getYTDStats(y);
  // Years present in state, for the year-reel popover (see openYTDYearPicker in app-05).
  const years=[...new Set(Object.keys(state).map(k=>parseInt(k.split('-')[0])))].sort((a,b)=>b-a);
  if(!years.includes(curY))years.unshift(curY);
  ytdAvailableYears=years;
  const btn=document.getElementById('ytd-year-select');
  if(btn)btn.textContent=String(y);
  if(!ytd||ytd.total===0){
    strip.style.display='flex';
    document.getElementById('ytd-title').textContent='YTD '+y;
    document.getElementById('ytd-total').textContent='—';
    ['ytd-csat','ytd-ar','ytd-aht','ytd-kpi'].forEach(id=>{document.getElementById(id).textContent='—';document.getElementById(id).className='daily-avg-val';});
    document.getElementById('ytd-months').textContent='0';
    document.getElementById('ytd-months-grid').innerHTML='<div style="font-size:11px;color:var(--text-muted);padding:8px 0">No data for this year</div>';
    return;
  }
  strip.style.display='flex';
  document.getElementById('ytd-title').textContent='YTD '+y+' (Jan–'+MONTHS[parseInt(ytd.keys[ytd.keys.length-1].split('-')[1])-1].slice(0,3)+')';
  document.getElementById('ytd-total').textContent=ytd.total;
  if(ytd.avgCSAT!==null){
    const g=gradeCSAT(ytd.avgCSAT);
    document.getElementById('ytd-csat').textContent=fmtCsat(ytd.avgCSAT);
    document.getElementById('ytd-csat').className='daily-avg-val '+g.gcls;
  }else{document.getElementById('ytd-csat').textContent='—';document.getElementById('ytd-csat').className='daily-avg-val';}
  if(ytd.arPct!==null){
    const g=gradeAR(ytd.arPct);
    document.getElementById('ytd-ar').textContent=ytd.arPct.toFixed(2)+'%';
    document.getElementById('ytd-ar').className='daily-avg-val '+g.gcls;
  }else{document.getElementById('ytd-ar').textContent='—';document.getElementById('ytd-ar').className='daily-avg-val';}
  if(ytd.avgAHT>0){
    const g=gradeAHT(ytd.avgAHT);
    document.getElementById('ytd-aht').textContent=fmtSec(ytd.avgAHT);
    document.getElementById('ytd-aht').className='daily-avg-val '+g.gcls;
  }else{document.getElementById('ytd-aht').textContent='—';document.getElementById('ytd-aht').className='daily-avg-val';}
  if(ytd.kpi!==null){
    const g=kpiScoreGrade(ytd.kpi);
    document.getElementById('ytd-kpi').textContent=ytd.kpi.toFixed(2)+'%';
    document.getElementById('ytd-kpi').className='daily-avg-val '+g.gcls;
  }else{document.getElementById('ytd-kpi').textContent='—';document.getElementById('ytd-kpi').className='daily-avg-val';}
  document.getElementById('ytd-months').textContent=ytd.months;

  // Month-by-month mini tiles
  const grid=document.getElementById('ytd-months-grid');
  grid.innerHTML=ytd.keys.map(k=>{
    const p=state[k];
    const surveys=p.surveys||[];
    const csatS=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const avgCSAT=csatS.length?calcCSAT(csatS):null;
    const arR=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arY=surveys.filter(sv=>sv.ar==='yes').length;
    const arPct=arR.length?arY/arR.length*100:null;
    const ahtSec=(()=>{
      if(p.monthlyAHT&&p.monthlyAHT>0)return p.monthlyAHT;
      const daily=p.dailyAHT||{};
      const entries=Object.values(daily).map(normAHTEntry).filter(e=>e.aht>0);
      if(entries.length){
        const hasW=entries.some(e=>e.count>0);
        if(hasW){const tw=entries.reduce((a,e)=>a+(e.count||1),0);return Math.round(entries.reduce((a,e)=>a+e.aht*(e.count||1),0)/tw);}
        return Math.round(entries.reduce((a,e)=>a+e.aht,0)/entries.length);
      }
      return p.aht||0;
    })();
    // Use per-period thresholds for correct historical grading
    const pt=getThresholdsForPeriod(k);
    const csatG=avgCSAT!==null?gradeCSATWith(avgCSAT,pt.csat):null;
    const arG=arPct!==null?gradeARWith(arPct,pt.ar):null;
    const ahtG=ahtSec>0?gradeAHTWith(ahtSec,pt.aht):null;
    const wc=csatG?(pt.weights.csat[csatG.grade]||0):0;
    const wa=arG?(pt.weights.ar[arG.grade]||0):0;
    const wh=ahtG?(pt.weights.aht[ahtG.grade]||0):0;
    const kpi=(avgCSAT!==null||arPct!==null||ahtSec>0)?wc+wa+wh+customMetricsPoints(k):null;
    const mIdx=parseInt(k.split('-')[1])-1;
    const g=kpi!==null?kpiScoreGrade(kpi):null;
    const isActive=k===activePeriodKey;
    return `<div class="highlight-tile ym-tile" style="background:var(--surface3);border:1px solid ${isActive?'var(--accent)':'var(--border)'};border-radius:8px;padding:8px 10px;cursor:pointer;${isActive?'box-shadow:0 0 0 1px var(--accent);':''}" data-action="switchToPeriod('${k}')">
      <div class="ym-tooltip">
        <div class="ym-row"><span>Surveys</span><span style="font-family:var(--mono)">${surveys.length}</span></div>
        <div class="ym-row"><span>CSAT</span><span style="font-family:var(--mono)" class="${csatG?csatG.gcls:''}">${avgCSAT!==null?fmtCsat(avgCSAT):'—'}</span></div>
        <div class="ym-row"><span>Agent Resolution</span><span style="font-family:var(--mono)" class="${arG?arG.gcls:''}">${arPct!==null?arPct.toFixed(2)+'%':'—'}</span></div>
        <div class="ym-row"><span>AHT</span><span style="font-family:var(--mono)" class="${ahtG?ahtG.gcls:''}">${ahtSec>0?fmtSec(ahtSec):'—'}</span></div>
        <div class="ym-row"><span>Final KPI</span><span style="font-family:var(--mono)" class="${g?g.gcls:''}">${kpi!==null?kpi.toFixed(2)+'%':'—'}</span></div>
      </div>
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:3px">${MONTHS[mIdx].slice(0,3)}</div>
      <div style="font-size:15px;font-weight:600;font-family:var(--mono)" class="${g?g.gcls:''}">${kpi!==null?kpi.toFixed(2)+'%':'—'}</div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${surveys.length} surveys</div>
    </div>`;
  }).join('');
}



// ── Cute member avatars ──────────────────────────────────────────────────
// 12 inline-SVG characters (no external images, CSP-safe). Each member gets a
// default picked from their name so it's stable; clicking an avatar lets you
// choose a different one. Keyed by the prettified name (lowercased) so
// "jonathan.juarez" and "Jonathan Juarez" share the same avatar.
const MEMBER_AVATAR_KEY='kpi_member_avatars_v1';
const _AV_EYE=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r||2.6}" fill="#2b2b3a"/><circle cx="${x+0.9}" cy="${y-0.9}" r="0.9" fill="#fff"/>`;
const _AV_CHEEKS='<ellipse cx="20" cy="40" rx="3.4" ry="2.2" fill="#ff8fa3" opacity=".55"/><ellipse cx="44" cy="40" rx="3.4" ry="2.2" fill="#ff8fa3" opacity=".55"/>';
const _AV_SMILE='<path d="M28 42q4 4 8 0" fill="none" stroke="#2b2b3a" stroke-width="1.8" stroke-linecap="round"/>';
const MEMBER_AVATARS=[
 {id:'cat',name:'Cat',bg:'#fde68a',svg:()=>`<path d="M15 30 17 10 30 20Z M49 30 47 10 34 20Z" fill="#f6ad55"/><path d="M18 26 19 15 26 20Z M46 26 45 15 38 20Z" fill="#ffc9c9"/><ellipse cx="32" cy="37" rx="19" ry="17" fill="#f6ad55"/>${_AV_EYE(25,35)}${_AV_EYE(39,35)}<path d="M30 40h4l-2 2.2Z" fill="#ff7a90"/><path d="M32 42.2v2M32 44.2q-2.5 2-5 0M32 44.2q2.5 2 5 0" fill="none" stroke="#2b2b3a" stroke-width="1.4" stroke-linecap="round"/>${_AV_CHEEKS}<path d="M8 38h9M8 42l9-1M56 38h-9M56 42l-9-1" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`},
 {id:'dog',name:'Dog',bg:'#bfdbfe',svg:()=>`<ellipse cx="14" cy="34" rx="7" ry="13" fill="#8b5a3c" transform="rotate(12 14 34)"/><ellipse cx="50" cy="34" rx="7" ry="13" fill="#8b5a3c" transform="rotate(-12 50 34)"/><ellipse cx="32" cy="35" rx="18" ry="17" fill="#d9a877"/><ellipse cx="32" cy="42" rx="9.5" ry="7.5" fill="#f5deb8"/>${_AV_EYE(25,32)}${_AV_EYE(39,32)}<ellipse cx="32" cy="38.5" rx="3.4" ry="2.4" fill="#2b2b3a"/><path d="M32 41v2.5M32 43.5q-2.6 2.2-5 0M32 43.5q2.6 2.2 5 0" fill="none" stroke="#2b2b3a" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="21" cy="40" rx="3" ry="2" fill="#ff8fa3" opacity=".5"/><ellipse cx="43" cy="40" rx="3" ry="2" fill="#ff8fa3" opacity=".5"/>`},
 {id:'bear',name:'Bear',bg:'#fbcfe8',svg:()=>`<circle cx="15" cy="20" r="7.5" fill="#a9714b"/><circle cx="49" cy="20" r="7.5" fill="#a9714b"/><circle cx="15" cy="20" r="3.8" fill="#e8b98f"/><circle cx="49" cy="20" r="3.8" fill="#e8b98f"/><ellipse cx="32" cy="36" rx="19" ry="18" fill="#a9714b"/><ellipse cx="32" cy="42" rx="8.5" ry="6.5" fill="#f0d4b0"/>${_AV_EYE(24,33)}${_AV_EYE(40,33)}<ellipse cx="32" cy="39" rx="3" ry="2.2" fill="#2b2b3a"/><path d="M32 41v2M32 43q-2.4 2-4.6 0M32 43q2.4 2 4.6 0" fill="none" stroke="#2b2b3a" stroke-width="1.3" stroke-linecap="round"/>`},
 {id:'bunny',name:'Bunny',bg:'#ddd6fe',svg:()=>`<ellipse cx="22" cy="15" rx="6" ry="15" fill="#fff"/><ellipse cx="42" cy="15" rx="6" ry="15" fill="#fff"/><ellipse cx="22" cy="16" rx="3" ry="10.5" fill="#ffc2d1"/><ellipse cx="42" cy="16" rx="3" ry="10.5" fill="#ffc2d1"/><ellipse cx="32" cy="40" rx="18" ry="16" fill="#fff"/>${_AV_EYE(25,38)}${_AV_EYE(39,38)}<path d="M30 42h4l-2 2Z" fill="#ff7a90"/><path d="M32 44q-2.5 2.6-5 0M32 44q2.5 2.6 5 0" fill="none" stroke="#2b2b3a" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="20" cy="44" rx="3.2" ry="2.1" fill="#ff8fa3" opacity=".55"/><ellipse cx="44" cy="44" rx="3.2" ry="2.1" fill="#ff8fa3" opacity=".55"/>`},
 {id:'panda',name:'Panda',bg:'#bbf7d0',svg:()=>`<circle cx="15" cy="20" r="7.5" fill="#2b2b3a"/><circle cx="49" cy="20" r="7.5" fill="#2b2b3a"/><ellipse cx="32" cy="36" rx="19" ry="18" fill="#fff"/><ellipse cx="24" cy="33" rx="5.2" ry="6.6" fill="#2b2b3a" transform="rotate(20 24 33)"/><ellipse cx="40" cy="33" rx="5.2" ry="6.6" fill="#2b2b3a" transform="rotate(-20 40 33)"/><circle cx="24.4" cy="32.6" r="2.2" fill="#fff"/><circle cx="39.6" cy="32.6" r="2.2" fill="#fff"/><circle cx="24.8" cy="32.8" r="1.2" fill="#2b2b3a"/><circle cx="39.2" cy="32.8" r="1.2" fill="#2b2b3a"/><ellipse cx="32" cy="40" rx="3" ry="2.1" fill="#2b2b3a"/><path d="M32 42v2M32 44q-2.4 2-4.6 0M32 44q2.4 2 4.6 0" fill="none" stroke="#2b2b3a" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="18" cy="42" rx="3" ry="2" fill="#ff8fa3" opacity=".5"/><ellipse cx="46" cy="42" rx="3" ry="2" fill="#ff8fa3" opacity=".5"/>`},
 {id:'fox',name:'Fox',bg:'#fed7aa',svg:()=>`<path d="M12 32 14 8 30 20Z M52 32 50 8 34 20Z" fill="#f97316"/><path d="M17 26 17.5 14 25 20Z M47 26 46.5 14 39 20Z" fill="#2b2b3a"/><path d="M13 34q19-8 38 0-2 14-19 19-17-5-19-19Z" fill="#f97316"/><path d="M13 36q10 2 19 14-13-2-19-14Z M51 36q-10 2-19 14 13-2 19-14Z" fill="#fff"/>${_AV_EYE(25,34)}${_AV_EYE(39,34)}<ellipse cx="32" cy="49.5" rx="2.6" ry="1.9" fill="#2b2b3a"/><path d="M32 51q-2 1.6-4 0M32 51q2 1.6 4 0" fill="none" stroke="#2b2b3a" stroke-width="1.1" stroke-linecap="round"/>`},
 {id:'frog',name:'Frog',bg:'#d9f99d',svg:()=>`<circle cx="20" cy="20" r="9" fill="#4ade80"/><circle cx="44" cy="20" r="9" fill="#4ade80"/><ellipse cx="32" cy="38" rx="21" ry="16" fill="#4ade80"/><circle cx="20" cy="20" r="6" fill="#fff"/><circle cx="44" cy="20" r="6" fill="#fff"/><circle cx="21" cy="20.5" r="3" fill="#2b2b3a"/><circle cx="43" cy="20.5" r="3" fill="#2b2b3a"/><circle cx="22" cy="19.5" r="1" fill="#fff"/><circle cx="44" cy="19.5" r="1" fill="#fff"/><path d="M21 40q11 9 22 0" fill="none" stroke="#166534" stroke-width="2" stroke-linecap="round"/><circle cx="28" cy="34" r="1" fill="#166534"/><circle cx="36" cy="34" r="1" fill="#166534"/><ellipse cx="16" cy="40" rx="3.4" ry="2.2" fill="#ff8fa3" opacity=".55"/><ellipse cx="48" cy="40" rx="3.4" ry="2.2" fill="#ff8fa3" opacity=".55"/>`},
 {id:'chick',name:'Chick',bg:'#fef9c3',svg:()=>`<path d="M32 10q-3 5 0 8M27 12q-1 4 1 7M37 12q1 4-1 7" fill="none" stroke="#f5a300" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="36" r="20" fill="#facc15"/><path d="M12 38q-4 4-2 9 5-1 8-5ZM52 38q4 4 2 9-5-1-8-5Z" fill="#f5b800"/>${_AV_EYE(25,33)}${_AV_EYE(39,33)}<path d="M28 38h8l-4 5Z" fill="#fb923c"/>${'<ellipse cx="19" cy="40" rx="3.4" ry="2.2" fill="#ff8fa3" opacity=".6"/><ellipse cx="45" cy="40" rx="3.4" ry="2.2" fill="#ff8fa3" opacity=".6"/>'}`},
 {id:'penguin',name:'Penguin',bg:'#a5f3fc',svg:()=>`<ellipse cx="32" cy="36" rx="19" ry="21" fill="#334155"/><ellipse cx="32" cy="41" rx="13" ry="15" fill="#fff"/><path d="M13 36q-5 8-2 14 6-3 8-10ZM51 36q5 8 2 14-6-3-8-10Z" fill="#334155"/>${_AV_EYE(25,32)}${_AV_EYE(39,32)}<path d="M28 37h8l-4 5Z" fill="#fb923c"/><ellipse cx="20" cy="39" rx="3.2" ry="2" fill="#ff8fa3" opacity=".55"/><ellipse cx="44" cy="39" rx="3.2" ry="2" fill="#ff8fa3" opacity=".55"/><ellipse cx="25" cy="57" rx="5" ry="2.2" fill="#fb923c"/><ellipse cx="39" cy="57" rx="5" ry="2.2" fill="#fb923c"/>`},
 {id:'pig',name:'Pig',bg:'#ffe4e6',svg:()=>`<path d="M14 26 16 10 28 19Z M50 26 48 10 36 19Z" fill="#f9a8d4"/><ellipse cx="32" cy="36" rx="20" ry="18" fill="#f9a8d4"/><ellipse cx="32" cy="41" rx="9" ry="6.6" fill="#f472b6"/><ellipse cx="28.6" cy="41" rx="1.5" ry="2.3" fill="#9d174d"/><ellipse cx="35.4" cy="41" rx="1.5" ry="2.3" fill="#9d174d"/>${_AV_EYE(23,32)}${_AV_EYE(41,32)}<ellipse cx="17" cy="39" rx="3.2" ry="2.1" fill="#fb7185" opacity=".55"/><ellipse cx="47" cy="39" rx="3.2" ry="2.1" fill="#fb7185" opacity=".55"/>`},
 {id:'koala',name:'Koala',bg:'#e2e8f0',svg:()=>`<circle cx="11" cy="26" r="10" fill="#94a3b8"/><circle cx="53" cy="26" r="10" fill="#94a3b8"/><circle cx="11" cy="26" r="5.4" fill="#e2e8f0"/><circle cx="53" cy="26" r="5.4" fill="#e2e8f0"/><ellipse cx="32" cy="36" rx="18" ry="18" fill="#94a3b8"/>${_AV_EYE(25,32)}${_AV_EYE(39,32)}<ellipse cx="32" cy="39" rx="4.6" ry="6" fill="#334155"/><ellipse cx="30.6" cy="37" rx="1.2" ry="1.6" fill="#64748b"/><path d="M32 45q-2.4 2-4.6 0M32 45q2.4 2 4.6 0" fill="none" stroke="#334155" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="19" cy="41" rx="3" ry="2" fill="#ff8fa3" opacity=".5"/><ellipse cx="45" cy="41" rx="3" ry="2" fill="#ff8fa3" opacity=".5"/>`},
 {id:'owl',name:'Owl',bg:'#fed7aa',svg:()=>`<path d="M12 28 10 10 26 18Z M52 28 54 10 38 18Z" fill="#92400e"/><ellipse cx="32" cy="37" rx="20" ry="19" fill="#b45309"/><circle cx="23" cy="32" r="9" fill="#fef3c7"/><circle cx="41" cy="32" r="9" fill="#fef3c7"/><circle cx="23" cy="32.5" r="4.6" fill="#2b2b3a"/><circle cx="41" cy="32.5" r="4.6" fill="#2b2b3a"/><circle cx="24.6" cy="30.8" r="1.5" fill="#fff"/><circle cx="42.6" cy="30.8" r="1.5" fill="#fff"/><path d="M28.5 40h7L32 47Z" fill="#fb923c"/><path d="M22 50q4 4 10 4t10-4" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" opacity=".6"/>`}
];
const MEMBER_PHOTO_KEY='kpi_member_photos_v1';
const TEAM_AVATAR_KEY='__team__';
function _avKey(name){const n=(name||'').trim();if(n===TEAM_AVATAR_KEY)return n;return prettifyAgentName(n).toLowerCase();}
function _photoMap(){try{return JSON.parse(localStorage.getItem(MEMBER_PHOTO_KEY)||'{}')||{};}catch(e){return {};}}
function getMemberPhoto(name){const v=_photoMap()[_avKey(name)];return (typeof v==='string'&&v.startsWith('data:image/'))?v:null;}
function setMemberPhoto(name,dataUrl){
  const m=_photoMap();
  if(dataUrl)m[_avKey(name)]=dataUrl;else delete m[_avKey(name)];
  try{localStorage.setItem(MEMBER_PHOTO_KEY,JSON.stringify(m));return true;}catch(e){return false;}
}
function _avMap(){try{return JSON.parse(localStorage.getItem(MEMBER_AVATAR_KEY)||'{}')||{};}catch(e){return {};}}
function _avDefaultId(name){
  const k=_avKey(name);if(k===TEAM_AVATAR_KEY)return 'bear';let h=0;
  for(let i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))>>>0;
  return MEMBER_AVATARS[h%MEMBER_AVATARS.length].id;
}
function getMemberAvatarId(name){
  const id=_avMap()[_avKey(name)];
  return MEMBER_AVATARS.some(a=>a.id===id)?id:_avDefaultId(name);
}
function memberAvatarSVG(id,size){
  const a=MEMBER_AVATARS.find(x=>x.id===id)||MEMBER_AVATARS[0];
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="${a.bg}"/>${a.svg()}</svg>`;
}
// Photo (if one was uploaded) wins over the cartoon avatar.
function memberAvatarInner(name,size){
  const ph=getMemberPhoto(name);
  if(ph)return `<img src="${escHtml(ph)}" alt="" width="${size}" height="${size}" draggable="false">`;
  return memberAvatarSVG(getMemberAvatarId(name),size);
}
// Avatar chip used on tiles / grids / member dashboard header. clickable=true makes it open the picker.
function memberAvatarHTML(name,size,clickable){
  const svg=memberAvatarInner(name,size);
  if(!clickable)return `<span class="member-avatar" style="width:${size}px;height:${size}px">${svg}</span>`;
  return `<button type="button" class="member-avatar member-avatar-btn" style="width:${size}px;height:${size}px" title="${name===TEAM_AVATAR_KEY?'Change team avatar / photo':'Change avatar / photo'}" data-agent="${escHtml(name)}" data-ph-click="openAvatarPicker(this.dataset.agent)">${svg}</button>`;
}
function setMemberAvatar(name,id){
  const m=_avMap();
  if(id)m[_avKey(name)]=id;else delete m[_avKey(name)];
  try{localStorage.setItem(MEMBER_AVATAR_KEY,JSON.stringify(m));}catch(e){}
}
let _avPickerTarget=null;
function openAvatarPicker(name){
  if(!name)return;
  _avPickerTarget=name;
  const cur=getMemberPhoto(name)?null:getMemberAvatarId(name);
  document.getElementById('avatar-picker-title').textContent=name===TEAM_AVATAR_KEY?'Choose team avatar':'Choose avatar for '+prettifyAgentName(name);
  const _hasPhoto=!!getMemberPhoto(name);
  const _rm=document.getElementById('avatar-photo-remove');if(_rm)_rm.style.display=_hasPhoto?'':'none';
  const _pv=document.getElementById('avatar-photo-preview');
  if(_pv){_pv.style.display=_hasPhoto?'':'none';_pv.innerHTML=_hasPhoto?memberAvatarInner(name,44):'';}
  document.getElementById('avatar-picker-grid').innerHTML=MEMBER_AVATARS.map(a=>
    `<button type="button" class="avatar-pick${a.id===cur?' selected':''}" data-avatar="${a.id}" title="${a.name}" data-ph-click="pickMemberAvatar(this.dataset.avatar)">${memberAvatarSVG(a.id,56)}<span>${a.name}</span></button>`).join('');
  document.getElementById('avatar-picker-modal').classList.add('open');
}
function closeAvatarPicker(){
  const m=document.getElementById('avatar-picker-modal');if(m)m.classList.remove('open');
  _avPickerTarget=null;
}
function pickMemberAvatar(id){
  if(!_avPickerTarget)return;
  setMemberAvatar(_avPickerTarget,id==='__default'?null:id);
  setMemberPhoto(_avPickerTarget,null);
  const name=_avPickerTarget;
  closeAvatarPicker();
  refreshMemberAvatars(name);
}
function resetMemberAvatar(){
  if(!_avPickerTarget)return;
  const name=_avPickerTarget;
  setMemberAvatar(name,null);setMemberPhoto(name,null);closeAvatarPicker();refreshMemberAvatars(name);
}
function chooseAvatarPhoto(){const i=document.getElementById('avatar-photo-input');if(i)i.click();}
function removeAvatarPhoto(){
  if(!_avPickerTarget)return;
  const name=_avPickerTarget;
  setMemberPhoto(name,null);closeAvatarPicker();refreshMemberAvatars(name);
}
// Center-crop to a square and shrink to 160px JPEG so it stays tiny in storage.
function handleAvatarPhotoFile(input){
  const file=input&&input.files&&input.files[0];
  const name=_avPickerTarget;
  if(input)input.value='';
  if(!file||!name)return;
  if(!/^image\//.test(file.type)){showToast('Please choose an image file');return;}
  const reader=new FileReader();
  reader.onerror=()=>showToast('Could not read that image');
  reader.onload=()=>{
    const img=new Image();
    img.onerror=()=>showToast('Could not load that image');
    img.onload=()=>{
      const S=160,side=Math.min(img.width,img.height);
      const cv=document.createElement('canvas');cv.width=S;cv.height=S;
      const ctx=cv.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,S,S);
      ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,S,S);
      const url=cv.toDataURL('image/jpeg',0.85);
      if(!setMemberPhoto(name,url)){showToast('Could not save the photo');return;}
      closeAvatarPicker();refreshMemberAvatars(name);
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}
function refreshMemberAvatars(name){
  if(name===TEAM_AVATAR_KEY&&typeof renderTeamViewTitle==='function'){renderTeamViewTitle();showToast('Team avatar updated');return;}
  if(typeof renderTeamView==='function'&&document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none')renderTeamView();
  const dash=document.getElementById('member-dash-avatar');
  if(dash&&dash.dataset.agent&&_avKey(dash.dataset.agent)===_avKey(name))dash.innerHTML=memberAvatarInner(name,42);
  if(typeof renderAHTMemberGrid==='function')renderAHTMemberGrid();
  showToast('Avatar updated');
}
