// ═══════════════════════════════════════════════════════════════════════════
// Insights — short, auto-written findings drawn from the active period's KPIs.
//
// Rule-based: every card is computed from the same data and helpers the
// dashboard tiles use (thresholds, weights, surveys, AHT logs). No network or
// AI calls, so it works offline. Nothing here writes to state.
//
// Public entry points (called from other files / data-ph-click handlers):
//   computeInsights()            -> array of insight objects for the active period
//   renderInsightsPage()         -> fills #insights-root
//   renderInsightsTeaser()       -> fills #insight-teaser on the dashboard
//   insightsSetFilter(type)      -> filter chips
//   insightsToggleChart(id)      -> show/hide the mini chart inside one card
// ═══════════════════════════════════════════════════════════════════════════

let _insFilter='all';
const _insOpenCharts=new Set();

const INS_TYPES={
  win:{label:'Win',cls:'ins-win'},
  focus:{label:'Focus',cls:'ins-focus'},
  pattern:{label:'Pattern',cls:'ins-pattern'},
  data:{label:'Data quality',cls:'ins-data'}
};
const INS_FILTERS=[['all','All'],['win','Wins'],['focus','Focus'],['pattern','Patterns'],['data','Data quality']];

function _insPlural(n,one,many){return n+' '+(n===1?one:(many||one+'s'));}
function _insPts(n){const v=Math.round(n*100)/100;return(v>0?'+':'')+v+' pts';}
function _insFmtDate(dk){return (typeof fmtDayLabel==='function')?fmtDayLabel(dk):dk;}

// ── Per-metric standing against the period's thresholds ───────────────────
// kind: 'csat' | 'ar' | 'aht'. Returns null when there is no value yet.
function _insMetricStanding(kind,value){
  if(value===null||value===undefined||(kind==='aht'&&!(value>0)))return null;
  const th=activeThresh[kind]||(kind==='csat'?CSAT_THRESHOLDS:kind==='ar'?AR_THRESHOLDS:AHT_THRESHOLDS);
  const w=(activeThresh.weights||KPI_WEIGHTS)[kind]||{};
  const grade=kind==='csat'?gradeCSAT(value):kind==='ar'?gradeAR(value):gradeAHT(value);
  const idx=th.findIndex(t=>t.grade===grade.grade);
  const next=idx>0?th[idx-1]:null;
  const gain=next?((w[next.grade]||0)-(w[grade.grade]||0)):0;
  return{kind,th,w,grade,idx,top:idx<=0,next,gain,points:w[grade.grade]||0};
}

// ── Projection (same blend the Month Forecast strip uses) ─────────────────
function _insProject(surveys){
  const rd=getProjectionWindow();
  if(!rd.isCurrentMonth||rd.todayOnly||!(rd.remainingDays>0)||!surveys.length)return null;
  const days=getDailyStats(surveys);
  const keys=Object.keys(days).sort();
  if(!keys.length)return null;
  const recent=keys.slice(-fcWindow);
  const csatS=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
  let pCsat=null;
  if(csatS.length){
    const overall=calcCSAT(csatS);
    const rs=csatS.filter(s=>{const dk=parseDateKey(s.date);return dk&&recent.includes(dk);});
    const rAvg=rs.length?calcCSAT(rs):overall;
    const add=(csatS.length/keys.length)*rd.remainingDays;
    pCsat=(overall*csatS.length+rAvg*add)/(csatS.length+add);
  }
  const arAll=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arYes=surveys.filter(sv=>sv.ar==='yes').length;
  let pAr=null;
  if(arAll.length){
    const ra=arAll.filter(sv=>{const dk=parseDateKey(sv.date);return dk&&recent.includes(dk);});
    const rPct=ra.length?ra.filter(sv=>sv.ar==='yes').length/ra.length*100:arYes/arAll.length*100;
    const add=(arAll.length/keys.length)*rd.remainingDays;
    pAr=(arYes+(rPct/100)*add)/(arAll.length+add)*100;
  }
  const overallAht=computeAHTSec();
  const dmap=getTileDailyAHTMap(getPeriod(activePeriodKey));
  const re=recent.map(dk=>dmap[dk]?normAHTEntry(dmap[dk]):null).filter(e=>e&&e.aht>0);
  let pAht=overallAht;
  if(re.length){
    const hasW=re.some(e=>e.count>0);
    pAht=Math.round(hasW
      ?re.reduce((a,e)=>a+e.aht*(e.count||1),0)/re.reduce((a,e)=>a+(e.count||1),0)
      :re.reduce((a,e)=>a+e.aht,0)/re.length);
  }
  if(pCsat===null&&pAr===null&&!(pAht>0))return null;
  const kpi=weightCSAT(pCsat)+weightAR(pAr)+weightAHT(pAht)+customMetricsPoints(activePeriodKey);
  return{csat:pCsat,ar:pAr,aht:pAht,kpi,remainingDays:rd.remainingDays,wd:rd.usingWorkingDays};
}

// ── Insight builders ──────────────────────────────────────────────────────
function _insCsat(ctx){
  if(!stockInScope('csat','dashboard')||ctx.avgCSAT===null)return null;
  const s=_insMetricStanding('csat',ctx.avgCSAT);
  const avg=ctx.avgCSAT,g=s.grade;
  if(s.top){
    // How many 3-star surveys could land before dropping out of the top grade
    const b=csatBreakdown(ctx.csatSurveys),rps=Math.max(1,Math.round(b.ratingsPerSurvey));
    let sum=b.sum,n=b.n,k=0;
    while(k<99&&(sum+3*rps)/(n+rps)>=g.min){sum+=3*rps;n+=rps;k++;}
    const margin=avg-g.min;
    return{id:'csat',chart:'csat',type:'win',prio:50,metric:'CSAT',
      title:'CSAT is '+g.grade,
      body:'<b>'+fmtCsat(avg)+'</b> across '+_insPlural(ctx.csatSurveys.length,'survey')+', '+fmtCsat(margin)+' above the '+g.min.toFixed(2)+' cutoff. '
        +(k>=99?'A few low ratings won’t move you out of the top grade.':k===0?'No cushion left — the next sub-5 rating would drop you a grade.':'You could take '+_insPlural(k,'more 3-star survey')+' before slipping a grade.')
        +' Worth '+s.points+' KPI points.',
      page:'thresholds',action:'View thresholds'};
  }
  const n=needed5sForCSAT(s.next.min,ctx.csatSurveys);
  let tail='';
  if(ctx.rd.isCurrentMonth&&ctx.rd.remainingDays>0&&typeof avgCSATNeededPerDay==='function'){
    const r=avgCSATNeededPerDay(s.next.min,ctx.csatSurveys,ctx.rd.remainingDays);
    if(r&&r.avgNeeded>0&&r.avgNeeded<=5)tail=' Or average <b>'+r.avgNeeded.toFixed(2)+'</b> per survey over the next '+ctx.rd.remainingDays+(ctx.rd.usingWorkingDays?' working days.':' days.');
    else if(r)tail=' Not reachable in the days left at the current survey pace.';
  }
  return{id:'csat',chart:'csat',type:'focus',prio:80,metric:'CSAT',gain:s.gain,gradeName:g.grade,
    title:'CSAT is '+g.grade,
    body:'<b>'+fmtCsat(avg)+'</b>. Need <b>'+n+'</b> more 5-star '+(n===1?'survey':'surveys')+' to reach '+s.next.grade+' ('+s.next.min.toFixed(2)+'+, '+_insPts(s.gain)+' on your KPI).'+tail,
    page:'thresholds',action:'View thresholds'};
}

function _insAr(ctx){
  if(!stockInScope('ar','dashboard')||ctx.arPct===null)return null;
  const s=_insMetricStanding('ar',ctx.arPct);
  const g=s.grade;
  if(s.top){
    let yes=ctx.arYes,tot=ctx.arResponded.length,k=0;
    while(k<99&&yes/(tot+1)*100>=g.min){tot++;k++;}
    return{id:'ar',chart:'ar',type:'win',prio:50,metric:'AR',
      title:'AR is '+g.grade,
      body:'<b>'+ctx.arPct.toFixed(2)+'%</b> from '+_insPlural(ctx.arResponded.length,'response')+'. '
        +(k>=99?'Comfortable margin over the '+g.min.toFixed(0)+'% cutoff.':k===0?'No cushion — the next “No” would drop you a grade.':'You could take '+_insPlural(k,'more “No”','more “No” answers')+' before slipping a grade.')
        +' Worth '+s.points+' KPI points.',
      page:'thresholds',action:'View thresholds'};
  }
  const n=neededYesForAR(s.next.min,ctx.surveys);
  let tail='';
  if(ctx.rd.isCurrentMonth&&ctx.rd.remainingDays>0&&typeof avgARNeededPerDay==='function'){
    const r=avgARNeededPerDay(s.next.min,ctx.surveys,ctx.rd.remainingDays);
    if(r&&r.pctNeeded>0&&r.pctNeeded<=100)tail=' That’s about <b>'+r.pctNeeded.toFixed(1)+'%</b> YES on the surveys still to come.';
    else if(r)tail=' Not reachable in the days left at the current survey pace.';
  }
  return{id:'ar',chart:'ar',type:'focus',prio:80,metric:'AR',gain:s.gain,gradeName:g.grade,
    title:'AR is '+g.grade,
    body:'<b>'+ctx.arPct.toFixed(2)+'%</b>. Need <b>'+n+'</b> more YES '+(n===1?'answer':'answers')+' to reach '+s.next.grade+' ('+s.next.min.toFixed(0)+'%+, '+_insPts(s.gain)+' on your KPI).'+tail,
    page:'thresholds',action:'View thresholds'};
}

function _insAht(ctx){
  if(!stockInScope('aht','dashboard')||!(ctx.ahtSec>0))return null;
  const s=_insMetricStanding('aht',ctx.ahtSec);
  const g=s.grade;
  if(s.top){
    const margin=Math.max(0,g.max-ctx.ahtSec);
    return{id:'aht',type:'win',prio:50,metric:'AHT',chart:'aht',
      title:'AHT is '+g.grade,
      body:'<b>'+fmtSec(ctx.ahtSec)+'</b>, '+fmtSec(margin)+' under the '+fmtSec(g.max)+' cutoff. Worth '+s.points+' KPI points.',
      page:'survey',action:'Open AHT data'};
  }
  const gap=ctx.ahtSec-s.next.max;
  let tail='';
  if(ctx.rd.isCurrentMonth&&ctx.rd.remainingDays>0&&typeof neededDailyAHTForThreshold==='function'){
    const x=neededDailyAHTForThreshold(s.next.max,ctx.rd.remainingDays);
    if(x!==null&&x>0)tail=' Averaging <b>'+fmtSec(Math.round(x))+'</b> a day for the next '+ctx.rd.remainingDays+(ctx.rd.usingWorkingDays?' working days':' days')+' gets you there.';
    else if(x!==null)tail=' Not reachable in the days left, even at 0s.';
  }
  return{id:'aht',type:'focus',prio:80,metric:'AHT',gain:s.gain,gradeName:g.grade,chart:'aht',
    title:'AHT is '+g.grade,
    body:'<b>'+fmtSec(ctx.ahtSec)+'</b>. Cut <b>'+fmtSec(gap)+'</b> to reach '+s.next.grade+' (≤ '+fmtSec(s.next.max)+', '+_insPts(s.gain)+' on your KPI).'+tail,
    page:'survey',action:'Open AHT data'};
}

// The metric whose next grade is worth the most KPI points gets flagged as the lever.
function _insMarkLever(list){
  const cand=list.filter(i=>i&&i.type==='focus'&&i.gain>0);
  if(!cand.length)return;
  cand.sort((a,b)=>b.gain-a.gain);
  const top=cand[0];
  top.prio=100;
  top.title=top.metric+' is the biggest lever';
  top.body='Currently '+top.gradeName+' \u2014 '+top.body;
  top.lever=true;
}

function _insMonthOverMonth(ctx){
  const prev=getPrevPeriodStats();
  if(!prev||prev.kpi===null||ctx.kpi===null)return null;
  const d=ctx.kpi-prev.kpi;
  if(Math.abs(d)<0.005)return null;
  const [py,pm]=prevPeriodKey(activePeriodKey).split('-').map(Number);
  const pl=periodLabelShort(pm,py);
  const bits=[];
  const mv=(name,cur,pv,fmt,lowerBetter)=>{
    if(cur===null||pv===null||pv===undefined||!(cur>0||name==='AR'||name==='CSAT'))return;
    const dd=cur-pv;if(Math.abs(dd)<1e-9)return;
    const better=lowerBetter?dd<0:dd>0;
    bits.push(name+' '+(better?'better':'worse')+' ('+fmt(pv)+' → '+fmt(cur)+')');
  };
  mv('CSAT',ctx.avgCSAT,prev.csat,v=>fmtCsat(v),false);
  mv('AR',ctx.arPct,prev.ar,v=>v.toFixed(2)+'%',false);
  mv('AHT',ctx.ahtSec>0?ctx.ahtSec:null,prev.aht,v=>fmtSec(v),true);
  const up=d>0;
  return{id:'mom',chart:'kpi',type:up?'win':'focus',prio:up?45:70,metric:'KPI',
    title:'KPI score is '+(up?'up ':'down ')+Math.abs(d).toFixed(2)+' pts on '+pl,
    body:'<b>'+ctx.kpi.toFixed(2)+'%</b> now vs '+prev.kpi.toFixed(2)+'% in '+pl+'.'+(bits.length?' '+bits.join(', ')+'.':''),
    page:'history',action:'Open history'};
}

function _insProjection(ctx){
  const pr=_insProject(ctx.surveys);
  if(!pr||ctx.kpi===null)return null;
  const cur=kpiScoreGrade(ctx.kpi),end=kpiScoreGrade(pr.kpi);
  const order=['Needs improvement','Satisfactory','Good','Exceptional'];
  const dir=order.indexOf(end.label)-order.indexOf(cur.label);
  const days=pr.remainingDays+(pr.wd?' working days':' days')+' left';
  const parts=[];
  if(pr.csat!==null)parts.push('CSAT '+fmtCsat(pr.csat));
  if(pr.ar!==null)parts.push('AR '+pr.ar.toFixed(2)+'%');
  if(pr.aht>0)parts.push('AHT '+fmtSec(pr.aht));
  const basis='Based on your last '+fcWindow+' active days, '+days+': '+parts.join(' · ')+'.';
  let title,type,prio;
  if(dir>0){title='Projected finish: '+end.label;type='win';prio=55;}
  else if(dir<0){title='Projected finish: '+end.label;type='focus';prio=90;}
  else{title='Projected finish: '+end.label;type='win';prio=48;}
  const lead=dir>0?'On pace to move up from '+cur.label+' to '+end.label
    :dir<0?'On pace to slip from '+cur.label+' to '+end.label
    :'Holding this pace keeps you in '+end.label;
  return{id:'proj',chart:'kpi',type,prio,metric:'KPI',
    title,
    body:lead+' at <b>'+pr.kpi.toFixed(2)+'%</b> (now '+ctx.kpi.toFixed(2)+'%). '+basis,
    page:'simulator',action:'Try the simulator'};
}

function _insVolumePattern(ctx){
  const dmap=getTileDailyAHTMap(getPeriod(activePeriodKey));
  const rows=Object.entries(dmap).map(([dk,v])=>({dk,...normAHTEntry(v)})).filter(e=>e.aht>0&&e.count>0);
  const n=rows.length;
  if(n<3)return null;
  const mx=rows.reduce((a,e)=>a+e.count,0)/n,my=rows.reduce((a,e)=>a+e.aht,0)/n;
  let sxy=0,sxx=0,syy=0;
  rows.forEach(e=>{const dx=e.count-mx,dy=e.aht-my;sxy+=dx*dy;sxx+=dx*dx;syy+=dy*dy;});
  if(!(sxx>0&&syy>0))return null;
  const r=sxy/Math.sqrt(sxx*syy);
  if(Math.abs(r)<0.5)return null;
  const sorted=[...rows].sort((a,b)=>a.count-b.count);
  const med=sorted[Math.floor(n/2)].count;
  const hi=rows.filter(e=>e.count>med),lo=rows.filter(e=>e.count<=med);
  if(!hi.length||!lo.length)return null;
  const avg=a=>a.reduce((s,e)=>s+e.aht,0)/a.length;
  const slower=r>0;
  const weak=n<7;
  return{id:'volume',type:'pattern',prio:weak?35:60,metric:'AHT',
    title:slower?'Busier days run slower':'Busier days run faster',
    body:'On days with more than '+med+' chats, AHT averaged <b>'+fmtSec(avg(hi))+'</b> vs <b>'+fmtSec(avg(lo))+'</b> on lighter days.'
      +(weak?' <span class="ins-weak">Only '+n+' logged days — treat this as a weak signal.</span>':' Based on '+n+' logged days.'),
    page:'history',action:'Open history'};
}

function _insDataQuality(ctx){
  const out=[];
  const p=getPeriod(activePeriodKey);
  // 1. Chats in a month total that no daily row accounts for
  let missing=0;const who=[];
  Object.keys(p.monthlyAHTByMember||{}).forEach(a=>{
    const m=p.monthlyAHTByMember[a];
    if(!m||!(m.count>0))return;
    const daily=(p.dailyAHTByMember&&p.dailyAHTByMember[a])||{};
    const rows=Object.values(daily).map(normAHTEntry).filter(e=>e.aht>0);
    if(!rows.length)return; // pure month-total mode is deliberate, not a gap
    const itemised=rows.reduce((s,e)=>s+(e.count||0),0);
    if(m.count>itemised){missing+=m.count-itemised;who.push(typeof prettifyAgentName==='function'?prettifyAgentName(a):a);}
  });
  if(missing>0)out.push({id:'dq-chats',type:'data',prio:30,metric:'AHT',
    title:missing+' '+(missing===1?'chat isn’t':'chats aren’t')+' itemized',
    body:'Month totals say more chats than your daily rows add up to ('+escHtml(who.slice(0,3).join(', '))+(who.length>3?' +'+(who.length-3):'')+'). The month total is what counts for AHT, but daily patterns only see the itemized days.',
    page:'survey',action:'Open AHT data'});
  // 2. Survey days with no AHT entry (only when daily AHT is actually being logged)
  const dmap=getTileDailyAHTMap(p);
  if(Object.keys(dmap).length){
    const sd=Object.keys(getDailyStats(ctx.surveys)).sort();
    const gaps=sd.filter(dk=>!(dmap[dk]&&normAHTEntry(dmap[dk]).aht>0));
    if(gaps.length)out.push({id:'dq-days',type:'data',prio:28,metric:'AHT',
      title:_insPlural(gaps.length,'survey day')+' without an AHT entry',
      body:gaps.slice(0,6).map(_insFmtDate).join(', ')+(gaps.length>6?' and '+(gaps.length-6)+' more':'')+'. Daily AHT and the volume pattern skip these days.',
      page:'survey',action:'Open AHT data'});
  }
  return out;
}

// ── Engine ────────────────────────────────────────────────────────────────
function computeInsights(){
  const p=getPeriod(activePeriodKey);
  const surveys=p.surveys||[];
  const csatSurveys=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
  const arResponded=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arYes=surveys.filter(sv=>sv.ar==='yes').length;
  const avgCSAT=csatSurveys.length?calcCSAT(csatSurveys):null;
  const arPct=arResponded.length?arYes/arResponded.length*100:null;
  const ahtSec=computeAHTSec();
  const hasAny=avgCSAT!==null||arPct!==null||ahtSec>0;
  const kpi=hasAny?weightCSAT(avgCSAT)+weightAR(arPct)+weightAHT(ahtSec)+customMetricsPoints(activePeriodKey):null;
  const ctx={p,surveys,csatSurveys,arResponded,arYes,avgCSAT,arPct,ahtSec,kpi,rd:getProjectionWindow()};
  const metrics=[_insCsat(ctx),_insAr(ctx),_insAht(ctx)].filter(Boolean);
  _insMarkLever(metrics);
  const list=[...metrics];
  [_insProjection(ctx),_insMonthOverMonth(ctx),_insVolumePattern(ctx)].forEach(i=>{if(i)list.push(i);});
  _insDataQuality(ctx).forEach(i=>list.push(i));
  list.sort((a,b)=>b.prio-a.prio);
  return list;
}

// ── Mini charts (inline SVG bars + dashed grade cutoffs, theme variables) ──
const INS_GRADE_COLOR={'Exceptional':'var(--green)','Good':'var(--teal)','Average':'var(--amber)','Satisfactory':'var(--orange)','Needs improvement':'var(--red)'};
const INS_CHART_DAYS=14;

// Points to plot for each insight chart: [{dk,v}] oldest -> newest.
function _insChartSeries(kind){
  const p=getPeriod(activePeriodKey);
  let rows=[];
  if(kind==='aht'){
    const dmap=getTileDailyAHTMap(p);
    rows=Object.keys(dmap).map(dk=>({dk,v:normAHTEntry(dmap[dk]).aht})).filter(e=>e.v>0);
  } else if(kind==='csat'||kind==='ar'){
    const days=getDailyStats(p.surveys||[]);
    Object.keys(days).forEach(dk=>{
      const sv=days[dk].surveys;
      if(kind==='csat'){const c=sv.filter(x=>x.csat!==null&&x.csat!==undefined&&!isNaN(x.csat));if(c.length)rows.push({dk,v:calcCSAT(c)});}
      else{const r=sv.filter(x=>x.ar==='yes'||x.ar==='no');if(r.length)rows.push({dk,v:r.filter(x=>x.ar==='yes').length/r.length*100});}
    });
  } else if(kind==='kpi'){
    dayLookupDaysWithData(activePeriodKey).forEach(dk=>{const st=dayLookupStats(activePeriodKey,dk);if(st.kpiRaw!==null)rows.push({dk,v:st.kpiRaw});});
  }
  return rows.sort((a,b)=>a.dk.localeCompare(b.dk)).slice(-INS_CHART_DAYS);
}

// The grade cutoffs worth drawing: the one above, the current one and the one below.
function _insChartLines(kind,series){
  const last=series.length?series[series.length-1].v:null;
  if(kind==='kpi'){
    return [[95,'Exceptional'],[85,'Good'],[80,'Satisfactory']].map(a=>({v:a[0],label:a[1]==='Satisfactory'?'Sat':a[1]==='Exceptional'?'Exc':a[1],color:INS_GRADE_COLOR[a[1]]}));
  }
  const th=activeThresh[kind]||(kind==='csat'?CSAT_THRESHOLDS:kind==='ar'?AR_THRESHOLDS:AHT_THRESHOLDS);
  const cur=kind==='csat'?gradeCSAT(computeInsightValue(kind)):kind==='ar'?gradeAR(computeInsightValue(kind)):gradeAHT(computeInsightValue(kind));
  const ci=Math.max(0,th.findIndex(t=>t.grade===cur.grade));
  return [ci-1,ci,ci+1].filter(i=>i>=0&&i<th.length).map(i=>{
    const t=th[i];const v=kind==='aht'?t.max:t.min;
    return{v,label:typeof gradeAbbr==='function'?gradeAbbr(t.grade):t.grade,color:INS_GRADE_COLOR[t.grade]||'var(--text-muted)'};
  }).filter(l=>isFinite(l.v)&&l.v>0);
}
// Whole-period value for a metric (what the tile shows) — decides which grade is "current".
function computeInsightValue(kind){
  const surveys=getPeriod(activePeriodKey).surveys||[];
  if(kind==='csat'){const c=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));return c.length?calcCSAT(c):0;}
  if(kind==='ar'){const r=surveys.filter(s=>s.ar==='yes'||s.ar==='no');return r.length?r.filter(s=>s.ar==='yes').length/r.length*100:0;}
  return computeAHTSec();
}

function _insChart(kind){
  const series=_insChartSeries(kind);
  if(series.length<2)return '<div class="ins-chart-empty">Need at least two days of data to draw this chart.</div>';
  const meta={
    csat:{name:'CSAT',fmt:v=>fmtCsat(v),zero:false},
    ar:{name:'AR',fmt:v=>v.toFixed(1)+'%',zero:false},
    aht:{name:'AHT',fmt:v=>fmtSec(v),zero:true},
    kpi:{name:'KPI score',fmt:v=>v.toFixed(1)+'%',zero:false}
  }[kind];
  const vals=series.map(e=>e.v);
  const dMin=Math.min(...vals),dMax=Math.max(...vals);
  const span=Math.max(dMax-dMin,dMax*0.03,1e-6);
  let lines=_insChartLines(kind,series);
  // Drop cutoffs that would flatten the bars (far from the data).
  lines=lines.filter(l=>meta.zero?l.v<=dMax*1.8:(l.v>=dMin-span*1.5&&l.v<=dMax+span*1.5));
  let lo=meta.zero?0:Math.min(dMin,...lines.map(l=>l.v)),hi=Math.max(dMax,...lines.map(l=>l.v));
  if(!meta.zero){const pad=(hi-lo)*0.25||span;lo=Math.max(0,lo-pad);}
  hi=hi+(hi-lo)*0.14;
  const W=380,H=200,L=8,R=88,T=24,B=28;
  const iw=W-L-R,ih=H-T-B,n=series.length,slot=iw/n,bw=Math.min(52,slot*0.62);
  const y=v=>T+(hi-v)/(hi-lo)*ih;
  const cx=i=>L+slot*i+slot/2;
  const showAll=n<=9;
  const bars=series.map((e,i)=>{
    const top=y(e.v),h=Math.max(1,T+ih-top);
    const lab=(showAll||i===n-1)?'<text x="'+cx(i).toFixed(1)+'" y="'+(top-5).toFixed(1)+'" text-anchor="middle" class="ins-val">'+escHtml(meta.fmt(e.v))+'</text>':'';
    return '<rect x="'+(cx(i)-bw/2).toFixed(1)+'" y="'+top.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="4" class="ins-bar"><title>'+escHtml(_insFmtDate(e.dk)+': '+meta.fmt(e.v))+'</title></rect>'+lab;
  }).join('');
  const step=Math.max(1,Math.ceil(n/7));
  const xl=series.map((e,i)=>i%step===0||i===n-1?'<text x="'+cx(i).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle" class="ins-axis">'+escHtml(_insFmtDate(e.dk))+'</text>':'').join('');
  const gl=lines.map(l=>'<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(l.v).toFixed(1)+'" y2="'+y(l.v).toFixed(1)+'" class="ins-gline" style="stroke:'+l.color+'"/>'
    +'<text x="'+(W-R+5)+'" y="'+(y(l.v)+3).toFixed(1)+'" class="ins-gl-label" style="fill:'+l.color+'">'+escHtml(l.label)+' '+escHtml(kind==='aht'?fmtSec(l.v):kind==='csat'?l.v.toFixed(2):l.v.toFixed(0)+'%')+'</text>').join('');
  const title=kind==='kpi'?'KPI running score vs. grade cutoffs':meta.name+' by day vs. grade cutoffs';
  const note='Bars = '+(kind==='kpi'?'running month-to-date score':'daily '+meta.name)+(n>=INS_CHART_DAYS?' (last '+INS_CHART_DAYS+' days)':'')+' · Dashed lines = grade cutoffs'+(meta.zero?'':' · axis starts at '+meta.fmt(lo))+(lines.length?'':' · nearest cutoffs are off this scale');
  return '<div class="ins-chart-title">'+escHtml(title)+'</div>'
    +'<svg class="ins-chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+escHtml(title)+'">'+gl+bars+xl+'</svg>'
    +'<div class="ins-chart-note">'+escHtml(note)+'</div>';
}

// ── Rendering ─────────────────────────────────────────────────────────────
function _insCardHtml(i){
  const t=INS_TYPES[i.type];
  const open=_insOpenCharts.has(i.id);
  const chartBtn=i.chart?'<button class="btn btn-ghost ins-btn" data-ph-click="insightsToggleChart(\''+i.id+'\')">'+(open?'Hide chart':'Show chart')+'</button>':'';
  return '<div class="ins-card '+t.cls+(i.lever?' ins-lever':'')+'">'
    +'<div class="ins-card-top"><span class="ins-tag">'+t.label+'</span><span class="ins-metric">'+escHtml(i.metric)+'</span></div>'
    +'<h3 class="ins-title">'+escHtml(i.title)+'</h3>'
    +'<p class="ins-body">'+i.body+'</p>'
    +(i.chart&&open?'<div class="ins-chart-wrap">'+_insChart(i.chart)+'</div>':'')
    +'<div class="ins-actions"><button class="btn btn-ghost ins-btn" data-ph-click="showPage(\''+i.page+'\')">'+escHtml(i.action)+' →</button>'+chartBtn+'</div>'
    +'</div>';
}

function renderInsightsPage(){
  const root=document.getElementById('insights-root');
  if(!root)return;
  const all=computeInsights();
  const counts={all:all.length};
  Object.keys(INS_TYPES).forEach(k=>{counts[k]=all.filter(i=>i.type===k).length;});
  if(!counts[_insFilter]&&_insFilter!=='all')_insFilter='all';
  const shown=_insFilter==='all'?all:all.filter(i=>i.type===_insFilter);
  const [y,m]=activePeriodKey.split('-').map(Number);
  const chips=INS_FILTERS.map(f=>'<button class="ins-chip'+(_insFilter===f[0]?' active':'')+'" data-ph-click="insightsSetFilter(\''+f[0]+'\')">'+f[1]+' <span class="ins-chip-n">'+(counts[f[0]]||0)+'</span></button>').join('');
  let body;
  if(!all.length){
    body='<div class="ins-empty"><b>Nothing to analyse yet.</b><br>Import surveys or log AHT for '+escHtml(periodLabel(m,y))+' and insights will appear here.</div>';
  } else if(!shown.length){
    body='<div class="ins-empty">No insights in this category for '+escHtml(periodLabel(m,y))+'.</div>';
  } else {
    body='<div class="ins-grid">'+shown.map(_insCardHtml).join('')+'</div>';
  }
  root.innerHTML='<div class="ins-chips">'+chips+'</div>'+body
    +'<p class="ins-foot">Written from your '+escHtml(periodLabel(m,y))+' data using your thresholds and weights. Calculated on this device — nothing is sent anywhere.</p>';
}

function insightsSetFilter(f){_insFilter=f;renderInsightsPage();}
function insightsToggleChart(id){if(_insOpenCharts.has(id))_insOpenCharts.delete(id);else _insOpenCharts.add(id);renderInsightsPage();}

// Dashboard teaser: one insight, rotating through the top few by day of month.
function renderInsightsTeaser(){
  const el=document.getElementById('insight-teaser');
  const pg=document.getElementById('page-insights');
  if(pg&&pg.style.display!=='none')renderInsightsPage();
  if(!el)return;
  const all=computeInsights();
  const pool=all.filter(i=>i.type!=='data');
  if(!pool.length){el.style.display='none';el.innerHTML='';return;}
  const pick=pool[new Date().getDate()%Math.min(3,pool.length)];
  const t=INS_TYPES[pick.type];
  el.style.display='flex';
  el.className='ins-teaser '+t.cls;
  el.innerHTML='<div class="ins-teaser-main">'
    +'<div class="ins-teaser-label"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/></svg> Insight of the day</div>'
    +'<div class="ins-teaser-title">'+escHtml(pick.title)+'</div>'
    +'<div class="ins-teaser-body">'+pick.body+'</div></div>'
    +'<button class="btn btn-ghost ins-btn" data-ph-click="showPage(\'insights\')">All insights ('+all.length+') →</button>';
}

// The first dashboard render happens during init, before this file has loaded,
// so paint the teaser once everything is up. Safe to call again at any time.
(function(){
  const first=()=>{try{if(typeof state!=='undefined'&&activePeriodKey)renderInsightsTeaser();}catch(e){console.warn('[Insights]',e);}};
  const ready=window.__storageReady||Promise.resolve();
  ready.then(()=>setTimeout(first,0));
  window.addEventListener('load',()=>setTimeout(first,0));
})();
