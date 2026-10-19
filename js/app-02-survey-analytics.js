// ── Month-over-Month ───────────────────────────────────────────────────────────
function renderMoM(surveys,avgCSAT,arPct,ahtSec){
  const panel=document.getElementById('mom-panel');
  const grid=document.getElementById('mom-grid');
  const prevKey=prevPeriodKey(activePeriodKey);
  const prev=getPrevPeriodStats();

  if(!prev&&!surveys.length){panel.style.display='none';return;}

  const [cy,cm]=activePeriodKey.split('-').map(Number);
  const [py,pm]=prevKey.split('-').map(Number);
  document.getElementById('mom-label').textContent=periodLabel(cm,cy)+' vs '+periodLabel(pm,py);

  function momCard(label,curVal,prevVal,fmt,color,invert){
    const curStr=curVal!==null?fmt(curVal):'—';
    const prevStr=prevVal!==null?fmt(prevVal):'—';
    let delta='',deltaColor='var(--text-muted)';
    if(curVal!==null&&prevVal!==null){
      const d=curVal-prevVal;
      const up=d>0;
      const good=invert?!up:up;
      deltaColor=good?'var(--green)':'var(--red)';
      const sign=up?'+':'';
      delta=sign+fmt(d);
    }
    // Bar comparison
    const maxVal=Math.max(curVal||0,prevVal||0)||1;
    const curW=curVal!==null?Math.round((curVal/maxVal)*100):0;
    const prevW=prevVal!==null?Math.round((prevVal/maxVal)*100):0;
    return`<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:10px">${label}</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
            <span style="font-size:11px;color:var(--text-muted)">This month</span>
            <span style="font-family:var(--mono);font-weight:600;font-size:15px;color:${color}">${curStr}</span>
          </div>
          <div style="height:5px;background:var(--surface3);border-radius:3px;overflow:hidden">
            <div style="width:${curW}%;height:100%;background:${color};border-radius:3px"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
            <span style="font-size:11px;color:var(--text-muted)">Last month</span>
            <span style="font-family:var(--mono);font-size:14px;color:var(--text-dim)">${prevStr}</span>
          </div>
          <div style="height:5px;background:var(--surface3);border-radius:3px;overflow:hidden">
            <div style="width:${prevW}%;height:100%;background:var(--surface3);border:1px solid var(--border2);border-radius:3px;box-sizing:border-box"></div>
          </div>
        </div>
        ${delta?`<div style="text-align:right;font-size:11px;font-family:var(--mono);color:${deltaColor};font-weight:600;margin-top:2px">${delta}</div>`:''}
      </div>
    </div>`;
  }

  const prevAHT=prev?prev.aht:null;
  grid.innerHTML=[
    momCard('CSAT Score',avgCSAT,prev?prev.csat:null,v=>fmtCsat(v),'var(--accent)',false),
    momCard('Agent Resolution',arPct,prev?prev.ar:null,v=>v.toFixed(1)+'%','var(--green)',false),
    momCard('AHT (seconds)',ahtSec||null,prevAHT,v=>fmtSec(Math.round(v)),'var(--teal)',true),
    momCard('Total Surveys',surveys.length,prev?prev.total:null,v=>Math.round(v)+'','var(--orange)',false),
  ].join('');
  panel.style.display='block';
}

// ── Custom KPI metrics: Dashboard section ────────────────────────────────
function renderCustomMetricsSection(){
  const el=document.getElementById('custom-metrics-section');
  if(!el)return;
  if(!CUSTOM_METRIC_DEFS.length){el.innerHTML='';return;}
  const p=getPeriod(activePeriodKey);
  el.innerHTML=`<div class="section-header" style="margin-top:1.25rem">
      <div class="section-title">Custom metrics</div>
    </div>
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      ${CUSTOM_METRIC_DEFS.map(def=>renderCustomMetricCard(def,p)).join('')}
    </div>`;
}
function renderCustomMetricCard(def,p){
  const entries=customMetricEntries(p,def.id);
  const avg=customMetricAvg(p,def.id);
  const status=customMetricStatus(def,avg);
  const sc=customScoringFor(def.id,activeThresh);
  const gName=customMetricGrade(def,avg,sc);
  const unit=def.unit?' '+escHtml(def.unit):'';
  const valStr=avg!==null?(Math.round(avg*100)/100)+unit:'—';
  const rows=entries.slice(-6).reverse().map(e=>`
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:3px 6px;font-size:11px">
        <span style="color:var(--text-muted)">${escHtml(e.dk)}</span>
        <span style="font-family:var(--mono)">${e.value}${unit}</span>
        <button class="icon-btn" style="width:18px;height:18px;padding:0;flex-shrink:0" title="Delete entry" data-ph-click="deleteCustomMetricEntry('${def.id}','${e.dk}')">
          <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`).join('')||'<div style="font-size:11px;color:var(--text-muted);font-style:italic;padding:3px 6px">No entries yet this period</div>';
  return `<div class="kpi-card" style="border-top:none">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#a855f7,rgba(168,85,247,0.3))"></div>
      <div class="kpi-metric-label" title="${escHtml(def.name)}">${escHtml(def.name)}</div>
      <div class="kpi-value">${valStr}</div>
      ${gName?`<div class="grade-pill ${CM_GRADE_CLS[gName]}" style="margin-top:2px;width:fit-content">${gName}${(customMetricIsScored(sc)&&customMetricInScope(def,'dashboard'))?' · '+weightCustomMetric(def,avg,sc)+' pts':''}</div>`:''}
      ${cmScopeOf(def)!=='both'?`<div style="font-size:10px;color:var(--text-muted);margin-top:3px">${cmScopeOf(def)==='team'?'Team members only — not in the dashboard Final KPI':'Main dashboard only — not in team members\' KPI'}</div>`:''}
      ${status?`<div class="grade-pill ${status.cls}" style="margin-top:2px;width:fit-content">${status.label}</div>`:''}
      <div style="margin-top:8px;display:flex;gap:6px;align-items:center">
        <input type="text" id="cm-date-${def.id}" data-value="${todayDateKey()}" value="${fmtCMDateDisplay(todayDateKey())}" readonly placeholder="Select date" data-ph-click="openCMDatePicker(this,'${def.id}')" style="flex:1;min-width:0;cursor:pointer;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 6px;border-radius:6px;font-size:11px;font-family:var(--mono)">
        <input type="number" step="any" id="cm-val-${def.id}" class="cm-val-input" placeholder="${escHtml(def.unit||'value')}" style="width:60px;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 6px;border-radius:6px;font-size:11px">
        <button class="btn btn-ghost" style="padding:4px 8px;font-size:11px;flex-shrink:0" data-ph-click="addCustomMetricEntry('${def.id}')">Add</button>
      </div>
      <div class="daily-aht-section" style="margin-top:auto;flex-shrink:0">
        <div class="daily-aht-label">This period</div>
        <div class="daily-aht-list">${rows}</div>
      </div>
    </div>`;
}
function addCustomMetricEntry(metricId){
  const dateInput=document.getElementById('cm-date-'+metricId);
  const valInput=document.getElementById('cm-val-'+metricId);
  const dk=dateInput?dateInput.dataset.value:'';
  const val=valInput?parseFloat(valInput.value):NaN;
  if(!dk||isNaN(val)){showToast('Enter a date and a value');return;}
  setCustomMetricValue(getPeriod(activePeriodKey),metricId,dk,val);
  renderDashboard(); // also redraws the custom cards and the Final KPI tile
  showToast('Entry added');
}
function deleteCustomMetricEntry(metricId,dk){
  deleteCustomMetricValue(getPeriod(activePeriodKey),metricId,dk);
  renderDashboard();
}
// ── Built-in metrics (CSAT / AR / AHT): where each one counts ───────────
function renderStockScopeSettings(){
  const el=document.getElementById('stock-scope-settings-list');
  if(!el)return;
  el.innerHTML=['csat','ar','aht'].map(k=>`
    <div class="sec-toggle-row" style="padding:8px 0">
      <div>
        <div class="sec-toggle-label">${STOCK_LABELS[k]}</div>
        <div class="sec-toggle-sub">${CM_SCOPE_LABELS[stockScopeOf(k)]}</div>
      </div>
      <select title="Where this metric counts toward the Final KPI" data-ph-change="setStockScope('${k}',this.value)" style="background:var(--surface);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:6px;font-size:11px;max-width:170px">
        ${['both','dashboard','team'].map(v=>`<option value="${v}"${stockScopeOf(k)===v?' selected':''}>${CM_SCOPE_LABELS[v]}</option>`).join('')}
      </select>
    </div>`).join('');
}
function setStockScope(metric,scope){
  if(!STOCK_LABELS[metric])return;
  STOCK_SCOPE[metric]=(scope==='dashboard'||scope==='team')?scope:'both';
  saveStockScope();
  applyActivePeriodThresholds();
  renderStockScopeSettings();
  renderDashboard();
  if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none')renderTeamView();
  showToast(STOCK_LABELS[metric]+': '+CM_SCOPE_LABELS[stockScopeOf(metric)]);
}
// ── Custom KPI metrics: Settings section (define/remove metrics) ────────
function renderCustomMetricsSettings(){
  renderStockScopeSettings();
  const el=document.getElementById('custom-metrics-settings-list');
  if(!el)return;
  if(!CUSTOM_METRIC_DEFS.length){
    el.innerHTML='<div style="font-size:12px;color:var(--text-muted);font-style:italic;padding:6px 0">No custom metrics yet — add one below.</div>';
    return;
  }
  el.innerHTML=CUSTOM_METRIC_DEFS.map(def=>{
    const sc=customScoringFor(def.id,null);
    const scoreTxt=customMetricIsScored(sc)
      ?` · <span style="color:var(--accent)">Counts toward Final KPI (max ${sc.pts.Exceptional} pts)</span>`
      :' · Not in Final KPI yet — set its grades &amp; points in Edit thresholds';
    const scopeSel=`<select title="Where this metric counts" data-ph-change="setCustomMetricScope('${def.id}',this.value)" style="background:var(--surface);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:6px;font-size:11px;max-width:170px">
            ${['both','dashboard','team'].map(v=>`<option value="${v}"${cmScopeOf(def)===v?' selected':''}>${CM_SCOPE_LABELS[v]}</option>`).join('')}
          </select>`;
    return `
      <div class="sec-toggle-row" style="padding:8px 0">
        <div>
          <div class="sec-toggle-label">${escHtml(def.name)}${def.unit?` <span style="color:var(--text-muted);font-weight:400">(${escHtml(def.unit)})</span>`:''}</div>
          <div class="sec-toggle-sub">${def.direction==='lower'?'Lower is better':'Higher is better'}${def.target!==null?' · Target: '+def.target:''}${scoreTxt}</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          ${scopeSel}
          <button class="icon-btn" title="Grades &amp; points (Edit thresholds)" data-ph-click="openThreshForCustomMetric('${def.id}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          </button>
          <button class="icon-btn" title="Remove metric" data-ph-click="confirmRemoveCustomMetric('${def.id}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>`;}).join('');
}
function confirmRemoveCustomMetric(id){
  const def=getCustomMetricDef(id);
  if(!def)return;
  if(!confirm('Remove "'+def.name+'"? Values you already logged for it are kept in your data, but it will no longer show on the Dashboard.'))return;
  removeCustomMetricDef(id);
  renderCustomMetricsSettings();
  renderCustomMetricsSection();
  renderDashboard();
  showToast('Metric removed');
}
function addCustomMetricFromForm(){
  const nameInput=document.getElementById('cm-new-name');
  const unitInput=document.getElementById('cm-new-unit');
  const dirInput=document.getElementById('cm-new-direction');
  const targetInput=document.getElementById('cm-new-target');
  const name=(nameInput.value||'').trim();
  if(!name){showToast('Give the metric a name');return;}
  const scopeInput=document.getElementById('cm-new-scope');
  addCustomMetricDef(name,unitInput.value,dirInput.value,targetInput.value,scopeInput?scopeInput.value:'both');
  nameInput.value='';unitInput.value='';targetInput.value='';
  renderCustomMetricsSettings();
  renderCustomMetricsSection();
  renderDashboard();
  showToast('Metric added: '+name+' — set its grades & points in Edit thresholds');
}

// Dashboard
function renderDashboard(){
  const surveys=getPeriod(activePeriodKey).surveys;
  const total=surveys.length;
  const prev=getPrevPeriodStats();

  // Total
  document.getElementById('total-val').textContent=total;
  document.getElementById('total-sub').textContent=total===1?'survey this period':'surveys this period';
  document.getElementById('total-trend').innerHTML=trendArrow(total,prev?prev.total:null,false);

  // CSAT
  const csatSurveys=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
  const csatTotal=csatSurveys.length;
  let avgCSAT=null;
  if(csatTotal>0){
    avgCSAT=calcCSAT(csatSurveys);
    const g=gradeCSAT(avgCSAT);
    document.getElementById('csat-val').textContent=fmtCsat(avgCSAT);
    document.getElementById('csat-val').className='kpi-value '+g.gcls;
    document.getElementById('csat-val').style.color='';
    // Build per-score breakdown (5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1)
    const csatScoreBuckets=[5,4.5,4,3.5,3,2.5,2,1.5,1];
    const csatBreakdown=csatScoreBuckets.map(sc=>{
      const cnt=csatSurveys.filter(s=>s.csat===sc).length;
      return cnt>0?`<span style="white-space:nowrap;font-family:var(--mono)"><span style="color:var(--amber);font-size:13px;font-weight:600">${sc}</span><span style="color:var(--text-muted);font-size:11px"> x </span><span style="color:var(--accent);font-size:14px;font-weight:700">${cnt}</span></span>`:'';
    }).filter(Boolean).join(' <span style="color:var(--border2)">·</span> ');
    document.getElementById('csat-count').innerHTML=csatBreakdown||`<span style="color:var(--text-muted)">${csatTotal} survey${csatTotal!==1?'s':''}</span>`;
    document.getElementById('csat-badge').innerHTML='<div class="grade-pill '+g.cls+'" style="margin-top:6px">'+g.grade+'</div>';
    document.getElementById('csat-trend').innerHTML=trendArrow(avgCSAT,prev?prev.csat:null,false);
    renderProgressBar('csat-progress-wrap',avgCSAT,activeThresh.csat||CSAT_THRESHOLDS,'var(--accent)',v=>fmtCsat(v),false);
    const nextG=(activeThresh.csat||CSAT_THRESHOLDS).find(t=>t.min>avgCSAT&&t.min>0);
    const nEl=document.getElementById('csat-need');
    if(nextG){const n=needed5sForCSAT(nextG.min,csatSurveys);nEl.style.display='block';nEl.innerHTML='Need <span>'+n+'</span> more 5 for <span>'+nextG.grade+'</span>';}
    else{nEl.style.display='none';}
  } else {
    document.getElementById('csat-val').textContent='—';
    document.getElementById('csat-val').className='kpi-value';
    document.getElementById('csat-val').style.color='var(--accent)';
    document.getElementById('csat-count').textContent='0 surveys';
    document.getElementById('csat-badge').innerHTML='';
    document.getElementById('csat-need').style.display='none';
    document.getElementById('csat-trend').innerHTML='';
    document.getElementById('csat-progress-wrap').style.display='none';
  }

  // AR
  const arResponded=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arYes=surveys.filter(sv=>sv.ar==='yes').length;
  let arPct=null;
  if(arResponded.length>0){
    arPct=arYes/arResponded.length*100;
    const g=gradeAR(arPct);
    document.getElementById('ar-val').textContent=arPct.toFixed(2)+'%';
    document.getElementById('ar-val').className='kpi-value '+g.gcls;
    document.getElementById('ar-val').style.color='';
    const arNo=arResponded.length-arYes;
    document.getElementById('ar-count').innerHTML=`<span style="color:#4ade80">Yes: <strong>${arYes}</strong></span> <span style="color:var(--border2)">·</span> <span style="color:#f87171">No: <strong>${arNo}</strong></span> <span style="color:var(--border2)">·</span> <span style="color:var(--text-muted)">${arResponded.length} total</span>`;
    document.getElementById('ar-badge').innerHTML='<div class="grade-pill '+g.cls+'" style="margin-top:6px">'+g.grade+'</div>';
    document.getElementById('ar-trend').innerHTML=trendArrow(arPct,prev?prev.ar:null,false);
    renderProgressBar('ar-progress-wrap',arPct,activeThresh.ar||AR_THRESHOLDS,'var(--green)',v=>v.toFixed(1)+'%',false);
    const nextG=(activeThresh.ar||AR_THRESHOLDS).find(t=>t.min>arPct&&t.min>0);
    const nEl=document.getElementById('ar-need');
    if(nextG){const n=neededYesForAR(nextG.min,surveys);nEl.style.display='block';nEl.innerHTML='Need <span>'+n+'</span> more YES for <span>'+nextG.grade+'</span>';}
    else{nEl.style.display='none';}
  } else {
    document.getElementById('ar-val').textContent='—';
    document.getElementById('ar-val').className='kpi-value';
    document.getElementById('ar-val').style.color='var(--green)';
    document.getElementById('ar-count').textContent='0 surveys';
    document.getElementById('ar-badge').innerHTML='';
    document.getElementById('ar-need').style.display='none';
    document.getElementById('ar-trend').innerHTML='';
    document.getElementById('ar-progress-wrap').style.display='none';
  }

  // ── Total surveys card: score + AR breakdown. The card is a flex column
  //    (see HTML) with the snippet list pinned to the bottom via margin-top:
  //    auto, so this can take whatever space it needs without overlapping
  //    the list below, at any card height / viewport width. ──────────────
  (function(){
    const el=document.getElementById('total-breakdown');
    if(!el)return;
    if(!total){el.innerHTML='';return;}
    const scoreBuckets=[5,4.5,4,3.5,3,2.5,2,1.5,1];
    const tile=(label,cnt,fg,bg,clickAttr)=>`<div class="total-breakdown-tile"${clickAttr?` data-ph-click="${clickAttr}" style="cursor:pointer;background:${bg||'var(--surface2)'};border:1px solid var(--border);border-radius:6px;padding:2px 6px 3px;min-width:28px;text-align:center;line-height:1.15" title="Click to see who generated these"`:` style="background:${bg||'var(--surface2)'};border:1px solid var(--border);border-radius:6px;padding:2px 6px 3px;min-width:28px;text-align:center;line-height:1.15"`}><div style="font-size:9px;color:var(--text-muted);font-family:var(--mono)">${label}</div><div style="font-size:12px;font-weight:600;font-family:var(--mono);color:${fg}">${cnt}</div></div>`;
    const scoreTiles=scoreBuckets.map(sc=>{
      const cnt=csatSurveys.filter(s=>s.csat===sc).length;
      return cnt>0?tile(sc,cnt,'var(--orange)',null,`openTileSurveyList('csat',${sc})`):'';
    }).filter(Boolean).join('');
    const arNo=arResponded.length-arYes;
    const arTiles=arResponded.length>0
      ? tile('Yes',arYes,'#4ade80','rgba(74,222,128,0.12)',arYes>0?`openTileSurveyList('ar','yes')`:null)+tile('No',arNo,'#f87171','rgba(248,113,113,0.12)',arNo>0?`openTileSurveyList('ar','no')`:null)
      : '';
    if(!scoreTiles&&!arTiles){el.innerHTML='';return;}
    el.innerHTML=[
      scoreTiles?`<div class="daily-aht-label" style="margin-bottom:4px">Score breakdown</div><div style="display:flex;flex-wrap:wrap;gap:4px">${scoreTiles}</div>`:'',
      arTiles?`<div class="daily-aht-label" style="margin:6px 0 4px">AR breakdown</div><div style="display:flex;flex-wrap:wrap;gap:4px">${arTiles}</div>`:''
    ].join('');
  })();

  // Sparklines: daily data points
  const days=getDailyStats(surveys);
  const dkeys=Object.keys(days).sort();
  if(dkeys.length>=2){
    const csatPairs=dkeys.map(dk=>{const s=days[dk].surveys.filter(sv=>sv.csat!==null&&!isNaN(sv.csat));return s.length>0?{dk,v:calcCSAT(s)}:null}).filter(Boolean);
    const arPairs=dkeys.map(dk=>{const s=days[dk].surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');const y=days[dk].surveys.filter(sv=>sv.ar==='yes').length;return s.length>0?{dk,v:y/s.length*100}:null}).filter(Boolean);
    const totalPairs=dkeys.map(dk=>({dk,v:days[dk].surveys.length}));
    if(csatPairs.length>=2)drawSparkline('spark-csat',csatPairs.map(p=>p.v),'#3b82f6',{labels:csatPairs.map(p=>fmtSparkDate(p.dk)),formatValue:v=>fmtCsat(v),title:'CSAT Score'});else drawNoDataSparkline('spark-csat');
    if(arPairs.length>=2)drawSparkline('spark-ar',arPairs.map(p=>p.v),'#22c55e',{labels:arPairs.map(p=>fmtSparkDate(p.dk)),formatValue:v=>v.toFixed(1)+'%',title:'Agent Resolution (AR)'});else drawNoDataSparkline('spark-ar');
    if(totalPairs.length>=2)drawSparkline('spark-total',totalPairs.map(p=>p.v),'#f97316',{labels:totalPairs.map(p=>fmtSparkDate(p.dk)),formatValue:v=>Math.round(v)+(Math.round(v)===1?' survey':' surveys'),title:'Total Surveys'});else drawNoDataSparkline('spark-total');
  } else {
    drawNoDataSparkline('spark-csat');
    drawNoDataSparkline('spark-ar');
    drawNoDataSparkline('spark-total');
  }
  // AHT sparkline: daily AHT entries sorted by date. Mirrors computeAHTSec's
  // source priority — team trend when members have data, else your own log —
  // so the sparkline always matches what the tile's number is based on.
  (function(){
    const p=getPeriod(activePeriodKey);
    const teamTrend=getTeamAHTDailyTrend(p);
    if(teamTrend.length>=2){
      drawSparkline('spark-aht',teamTrend.map(e=>e.aht),'#14b8a6',{labels:teamTrend.map(e=>fmtSparkDate(e.dk)),formatValue:v=>fmtSec(Math.round(v)),title:'Avg Handle Time (AHT)'});
      return;
    }
    const daily=p.dailyAHT||{};
    const ahtEntries=Object.entries(daily)
      .map(([dk,v])=>({dk,...normAHTEntry(v)}))
      .filter(e=>e.aht>0)
      .sort((a,b)=>a.dk.localeCompare(b.dk));
    if(ahtEntries.length>=2){
      drawSparkline('spark-aht',ahtEntries.map(e=>e.aht),'#14b8a6',{labels:ahtEntries.map(e=>fmtSparkDate(e.dk)),formatValue:v=>fmtSec(Math.round(v)),title:'Avg Handle Time (AHT)'});
    } else {
      drawNoDataSparkline('spark-aht');
    }
  })();

  renderThreshTables(surveys,csatSurveys,total,arResponded.length,arYes);
  renderDailyGrid(surveys);
  renderHeatmap(surveys);
  renderDailyAverage(surveys);
  const _ahtSecForRender=computeAHTSec();
  renderKPIScore(avgCSAT,arPct,_ahtSecForRender);
  renderTileSnippets(surveys,avgCSAT,arPct,_ahtSecForRender);
  initDailyTargetInput();
  renderMiniCal();
  updateTeamNavState();
  populateAHTMemberSelect();
  renderCustomMetricsSection();
  if(typeof renderInsightsTeaser==='function')renderInsightsTeaser();
}

// ── Tile inline snippets ─────────────────────────────────────────────────────
const GRADE_ABBR={'Exceptional':'Exc','Good':'Good','Average':'Avg','Satisfactory':'Sat','Needs improvement':'Low'};
function gradeAbbr(g){return GRADE_ABBR[g]||g.slice(0,3);}
function renderTileSnippets(surveys,avgCSAT,arPct,ahtSec){
  const empty='<div style="font-size:11px;color:var(--text-muted);font-style:italic;padding:3px 6px">No surveys yet</div>';

  // ── Total surveys: ID + date, newest first ───────────────────────────────
  const totalEl=document.getElementById('total-snippet-list');
  if(totalEl){
    if(!surveys.length){totalEl.innerHTML=empty;}
    else{
      const sorted=[...surveys].reverse();
      totalEl.innerHTML=sorted.map(sv=>`
        <div class="daily-aht-list-item">
          <span class="daily-aht-list-date">${sv.date?escHtml(sv.date):'—'}</span>
          <span class="daily-aht-list-val" style="font-size:11px;color:var(--orange)">${sv.id?escHtml(sv.id):'—'}</span>
        </div>`).join('');
    }
  }

  // ── CSAT thresholds ────────────────────────────────────────────────────
  const csatEl=document.getElementById('csat-thresh-tile-list');
  if(csatEl){
    const csatThresh=activeThresh.csat||CSAT_THRESHOLDS;
    const csatSurveysForNeed=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
    const curGrade=avgCSAT!==null?gradeCSAT(avgCSAT).grade:null;
    csatEl.innerHTML=csatThresh.map(t=>{
      const isCur=curGrade===t.grade;
      const label=t.min>0?t.min.toFixed(2)+'+':'< '+csatThresh[csatThresh.length-2].min.toFixed(2);
      let needText='—',needStyle='color:var(--text-muted)';
      if(isCur){
        needText=fmtCsat(avgCSAT);needStyle='color:var(--text);font-weight:700';
      } else if(avgCSAT!==null&&t.min>0){
        const n=needed5sForCSAT(t.min,csatSurveysForNeed);
        needText=n>0?'Need '+n:'—';
        needStyle=n>0?'color:#ef4444;font-weight:600':'color:var(--text-muted)';
      }
      return`<div class="daily-aht-list-item thresh-row${isCur?' thresh-row-cur':''}" style="display:flex;align-items:center;min-height:36px">
        <span class="grade-pill ${t.cls} thresh-pill"><span class="thresh-pill-full">${t.grade}</span><span class="thresh-pill-abbr">${gradeAbbr(t.grade)}</span></span>
        <span class="thresh-label">${label}</span>
        <span class="thresh-need" style="${needStyle}">${needText}</span>
      </div>`;
    }).join('');
  }

  // ── AR thresholds ──────────────────────────────────────────────────────
  const arEl=document.getElementById('ar-thresh-tile-list');
  if(arEl){
    const arThresh=activeThresh.ar||AR_THRESHOLDS;
    const curGrade=arPct!==null?gradeAR(arPct).grade:null;
    arEl.innerHTML=arThresh.map(t=>{
      const isCur=curGrade===t.grade;
      const label=t.min>0?t.min.toFixed(0)+'%+':'< '+arThresh[arThresh.length-2].min.toFixed(0)+'%';
      let needText='—',needStyle='color:var(--text-muted)';
      if(isCur){
        needText=arPct.toFixed(2)+'%';needStyle='color:var(--text);font-weight:700';
      } else if(arPct!==null&&t.min>0){
        const n=neededYesForAR(t.min,surveys);
        needText=n>0?'Need '+n:'—';
        needStyle=n>0?'color:#ef4444;font-weight:600':'color:var(--text-muted)';
      }
      return`<div class="daily-aht-list-item thresh-row${isCur?' thresh-row-cur':''}" style="display:flex;align-items:center;min-height:36px">
        <span class="grade-pill ${t.cls} thresh-pill"><span class="thresh-pill-full">${t.grade}</span><span class="thresh-pill-abbr">${gradeAbbr(t.grade)}</span></span>
        <span class="thresh-label">${label}</span>
        <span class="thresh-need" style="${needStyle}">${needText}</span>
      </div>`;
    }).join('');
  }

  // ── AHT thresholds ─────────────────────────────────────────────────────
  const ahtEl=document.getElementById('aht-thresh-tile-list');
  if(ahtEl){
    const ahtThresh=activeThresh.aht||AHT_THRESHOLDS;
    const curGrade=ahtSec>0?gradeAHT(ahtSec).grade:null;
    ahtEl.innerHTML=ahtThresh.map(t=>{
      const isCur=curGrade===t.grade;
      const label=t.max<Infinity?'≤ '+fmtSec(t.max):'> '+fmtSec(ahtThresh[ahtThresh.length-2].max);
      let needText='—',needStyle='color:var(--text-muted)',needLong=false;
      if(isCur){
        needText=fmtSec(ahtSec);needStyle='color:var(--text);font-weight:700';
      } else if(ahtSec>0&&t.max<Infinity&&ahtSec>t.max){
        const needed=ahtSec-t.max;
        needText='Cut '+fmtSec(needed);
        needStyle='color:#ef4444;font-weight:600';
        // Prefer the "needed per day" framing (same one shown in the AHT
        // thresholds side panel) over a flat "Cut" total when it's reachable.
        // No "avg" prefix here so it reads bigger and fits on one line.
        const rd=getProjectionWindow();
        if(rd.isCurrentMonth&&(rd.remainingDays>0||rd.todayOnly)){
          const x=neededDailyAHTForThreshold(t.max,rd.remainingDays);
          if(x!==null&&x>0){
            const dLabel=rd.usingWorkingDays?'wd':'d';
            const daysStr=rd.todayOnly?'today':rd.remainingDays+dLabel+' left';
            needText=fmtSec(Math.round(x))+'/day &middot; '+daysStr;
            needStyle='color:var(--teal);font-weight:700';
            needLong=true;
          }
        }
      }
      return`<div class="daily-aht-list-item thresh-row${isCur?' thresh-row-cur':''}" style="display:flex;align-items:center;min-height:36px">
        <span class="grade-pill ${t.cls} thresh-pill"><span class="thresh-pill-full">${t.grade}</span><span class="thresh-pill-abbr">${gradeAbbr(t.grade)}</span></span>
        <span class="thresh-label">${label}</span>
        <span class="thresh-need${needLong?' thresh-need-long':''}" style="${needStyle}">${needText}</span>
      </div>`;
    }).join('');
  }

  // ── KPI: breakdown + period history ──────────────────────────────────────
  const kpiBkEl=document.getElementById('kpi-snippet-breakdown');
  if(kpiBkEl){
    const wc=weightCSAT(avgCSAT),wa=weightAR(arPct),wh=weightAHT(ahtSec);
    const wCustom=scoredCustomMetricsWeight(getPeriod(activePeriodKey));
    const hasAny=avgCSAT!==null||arPct!==null||ahtSec>0||wCustom>0;
    const subEl=document.getElementById('kpi-final-sub');
    if(subEl)subEl.textContent=kpiFormulaLabel('dashboard');
    // One row per custom metric that counts on the dashboard: its points once graded,
    // or a muted hint while it still needs grades/points in Edit thresholds.
    const cmTh=getThresholdsForPeriod(activePeriodKey);
    const cmTileRows=CUSTOM_METRIC_DEFS.filter(d=>customMetricInScope(d,'dashboard')).map(def=>{
      const sc=customScoringFor(def.id,cmTh);
      const avg=customMetricAvg(getPeriod(activePeriodKey),def.id);
      const on=customMetricIsScored(sc);
      const g=on?customMetricGrade(def,avg,sc):null;
      const gcls=(g&&g!=='Needs improvement')?'gc-'+g.toLowerCase():'gc-needs';
      const val=!on?'not scored yet':(avg===null?'—':weightCustomMetric(def,avg,sc)+'%');
      return `<div class="daily-aht-list-item">
          <span style="font-size:11px;color:var(--text-muted)" title="${escHtml(def.name)}">${escHtml(def.name)}</span>
          <span class="daily-aht-list-val ${on&&avg!==null?gcls:''}" style="${(!on||avg===null)?'color:var(--text-muted);font-style:'+(on?'normal':'italic'):''}">${val}</span>
        </div>`;
    }).join('');
    if(!hasAny){kpiBkEl.innerHTML='<div style="font-size:11px;color:var(--text-muted);font-style:italic;padding:3px 6px">No data yet</div>';}
    else{
      const total=wc+wa+wh+wCustom;
      const g=kpiScoreGrade(total);
      const gCsat=avgCSAT!==null?gradeCSAT(avgCSAT):{gcls:'gc-needs'};
      const gAR=arPct!==null?gradeAR(arPct):{gcls:'gc-needs'};
      const gAHT=ahtSec>0?gradeAHT(ahtSec):{gcls:'gc-needs'};
      kpiBkEl.innerHTML=`
        <div class="daily-aht-list-item">
          <span style="font-size:11px;color:var(--text-muted)">CSAT</span>
          <span class="daily-aht-list-val ${avgCSAT!==null?gCsat.gcls:''}" style="${avgCSAT===null?'color:var(--text-muted)':''}">${avgCSAT!==null?wc+'%':'—'}</span>
        </div>
        <div class="daily-aht-list-item">
          <span style="font-size:11px;color:var(--text-muted)">AR</span>
          <span class="daily-aht-list-val ${arPct!==null?gAR.gcls:''}" style="${arPct===null?'color:var(--text-muted)':''}">${arPct!==null?wa+'%':'—'}</span>
        </div>
        <div class="daily-aht-list-item">
          <span style="font-size:11px;color:var(--text-muted)">AHT</span>
          <span class="daily-aht-list-val ${ahtSec>0?gAHT.gcls:''}" style="${ahtSec<=0?'color:var(--text-muted)':''}">${ahtSec>0?wh+'%':'—'}</span>
        </div>
        ${cmTileRows}
        <div class="daily-aht-list-item" style="border-top:1px solid var(--border);margin-top:2px;padding-top:4px">
          <span style="font-size:11px;color:var(--text-muted);font-weight:600">Total</span>
          <span class="daily-aht-list-val ${g.gcls}">${total.toFixed(2)}%</span>
        </div>`;
    }
  }

  const kpiHistEl=document.getElementById('kpi-snippet-history');
  if(kpiHistEl){
    const allStats=getAllPeriodStats().sort((a,b)=>b.key.localeCompare(a.key));
    const history=allStats.map(s=>{
      const spt=getThresholdsForPeriod(s.key);
      const wc2=s.csat!==null?(spt.weights.csat[gradeCSATWith(s.csat,spt.csat).grade]||0):0;
      const wa2=s.ar!==null?(spt.weights.ar[gradeARWith(s.ar,spt.ar).grade]||0):0;
      const wh2=(s.aht&&s.aht>0)?(spt.weights.aht[gradeAHTWith(s.aht,spt.aht).grade]||0):0;
      const kpi2=(s.csat!==null||s.ar!==null||(s.aht&&s.aht>0))?wc2+wa2+wh2+customMetricsPoints(s.key):null;
      return{...s,kpi:kpi2};
    }).filter(s=>s.kpi!==null);
    if(!history.length){kpiHistEl.innerHTML='<div style="font-size:11px;color:var(--text-muted);font-style:italic;padding:3px 6px">No history yet</div>';}
    else{
      kpiHistEl.innerHTML=history.map(s=>{
        const sg=kpiScoreGrade(s.kpi);
        const isCur=s.key===activePeriodKey;
        return`<div class="daily-aht-list-item"${isCur?' style="background:rgba(168,85,247,0.1)"':''}>
          <span class="daily-aht-list-date">${s.label}${isCur?' ●':''}</span>
          <span class="daily-aht-list-val ${sg.gcls}">${s.kpi.toFixed(2)}%</span>
        </div>`;
      }).join('');
    }
  }
}

function renderDailyGrid(surveys){
  const grid=document.getElementById('daily-grid');
  const _f=dailyFilter.main;
  if(_f)surveys=surveys.filter(sv=>_dailyFilterMatch(_f,sv));
  const days=getDailyStats(surveys);
  const dailyAHTMapAll=getTileDailyAHTMap(getPeriod(activePeriodKey));
  // Include days that only have AHT data (no CSAT/AR surveys) so they still get a tile
  Object.keys(dailyAHTMapAll).forEach(dk=>{
    const entry=dailyAHTMapAll[dk];
    const sec=entry?normAHTEntry(entry).aht||0:0;
    if(!_f&&sec>0&&!days[dk])days[dk]={surveys:[]};
  });
  const keys=Object.keys(days).sort();
  _renderDailyFilterBar('main',grid,keys.length,surveys.length);
  if(keys.length===0){
    grid.innerHTML='<div class="day-tile"><div class="day-empty">'+(_f?'No surveys match this filter.':'No survey data yet.')+'</div></div>';
    return;
  }
  grid.innerHTML='';
  keys.forEach(dk=>{
    const daySurveys=days[dk].surveys;
    const csatDaySurveys=daySurveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const csatAvg=csatDaySurveys.length>0?calcCSAT(csatDaySurveys):null;
    const arResponded=daySurveys.filter(s=>s.ar==='yes'||s.ar==='no');
    const arYes=daySurveys.filter(s=>s.ar==='yes').length;
    const arPct=arResponded.length>0?arYes/arResponded.length*100:null;
    const arNo=arResponded.length-arYes;
    const arYesNoHTML=arResponded.length>0
      ?`<div class="day-score-row"><span class="day-score-key">Yes/No</span><span class="day-score-val" style="font-size:11px">${_dfChip('main','ar','yes',arYes,'var(--green)','Yes')}<span style="color:var(--text-muted)"> / </span>${_dfChip('main','ar','no',arNo,'var(--red)','No')}</span></div>`
      :`<div class="day-score-row"><span class="day-score-key">Yes/No</span><span class="day-score-val" style="color:var(--text-muted)">—</span></div>`;
    const dailyAHTMap=dailyAHTMapAll;
    const dayAHTEntry=dailyAHTMap[dk];
    const dayAHTSec=dayAHTEntry?normAHTEntry(dayAHTEntry).aht||0:0;

    // Score distribution mini-bar
    let distHTML='';
    if(csatDaySurveys.length>0){
      const scores=[5,4.5,4,3.5,3,2.5,2,1.5,1];
      const maxCount=Math.max(...scores.map(sc=>csatDaySurveys.filter(s=>s.csat===sc).length));
      const bars=scores.map(sc=>{
        const cnt=csatDaySurveys.filter(s=>s.csat===sc).length;
        if(!cnt)return'';
        const barH=maxCount>0?Math.max(3,Math.round(cnt/maxCount*18)):3;
        const col=sc>=4.9?'var(--green)':sc>=4.5?'var(--accent)':sc>=4?'var(--amber)':'var(--red)';
        return`<div data-filter-chip="1" data-action="event.stopPropagation();setDailyFilter('main','csat',${sc})" style="display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;padding:1px 2px;border-radius:3px;${(_f&&_f.type==='csat'&&_f.val===sc)?'outline:1px solid var(--accent);background:rgba(148,163,184,.18)':''}" title="${sc}×${cnt} — click to filter by this score">
          <span style="font-size:8px;font-family:var(--mono);color:var(--text-muted);line-height:1">${cnt}</span>
          <div style="width:6px;height:${barH}px;background:${col};border-radius:2px 2px 0 0"></div>
          <span style="font-size:7px;font-family:var(--mono);color:var(--text-muted);line-height:1">${sc}</span>
        </div>`;
      }).filter(Boolean).join('');
      distHTML=`<div style="display:flex;align-items:flex-end;gap:3px;margin-top:3px;padding-top:3px;border-top:1px solid var(--border)">${bars}</div>`;
    }

    const tile=document.createElement('div');
    tile.className='day-tile';
    tile.style.cursor='pointer';
    tile.title='Click to view day details';
    tile.addEventListener('mouseenter',function(){const bar=this.querySelector('.day-tile-accent-bar');if(bar)bar.style.opacity='1';});
    tile.addEventListener('mouseleave',function(){const bar=this.querySelector('.day-tile-accent-bar');if(bar)bar.style.opacity='0';});
    tile.addEventListener('click',function(e){
      // don't fire if annotation button or its children were clicked
      if(e.target.closest('[data-filter-chip]')||e.target.closest('.day-ann-btn')||e.target.closest('[onclick^="openAnnModal"]'))return;
      openDayDetail(dk);
    });
    let csatHTML=csatAvg!==null
      ?`<div class="day-score-row"><span class="day-score-key">CSAT</span><span class="day-score-val ${gradeCSAT(csatAvg).gcls}">${fmtCsat(csatAvg)}</span></div>`
      :`<div class="day-score-row"><span class="day-score-key">CSAT</span><span class="day-score-val" style="color:var(--text-muted)">—</span></div>`;
    let arHTML=arPct!==null
      ?`<div class="day-score-row"><span class="day-score-key">AR</span><span class="day-score-val ${gradeAR(arPct).gcls}">${arPct.toFixed(2)}%</span></div>`
      :`<div class="day-score-row"><span class="day-score-key">AR</span><span class="day-score-val" style="color:var(--text-muted)">—</span></div>`;
    let ahtHTML=dayAHTSec>0
      ?`<div class="day-score-row"><span class="day-score-key">AHT</span><span class="day-score-val ${gradeAHT(dayAHTSec).gcls}" style="font-size:11px">${fmtSec(dayAHTSec)}</span></div>`
      :`<div class="day-score-row"><span class="day-score-key">AHT</span><span class="day-score-val" style="color:var(--text-muted)">—</span></div>`;
    const ann=(getPeriod(activePeriodKey).annotations||{})[dk]||'';
    const mood=getMood(dk);
    // Low score alert: any individual score below 4
    const lowScores=csatDaySurveys.filter(s=>s.csat<4);
    const lowAlertHTML=lowScores.length?`<div class="day-low-alert">⚠ ${lowScores.length} low score${lowScores.length>1?'s':''}</div>`:'';
    // Daily target progress
    const target=_f?0:getDailyTarget();
    let targetHTML='';
    if(target>0){
      const pct=Math.min(100,Math.round(daySurveys.length/target*100));
      const col=pct>=100?'var(--green)':pct>=60?'var(--amber)':'var(--red)';
      targetHTML=`<div class="day-target-bar"><div class="day-target-fill" style="width:${pct}%;background:${col}"></div></div>
      <div class="day-target-label"><span>${daySurveys.length}/${target}</span><span style="color:${col}">${pct}%</span></div>`;
    }
    tile.innerHTML=`
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),rgba(59,130,246,0.2));border-radius:var(--radius-md) var(--radius-md) 0 0;opacity:0;transition:opacity .2s" class="day-tile-accent-bar"></div>
      <div class="day-label" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:4px">
          ${fmtDayLabel(dk)}
          ${mood?`<span class="day-mood" title="Change mood" data-action="event.stopPropagation();toggleMoodPicker('${dk}',this)">${mood}</span>`:''}
        </span>
        <span style="display:flex;align-items:center;gap:4px">
          ${ann?`<span title="📌 ${ann.replace(/"/g,'&quot;')}" style="font-size:11px;cursor:pointer;line-height:1" data-action="event.stopPropagation();openAnnModal('${dk}')">📝</span>`:''}
          <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="opacity:.3;flex-shrink:0"><path d="M9 18l6-6-6-6"/></svg>
        </span>
      </div>
      <div class="day-scores">
        ${csatHTML}
        ${arHTML}
        ${arYesNoHTML}
        ${ahtHTML}
        <div class="day-score-row" style="margin-top:2px;border-top:1px solid var(--border);padding-top:2px">
          <span class="day-score-key" style="color:var(--text-muted);font-size:9px">${target>0?'':daySurveys.length+' survey'+(daySurveys.length!==1?'s':'')}</span>
          ${!mood?`<button class="day-ann-btn" style="width:auto;padding:0 4px;font-size:10px;border:none;background:none;color:var(--text-muted)" title="Add mood" data-action="event.stopPropagation();toggleMoodPicker('${dk}',this)">😶</button>`:''}
        </div>
      </div>
      ${lowAlertHTML}
      ${targetHTML}
      ${distHTML}
      ${ann?`<div class="day-annotation">📌 ${ann}</div>`:''}
      <button class="day-ann-btn" data-action="event.stopPropagation();openAnnModal('${dk}')">✏ ${ann?'edit note':'add note'}</button>
      <div class="day-tile-open-hint">tap to view details</div>`;
    grid.appendChild(tile);
  });
}

// ── Daily breakdown filter (Yes/No + CSAT score) ────────────────────────────
// Click a Yes/No count or a CSAT score bar on any day tile to filter the whole
// Daily Breakdown grid to just those surveys. Click again (or "Clear") to reset.
// Kept separately for the main dashboard ('main') and the member view ('member').
var dailyFilter={main:null,member:null};
var _memberGridCtx=null;
function _dailyFilterMatch(f,sv){
  if(!f)return true;
  if(f.type==='ar')return sv.ar===f.val;
  if(f.type==='csat')return sv.csat===f.val;
  return true;
}
function _dfChip(scope,type,val,count,color,label){
  const f=dailyFilter[scope];
  const on=f&&f.type===type&&f.val===val;
  const arg=typeof val==='number'?val:"'"+val+"'";
  return`<span data-filter-chip="1" data-action="event.stopPropagation();setDailyFilter('${scope}','${type}',${arg})" title="${count} ${label} — click to filter by ${label}" style="cursor:pointer;color:${color};padding:0 3px;border-radius:4px;${on?'outline:1px solid '+color+';background:rgba(148,163,184,.18)':''}">${count}</span>`;
}
function _renderDailyFilterBar(scope,grid,dayCount,surveyCount){
  const id=scope+'-daily-filter-bar';
  let bar=document.getElementById(id);
  const f=dailyFilter[scope];
  if(!f){if(bar)bar.remove();return;}
  if(!bar){bar=document.createElement('div');bar.id=id;grid.parentNode.insertBefore(bar,grid);}
  bar.style.cssText='display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:11px;color:var(--text-dim);flex-wrap:wrap';
  const lbl=f.type==='ar'?'AR = '+(f.val==='yes'?'Yes':'No'):'CSAT score = '+f.val;
  bar.innerHTML=`<span style="background:var(--surface2);border:1px solid var(--border);border-radius:999px;padding:3px 10px">Filter: <b style="color:var(--text)">${lbl}</b> · ${surveyCount} survey${surveyCount!==1?'s':''} across ${dayCount} day${dayCount!==1?'s':''}</span><button data-ph-click="setDailyFilter('${scope}',null,null)" style="background:var(--surface2);border:1px solid var(--border);color:var(--text-dim);font-size:11px;font-family:var(--font);padding:3px 10px;border-radius:999px;cursor:pointer">✕ Clear filter</button>`;
}
function setDailyFilter(scope,type,val){
  const cur=dailyFilter[scope];
  if(!type||(cur&&cur.type===type&&cur.val===val))dailyFilter[scope]=null;
  else dailyFilter[scope]={type,val};
  if(scope==='member'){
    if(_memberGridCtx)renderMemberDailyGrid(_memberGridCtx.agent,_memberGridCtx.surveys);
  }else{
    renderDailyGrid(getPeriod(activePeriodKey).surveys||[]);
  }
}

// ── Daily Target ─────────────────────────────────────────────────────────────
function getDailyTarget(){
  try{return parseInt(localStorage.getItem('daily-target')||'0')||0;}catch(e){return 0;}
}
function saveDailyTarget(v){
  try{localStorage.setItem('daily-target',parseInt(v)||0);}catch(e){}
}
function initDailyTargetInput(){
  const el=document.getElementById('daily-target-input');
  if(el)el.value=getDailyTarget();
}

// ── Mood Tags ─────────────────────────────────────────────────────────────────
const MOODS=['🔥','😊','😐','😤','😴','💪','🎯','⚡','🌧️','✨'];
function getMoodsStore(){
  try{return JSON.parse(localStorage.getItem('moods-'+activePeriodKey)||'{}');}catch(e){return{};}
}
function saveMood(dk,mood){
  const s=getMoodsStore();
  if(mood)s[dk]=mood;else delete s[dk];
  try{localStorage.setItem('moods-'+activePeriodKey,JSON.stringify(s));}catch(e){}
}
function getMood(dk){return getMoodsStore()[dk]||'';}
let _moodPickerDk=null;
function toggleMoodPicker(dk,anchorEl){
  // Remove any open picker
  document.querySelectorAll('.mood-picker').forEach(el=>el.remove());
  if(_moodPickerDk===dk){_moodPickerDk=null;return;}
  _moodPickerDk=dk;
  const picker=document.createElement('div');
  picker.className='mood-picker';
  picker.innerHTML=MOODS.map(m=>`<button class="mood-btn-pick" title="${m}" data-action="event.stopPropagation();pickMood('${dk}','${m}')">${m}</button>`).join('')
    +`<button class="mood-btn-pick" title="Clear" data-action="event.stopPropagation();pickMood('${dk}','')">✕</button>`;
  // Position relative to anchor
  const parent=anchorEl.closest('.day-tile');
  parent.style.position='relative';
  parent.appendChild(picker);
  setTimeout(()=>document.addEventListener('click',closeMoodPicker,{once:true}),0);
}
function closeMoodPicker(){
  document.querySelectorAll('.mood-picker').forEach(el=>el.remove());
  _moodPickerDk=null;
}
function pickMood(dk,mood){
  saveMood(dk,mood);
  closeMoodPicker();
  renderDailyGrid(getPeriod(activePeriodKey).surveys||[]);
  renderMiniCal();
}

// ── Mini Calendar Heatmap (now a popup) ────────────────────────────────────────
let _miniCalVisible=false;
let _calHeatmapKey=null; // period key currently shown in the popup
function openCalHeatmapModal(){
  const overlay=document.getElementById('cal-heatmap-overlay');
  if(overlay){overlay.classList.add('open');}
  _miniCalVisible=true;
  _calHeatmapKey=activePeriodKey; // start on current period
  _renderCalHeatmapForKey(_calHeatmapKey);
  // Update button style
  const btn=document.getElementById('mini-cal-toggle-btn');
  if(btn){btn.style.background='var(--accent-dim)';btn.style.borderColor='rgba(59,130,246,0.4)';btn.style.color='var(--accent)';}
}
function closeCalHeatmapModal(){
  const overlay=document.getElementById('cal-heatmap-overlay');
  if(overlay){overlay.classList.remove('open');}
  _miniCalVisible=false;
  const btn=document.getElementById('mini-cal-toggle-btn');
  if(btn){btn.style.background='';btn.style.borderColor='';btn.style.color='';}
}
function calHeatmapShiftMonth(delta){
  if(!_calHeatmapKey)return;
  const [y,m]=_calHeatmapKey.split('-').map(Number);
  let nm=m+delta,ny=y;
  if(nm<1){nm=12;ny--;}
  if(nm>12){nm=1;ny++;}
  _calHeatmapKey=ny+'-'+String(nm).padStart(2,'0');
  _renderCalHeatmapForKey(_calHeatmapKey);
}
function _renderCalHeatmapForKey(key){
  // Update period label in nav
  const [y,m]=key.split('-').map(Number);
  const periodLbl=document.getElementById('cal-heatmap-period-label');
  if(periodLbl)periodLbl.textContent=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]+' '+y;
  // Render using data from this key (may be empty)
  const surveys=(state[key]||{surveys:[]}).surveys||[];
  renderHeatmap(surveys,key);
}
// Keep toggleMiniCal as alias for backward-compat
function toggleMiniCal(){openCalHeatmapModal();}
function renderMiniCal(){
  if(_miniCalVisible)_renderCalHeatmapForKey(_calHeatmapKey||activePeriodKey);
}

// ── Copy Day Summary ──────────────────────────────────────────────────────────
function copyDaySummary(dk,csatAvg,arPct,ahtSec,kpiRaw,count){
  const lines=[
    `📅 ${fmtDayLabel(dk)} — Daily Summary`,
    `Surveys: ${count}`,
    csatAvg!==null?`CSAT: ${fmtCsat(csatAvg)} (${gradeCSAT(csatAvg).grade})`:'CSAT: —',
    arPct!==null?`AR: ${arPct.toFixed(1)}% (${gradeAR(arPct).grade})`:'AR: —',
    ahtSec?`AHT: ${fmtSec(ahtSec)} (${gradeAHT(ahtSec).grade})`:'AHT: —',
    kpiRaw!==null?`KPI: ${kpiRaw.toFixed(1)}%`:'KPI: —',
  ];
  navigator.clipboard.writeText(lines.join('\n')).then(()=>showToast('Day summary copied!')).catch(()=>showToast('Copy failed'));
}

// ── Best Day Banner ───────────────────────────────────────────────────────────
function getBestDayRecords(dk,csatAvg,arPct,daySurveys){
  const surveys=getPeriod(activePeriodKey).surveys||[];
  const allDays=getDailyStats(surveys);
  const records=[];
  // Best CSAT day?
  if(csatAvg!==null){
    const allCsats=Object.entries(allDays).map(([k,ds])=>{const cs=ds.surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));return cs.length?calcCSAT(cs):null}).filter(v=>v!==null);
    if(allCsats.length&&csatAvg>=Math.max(...allCsats)-0.001)records.push('Best CSAT day 😊');
  }
  // Most surveys day?
  const allCounts=Object.values(allDays).map(ds=>ds.surveys.length);
  if(allCounts.length&&daySurveys.length>=Math.max(...allCounts))records.push('Most surveys in a day 📋');
  // Best AR day?
  if(arPct!==null){
    const allARs=Object.entries(allDays).map(([k,ds])=>{const ar=ds.surveys.filter(s=>s.ar==='yes'||s.ar==='no');const y=ds.surveys.filter(s=>s.ar==='yes').length;return ar.length?y/ar.length*100:null}).filter(v=>v!==null);
    if(allARs.length&&arPct>=Math.max(...allARs)-0.01)records.push('Best AR day ✅');
  }
  return records;
}

// ── Week-over-Week ────────────────────────────────────────────────────────────
function getWowBadge(metric,current,prev){
  if(prev===null||prev===undefined||current===null)return'';
  const diff=current-prev;
  const pct=prev!==0?Math.round(diff/prev*100):0;
  if(Math.abs(pct)<1)return`<span class="wow-badge wow-flat">— same</span>`;
  if(diff>0)return`<span class="wow-badge wow-up">▲ ${Math.abs(pct)}% vs last wk</span>`;
  return`<span class="wow-badge wow-down">▼ ${Math.abs(pct)}% vs last wk</span>`;
}

// ── Export Day as Image ───────────────────────────────────────────────────────
function exportDayImage(dk){
  const modal=document.querySelector('#day-detail-modal .modal');
  if(!modal){showToast('No modal open');return;}
  // Use html2canvas if available, else fallback to SVG screenshot
  if(typeof html2canvas!=='undefined'){
    html2canvas(modal,{backgroundColor:'#121519',scale:2}).then(canvas=>{
      const a=document.createElement('a');
      a.download=`ProgressHub_day_${dk}.png`;
      a.href=canvas.toDataURL('image/png');
      a.click();
      showToast('Day exported as image!');
    });
  } else {
    // Fallback: copy text summary
    showToast('Image export needs html2canvas — copied text summary instead');
  }
}
function weightCSAT(avg){
  if(avg===null)return 0;
  const g=gradeCSAT(avg);
  const w=activeThresh.weights||KPI_WEIGHTS;
  return w.csat[g.grade]||0;
}
function weightAR(pct){
  if(pct===null)return 0;
  const g=gradeAR(pct);
  const w=activeThresh.weights||KPI_WEIGHTS;
  return w.ar[g.grade]||0;
}
function weightAHT(sec){
  if(!sec||sec<=0)return 0;
  const g=gradeAHT(sec);
  const w=activeThresh.weights||KPI_WEIGHTS;
  return w.aht[g.grade]||0;
}
function kpiScoreGrade(score){
  if(score>=95)return{label:'Exceptional',cls:'grade-exceptional',gcls:'gc-exceptional'};
  if(score>=85)return{label:'Good',cls:'grade-good',gcls:'gc-good'};
  if(score>=80)return{label:'Satisfactory',cls:'grade-satisfactory',gcls:'gc-satisfactory'};
  return{label:'Needs improvement',cls:'grade-needs',gcls:'gc-needs'};
}

function renderKPIScore(avgCSAT,arPct,ahtSec){
  const wc=weightCSAT(avgCSAT);
  const wa=weightAR(arPct);
  const wh=weightAHT(ahtSec);
  const wCustom=scoredCustomMetricsWeight(getPeriod(activePeriodKey));
  const hasAny=(avgCSAT!==null)||(arPct!==null)||(ahtSec>0)||(wCustom>0);
  const prev=getPrevPeriodStats();
  if(!hasAny){
    const el=document.getElementById('kpi-final-val');
    el.textContent='—';
    el.className='kpi-value';
    el.style.color='var(--purple)';
    document.getElementById('kpi-final-badge').innerHTML='';
    document.getElementById('kpi-breakdown').style.display='none';
    document.getElementById('kpi-trend').innerHTML='';
    document.getElementById('kpi-progress-wrap').style.display='none';
    return;
  }
  const total=wc+wa+wh+wCustom;
  const el=document.getElementById('kpi-final-val');
  el.textContent=total.toFixed(2)+'%';
  const g=kpiScoreGrade(total);
  el.className='kpi-value '+g.gcls;
  el.style.color='';
  document.getElementById('kpi-final-badge').innerHTML='<div class="grade-pill '+g.cls+'">'+g.label+'</div>';
  document.getElementById('kpi-trend').innerHTML=trendArrow(total,prev?prev.kpi:null,false);
  const bk=document.getElementById('kpi-breakdown');
  bk.style.display='block';
  bk.innerHTML=[['csat','CSAT',wc],['ar','AR',wa],['aht','AHT',wh]].filter(r=>stockInScope(r[0],'dashboard')).map(r=>r[1]+' <span style="color:var(--text)">'+r[2]+'%</span>').join(' · ')+customMetricBreakdown(activePeriodKey).map(r=>' · '+escHtml(r.def.name)+' <span style="color:var(--text)">'+r.pts+'%</span>').join('');
}

// Goals removed — stubs kept for safety
function renderGoalProgressBars(){}
function renderGoalsProgress(){}

function renderThreshTables(surveys,csatSurveys,total,arTotal,arYes){
  const avgCSAT=csatSurveys.length>0?calcCSAT(csatSurveys):null;
  const arPct=arTotal>0?arYes/arTotal*100:null;
  const ahtSec=computeAHTSec();
  const rdThresh=getProjectionWindow();
  const dLabelThresh=rdThresh.todayOnly?'today':(rdThresh.usingWorkingDays?'wd':'d');

  const csatThresh=activeThresh.csat||CSAT_THRESHOLDS;
  const csatWeights=(activeThresh.weights||KPI_WEIGHTS).csat;
  const cb=document.getElementById('csat-thresh-body');
  cb.innerHTML='';
  csatThresh.forEach(t=>{
    const isCurrent=avgCSAT!==null&&gradeCSAT(avgCSAT).grade===t.grade;
    const label=t.min>0?t.min.toFixed(2)+'+':'< 4.85';
    const wVal=csatWeights[t.grade];
    const wPct=wVal!==undefined?wVal+'%':'0%';
    let currentCell='—';
    if(avgCSAT!==null){
      if(isCurrent)currentCell='<span class="check-icon" style="display:inline-flex;align-items:center;gap:4px"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> '+fmtCsat(avgCSAT)+'</span>';
      else if(t.min>0){
        const n=needed5sForCSAT(t.min,csatSurveys);
        const style=n>0?'color:#ef4444;font-weight:600':'color:var(--text-muted)';
        currentCell='<span style="'+style+'">Need '+n+'</span>';
        if(rdThresh.isCurrentMonth&&rdThresh.remainingDays>0&&avgCSAT<t.min){
          const r=avgCSATNeededPerDay(t.min,csatSurveys,rdThresh.remainingDays);
          if(r!==null){
            if(r.avgNeeded>0&&r.avgNeeded<=5){
              const daysStr=rdThresh.todayOnly?'today':rdThresh.remainingDays+dLabelThresh+' left';
              currentCell+='<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:var(--teal);background:var(--teal-dim);border:1px solid rgba(20,184,166,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">🎯 avg '+r.avgNeeded.toFixed(2)+'/day · '+daysStr+'</span>';
            } else {
              const daysStr=rdThresh.todayOnly?'today':rdThresh.remainingDays+dLabelThresh;
              currentCell+='<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">&#9888; not reachable '+daysStr+'</span>';
            }
          }
        }
      }
    }
    const tr=document.createElement('tr');
    if(isCurrent)tr.className='current-row';
    tr.innerHTML='<td><span class="grade-pill '+t.cls+'">'+t.grade+'</span></td><td style="font-family:var(--mono)">'+label+'</td><td style="font-family:var(--mono)">'+currentCell+'</td><td style="font-family:var(--mono);color:var(--text-dim)">'+wPct+'</td>';
    cb.appendChild(tr);
  });

  const arThresh=activeThresh.ar||AR_THRESHOLDS;
  const arWeights=(activeThresh.weights||KPI_WEIGHTS).ar;
  const ab=document.getElementById('ar-thresh-body');
  ab.innerHTML='';
  arThresh.forEach(t=>{
    const isCurrent=arPct!==null&&gradeAR(arPct).grade===t.grade;
    const label=t.min>0?t.min.toFixed(2)+'%+':'< 83%';
    const wVal=arWeights[t.grade];
    const wPct=wVal!==undefined?wVal+'%':'0%';
    let currentCell='—';
    if(arPct!==null){
      if(isCurrent)currentCell='<span class="check-icon" style="display:inline-flex;align-items:center;gap:4px"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> '+arPct.toFixed(2)+'%</span>';
      else if(t.min>0){
        const n=neededYesForAR(t.min,surveys);
        const style=n>0?'color:#ef4444;font-weight:600':'color:var(--text-muted)';
        currentCell='<span style="'+style+'">Need '+n+' YES</span>';
        if(rdThresh.isCurrentMonth&&rdThresh.remainingDays>0&&arPct<t.min){
          const r=avgARNeededPerDay(t.min,surveys,rdThresh.remainingDays);
          if(r!==null){
            if(r.pctNeeded>0&&r.pctNeeded<=100){
              const daysStr=rdThresh.todayOnly?'today':rdThresh.remainingDays+dLabelThresh+' left';
              currentCell+='<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:var(--teal);background:var(--teal-dim);border:1px solid rgba(20,184,166,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">🎯 avg '+r.pctNeeded.toFixed(1)+'% YES/day · '+daysStr+'</span>';
            } else {
              const daysStr=rdThresh.todayOnly?'today':rdThresh.remainingDays+dLabelThresh;
              currentCell+='<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">&#9888; not reachable '+daysStr+'</span>';
            }
          }
        }
      }
    }
    const tr=document.createElement('tr');
    if(isCurrent)tr.className='current-row';
    tr.innerHTML='<td><span class="grade-pill '+t.cls+'">'+t.grade+'</span></td><td style="font-family:var(--mono)">'+label+'</td><td style="font-family:var(--mono)">'+currentCell+'</td><td style="font-family:var(--mono);color:var(--text-dim)">'+wPct+'</td>';
    ab.appendChild(tr);
  });

  renderAHTThresh(ahtSec);
}

function renderAHTThresh(currentSec){
  const ab=document.getElementById('aht-thresh-body');
  ab.innerHTML='';
  const ahtThresh=activeThresh.aht||AHT_THRESHOLDS;
  const ahtWeights=(activeThresh.weights||KPI_WEIGHTS).aht;
  ahtThresh.forEach((t,idx)=>{
    const wVal=ahtWeights[t.grade];
    const weightLabel=wVal!==undefined?wVal+'%':'0%';
    const isCurrent=currentSec>0&&gradeAHT(currentSec).grade===t.grade;
    const prevMax=idx>0?ahtThresh[idx-1].max:null;
    const maxLabel=t.max===Infinity?(prevMax?'> '+prevMax+'s':'> Satisfactory'):'≤ '+t.max+'s';
    const equivLabel=t.max===Infinity?(prevMax?'> '+fmtSec(prevMax):'—'):'≤ '+fmtSec(t.max);
    let currentCell='—';
    if(currentSec>0){
      if(isCurrent){
        currentCell='<span class="check-icon" style="display:inline-flex;align-items:center;gap:3px"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'+fmtSec(currentSec)+'</span>';
      } else if(t.max!==Infinity&&currentSec>t.max){
        // This grade requires lower AHT — show how many seconds to cut
        const needed=currentSec-t.max;
        let extra='';
        const rd=getProjectionWindow();
        if(rd.isCurrentMonth&&(rd.remainingDays>0||rd.todayOnly)){
          const x=neededDailyAHTForThreshold(t.max,rd.remainingDays);
          if(x!==null){
            const dLabel=rd.usingWorkingDays?'wd':'d';
            const daysStr=rd.todayOnly?'today':rd.remainingDays+dLabel+' left';
            extra=x>0
              ?'<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:var(--teal);background:var(--teal-dim);border:1px solid rgba(20,184,166,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">🎯 avg '+fmtSec(Math.round(x))+'/day &middot; '+daysStr+'</span>'
              :'<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">&#9888; not reachable '+daysStr+'</span>';
          }
        }
        currentCell='<span style="color:#ef4444;font-weight:600">Cut '+fmtSec(needed)+'</span>'+extra;
      } else if(t.max===Infinity){
        // Worst tier and we're not in it — already better
        currentCell='<span style="color:var(--text-muted)">—</span>';
      }
    }
    const tr=document.createElement('tr');
    if(isCurrent)tr.className='current-row';
    tr.innerHTML='<td><span class="grade-pill '+t.cls+'">'+t.grade+'</span></td><td style="font-family:var(--mono)">'+maxLabel+'</td><td style="font-family:var(--mono)">'+equivLabel+'</td><td style="font-family:var(--mono)">'+currentCell+'</td><td style="font-family:var(--mono);color:var(--text-dim)">'+weightLabel+'</td>';
    ab.appendChild(tr);
  });
  if(activePeriodKey){
    const p=getPeriod(activePeriodKey);
    const surveys=p.surveys||[];
    const csatSurveys=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const avgCSAT=csatSurveys.length>0?calcCSAT(csatSurveys):null;
    const arResponded=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arYes=surveys.filter(sv=>sv.ar==='yes').length;
    const arPct=arResponded.length>0?arYes/arResponded.length*100:null;
    renderKPIScore(avgCSAT,arPct,currentSec);
  }
}

// Duplicate detection
function findDuplicates(surveys){
  const seen={};
  const dupIds=new Set();
  surveys.forEach((sv,i)=>{
    if(!sv.id||sv.id.trim().toUpperCase()==='NOT_SET')return;
    const key=sv.id;
    if(seen[key]!==undefined){dupIds.add(seen[key]);dupIds.add(i);}
    else seen[key]=i;
  });
  return dupIds;
}

// Fill the blanks of an existing survey from a re-imported copy with the same ID.
// Typical case: the survey was first imported before the customer answered (no
// Yes/No, no ratings); a later export has the response. Only empty fields are
// filled; anything already set (including a manual Edit-modal change) is kept.
// Returns true if anything changed.
function mergeSurveyGaps(existing,incoming){
  if(!existing||!incoming)return false;
  let changed=false;
  const blank=v=>v===null||v===undefined||v===''||(typeof v==='number'&&isNaN(v));
  ['q1','q2'].forEach(k=>{
    if(blank(existing[k])&&!blank(incoming[k])){existing[k]=incoming[k];changed=true;}
  });
  ['agent','queue','channel','date'].forEach(k=>{
    if(blank(existing[k])&&!blank(incoming[k])){existing[k]=incoming[k];changed=true;}
  });
  if(blank(existing.comment)&&!blank(incoming.comment)){existing.comment=incoming.comment;changed=true;}
  if((!existing.ar||existing.ar==='none')&&incoming.ar&&incoming.ar!=='none'){existing.ar=incoming.ar;changed=true;}
  if(changed){
    const c=computeCSAT(existing.q1,existing.q2,existing.date);
    if(blank(existing.csat)||c!==null)existing.csat=c;
  }
  return changed;
}

// Survey import
// ── Survey import: format detection ──────────────────────────────────────
// Two supported paste formats:
//  1. "tsv"   — one row per line, tab-separated:
//               agent⇥queue⇥id⇥channel⇥q1⇥q2⇥comment(AR)⇥csat⇥PASS/FAIL⇥date
//  2. "block" — one *field per line*, multi-line per record, with several
//               fields (q2, comment, csat, PASS/FAIL) optionally omitted
//               entirely rather than left blank. Anchors are the interaction
//               id (I-########) and the trailing timestamp line, e.g.:
//                 jonathan.juarez
//                 kkatipunan
//                 I-25791620
//                 Message
//                 5
//                 PASS
//                 6/18/26 1:52 AM
const SURVEY_ID_RE=/^(I-\d+|NOT_SET)$/i;
// Accepted timestamp lines: "6/18/26 1:52 AM" and the newer "October 19, 2026 10:18:55 AM SGT"
// (long month name, optional seconds, optional trailing time-zone abbreviation).
const SURVEY_DATE_RE=/^(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4},?)\s+\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)(\s+[A-Z]{2,5}([+-]\d{1,2}(:\d{2})?)?)?$/i;
const _SURVEY_MONTHS=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
// Converts any accepted timestamp into the app's internal "M/D/YY h:mm AM" form, so every page that reads a
// survey's date (period detection, daily KPIs, calendar, filters) keeps working. Seconds and the zone label are
// dropped (the time shown is already local time). Unrecognised text is returned unchanged.
function normalizeSurveyDate(str){
  const t=String(str==null?'':str).trim();
  let m=t.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4}),?\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)(?:\s+[A-Z]{2,5}(?:[+-]\d{1,2}(?::\d{2})?)?)?$/i);
  if(m){
    const mi=_SURVEY_MONTHS.indexOf(m[1].slice(0,3).toLowerCase());
    if(mi>=0)return (mi+1)+'/'+parseInt(m[2],10)+'/'+m[3].slice(2)+' '+parseInt(m[4],10)+':'+m[5]+' '+m[6].toUpperCase();
  }
  m=t.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2})(?::\d{2})?\s*(AM|PM)(?:\s+[A-Z]{2,5}(?:[+-]\d{1,2}(?::\d{2})?)?)?$/i);
  if(m)return m[1]+' '+m[2]+' '+m[3].toUpperCase();
  return t;
}
const SURVEY_NUM_RE=/^\d+(\.\d+)?$/;
const SURVEY_PASSFAIL_RE=/^(PASS|FAIL)$/i;

function surveyDetectFormat(raw){
  if(!raw||!raw.trim())return 'tsv';
  const lines=raw.split('\n').filter(l=>l.trim());
  if(!lines.length)return 'tsv';
  // If any line contains a tab, treat as the original one-row-per-line TSV format.
  if(lines.some(l=>l.includes('\t')))return 'tsv';
  // Block format signature: at least one line is a bare interaction ID and
  // at least one line is a bare timestamp, each living alone on its own line.
  const hasId=lines.some(l=>SURVEY_ID_RE.test(l.trim()));
  const hasDate=lines.some(l=>SURVEY_DATE_RE.test(l.trim()));
  return(hasId&&hasDate)?'block':'tsv';
}

// Splits the multi-line block format into per-record arrays of raw lines.
// Each record ends at (and includes) its timestamp line.
function surveyBlockSplitRecords(raw){
  const lines=raw.split('\n');
  // Trim fully-blank lines at the very end only (preserve interior blanks —
  // they're meaningful placeholders for omitted fields).
  while(lines.length&&lines[lines.length-1].trim()==='')lines.pop();
  const records=[];
  let start=0;
  for(let i=0;i<lines.length;i++){
    if(SURVEY_DATE_RE.test(lines[i].trim())){
      records.push(lines.slice(start,i+1));
      start=i+1;
    }
  }
  return records;
}

// Parses one record's raw lines into the common survey row shape.
// Returns null if the record doesn't contain a recognizable id.
function surveyBlockParseRecord(recLines){
  const trimmed=recLines.map(l=>l.trim());
  const idIdx=trimmed.findIndex(l=>SURVEY_ID_RE.test(l));
  if(idIdx===-1||idIdx<2)return null; // need agent+queue before the id
  const agent=trimmed[idIdx-2]||'';
  const queue=trimmed[idIdx-1]||'';
  const id=trimmed[idIdx];
  const channel=(trimmed[idIdx+1]||'').trim();
  const rawDate=trimmed[trimmed.length-1];
  if(!SURVEY_DATE_RE.test(rawDate))return null;
  const date=normalizeSurveyDate(rawDate);
  // Everything between channel and date is the variable middle section:
  // some combination of q1, q2, csat (numeric), comment (free text), and
  // PASS/FAIL — each independently optional, classified by content rather
  // than fixed position since absent fields don't reserve a blank line.
  const middle=trimmed.slice(idIdx+2,trimmed.length-1);
  const nums=[];
  const commentLines=[];
  let passfail='';
  middle.forEach(tok=>{
    if(tok==='')return;
    if(SURVEY_PASSFAIL_RE.test(tok))passfail=tok.toUpperCase();
    else if(SURVEY_NUM_RE.test(tok))nums.push(parseFloat(tok));
    else commentLines.push(tok); // free-text line = comment and/or AR note
  });
  let q1=null,q2=null,csat=null;
  if(nums.length===1){
    // Only one rating answered (knowledge rating) — it still counts toward
    // Survey Count / AR but not CSAT (computeCSAT returns null).
    q1=nums[0];
    csat=computeCSAT(q1,null,date);
  }else if(nums.length>=2){
    // 3 numbers = q1, q2, csat (csat is usually just their average, but we
    // trust the pasted value rather than recomputing it). 2 numbers = q1,q2.
    q1=nums[0];q2=nums[1];
    csat=nums.length>=3?nums[2]:computeCSAT(q1,q2,date);
  }
  // Some pastes carry two free-text lines: the AR yes/no response and a
  // separate general feedback comment. Check every free-text line for the
  // AR answer instead of only the last one, so a later comment line can't
  // silently overwrite an earlier "Yes"/"No" response.
  let ar='none';
  commentLines.forEach(line=>{
    const l=line.toLowerCase();
    if(l.startsWith('yes'))ar='yes';
    else if(l.startsWith('no'))ar='no';
  });
  const comment=commentLines.join(' ');
  return{agent,queue,id,channel,q1,q2,comment,csat,ar,date,passfail};
}

function surveyParseBlockFormat(raw){
  return surveyBlockSplitRecords(raw)
    .map(surveyBlockParseRecord)
    .filter(r=>r!==null);
}

// ── Survey import: auto-detect date / period from pasted rows ───────────────
// Works for either paste format by collecting the row objects first, then
// reading each row's `.date` field — so period detection stays format-agnostic.
function surveyExtractRows(raw){
  if(!raw||!raw.trim())return [];
  if(surveyDetectFormat(raw)==='block')return surveyParseBlockFormat(raw);
  const lines=raw.split('\n').filter(l=>l.trim());
  return lines.map(line=>{
    const cols=line.split('\t');
    return{id:(cols[2]||'').trim(),date:normalizeSurveyDate((cols[9]||cols[8]||'').trim())};
  });
}

function surveyDetectPeriod(raw){
  // Returns {month,year,periodKey,label,count} for the dominant month/year in pasted data, or null
  if(!raw||!raw.trim())return null;
  const rows=surveyExtractRows(raw);
  const tally={};
  rows.forEach(row=>{
    const dateStr=(row.date||'').trim();
    if(!dateStr)return;
    const dk=parseDateKey(dateStr);
    if(!dk)return;
    const pk=dk.slice(0,7); // "YYYY-MM"
    tally[pk]=(tally[pk]||0)+1;
  });
  if(!Object.keys(tally).length)return null;
  // Pick the period with the most rows
  const best=Object.entries(tally).sort((a,b)=>b[1]-a[1])[0];
  if(!best)return null;
  const [pk,count]=best;
  const [y,m]=pk.split('-').map(Number);
  return{month:m,year:y,periodKey:pk,label:MONTHS[m-1]+' '+y,count};
}

function surveyAutoDetectDate(){
  const raw=document.getElementById('survey-input').value;
  const hintBox=document.getElementById('survey-date-detect-hint');
  const hintText=document.getElementById('survey-date-detect-text');
  const detected=surveyDetectPeriod(raw);
  if(detected){
    hintBox.style.display='flex';
    const isCurrent=detected.periodKey===activePeriodKey;
    if(isCurrent){
      hintText.textContent=`📅 Detected period: ${detected.label} (${detected.count} row${detected.count!==1?'s':''}) — matches active period ✓`;
      hintBox.style.borderColor='rgba(34,197,94,0.35)';
      hintBox.style.background='rgba(34,197,94,0.07)';
      hintBox.style.color='var(--green)';
    }else{
      hintText.textContent=`📅 Detected period: ${detected.label} (${detected.count} row${detected.count!==1?'s':''}) — will auto-switch period on import`;
      hintBox.style.borderColor='rgba(59,130,246,0.25)';
      hintBox.style.background='rgba(59,130,246,0.08)';
      hintBox.style.color='var(--accent)';
    }
  }else{
    hintBox.style.display='none';
    hintText.textContent='';
  }
}

function parseSurvey(){
  const raw=document.getElementById('survey-input').value.trim();
  if(!raw){setStatus('Nothing to import.','');return;}
  const format=surveyDetectFormat(raw);
  let added=0,skipped=0,dupsFound=0;

  // ── Auto-detect period from dates in pasted data ──────────────────────────
  // Period switch is deferred until after rows are committed, so an accidental
  // paste from a different month cannot silently change the active period before
  // any data is written.
  const detected=surveyDetectPeriod(raw);
  const targetPeriodKey=detected?detected.periodKey:activePeriodKey;
  const p=getPeriod(targetPeriodKey);
  let updated=0;
  const existingById=new Map();
  p.surveys.forEach(sv=>{
    if(sv.id&&sv.id.trim().toUpperCase()!=='NOT_SET'&&!existingById.has(sv.id))existingById.set(sv.id,sv);
  });
  const existingIds={has:k=>existingById.has(k),add:()=>{}};

  function commitRow(row){
    const{agent,queue,id,channel,q1,q2,comment,csat,ar,date}=row;
    const dupKey=id;
    const isNotSet=!id||id.trim().toUpperCase()==='NOT_SET';
    if(!isNotSet&&existingIds.has(dupKey)){
      // Same ID already imported: fill in anything that was blank (e.g. a Yes/No
      // that arrived later) instead of dropping the new row.
      if(mergeSurveyGaps(existingById.get(dupKey),row)){updated++;}
      else{dupsFound++;skipped++;}
      return;
    }
    const ns={agent,queue,id,channel,q1,q2,comment,csat,ar,date};
    if(!isNotSet)existingById.set(dupKey,ns);
    p.surveys.push(ns);
    added++;
  }

  if(format==='block'){
    const rows=surveyParseBlockFormat(raw);
    const totalBlocks=surveyBlockSplitRecords(raw).length;
    skipped+=Math.max(0,totalBlocks-rows.length); // unparseable blocks
    rows.forEach(commitRow);
  }else{
    const lines=raw.split('\n').filter(l=>l.trim());
    lines.forEach(line=>{
      const cols=line.split('\t');
      if(cols.length<3){skipped++;return;}
      const q1Raw=(cols[4]||'').trim();
      const q2Raw=(cols[5]||'').trim();
      const q1=q1Raw!==''?parseFloat(q1Raw):null;
      const q2=q2Raw!==''?parseFloat(q2Raw):null;
      const date=normalizeSurveyDate((cols[9]||cols[8]||'').trim());
      const csat=computeCSAT(q1,q2,date);
      const comment=(cols[6]||'').trim();
      let ar='none';
      if(comment.toLowerCase().startsWith('yes'))ar='yes';
      else if(comment.toLowerCase().startsWith('no'))ar='no';
      const id=(cols[2]||'').trim();
      commitRow({agent:(cols[0]||'').trim(),queue:(cols[1]||'').trim(),id,channel:(cols[3]||'').trim(),q1,q2,comment,csat,ar,date});
    });
  }

  autoMergeDuplicateAgentNames();
  autoMigratePersonalAHTLog();
  saveState();
  // ── Apply period switch now that rows have been committed ─────────────────
  if(detected&&detected.periodKey!==activePeriodKey){
    setActivePeriod(detected.month,detected.year);
  }
  document.getElementById('survey-input').value='';
  // Hide hint after import
  document.getElementById('survey-date-detect-hint').style.display='none';
  let msg=added+' row'+(added!==1?'s':'')+' imported'+(updated?' · '+updated+' updated with new responses':'')+(skipped?' · '+skipped+' skipped':'');
  if(dupsFound>0)msg+=` · ${dupsFound} duplicate${dupsFound!==1?'s':''} skipped`;
  if(detected)msg+=` · period auto-set to ${detected.label}`;
  setStatus(msg,(added>0||updated>0)?'success':'');
  renderDashboard();
  renderSurveyTable();
  if(typeof refreshWdayBadge==='function')refreshWdayBadge();
  showToast(added+' survey'+(added!==1?'s':'')+' added'+(updated?' · '+updated+' updated':''));
}

function renderSurveyTable(){
  lastCheckedIdx=null;
  _selectedSurveyIdx=null;
  const surveys=getPeriod(activePeriodKey).surveys;
  const tbody=document.getElementById('survey-tbody');
  tbody.innerHTML='';
  const panel=document.getElementById('survey-table-panel');
  if(surveys.length===0){panel.style.display='none';updateBulkBar();renderAgentPillRow();return;}
  panel.style.display='block';
  document.getElementById('survey-record-count').textContent=surveys.length+' record'+(surveys.length!==1?'s':'');

  // Duplicate detection
  const dupIdxs=findDuplicates(surveys);
  const dupCount=new Set([...dupIdxs]).size;
  const dupBadge=document.getElementById('dup-count-badge');
  if(dupCount>0){
    dupBadge.style.display='inline-flex';
    dupBadge.innerHTML=`<span style="background:rgba(245,158,11,0.15);color:#fbbf24;border-radius:20px;padding:2px 8px;font-size:11px">⚠ ${dupCount} duplicate row${dupCount!==1?'s':''}</span>`;
  } else {
    dupBadge.style.display='none';
  }

  surveys.forEach((sv,i)=>{
    const arCls=sv.ar==='yes'?'ar-yes':sv.ar==='no'?'ar-no':'ar-none';
    const arTxt=sv.ar==='yes'?'YES':sv.ar==='no'?'NO':'—';
    const fmtScore=(v)=>{
      if(v===null||v===undefined||isNaN(v))return '<span style="color:var(--text-muted)">—</span>';
      const s=v.toFixed(2);
      const red=v<5?'color:#ef4444;font-weight:600':'';
      return '<span style="'+red+'">'+s+'</span>';
    };
    const tr=document.createElement('tr');
    if(dupIdxs.has(i))tr.className='dup-row';
    tr.dataset.idx=i;
    tr.style.cursor='pointer';
    // Use mousedown/mouseup to distinguish drag (text select) from click (row select)
    let _trDragging=false;
    tr.addEventListener('mousedown',()=>{_trDragging=false;});
    tr.addEventListener('mousemove',()=>{_trDragging=true;});
    tr.onclick=(e)=>{
      if(_trDragging)return;
      if(e.target.closest('button,input'))return;
      surveySelectRow(i,tr,e.shiftKey);
    };
    tr.innerHTML=`
      <td class="check-col"><input type="checkbox" class="row-cb" data-idx="${i}" data-action="handleRowCb(this,${i},event)" title="Click · Shift+click to select range"></td>
      <td>${i+1}</td>
      <td>${escHtml(sv.agent)}</td>
      <td>${escHtml(sv.id)}</td>
      <td>${escHtml(sv.channel)}</td>
      <td>${fmtScore(sv.q1)}</td>
      <td>${fmtScore(sv.q2)}</td>
      <td>${fmtScore(sv.csat)}</td>
      <td class="${arCls}">${arTxt}</td>
      <td>${escHtml(sv.date)}</td>
      <td style="display:flex;gap:4px;align-items:center">
        <button class="icon-btn" title="Edit" data-action="openEditRow(${i})">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn danger" title="Delete" data-action="deleteRow(${i})">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
  updateBulkBar();
  renderAgentPillRow();
}

let _selectedSurveyIdx=null;
let _anchorSurveyIdx=null; // anchor for shift+click range

function surveySelectRow(idx,tr,shiftKey){
  const allRows=[...document.querySelectorAll('#survey-tbody tr[data-idx]')];

  if(shiftKey&&_anchorSurveyIdx!==null){
    // Range select: find anchor and current row positions in DOM order
    const anchorRow=allRows.find(r=>parseInt(r.dataset.idx)===_anchorSurveyIdx);
    const anchorPos=anchorRow?allRows.indexOf(anchorRow):-1;
    const currentPos=allRows.indexOf(tr);
    if(anchorPos!==-1){
      const start=Math.min(anchorPos,currentPos);
      const end=Math.max(anchorPos,currentPos);
      allRows.forEach((r,pos)=>{
        const cb=r.querySelector('.row-cb');
        if(pos>=start&&pos<=end){
          r.classList.add('survey-row-selected');
          if(cb)cb.checked=true;
        }
      });
      _selectedSurveyIdx=idx;
      updateBulkBar();
      return;
    }
  }

  // Normal click: toggle this row, keep others
  const cb=tr.querySelector('.row-cb');
  const wasChecked=cb?cb.checked:false;

  // Clear highlight from all rows first (re-applied below per checked state)
  allRows.forEach(r=>r.classList.remove('survey-row-selected'));

  if(wasChecked&&_selectedSurveyIdx===idx){
    if(cb)cb.checked=false;
    _selectedSurveyIdx=null;
    _anchorSurveyIdx=null;
  } else {
    if(cb)cb.checked=true;
    _selectedSurveyIdx=idx;
    _anchorSurveyIdx=idx;
    tr.classList.add('survey-row-selected');
  }

  // Re-highlight all still-checked rows
  allRows.forEach(r=>{
    const c=r.querySelector('.row-cb');
    if(c&&c.checked)r.classList.add('survey-row-selected');
  });

  lastCheckedIdx=idx;
  updateBulkBar();
}

// Keyboard: Delete = delete selected row, Escape = deselect ALL (survey + AHT)
document.addEventListener('keydown',function(e){
  const active=document.activeElement;
  const inputFocused=active&&(active.tagName==='INPUT'||active.tagName==='TEXTAREA'||active.tagName==='SELECT');
  const surveyPage=document.getElementById('page-survey');
  const surveyVisible=surveyPage&&surveyPage.style.display!=='none';
  if(!surveyVisible)return;

  if(e.key==='Escape'&&!inputFocused){
    // Clear survey rows
    document.querySelectorAll('#survey-tbody tr[data-idx]').forEach(r=>{
      r.classList.remove('survey-row-selected');
      const cb=r.querySelector('.row-cb');
      if(cb)cb.checked=false;
    });
    _selectedSurveyIdx=null;_anchorSurveyIdx=null;lastCheckedIdx=null;
    updateBulkBar();
    // Clear AHT rows
    document.querySelectorAll('#aht-imported-tbody tr[data-dk]').forEach(r=>{
      r.classList.remove('survey-row-selected');
      r.style.background='';
      const cb=r.querySelector('.aht-row-cb');
      if(cb){cb.checked=false;cb.style.opacity='0';cb.style.pointerEvents='none';}
    });
    _ahtSelIdx=null;_ahtAnchorDk=null;_ahtLastCbDk=null;
    const ahtSelAll=document.getElementById('aht-sel-all');
    if(ahtSelAll){ahtSelAll.checked=false;ahtSelAll.indeterminate=false;ahtSelAll.style.opacity='0';ahtSelAll.style.pointerEvents='none';}
    const ahtBar=document.getElementById('aht-bulk-bar');
    if(ahtBar)ahtBar.style.display='none';
    return;
  }

  if((e.key==='Delete'||e.key==='Backspace')&&!inputFocused){
    // Survey rows
    const surveyChecked=[...document.querySelectorAll('.row-cb:checked')];
    // AHT rows
    const ahtChecked=[...document.querySelectorAll('.aht-row-cb:checked')];
    if(surveyChecked.length===0&&ahtChecked.length===0)return;
    e.preventDefault();
    if(ahtChecked.length>0){ahtBulkDelete();return;}
    if(surveyChecked.length===1){
      const idx=parseInt(surveyChecked[0].dataset.idx);
      _selectedSurveyIdx=null;_anchorSurveyIdx=null;
      deleteRow(idx);
    } else {
      bulkDelete();
      _selectedSurveyIdx=null;_anchorSurveyIdx=null;
    }
  }
});

function handleRowCb(cb,idx,e){
  if(e.shiftKey&&lastCheckedIdx!==null){
    const allCbs=[...document.querySelectorAll('.row-cb')];
    const clickedPos=allCbs.indexOf(cb);
    const anchorEl=allCbs.find(c=>parseInt(c.dataset.idx)===lastCheckedIdx);
    const anchorPos=anchorEl?allCbs.indexOf(anchorEl):-1;
    if(anchorPos!==-1){
      const start=Math.min(clickedPos,anchorPos);
      const end=Math.max(clickedPos,anchorPos);
      allCbs.forEach((c,pos)=>{if(pos>=start&&pos<=end)c.checked=cb.checked;});
    }
  }
  // Sync row highlight to this checkbox state
  const tr=cb.closest('tr');
  if(tr){
    if(cb.checked){tr.classList.add('survey-row-selected');_selectedSurveyIdx=idx;}
    else{tr.classList.remove('survey-row-selected');if(_selectedSurveyIdx===idx)_selectedSurveyIdx=null;}
  }
  lastCheckedIdx=idx;
  updateBulkBar();
}

function updateBulkBar(){
  const cbs=document.querySelectorAll('.row-cb:checked');
  const btn=document.getElementById('bulk-delete-btn');
  if(btn)btn.style.display=cbs.length>0?'inline-flex':'none';
  // Update select-all state
  const all=document.querySelectorAll('.row-cb');
  const selectAll=document.getElementById('select-all-cb');
  if(selectAll&&all.length>0){
    selectAll.indeterminate=cbs.length>0&&cbs.length<all.length;
    // Show select-all header checkbox only when any row is checked
    selectAll.style.opacity=cbs.length>0?'1':'0';
    selectAll.style.pointerEvents=cbs.length>0?'auto':'none';
  }
}

function toggleSelectAll(checked){
  lastCheckedIdx=null;
  document.querySelectorAll('.row-cb').forEach(cb=>cb.checked=checked);
  updateBulkBar();
}

function bulkDelete(){
  const cbs=[...document.querySelectorAll('.row-cb:checked')];
  if(cbs.length===0)return;
  if(!confirm(`Delete ${cbs.length} selected row${cbs.length!==1?'s':''}?`))return;
  const idxs=new Set(cbs.map(cb=>parseInt(cb.dataset.idx)));
  const p=getPeriod(activePeriodKey);
  const backup=[...p.surveys];
  p.surveys=p.surveys.filter((_,i)=>!idxs.has(i));
  saveState();renderDashboard();renderSurveyTable();
  undoState.surveys=backup;undoState.key=activePeriodKey;
  showUndoToast(idxs.size);
}

function deleteRow(i){
  const p=getPeriod(activePeriodKey);
  const backup=[...p.surveys];
  p.surveys.splice(i,1);
  saveState();renderDashboard();renderSurveyTable();
  undoState.surveys=backup;undoState.key=activePeriodKey;
  showUndoToast(1);
}

// Edit row
function openEditRow(i){
  editingRowIdx=i;
  const sv=getPeriod(activePeriodKey).surveys[i];
  document.getElementById('edit-agent').value=sv.agent||'';
  document.getElementById('edit-id').value=sv.id||'';
  document.getElementById('edit-channel').value=sv.channel||'';
  document.getElementById('edit-q1').value=sv.q1!==null?sv.q1:'';
  document.getElementById('edit-q2').value=sv.q2!==null?sv.q2:'';
  document.getElementById('edit-comment').value=sv.comment||'';
  document.getElementById('edit-ar').value=sv.ar||'none';
  document.getElementById('edit-date').value=sv.date||'';
  document.getElementById('edit-row-modal').classList.add('open');
}
function closeEditModal(){document.getElementById('edit-row-modal').classList.remove('open');editingRowIdx=null;}
function saveEditRow(){
  if(editingRowIdx===null)return;
  const p=getPeriod(activePeriodKey);
  const sv=p.surveys[editingRowIdx];
  sv.agent=document.getElementById('edit-agent').value.trim();
  sv.id=document.getElementById('edit-id').value.trim();
  sv.channel=document.getElementById('edit-channel').value.trim();
  const q1=parseFloat(document.getElementById('edit-q1').value);
  const q2=parseFloat(document.getElementById('edit-q2').value);
  sv.q1=isNaN(q1)?null:q1;
  sv.q2=isNaN(q2)?null:q2;
  sv.comment=document.getElementById('edit-comment').value.trim();
  sv.ar=document.getElementById('edit-ar').value;
  sv.date=document.getElementById('edit-date').value.trim();
  sv.csat=computeCSAT(sv.q1,sv.q2,sv.date);
  saveState();renderDashboard();renderSurveyTable();closeEditModal();
  showToast('Row updated');
}

// Export CSV
function exportCSV(){
  const surveys=getPeriod(activePeriodKey).surveys;
  if(!surveys.length){showToast('No data to export');return;}
  const header='#,Agent,Interaction,Channel,Knowledge rating,Courteous rating,CSAT,AR,Date\n';
  const rows=surveys.map((sv,i)=>[i+1,sv.agent,sv.id,sv.channel,sv.q1??'',sv.q2??'',sv.csat!==null?sv.csat.toFixed(2):'',sv.ar,sv.date].join(',')).join('\n');
  const blob=new Blob([header+rows],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  const [y,m]=activePeriodKey.split('-');
  a.download=`ProgressHub_${MONTHS[parseInt(m)-1]}_${y}.csv`;
  a.click();
  showToast('CSV exported');
}

// Export CSV — AHT & Chat Count (the daily entries shown in the
// "AHT & Chat Count" imported-data table on the Survey page)
function exportAHTCSV(){
  const p=getPeriod(activePeriodKey);
  const daily=p.dailyAHT||{};
  const entries=Object.entries(daily)
    .map(([dk,v])=>({dk,...normAHTEntry(v)}))
    .filter(e=>e.aht>0)
    .sort((a,b)=>a.dk.localeCompare(b.dk));
  if(!entries.length){showToast('No AHT data to export');return;}
  const header='#,Date,Chats,AHT (seconds),AHT,Grade\n';
  const t=getThresholdsForPeriod(activePeriodKey);
  const rows=entries.map((e,i)=>{
    const g=gradeAHTWith(e.aht,t.aht);
    return [i+1,e.dk,e.count||0,e.aht,fmtSec(e.aht),g.grade].join(',');
  }).join('\n');
  const blob=new Blob([header+rows],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  const [y,m]=activePeriodKey.split('-');
  a.download=`ProgressHub_AHT_${MONTHS[parseInt(m)-1]}_${y}.csv`;
  a.click();
  showToast('AHT & Chat Count CSV exported');
}

// Build the export payload for a given set of period keys.
// Passing no keys (or null) exports every period — that's the full-backup path.
// ── Team members available to export ───────────────────────────────────────
// Everyone with surveys or per-member AHT/chat data in any period. '' = surveys with no member name.
function getExportMembers(){
  const names=new Map(); // raw name -> {surveys, ahtDays}
  let unnamed=0;
  const bump=(n,field,by)=>{if(!names.has(n))names.set(n,{surveys:0,ahtDays:0});names.get(n)[field]+=by;};
  Object.keys(state).forEach(k=>{
    const p=state[k];if(!p)return;
    (p.surveys||[]).forEach(sv=>{const n=(sv.agent||'').trim();if(n)bump(n,'surveys',1);else unnamed++;});
    Object.keys(p.dailyAHTByMember||{}).forEach(n=>{const c=getMemberAHTEntries(p,n).length;if(c)bump(n,'ahtDays',c);});
    Object.keys(p.monthlyAHTByMember||{}).forEach(n=>{const v=p.monthlyAHTByMember[n];if(v&&v.aht>0&&!names.has(n))bump(n,'ahtDays',0);});
  });
  // Manually added members (even ones with no data yet) can be ticked too
  try{getManualMembersAll().forEach(n=>{if(!names.has(n))names.set(n,{surveys:0,ahtDays:0});});}catch(e){}
  const list=[...names.entries()].map(([raw,v])=>({raw,label:prettifyAgentName(raw),surveys:v.surveys,ahtDays:v.ahtDays}))
    .sort((x,y)=>x.label.localeCompare(y.label));
  if(unnamed)list.push({raw:'',label:'Unnamed (surveys with no member name)',surveys:unnamed,ahtDays:0});
  return list;
}

// Build the export payload. periodKeys: which months (none = all). members: array of raw member
// names to export ('' = surveys without a name), or null/undefined for everyone (the full backup).
// A member export carries EVERYTHING stored for those members — surveys, daily + monthly AHT/chat,
// their working-days calendar, their team-scorecard extra-metric scores, and their avatar / photo —
// but none of your own notes, moods, working days, custom metrics or global settings.
function buildExportData(periodKeys,members){
  const memberMode=Array.isArray(members);
  const memberSet=memberMode?new Set(members):null;
  const keys=(periodKeys&&periodKeys.length)
    ?periodKeys.filter(k=>state[k]).sort()
    :Object.keys(state).sort();
  // A full export also carries months that only have a working-days calendar saved
  // (team or per-member) and no survey/AHT data, so those calendars aren't dropped.
  if(!(periodKeys&&periodKeys.length)){
    try{
      const seen=new Set(keys);
      for(let i=0;i<localStorage.length;i++){
        const lk=localStorage.key(i);
        const mm=lk&&lk.match(/^wdays-(?:member-.+-)?(\d{4}-(?:0[1-9]|1[0-2]))$/);
        if(!mm||seen.has(mm[1]))continue;
        let arr=[];try{arr=JSON.parse(localStorage.getItem(lk)||'[]');}catch(e){}
        if(Array.isArray(arr)&&arr.length){seen.add(mm[1]);keys.push(mm[1]);}
      }
      keys.sort();
    }catch(e){}
  }
  const exportData={
    exported:new Date().toISOString(),
    version:'3.10.0',
    partial:((periodKeys&&periodKeys.length)||memberMode)?true:false,
    periods:{}
  };
  let scx=null;
  if(memberMode){
    exportData.members=members.map(n=>n===''?'(unnamed)':n);
    // Avatar + uploaded photo (keyed the same way the app keys them: prettified, lower-cased name)
    const prof={};
    try{
      const av=_avMap(),ph=_photoMap();
      members.filter(n=>n!=='').forEach(n=>{
        const k=_avKey(n),e={};
        if(typeof av[k]==='string')e.avatar=av[k];
        if(typeof ph[k]==='string')e.photo=ph[k];
        if(Object.keys(e).length)prof[n]=e;
      });
    }catch(e){}
    if(Object.keys(prof).length)exportData.memberProfiles=prof;
    try{
      const rm={};const all=_readRosterMap();
      keys.forEach(k=>{const l=(all[k]||[]).filter(n=>memberSet.has(n));if(l.length)rm[k]=l;});
      if(Object.keys(rm).length)exportData.manualMembersByPeriod=rm;
    }catch(e){}
    try{scx=getScExtra();}catch(e){scx=null;}
  }else{
    // Collect global settings
    let kpiWeights=null,customScoring=null;
    try{const tv=localStorage.getItem('kpi_thresholds_v1');if(tv){const tp=JSON.parse(tv);kpiWeights=tp.weights||null;customScoring=tp.custom||null;}}catch(e){}
    let dailyTarget=0;
    try{dailyTarget=parseInt(localStorage.getItem('daily-target')||'0')||0;}catch(e){}
    const customMetricDefs=JSON.parse(JSON.stringify(CUSTOM_METRIC_DEFS||[]));
    const allMonthly=loadMonthlyThresholds()||{};
    // For a partial export, only carry the per-month overrides of the chosen months
    const monthlyThresholds=(periodKeys&&periodKeys.length)
      ?Object.keys(allMonthly).filter(k=>keys.includes(k)).reduce((o,k)=>{o[k]=allMonthly[k];return o;},{})
      :allMonthly;
    exportData.thresholds={csat:CSAT_THRESHOLDS,ar:AR_THRESHOLDS,aht:AHT_THRESHOLDS};
    exportData.kpiWeights=kpiWeights;
    exportData.customScoring=customScoring;
    exportData.monthlyThresholds=monthlyThresholds;
    exportData.dailyTarget=dailyTarget;
    exportData.customMetricDefs=customMetricDefs;
    exportData.stockScope=Object.assign({},STOCK_SCOPE);
    try{
      const rm={};const all=_readRosterMap();
      Object.keys(all).forEach(k=>{if((periodKeys&&periodKeys.length)&&!keys.includes(k))return;if(Array.isArray(all[k])&&all[k].length)rm[k]=all[k].slice();});
      if(Object.keys(rm).length)exportData.manualMembersByPeriod=rm;
    }catch(e){}
    // Avatars + uploaded photos for every member and for the team itself (the maps are
    // keyed by prettified lower-case name; "__team__" is the team's own avatar/photo).
    try{
      const av=_avMap(),ph=_photoMap();
      if(Object.keys(av).length||Object.keys(ph).length)exportData.avatarData={avatars:av,photos:ph};
    }catch(e){}
    // Team View + scorecard + display settings (the app's own storage keys, copied as-is)
    try{
      const st={};
      ['kpi_team_view_name_v1','kpi_team_thresholds_v1','kpi_scorecard_cfg_v1','kpi_theme','kpi_theme_auto','kpi_show_ytd','kpi_show_reflection',
       'kpi_show_forecast','kpi_show_dailyavg','kpi_fcwindow','kpi_apcollapsed','kpi_dlcollapsed','kpi_monthsummary_tab_v1'
      ].forEach(k=>{const v=localStorage.getItem(k);if(v!==null&&v!==undefined)st[k]=v;});
      if(Object.keys(st).length)exportData.appSettings=st;
    }catch(e){}
    // Opt-in (Security > "Include password in full backups"): the password hash, full backups only
    try{
      if(!(periodKeys&&periodKeys.length)&&localStorage.getItem('kpi_sec_in_backup')==='1'&&window.kpiSecurityIsEnabled&&window.kpiSecurityIsEnabled()){
        const h=localStorage.getItem('kpi_sec_hash');
        if(h)exportData.security={enabled:true,hash:h};
      }
    }catch(e){}
    // Team-scorecard extra metrics + typed-in scores (only the chosen months' scores on a partial export)
    try{
      const x=getScExtra();
      const vals=(periodKeys&&periodKeys.length)
        ?Object.keys(x.values||{}).filter(k=>keys.includes(k)).reduce((o,k)=>{o[k]=x.values[k];return o;},{})
        :(x.values||{});
      if((x.metrics||[]).length||Object.keys(vals).length)exportData.scorecardExtra={metrics:x.metrics||[],values:vals};
    }catch(e){}
  }
  keys.forEach(key=>{
    const [y,m]=key.split('-');
    const p=state[key]||{surveys:[]};
    const label=periodLabel(parseInt(m),parseInt(y));
    if(memberMode){
      const surveys=(p.surveys||[]).filter(sv=>memberSet.has((sv.agent||'').trim()));
      const daily={},monthly={};
      Object.keys(p.dailyAHTByMember||{}).forEach(n=>{if(memberSet.has(n))daily[n]=JSON.parse(JSON.stringify(p.dailyAHTByMember[n]));});
      Object.keys(p.monthlyAHTByMember||{}).forEach(n=>{if(memberSet.has(n))monthly[n]=JSON.parse(JSON.stringify(p.monthlyAHTByMember[n]));});
      // Each member's own working-days calendar for this month
      const wd={};
      members.filter(n=>n!=='').forEach(n=>{
        try{const v=localStorage.getItem('wdays-member-'+encodeURIComponent(n)+'-'+y+'-'+m);const arr=v?JSON.parse(v):[];if(Array.isArray(arr)&&arr.length)wd[n]=arr;}catch(e){}
      });
      // Team-scorecard extra-metric scores typed in for these members this month
      const scv={};
      const pv=scx&&scx.values&&scx.values[key];
      if(pv)Object.keys(pv).forEach(scope=>Object.keys(pv[scope]||{}).forEach(mid=>{
        Object.keys(pv[scope][mid]||{}).forEach(mem=>{
          if(!memberSet.has(mem))return;
          const v=pv[scope][mid][mem];
          if(v===undefined||v===null)return;
          ((scv[scope]=scv[scope]||{})[mid]=scv[scope][mid]||{})[mem]=v;
        });
      }));
      if(!surveys.length&&!Object.keys(daily).length&&!Object.keys(monthly).length&&!Object.keys(wd).length&&!Object.keys(scv).length)return; // nothing for these members this month
      const ent={label,surveys,dailyAHTByMember:daily,monthlyAHTByMember:monthly};
      if(Object.keys(wd).length)ent.memberWorkingDays=wd;
      if(Object.keys(scv).length){
        ent.scorecardValues=scv;
        const used=exportData.scorecardMetrics=exportData.scorecardMetrics||{};
        Object.keys(scv).forEach(scope=>Object.keys(scv[scope]).forEach(mid=>{
          const def=(scx.metrics||[]).find(q=>q.id===mid);
          if(def&&!used[mid])used[mid]=JSON.parse(JSON.stringify(def));
        }));
      }
      exportData.periods[key]=ent;
      return;
    }
    const surveys=p.surveys||[];
    const csatSurveys=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const avgCSAT=csatSurveys.length>0?calcCSAT(csatSurveys):null;
    const arResponded=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arYes=surveys.filter(sv=>sv.ar==='yes').length;
    const arPct=arResponded.length>0?arYes/arResponded.length*100:null;
    const ahtSec=p.aht||0;
    const wc=weightCSAT(avgCSAT),wa=weightAR(arPct),wh=weightAHT(ahtSec);
    const kpi=(avgCSAT!==null||arPct!==null||ahtSec>0)?wc+wa+wh+customMetricsPoints(key):null;
    // Load working days for this period from localStorage
    let wdays=[];
    try{const wv=localStorage.getItem('wdays-'+y+'-'+m);wdays=wv?JSON.parse(wv):[];}catch(e){}
    // Load per-day moods from localStorage
    let moods={};
    try{const mv=localStorage.getItem('moods-'+key);moods=mv?JSON.parse(mv):{};}catch(e){}
    // Every member's own working-days calendar for this month
    const memberWD={};
    try{
      const suffix='-'+y+'-'+m;
      for(let i=0;i<localStorage.length;i++){
        const lk=localStorage.key(i);
        if(!lk||!lk.startsWith('wdays-member-')||!lk.endsWith(suffix))continue;
        const agent=decodeURIComponent(lk.slice('wdays-member-'.length,lk.length-suffix.length));
        const arr=JSON.parse(localStorage.getItem(lk)||'[]');
        if(Array.isArray(arr)&&arr.length)memberWD[agent]=arr;
      }
    }catch(e){}
    exportData.periods[key]={
      label,
      surveys:surveys,
      aht_seconds:ahtSec,
      monthlyAHT:p.monthlyAHT||0,
      annotations:p.annotations||{},
      dailyAHT:p.dailyAHT||{},
      dailyAHTByMember:p.dailyAHTByMember||{},
      monthlyAHTByMember:p.monthlyAHTByMember||{},
      customMetrics:p.customMetrics||{},
      workingDays:wdays,
      memberWorkingDays:memberWD,
      moods:moods,
      computed:{
        avgCSAT:avgCSAT!==null?parseFloat(avgCSAT.toFixed(4)):null,
        arPct:arPct!==null?parseFloat(arPct.toFixed(4)):null,
        kpi:kpi!==null?parseFloat(kpi.toFixed(4)):null,
        csatGrade:avgCSAT!==null?gradeCSAT(avgCSAT).grade:null,
        arGrade:arPct!==null?gradeAR(arPct).grade:null,
        ahtGrade:ahtSec>0?gradeAHT(ahtSec).grade:null,
        surveyCount:surveys.length
      }
    };
  });
  return exportData;
}

function downloadExportData(exportData,filename){
  const blob=new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=filename;
  a.click();
}

// Full backup — every period. Unchanged behaviour.
function exportJSON(){
  downloadExportData(buildExportData(null),`ProgressHub_export_${localDateKey(new Date())}.json`);
  showToast('JSON exported — all periods');
}

// ── Export JSON for selected month(s) ──────────────────────────────────────
function openExportMonthModal(){
  const keys=Object.keys(state).sort().reverse();
  const listEl=document.getElementById('export-month-list');
  if(!keys.length){
    showToast('No periods to export');
    return;
  }
  listEl.innerHTML=keys.map(key=>{
    const [y,m]=key.split('-');
    const p=state[key];
    const count=(p.surveys||[]).length;
    const ahtSec=p.aht||0;
    const checked=key===activePeriodKey?'checked':'';
    return `<label class="export-month-row">
      <input type="checkbox" class="export-month-cb" value="${escHtml(key)}" ${checked}>
      <span class="export-month-name">${escHtml(periodLabel(parseInt(m),parseInt(y)))}</span>
      <span class="export-month-meta">${count} survey${count!==1?'s':''}${ahtSec>0?' · AHT '+fmtSec(ahtSec):''}</span>
    </label>`;
  }).join('');
  const memEl=document.getElementById('export-member-list');
  if(memEl){
    const mem=getExportMembers();
    memEl.innerHTML=mem.length?mem.map(mb=>`<label class="export-month-row">
      <input type="checkbox" class="export-member-cb" value="${escHtml(mb.raw)}" checked>
      <span class="export-month-name">${escHtml(mb.label)}</span>
      <span class="export-month-meta">${mb.surveys} survey${mb.surveys!==1?'s':''}${mb.ahtDays?' · '+mb.ahtDays+' AHT day'+(mb.ahtDays!==1?'s':''):''}</span>
    </label>`).join(''):'<div style="font-size:12px;color:var(--text-muted);padding:8px">No team members found yet.</div>';
  }
  updateExportMonthCount();
  document.getElementById('export-month-modal').classList.add('open');
}

function closeExportMonthModal(){
  document.getElementById('export-month-modal').classList.remove('open');
}

function getExportMonthSelection(){
  return Array.from(document.querySelectorAll('.export-month-cb'))
    .filter(cb=>cb.checked).map(cb=>cb.value);
}

function updateExportMonthCount(){
  const sel=getExportMonthSelection();
  const total=sel.reduce((a,k)=>a+((state[k]&&state[k].surveys)?state[k].surveys.length:0),0);
  const el=document.getElementById('export-month-count');
  if(el){
    el.textContent=sel.length
      ?`${sel.length} month${sel.length!==1?'s':''} selected · ${total} survey${total!==1?'s':''}`
      :'No months selected';
  }
  const btn=document.getElementById('export-month-confirm-btn');
  const mems=Array.from(document.querySelectorAll('.export-member-cb'));
  const memSel=mems.filter(cb=>cb.checked).length;
  const memEl=document.getElementById('export-member-count');
  if(memEl)memEl.textContent=!mems.length?'':(memSel===mems.length?'All members':(memSel?memSel+' of '+mems.length+' members':'No members selected'));
  if(btn)btn.disabled=sel.length===0||(mems.length>0&&memSel===0);
}

function toggleAllExportMonths(on){
  document.querySelectorAll('.export-month-cb').forEach(cb=>{cb.checked=on;});
  updateExportMonthCount();
}

function toggleAllExportMembers(on){
  document.querySelectorAll('.export-member-cb').forEach(cb=>{cb.checked=on;});
  updateExportMonthCount();
}
// null = everyone (full data); otherwise the raw names ticked
function getExportMemberSelection(){
  const cbs=Array.from(document.querySelectorAll('.export-member-cb'));
  if(!cbs.length||cbs.every(cb=>cb.checked))return null;
  return cbs.filter(cb=>cb.checked).map(cb=>cb.value);
}
function confirmExportMonths(){
  const sel=getExportMonthSelection();
  if(!sel.length){showToast('Pick at least one month');return;}
  const members=getExportMemberSelection();
  if(members&&!members.length){showToast('Pick at least one team member');return;}
  const data=buildExportData(sel,members);
  if(!Object.keys(data.periods).length&&!(data.manualMembersByPeriod&&Object.keys(data.manualMembersByPeriod).length)){showToast('No data for those members in the chosen months');return;}
  let name;
  if(sel.length===1){
    const [y,m]=sel[0].split('-');
    name=`${MONTHS[parseInt(m)-1]}_${y}`;
  }else{
    const sorted=sel.slice().sort();
    name=`${sorted[0]}_to_${sorted[sorted.length-1]}`;
  }
  let who='';
  if(members){
    const slug=n=>(prettifyAgentName(n)||'unnamed').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    who=members.length===1?slug(members[0])+'_':members.length+'_members_';
  }
  downloadExportData(data,`ProgressHub_${who}${name}.json`);
  closeExportMonthModal();
  const monthsTxt=sel.length===1?(data.periods[sel[0]]?data.periods[sel[0]].label:'1 month'):`${sel.length} months`;
  showToast(members?`JSON exported — ${members.length===1?(prettifyAgentName(members[0])||'unnamed'):members.length+' members'}, ${monthsTxt}`:`JSON exported — ${monthsTxt}`);
}

// Close the month picker when the backdrop itself is clicked
document.addEventListener('click',function(e){
  const ov=document.getElementById('export-month-modal');
  if(ov&&ov.classList.contains('open')&&e.target===ov)closeExportMonthModal();
});

// JSON Import
let pendingJSONImport=null;

function handleJSONImport(input){
  const file=input.files[0];
  input.value=''; // reset so same file can be picked again
  if(!file)return;
  const reader=new FileReader();
  reader.onload=function(e){
    let data;
    try{data=JSON.parse(e.target.result);}
    catch(err){showToast('Invalid JSON file');return;}
    if(!data.periods||typeof data.periods!=='object'){
      showToast('Not a valid KPI Tracker export');return;
    }
    pendingJSONImport=data;
    showJSONImportModal(data);
  };
  reader.readAsText(file);
}

function showJSONImportModal(data){
  const keys=Object.keys(data.periods).sort();
  const total=keys.reduce((a,k)=>a+(data.periods[k].surveys||[]).length,0);
  const rows=keys.map(key=>{
    const p=data.periods[key];
    const surveyCount=(p.surveys||[]).length;
    const existing=state[key];
    const existingCount=existing?(existing.surveys||[]).length:0;
    const badge=existing
      ?`<span style="font-size:10px;background:var(--amber-dim);color:var(--amber);border-radius:4px;padding:1px 6px;margin-left:6px">merge</span>`
      :`<span style="font-size:10px;background:var(--green-dim);color:var(--green);border-radius:4px;padding:1px 6px;margin-left:6px">new</span>`;
    return`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span style="font-family:var(--mono)">${p.label||key}${badge}</span>
      <span style="color:var(--text-muted)">${surveyCount} survey${surveyCount!==1?'s':''}${existing?' ('+existingCount+' existing)':''}</span>
    </div>`;
  }).join('');
  document.getElementById('json-import-preview').innerHTML=`
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">
      File contains <strong style="color:var(--text)">${keys.length} period${keys.length!==1?'s':''}</strong> · <strong style="color:var(--text)">${total} surveys</strong>
      ${data.exported?'<span style="margin-left:8px;color:var(--text-muted)">exported '+new Date(data.exported).toLocaleDateString()+'</span>':''}
    </div>
    <div style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:0 12px">${rows}</div>`;
  document.getElementById('json-import-modal').classList.add('open');
}

function closeJSONImportModal(){
  document.getElementById('json-import-modal').classList.remove('open');
  pendingJSONImport=null;
}

function confirmJSONImport(){
  if(!pendingJSONImport)return;
  const data=pendingJSONImport;
  let periodsAdded=0,periodsUpdated=0,surveysAdded=0,surveysUpdated=0;

  Object.keys(data.periods).forEach(key=>{
    const incoming=data.periods[key];
    const incomingSurveys=incoming.surveys||[];
    if(!state[key]){
      // New period — add wholesale
      state[key]={
        surveys:[...incomingSurveys],
        aht:incoming.aht_seconds||0,
        monthlyAHT:incoming.monthlyAHT||0,
        annotations:{...((incoming.annotations)||{})},
        dailyAHT:{...((incoming.dailyAHT)||{})},
        dailyAHTByMember:JSON.parse(JSON.stringify(incoming.dailyAHTByMember||{})),
        monthlyAHTByMember:JSON.parse(JSON.stringify(incoming.monthlyAHTByMember||{})),
        customMetrics:JSON.parse(JSON.stringify(incoming.customMetrics||{}))
      };
      // Restore working days if present in export
      if(Array.isArray(incoming.workingDays)&&incoming.workingDays.length>0){
        const [ky,km]=key.split('-');
        try{localStorage.setItem('wdays-'+ky+'-'+km,JSON.stringify(incoming.workingDays));}catch(e){}
      }
      // Restore moods if present in export
      if(incoming.moods&&Object.keys(incoming.moods).length>0){
        try{localStorage.setItem('moods-'+key,JSON.stringify(incoming.moods));}catch(e){}
      }
      surveysAdded+=incomingSurveys.length;
      periodsAdded++;
    } else {
      // Existing period — merge surveys by dup key
      const p=state[key];
      const existingKeys=new Map();
      p.surveys.forEach(sv=>{
        if(sv.id&&sv.id.trim().toUpperCase()!=='NOT_SET'&&!existingKeys.has(sv.id))existingKeys.set(sv.id,sv);
      });
      let added=0;
      incomingSurveys.forEach(sv=>{
        const dk=(sv.id||'');
        const _notSet=!sv.id||sv.id.trim().toUpperCase()==='NOT_SET';
        if(_notSet||!existingKeys.has(dk)){
          p.surveys.push(sv);
          if(!_notSet)existingKeys.set(dk,sv);
          added++;
        }else if(mergeSurveyGaps(existingKeys.get(dk),sv)){
          surveysUpdated++;
        }
      });
      // Merge annotations (don't overwrite existing)
      const ann=incoming.annotations||{};
      Object.keys(ann).forEach(dk=>{if(!p.annotations[dk])p.annotations[dk]=ann[dk];});
      // Merge dailyAHT (don't overwrite existing entries)
      const dAHT=incoming.dailyAHT||{};
      if(!p.dailyAHT)p.dailyAHT={};
      Object.keys(dAHT).forEach(dk=>{if(!p.dailyAHT[dk])p.dailyAHT[dk]=dAHT[dk];});
      // Merge per-member dailyAHTByMember (don't overwrite existing entries)
      const dAHTByMember=incoming.dailyAHTByMember||{};
      if(!p.dailyAHTByMember)p.dailyAHTByMember={};
      Object.keys(dAHTByMember).forEach(agent=>{
        if(!p.dailyAHTByMember[agent])p.dailyAHTByMember[agent]={};
        Object.keys(dAHTByMember[agent]||{}).forEach(dk=>{
          if(!p.dailyAHTByMember[agent][dk])p.dailyAHTByMember[agent][dk]=dAHTByMember[agent][dk];
        });
      });
      // Merge per-member monthlyAHTByMember (don't overwrite an existing running total)
      const mAHTByMember=incoming.monthlyAHTByMember||{};
      if(!p.monthlyAHTByMember)p.monthlyAHTByMember={};
      Object.keys(mAHTByMember).forEach(agent=>{
        if(!p.monthlyAHTByMember[agent])p.monthlyAHTByMember[agent]=mAHTByMember[agent];
      });
      // Merge custom metric values (don't overwrite an existing entry for the same date)
      const cMetrics=incoming.customMetrics||{};
      if(!p.customMetrics)p.customMetrics={};
      Object.keys(cMetrics).forEach(mid=>{
        if(!p.customMetrics[mid])p.customMetrics[mid]={};
        Object.keys(cMetrics[mid]||{}).forEach(dk=>{
          if(p.customMetrics[mid][dk]===undefined)p.customMetrics[mid][dk]=cMetrics[mid][dk];
        });
      });
      // Only overwrite legacy AHT if current period has none set
      if(!p.aht&&incoming.aht_seconds)p.aht=incoming.aht_seconds;
      // Restore monthlyAHT if current period has none
      if(!p.monthlyAHT&&incoming.monthlyAHT)p.monthlyAHT=incoming.monthlyAHT;
      // Restore working days only if current period has none saved
      if(Array.isArray(incoming.workingDays)&&incoming.workingDays.length>0){
        const [ky,km]=key.split('-');
        const wdKey='wdays-'+ky+'-'+km;
        try{
          const existing=localStorage.getItem(wdKey);
          const existingArr=existing?JSON.parse(existing):[];
          if(existingArr.length===0) localStorage.setItem(wdKey,JSON.stringify(incoming.workingDays));
        }catch(e){}
      }
      // Restore moods — merge, don't overwrite existing days
      if(incoming.moods&&Object.keys(incoming.moods).length>0){
        try{
          const existingMoods=JSON.parse(localStorage.getItem('moods-'+key)||'{}');
          const merged=Object.assign({},incoming.moods,existingMoods);
          localStorage.setItem('moods-'+key,JSON.stringify(merged));
        }catch(e){}
      }
      surveysAdded+=added;
      periodsUpdated++;
    }
    // Per-member working-days calendars (an existing calendar on this device wins)
    if(incoming.memberWorkingDays&&typeof incoming.memberWorkingDays==='object'){
      const [wy,wm]=key.split('-');
      Object.keys(incoming.memberWorkingDays).forEach(agent=>{
        const arr=incoming.memberWorkingDays[agent];
        if(!Array.isArray(arr)||!arr.length)return;
        const wk='wdays-member-'+encodeURIComponent(agent)+'-'+wy+'-'+wm;
        try{
          const ex=localStorage.getItem(wk);
          const exArr=ex?JSON.parse(ex):[];
          if(!exArr.length)localStorage.setItem(wk,JSON.stringify(arr));
        }catch(e){}
      });
    }
  });
  // Team-scorecard extra-metric scores for members (metrics merged by id; existing values win)
  if(data.scorecardMetrics||Object.values(data.periods).some(pp=>pp&&pp.scorecardValues)){
    try{
      const x=getScExtra();
      Object.values(data.scorecardMetrics||{}).forEach(def=>{
        if(def&&def.id&&!x.metrics.some(q=>q.id===def.id))x.metrics.push(def);
      });
      Object.keys(data.periods).forEach(pk=>{
        const sv=data.periods[pk]&&data.periods[pk].scorecardValues;
        if(!sv)return;
        Object.keys(sv).forEach(scope=>Object.keys(sv[scope]||{}).forEach(mid=>{
          Object.keys(sv[scope][mid]||{}).forEach(mem=>{
            const bucket=((x.values[pk]=x.values[pk]||{})[scope]=x.values[pk][scope]||{});
            const per=(bucket[mid]=bucket[mid]||{});
            if(per[mem]===undefined)per[mem]=sv[scope][mid][mem];
          });
        }));
      });
      saveScExtra(x);
    }catch(e){}
  }
  // Member avatars / photos (existing choices on this device win)
  if(data.memberProfiles&&typeof data.memberProfiles==='object'){
    try{
      Object.keys(data.memberProfiles).forEach(n=>{
        const pr=data.memberProfiles[n]||{};
        const k=_avKey(n);
        if(typeof pr.avatar==='string'&&!_avMap()[k])setMemberAvatar(n,pr.avatar);
        if(typeof pr.photo==='string'&&pr.photo.startsWith('data:image/')&&!_photoMap()[k])setMemberPhoto(n,pr.photo);
      });
    }catch(e){}
  }

  // Full-export avatars / photos (existing choices on this device win)
  if(data.avatarData&&typeof data.avatarData==='object'){
    try{
      const av=_avMap(),ph=_photoMap();
      let aN=0,pN=0;
      Object.entries(data.avatarData.avatars||{}).forEach(([k,v])=>{if(typeof v==='string'&&!av[k]){av[k]=v;aN++;}});
      Object.entries(data.avatarData.photos||{}).forEach(([k,v])=>{if(typeof v==='string'&&v.startsWith('data:image/')&&!ph[k]){ph[k]=v;pN++;}});
      if(aN)localStorage.setItem(MEMBER_AVATAR_KEY,JSON.stringify(av));
      if(pN)localStorage.setItem(MEMBER_PHOTO_KEY,JSON.stringify(ph));
    }catch(e){}
  }
  // Team View name, team grading, scorecard + display settings (only fill in what this device doesn't have yet)
  let settingsApplied=0;
  if(data.appSettings&&typeof data.appSettings==='object'){
    try{
      Object.entries(data.appSettings).forEach(([k,v])=>{
        // Lock/password keys are never taken from appSettings (a crafted file could otherwise lock you out); see data.security below
        if(typeof v==='string'&&k.startsWith('kpi_')&&!/^kpi_(sec_|lock_|lockout_|unlocked_)/.test(k)&&localStorage.getItem(k)===null){localStorage.setItem(k,v);settingsApplied++;}
      });
      if(settingsApplied){
        try{loadTeamThresholds();}catch(e){}
        try{if(localStorage.getItem('kpi_theme')&&typeof _applyTheme==='function')_applyTheme(localStorage.getItem('kpi_theme'));}catch(e){}
      }
    }catch(e){}
  }
  // Password (only present if it was included on purpose). Applied only when this device has no password yet; never overwrites one.
  let securityApplied=false;
  if(data.security&&typeof data.security==='object'){
    try{
      const h=data.security.hash;
      if(data.security.enabled&&typeof h==='string'&&/^[0-9a-f]{64}$/.test(h)&&!(window.kpiSecurityIsEnabled&&window.kpiSecurityIsEnabled())&&!localStorage.getItem('kpi_sec_hash')){
        window.kpiSecuritySetPassword(h);securityApplied=true;
      }
    }catch(e){}
  }
  // Team-scorecard extra metrics + scores (metrics merged by id; existing values win)
  if(data.scorecardExtra&&typeof data.scorecardExtra==='object'){
    try{
      const x=getScExtra();
      (data.scorecardExtra.metrics||[]).forEach(def=>{if(def&&def.id&&!x.metrics.some(q=>q.id===def.id))x.metrics.push(def);});
      const iv=data.scorecardExtra.values||{};
      const merge=(dst,src)=>{Object.keys(src||{}).forEach(k=>{
        if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])){if(!dst[k]||typeof dst[k]!=='object')dst[k]={};merge(dst[k],src[k]);}
        else if(dst[k]===undefined)dst[k]=src[k];
      });};
      merge(x.values,iv);
      saveScExtra(x);
    }catch(e){}
  }

  // Manually added team members — per month. Add any that aren't already on this device's list for that month.
  if(data.manualMembersByPeriod&&typeof data.manualMembersByPeriod==='object'){
    try{
      Object.keys(data.manualMembersByPeriod).forEach(pk=>{
        const incoming=data.manualMembersByPeriod[pk];
        if(!/^\d{4}-\d{2}$/.test(pk)||!Array.isArray(incoming))return;
        const cur=getManualMembers(pk),seen=new Set(cur.map(_memberCanon));
        incoming.forEach(n=>{
          if(typeof n!=='string')return;
          const t=n.trim().replace(/\s+/g,' ');
          if(t&&!seen.has(_memberCanon(t))){cur.push(t);seen.add(_memberCanon(t));}
        });
        saveManualMembers(cur,pk);
      });
    }catch(e){}
  }
  // Older exports carried one global list — only people with no data in any month need pinning.
  if(Array.isArray(data.manualMembers)){
    try{
      const map=_readRosterMap();
      _pinLegacyRosterNames(map,data.manualMembers);
      _writeRosterMap(map);
    }catch(e){}
  }

  backfillSingleRatingCSAT(state);
  autoMergeDuplicateAgentNames();
  autoMigratePersonalAHTLog();
  saveState();
  // Restore global settings from export
  if(data.dailyTarget){
    try{localStorage.setItem('daily-target',String(data.dailyTarget));}catch(e){}
  }
  if(data.kpiWeights){
    try{
      const existing=JSON.parse(localStorage.getItem('kpi_thresholds_v1')||'null');
      const merged=existing||{csat:CSAT_THRESHOLDS,ar:AR_THRESHOLDS,aht:AHT_THRESHOLDS};
      merged.weights=data.kpiWeights;
      localStorage.setItem('kpi_thresholds_v1',JSON.stringify(merged));
      KPI_WEIGHTS=Object.assign(JSON.parse(JSON.stringify(DEFAULT_KPI_WEIGHTS)),{
        csat:Object.assign({},DEFAULT_KPI_WEIGHTS.csat,data.kpiWeights.csat),
        ar:Object.assign({},DEFAULT_KPI_WEIGHTS.ar,data.kpiWeights.ar),
        aht:Object.assign({},DEFAULT_KPI_WEIGHTS.aht,data.kpiWeights.aht)
      });
    }catch(e){}
  }
  // Restore per-month threshold overrides
  if(data.monthlyThresholds&&typeof data.monthlyThresholds==='object'){
    try{
      const existing=loadMonthlyThresholds();
      const merged=Object.assign({},data.monthlyThresholds,existing); // existing wins on conflict
      saveMonthlyThresholds(merged);
    }catch(e){}
  }
  // Restore CSAT/AR/AHT scope — only if this device is still on the defaults
  if(data.stockScope&&typeof data.stockScope==='object'&&['csat','ar','aht'].every(k=>stockScopeOf(k)==='both')){
    try{['csat','ar','aht'].forEach(k=>{const v=data.stockScope[k];if(v==='dashboard'||v==='team')STOCK_SCOPE[k]=v;});saveStockScope();applyActivePeriodThresholds();}catch(e){}
  }
  // Restore custom metric definitions — merge by id, existing definitions win
  if(Array.isArray(data.customMetricDefs)&&data.customMetricDefs.length){
    try{
      const existingIds=new Set(CUSTOM_METRIC_DEFS.map(m=>m.id));
      data.customMetricDefs.forEach(def=>{if(def&&def.id&&!existingIds.has(def.id)){CUSTOM_METRIC_DEFS.push(def);existingIds.add(def.id);}});
      migrateLegacyCustomMetricScoring();
      saveCustomMetricDefs();
    }catch(e){}
  }
  // Restore custom metric grades/points — existing values win
  if(data.customScoring&&typeof data.customScoring==='object'){
    try{
      Object.keys(data.customScoring).forEach(k=>{if(!CUSTOM_SCORING[k])CUSTOM_SCORING[k]=normCustomScoring(data.customScoring[k]);});
      saveThresholds();
    }catch(e){}
  }
  closeJSONImportModal();
  updateAHT();
  renderDashboard();
  renderSurveyTable();
  renderDailyAHTList();
  renderAHTImportedTable();
  initYearSelect();
  if(typeof refreshWdayBadge==='function')refreshWdayBadge();

  const msg=`Imported: ${surveysAdded} survey${surveysAdded!==1?'s':''} · ${periodsAdded} new period${periodsAdded!==1?'s':''} · ${periodsUpdated} merged${surveysUpdated?' · '+surveysUpdated+' updated with new responses':''}`;
  setStatus(msg,'success');
  try{if(typeof renderTeamViewTitle==='function')renderTeamViewTitle();if(typeof renderTeamView==='function')renderTeamView();}catch(e){}
  showToast((settingsApplied?'JSON import complete — reload the page to apply display settings':'JSON import complete')+(securityApplied?' · password protection restored':''));
}
function clearSurveyInput(){document.getElementById('survey-input').value='';setStatus('','');const hintBox=document.getElementById('survey-date-detect-hint');const hintText=document.getElementById('survey-date-detect-text');if(hintBox)hintBox.style.display='none';if(hintText)hintText.textContent='';}
function clearAllData(){
  if(!confirm('Delete ALL survey data for '+periodLabel(...activePeriodKey.split('-').reverse().map(Number).reverse())+'?'))return;
  state[activePeriodKey]={surveys:[],aht:0,annotations:{},dailyAHT:{},monthlyAHT:0,dailyAHTByMember:{},monthlyAHTByMember:{}};
  const ahtEl=document.getElementById('aht-input');if(ahtEl)ahtEl.value='';
  updateAHT();saveState();renderDashboard();renderSurveyTable();
  renderDailyAHTList();renderAHTImportedTable();
  setStatus('All data cleared.','');
}
function setStatus(msg,type){
  const el=document.getElementById('status-msg');
  el.textContent=msg;el.className='status-msg'+(type?' '+type:'');
}

// History
function renderHistory(){
  const list=document.getElementById('history-list');
  // Only show periods up to the current real-world month. Browsing forward with the month/year
  // selector or the "next month" arrow lazily creates an empty entry in `state` for that period
  // (see getPeriod()) — without this filter those "coming" months would show up here as blank cards.
  const now=new Date();
  const currentKey=periodKey(now.getMonth()+1,now.getFullYear());
  const keys=Object.keys(state).filter(k=>k<=currentKey).sort().reverse();
  if(keys.length===0){
    list.innerHTML='<div class="empty-state"><svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><p>No periods tracked yet.</p></div>';
    return;
  }
  list.innerHTML='';
  keys.forEach(key=>{
    const [y,m]=key.split('-');
    const p=state[key];const surveys=p.surveys||[];const total=surveys.length;
    const csatAvg=total>0?calcCSAT(surveys):null;
    const arResponded=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arYes=surveys.filter(sv=>sv.ar==='yes').length;
    const arPct=arResponded.length>0?arYes/arResponded.length*100:null;
    const sec=p.aht||0;
    const isActive=key===activePeriodKey;
    // Use per-period thresholds for correct historical grading
    const pt=getThresholdsForPeriod(key);
    const hasCustom=hasMonthlyOverride(key);
    const csatG=csatAvg!==null?gradeCSATWith(csatAvg,pt.csat):null;
    const arG=arPct!==null?gradeARWith(arPct,pt.ar):null;
    const ahtG=sec>0?gradeAHTWith(sec,pt.aht):null;
    const wc=csatAvg!==null?(pt.weights.csat[csatG.grade]||0):0;
    const wa=arPct!==null?(pt.weights.ar[arG.grade]||0):0;
    const wh=sec>0?(pt.weights.aht[ahtG.grade]||0):0;
    const kpi=(csatAvg!==null||arPct!==null||sec>0)?wc+wa+wh+customMetricsPoints(key):null;
    const card=document.createElement('div');
    card.className='history-card';
    if(isActive)card.style.borderColor='var(--accent)';
    card.innerHTML=`
      <div>
        <div class="history-period">${MONTHS[parseInt(m)-1]} ${y}${isActive?' <span style="font-size:11px;color:var(--accent);font-family:var(--font);font-weight:500">· active</span>':''}${hasCustom?' <span title="Custom thresholds set for this month" style="font-size:10px;color:var(--accent);cursor:pointer" data-action="openThreshForMonth(\''+key+'\')">⚙ custom thresholds</span>':''}</div>
        <div class="history-meta">${total} survey${total!==1?'s':''} · ${arResponded.length} AR responses</div>
      </div>
      <div class="history-scores">
        <div class="history-score-item">
          <div class="history-score-label">CSAT</div>
          <div class="history-score-val ${csatG?csatG.gcls:''}" style="${csatG?'':'color:var(--text-muted)'}">${csatAvg!==null?(surveys.filter(s=>s.csat!==null&&!isNaN(s.csat)).length>0?fmtCsat(csatAvg):'—'):'—'}</div>
        </div>
        <div class="history-score-item">
          <div class="history-score-label">AR</div>
          <div class="history-score-val ${arG?arG.gcls:''}" style="${arG?'':'color:var(--text-muted)'}">${arPct!==null?arPct.toFixed(2)+'%':'—'}</div>
        </div>
        <div class="history-score-item">
          <div class="history-score-label">AHT</div>
          <div class="history-score-val ${ahtG?ahtG.gcls:''}" style="${ahtG?'':'color:var(--text-muted)'}">${sec>0?fmtSec(sec):'—'}</div>
        </div>
        <div class="history-score-item">
          <div class="history-score-label">KPI</div>
          <div class="history-score-val" style="color:var(--purple)">${kpi!==null?kpi.toFixed(2)+'%':'—'}</div>
        </div>
        <div class="history-actions">
          <button class="icon-btn" title="Switch to period" data-action="switchToPeriod('${key}')">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          </button>
          <button class="icon-btn danger" title="Delete period" data-action="deletePeriod('${key}')">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>`;
    list.appendChild(card);
  });
}

function switchToPeriod(key){
  const [y,m]=key.split('-');
  setActivePeriod(parseInt(m),parseInt(y));
  showPage('dashboard');
  showToast('Switched to '+periodLabel(parseInt(m),parseInt(y)));
}
// Open threshold editor pre-scoped to a specific month (e.g. from History page "custom thresholds" link)
function openThreshForMonth(key){
  _populateThreshScopeDropdown();
  threshEditorScope=key;
  const sel=document.getElementById('te-scope-sel');
  if(sel)sel.value=key;
  _syncThreshEditorScope();
  activeThreshTab='csat';
  switchThreshTab('csat');
  document.getElementById('thresh-editor-modal').classList.add('open');
}
function deletePeriod(key){
  const [y,m]=key.split('-');
  if(!confirm('Delete all data for '+periodLabel(parseInt(m),parseInt(y))+'?'))return;
  delete state[key];saveState();
  if(key===activePeriodKey){const now=new Date();setActivePeriod(now.getMonth()+1,now.getFullYear());}
  renderHistory();
}

// Threshold Editor
let activeThreshTab='csat';
let threshEditorScope='global'; // 'global' or a periodKey like '2026-06'
let threshEditorDraft={csat:null,ar:null,aht:null,weights:null,custom:null}; // working copy while editor is open
let threshEditorDirty=false; // true while the draft has edits that haven't been applied yet
function _setThreshDirty(v){
  threshEditorDirty=!!v;
  const b=document.getElementById('te-apply-btn');
  if(b)b.textContent=threshEditorDirty?'Apply changes':'Apply';
}
// Every edit only touches the draft. Nothing is saved or re-scored until Apply is clicked.
function _touchThreshDraft(){_setThreshDirty(true);}
// Parses a points field: blank (or anything that isn't a number) counts as 0.
function _ptsFromInput(val){
  const v=parseFloat(String(val).trim());
  return(isNaN(v)||v<0)?0:v;
}
// Apply: writes the draft to storage, re-scores everything, and re-renders the open tab
// so any blank points field now shows 0.
function applyThreshEditor(){
  if(!threshEditorDraft.csat)return;
  _commitThreshDraft();
  refreshAfterThresh();
  _setThreshDirty(false);
  renderThreshEditor(activeThreshTab);
  showToast('Thresholds applied');
}

// One scoring entry per current custom metric: the scope's own value if it has
// one, otherwise the global one, otherwise blank.
function _cloneCustom(c){
  const o={};
  CUSTOM_METRIC_DEFS.forEach(d=>{o[d.id]=normCustomScoring((c&&c[d.id])||CUSTOM_SCORING[d.id]);});
  return o;
}
function _threshDraftFrom(src){
  return {
    custom:_cloneCustom(src.custom),
    csat:src.csat.map(t=>({...t})),
    ar:src.ar.map(t=>({...t})),
    aht:src.aht.map(t=>({...t,max:t.max===Infinity?null:t.max})),
    weights:JSON.parse(JSON.stringify(src.weights||KPI_WEIGHTS))
  };
}
function _threshDraftToLive(draft){
  return {
    custom:_cloneCustom(draft.custom),
    csat:draft.csat.map((v,i)=>({...DEFAULT_CSAT_THRESHOLDS[i],...v})),
    ar:draft.ar.map((v,i)=>({...DEFAULT_AR_THRESHOLDS[i],...v})),
    aht:draft.aht.map((v,i)=>({...DEFAULT_AHT_THRESHOLDS[i],...v,max:v.max===null?Infinity:v.max})),
    weights:JSON.parse(JSON.stringify(draft.weights||KPI_WEIGHTS))
  };
}

// Opens Edit Thresholds straight on a custom metric's tab (from Settings).
function openThreshForCustomMetric(id){
  _populateThreshScopeDropdown();
  threshEditorScope=activePeriodKey||'global';
  _syncThreshEditorScope();
  switchThreshTab('cm:'+id);
  document.getElementById('thresh-editor-modal').classList.add('open');
}
function openThresholdEditor(){
  activeThreshTab='csat';
  // Populate scope dropdown with all known periods
  _populateThreshScopeDropdown();
  // Default scope: the currently active period (so opening from June shows June settings)
  threshEditorScope=activePeriodKey||'global';
  _syncThreshEditorScope();
  switchThreshTab('csat');
  document.getElementById('thresh-editor-modal').classList.add('open');
}
function _populateThreshScopeDropdown(){
  const sel=document.getElementById('te-scope-sel');
  if(!sel)return;
  sel.innerHTML='<option value="global">🌐 Global (all months)</option><option value="team">👥 Team Members</option>';
  // Add all periods that have data, sorted newest first
  const allOverrides=loadMonthlyThresholds();
  const periodKeys=Object.keys(state).sort().reverse();
  // Also include any months that have overrides but no data
  const overrideKeys=Object.keys(allOverrides).filter(k=>!state[k]);
  const allKeys=[...new Set([...periodKeys,...overrideKeys])].sort().reverse();
  allKeys.forEach(key=>{
    const [y,m]=key.split('-').map(Number);
    if(!y||!m)return;
    const hasOv=!!allOverrides[key];
    const label=MONTHS[m-1]+' '+y+(hasOv?' ★':'');
    const opt=document.createElement('option');
    opt.value=key;
    opt.textContent=label;
    sel.appendChild(opt);
  });
  sel.value=(activePeriodKey&&(state[activePeriodKey]||allOverrides[activePeriodKey]))?activePeriodKey:'global';
}
// Opens the threshold editor pre-scoped to the Team View's own thresholds —
// separate from the dashboard's, and only ever used to grade team-page tiles.
function openTeamThresholdEditor(){
  _populateThreshScopeDropdown();
  threshEditorScope='team';
  const sel=document.getElementById('te-scope-sel');
  if(sel)sel.value='team';
  _syncThreshEditorScope();
  activeThreshTab='csat';
  switchThreshTab('csat');
  document.getElementById('thresh-editor-modal').classList.add('open');
}
function closeThreshEditor(force){
  if(force!==true&&threshEditorDirty){
    // Same Save / Discard / Keep editing prompt as every other popup (Save = Apply).
    if(typeof phUnsavedPrompt==='function'&&phUnsavedPrompt('thresh-editor-modal'))return;
    if(!confirm('You have changes that haven\'t been applied. Close and discard them?'))return;
  }
  _setThreshDirty(false);
  document.getElementById('thresh-editor-modal').classList.remove('open');
}

function _syncThreshEditorScope(){
  _renderThreshTabStrip();
  // Load draft from correct source
  if(threshEditorScope==='global'){
    threshEditorDraft=_threshDraftFrom({csat:CSAT_THRESHOLDS,ar:AR_THRESHOLDS,aht:AHT_THRESHOLDS,weights:KPI_WEIGHTS});
  } else if(threshEditorScope==='team'){
    // Team thresholds have no weights/KPI score of their own — the Team View
    // tiles only ever show CSAT/AR/AHT grade pills — so seed weights from the
    // global set just so the (hidden) weights tab has something valid to read.
    threshEditorDraft=_threshDraftFrom({csat:TEAM_CSAT_THRESHOLDS,ar:TEAM_AR_THRESHOLDS,aht:TEAM_AHT_THRESHOLDS,weights:KPI_WEIGHTS});
    if(activeThreshTab==='weights')activeThreshTab='csat';
  } else {
    const ov=getMonthlyOverrideRaw(threshEditorScope);
    if(ov){
      const live=_threshDraftToLive(ov);
      threshEditorDraft=_threshDraftFrom(live);
    } else {
      // no override yet – seed from global
      threshEditorDraft=_threshDraftFrom({csat:CSAT_THRESHOLDS,ar:AR_THRESHOLDS,aht:AHT_THRESHOLDS,weights:KPI_WEIGHTS});
    }
  }
  _setThreshDirty(false);
  _updateThreshEditorScopeUI();
  if(activeThreshTab)renderThreshEditor(activeThreshTab);
}

function _updateThreshEditorScopeUI(){
  const sel=document.getElementById('te-scope-sel');
  if(sel)sel.value=threshEditorScope;
  const badge=document.getElementById('te-scope-badge');
  if(!badge)return;
  if(threshEditorScope==='global'){
    badge.textContent='Global (all months)';
    badge.style.color='var(--text-muted)';
  } else if(threshEditorScope==='team'){
    badge.textContent='Team View only — dashboard is unaffected';
    badge.style.color='var(--accent)';
  } else {
    const [y,m]=threshEditorScope.split('-').map(Number);
    const hasOv=hasMonthlyOverride(threshEditorScope);
    badge.textContent=MONTHS[m-1]+' '+y+(hasOv?' · custom':'· using global');
    badge.style.color=hasOv?'var(--accent)':'var(--text-muted)';
  }
  const clearBtn=document.getElementById('te-scope-clear-btn');
  if(clearBtn){
    clearBtn.style.display=(threshEditorScope!=='global'&&threshEditorScope!=='team'&&hasMonthlyOverride(threshEditorScope))?'inline-flex':'none';
  }
}

function changeThreshScope(val){
  if(threshEditorDirty&&!confirm('You have changes that haven\'t been applied. Switch scope and discard them?')){
    const sel=document.getElementById('te-scope-sel');
    if(sel)sel.value=threshEditorScope;
    return;
  }
  threshEditorScope=val;
  _syncThreshEditorScope();
  switchThreshTab(activeThreshTab); // keep tab strip/panel visibility in sync (e.g. Weights hidden for 'team')
}
function clearMonthThreshOverride(){
  if(threshEditorScope==='global'||threshEditorScope==='team')return;
  if(!confirm('Remove the custom thresholds for this month and revert to global defaults?'))return;
  setMonthlyThresholdOverride(threshEditorScope,null);
  _syncThreshEditorScope();
  if(threshEditorScope===activePeriodKey)applyActivePeriodThresholds();
  showToast('Month override cleared — now using global thresholds');
}

// Writes the current draft back to storage (global or monthly override)
function _commitThreshDraft(){
  if(threshEditorScope==='global'){
    // Update global arrays
    CSAT_THRESHOLDS=threshEditorDraft.csat.map((v,i)=>({...DEFAULT_CSAT_THRESHOLDS[i],...v}));
    AR_THRESHOLDS=threshEditorDraft.ar.map((v,i)=>({...DEFAULT_AR_THRESHOLDS[i],...v}));
    AHT_THRESHOLDS=threshEditorDraft.aht.map((v,i)=>({...DEFAULT_AHT_THRESHOLDS[i],...v,max:v.max===null?Infinity:v.max}));
    KPI_WEIGHTS=JSON.parse(JSON.stringify(threshEditorDraft.weights));
    CUSTOM_SCORING=JSON.parse(JSON.stringify(threshEditorDraft.custom||{}));
    saveThresholds();
  } else if(threshEditorScope==='team'){
    TEAM_CSAT_THRESHOLDS=threshEditorDraft.csat.map((v,i)=>({...DEFAULT_CSAT_THRESHOLDS[i],...v}));
    TEAM_AR_THRESHOLDS=threshEditorDraft.ar.map((v,i)=>({...DEFAULT_AR_THRESHOLDS[i],...v}));
    TEAM_AHT_THRESHOLDS=threshEditorDraft.aht.map((v,i)=>({...DEFAULT_AHT_THRESHOLDS[i],...v,max:v.max===null?Infinity:v.max}));
    saveTeamThresholds();
    if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none')renderTeamView();
    return; // team thresholds never feed applyActivePeriodThresholds()/the dashboard
  } else {
    setMonthlyThresholdOverride(threshEditorScope,{
      csat:threshEditorDraft.csat.map(t=>({grade:t.grade,min:t.min})),
      ar:threshEditorDraft.ar.map(t=>({grade:t.grade,min:t.min})),
      aht:threshEditorDraft.aht.map(t=>({grade:t.grade,max:t.max===null?null:t.max})),
      weights:JSON.parse(JSON.stringify(threshEditorDraft.weights)),
      custom:JSON.parse(JSON.stringify(threshEditorDraft.custom||{}))
    });
    _updateThreshEditorScopeUI();
  }
  // Reapply to active period so dashboard re-renders correctly
  applyActivePeriodThresholds();
}
// Tab strip is built from the current custom metrics, so a newly added metric
// shows up here automatically. Team scope only has CSAT/AR/AHT.
function _renderThreshTabStrip(){
  const strip=document.getElementById('te-tab-strip');
  if(!strip)return;
  const team=threshEditorScope==='team';
  const tabs=[{id:'csat',label:'CSAT'},{id:'ar',label:'AR'},{id:'aht',label:'AHT'}];
  if(!team){
    CUSTOM_METRIC_DEFS.forEach(d=>tabs.push({id:'cm:'+d.id,label:d.name,custom:true}));
    tabs.push({id:'weights',label:'KPI Weights'});
  }
  strip.innerHTML=tabs.map(t=>`<button class="thresh-modal-tab" data-tab="${escHtml(t.id)}"${t.custom?` title="${escHtml(t.label)}" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"`:''} data-ph-click="switchThreshTab('${t.id}')">${escHtml(t.label)}</button>`).join('');
}
function switchThreshTab(tab){
  tab=String(tab||'csat');
  if(tab.indexOf('cm:')===0&&(threshEditorScope==='team'||!getCustomMetricDef(tab.slice(3))))tab='csat';
  if(tab==='weights'&&threshEditorScope==='team')tab='csat';
  activeThreshTab=tab;
  const isCM=tab.indexOf('cm:')===0;
  ['csat','ar','aht','weights'].forEach(t=>{
    document.getElementById('tepanel-'+t).style.display=t===tab?'block':'none';
  });
  document.getElementById('tepanel-custom').style.display=isCM?'block':'none';
  document.querySelectorAll('#te-tab-strip .thresh-modal-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  renderThreshEditor(tab);
}
function renderThreshEditor(tab){
  const dr=threshEditorDraft;
  if(!dr.csat)return; // draft not initialised yet
  if(tab==='csat'){
    const el=document.getElementById('te-csat-rows');
    el.innerHTML='';
    dr.csat.slice(0,-1).forEach((t,i)=>{
      const row=document.createElement('div');
      row.className='te-row';
      row.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${DEFAULT_CSAT_THRESHOLDS[i].cls}">${t.grade}</span></span>
        <label style="font-size:11px;color:var(--text-muted);min-width:60px">Min score</label>
        <input class="te-input" type="number" step="0.01" min="1" max="5" value="${t.min}" data-input="updateCSATThresh(${i},this.value)">
        <span class="te-unit">/ 5.00</span>`;
      el.appendChild(row);
    });
    const ni=document.createElement('div');
    ni.className='te-row';
    ni.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${DEFAULT_CSAT_THRESHOLDS[4].cls}">Needs improvement</span></span>
      <span style="font-size:11px;color:var(--text-muted)">Below Satisfactory threshold (auto)</span>`;
    el.appendChild(ni);
  } else if(tab==='ar'){
    const el=document.getElementById('te-ar-rows');
    el.innerHTML='';
    dr.ar.slice(0,-1).forEach((t,i)=>{
      const row=document.createElement('div');
      row.className='te-row';
      row.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${DEFAULT_AR_THRESHOLDS[i].cls}">${t.grade}</span></span>
        <label style="font-size:11px;color:var(--text-muted);min-width:60px">Min %</label>
        <input class="te-input" type="number" step="0.1" min="0" max="100" value="${t.min}" data-input="updateARThresh(${i},this.value)">
        <span class="te-unit">%</span>`;
      el.appendChild(row);
    });
    const ni=document.createElement('div');
    ni.className='te-row';
    ni.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${DEFAULT_AR_THRESHOLDS[4].cls}">Needs improvement</span></span>
      <span style="font-size:11px;color:var(--text-muted)">Below Satisfactory threshold (auto)</span>`;
    el.appendChild(ni);
  } else if(tab==='aht'){
    const el=document.getElementById('te-aht-rows');
    el.innerHTML='';
    dr.aht.slice(0,-1).forEach((t,i)=>{
      const maxVal=t.max===null?DEFAULT_AHT_THRESHOLDS[i].max:t.max;
      const row=document.createElement('div');
      row.className='te-row';
      row.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${DEFAULT_AHT_THRESHOLDS[i].cls}">${t.grade}</span></span>
        <label style="font-size:11px;color:var(--text-muted);min-width:60px">Max sec</label>
        <input class="te-input" type="number" step="1" min="1" value="${maxVal}" data-input="updateAHTThresh_ed(${i},this.value)">
        <span class="te-unit">= ${fmtSec(maxVal)}</span>`;
      el.appendChild(row);
    });
    const ni=document.createElement('div');
    ni.className='te-row';
    ni.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${DEFAULT_AHT_THRESHOLDS[4].cls}">Needs improvement</span></span>
      <span style="font-size:11px;color:var(--text-muted)">Above Satisfactory threshold (auto)</span>`;
    el.appendChild(ni);
  } else if(String(tab).indexOf('cm:')===0){
    const def=getCustomMetricDef(tab.slice(3));
    const el=document.getElementById('te-custom-rows');
    const hint=document.getElementById('te-custom-hint');
    if(!def||!el||!hint)return;
    if(!dr.custom)dr.custom=_cloneCustom(null);
    if(!dr.custom[def.id])dr.custom[def.id]=blankCustomScoring();
    const sc=dr.custom[def.id];
    const lower=def.direction==='lower';
    hint.textContent=(lower?'Maximum value':'Minimum value')+(def.unit?' ('+def.unit+')':'')+' needed for each grade. '+(lower?'Lower':'Higher')+' is better. Leave a grade blank to skip it.';
    el.innerHTML='';
    CM_GRADES.forEach((g,i)=>{
      const row=document.createElement('div');
      row.className='te-row';
      row.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${CM_GRADE_CLS[g]}">${g}</span></span>
        <label style="font-size:11px;color:var(--text-muted);min-width:60px">${lower?'Max value':'Min value'}</label>
        <input class="te-input" type="number" step="any" placeholder="—" value="${sc.cut[i]===null?'':sc.cut[i]}" data-input="updateCMThresh('${def.id}',${i},this.value)">
        <span class="te-unit">${escHtml(def.unit||'')}</span>`;
      el.appendChild(row);
    });
    const ni=document.createElement('div');
    ni.className='te-row';
    ni.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${CM_GRADE_CLS['Needs improvement']}">Needs improvement</span></span>
      <span style="font-size:11px;color:var(--text-muted)">${lower?'Above':'Below'} Satisfactory threshold (auto)</span>`;
    el.appendChild(ni);
    _renderCMSummary(def.id);
  } else if(tab==='weights'){
    const el=document.getElementById('te-weights-rows');
    el.innerHTML='';
    const metrics=[
      {key:'csat',label:'CSAT',color:'var(--accent)'},
      {key:'ar',label:'AR',color:'var(--green)'},
      {key:'aht',label:'AHT',color:'var(--teal)'}
    ];
    const grades=['Exceptional','Good','Average','Satisfactory'];
    const gradeClasses={Exceptional:'grade-exceptional',Good:'grade-good',Average:'grade-average',Satisfactory:'grade-satisfactory'};
    metrics.forEach(({key,label,color})=>{
      const section=document.createElement('div');
      section.style.cssText='margin-bottom:14px';
      section.innerHTML=`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:${color};margin-bottom:6px">${label}</div>`;
      grades.forEach(grade=>{
        const row=document.createElement('div');
        row.className='te-row';
        row.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${gradeClasses[grade]}">${grade}</span></span>
          <label style="font-size:11px;color:var(--text-muted);min-width:60px">Points</label>
          <input class="te-input" type="number" step="0.25" min="0" max="100" value="${(dr.weights[key]||{})[grade]||0}" data-input="updateKPIWeight('${key}','${grade}',this.value)">
          <span class="te-unit">pts</span>`;
        section.appendChild(row);
      });
      el.appendChild(section);
    });
    CUSTOM_METRIC_DEFS.forEach(def=>{
      const sc=(dr.custom&&dr.custom[def.id])||blankCustomScoring();
      const section=document.createElement('div');
      section.style.cssText='margin-bottom:14px';
      section.innerHTML=`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#a855f7;margin-bottom:6px">${escHtml(def.name)}</div>`;
      CM_GRADES.forEach(grade=>{
        const row=document.createElement('div');
        row.className='te-row';
        row.innerHTML=`<span class="te-grade-pill"><span class="grade-pill ${CM_GRADE_CLS[grade]}">${grade}</span></span>
          <label style="font-size:11px;color:var(--text-muted);min-width:60px">Points</label>
          <input class="te-input" type="number" step="0.25" min="0" max="100" value="${sc.pts[grade]||0}" data-input="updateCMPoints('${def.id}','${grade}',this.value)">
          <span class="te-unit">pts</span>`;
        section.appendChild(row);
      });
      el.appendChild(section);
    });
    updateWeightsTotal();
  }
}
// Small status box under a custom metric's cutoffs: does it count toward Final KPI yet?
function _renderCMSummary(id){
  const box=document.getElementById('te-custom-summary');
  const dr=threshEditorDraft;
  if(!box||!dr.custom||!dr.custom[id])return;
  const sc=dr.custom[id];
  const on=customMetricIsScored(sc);
  box.innerHTML=`<span>${on
    ?'Counts toward Final KPI — up to <b style="font-family:var(--mono);color:var(--text)">'+sc.pts.Exceptional+' pts</b>'
    :'Not counting toward Final KPI yet — needs at least one cutoff and points above 0'}${(()=>{const d=getCustomMetricDef(id);return d?' · '+CM_SCOPE_LABELS[cmScopeOf(d)]:'';})()}</span>
    <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px;flex-shrink:0" data-ph-click="switchThreshTab('weights')">Set points &rarr;</button>`;
}
function updateCMThresh(id,i,val){
  if(!threshEditorDraft.custom)threshEditorDraft.custom={};
  const sc=threshEditorDraft.custom[id]||(threshEditorDraft.custom[id]=blankCustomScoring());
  const str=String(val).trim();
  const v=parseFloat(str);
  sc.cut[i]=(str===''||isNaN(v))?null:v;
  _touchThreshDraft();_renderCMSummary(id);
}
function updateCMPoints(id,grade,val){
  const v=_ptsFromInput(val);
  if(!threshEditorDraft.custom)threshEditorDraft.custom={};
  const sc=threshEditorDraft.custom[id]||(threshEditorDraft.custom[id]=blankCustomScoring());
  sc.pts[grade]=v;
  _touchThreshDraft();updateWeightsTotal();
}
function updateWeightsTotal(){
  const w=threshEditorDraft.weights||KPI_WEIGHTS;
  const maxFor=ctx=>{let m=['csat','ar','aht'].reduce((a,k)=>a+(stockInScope(k,ctx)?(w[k].Exceptional||0):0),0);CUSTOM_METRIC_DEFS.forEach(d=>{if(!customMetricInScope(d,ctx))return;const sc=threshEditorDraft.custom&&threshEditorDraft.custom[d.id];if(sc)m+=sc.pts.Exceptional||0;});return m;};
  const max=maxFor('dashboard'),maxTeam=maxFor('team');
  const el=document.getElementById('te-weights-max');
  if(el)el.textContent=max.toFixed(2)+'%';
  const note=document.getElementById('te-weights-note');
  if(note){
    const parts=[];
    if(Math.abs(maxTeam-max)>0.005)parts.push('Max for team members: '+maxTeam.toFixed(2)+'% (some metrics count on only one side).');
    if(Math.abs(max-100)>=0.005||Math.abs(maxTeam-100)>=0.005)parts.push("Total isn't 100. Nothing is auto-adjusted, and the Final KPI grade bands (95 / 85 / 80) are fixed, so change the points yourself if you want them to add up to 100.");
    note.textContent=parts.join(' ');
  }
}
function updateKPIWeight(metric,grade,val){
  const v=_ptsFromInput(val);
  if(!threshEditorDraft.weights)threshEditorDraft.weights=JSON.parse(JSON.stringify(KPI_WEIGHTS));
  threshEditorDraft.weights[metric][grade]=v;
  _touchThreshDraft();
  updateWeightsTotal();
}
function updateCSATThresh(i,val){
  const v=parseFloat(val);if(isNaN(v))return;
  threshEditorDraft.csat[i].min=v;
  _touchThreshDraft();
}
function updateARThresh(i,val){
  const v=parseFloat(val);if(isNaN(v))return;
  threshEditorDraft.ar[i].min=v;
  _touchThreshDraft();
}
function updateAHTThresh_ed(i,val){
  const v=parseInt(val);if(isNaN(v))return;
  threshEditorDraft.aht[i].max=v;
  // Update the unit label in the same row
  const rows=document.getElementById('te-aht-rows').querySelectorAll('.te-row');
  if(rows[i]){const unit=rows[i].querySelector('.te-unit');if(unit)unit.textContent='= '+fmtSec(v);}
  _touchThreshDraft();
}
function refreshAfterThresh(){
  renderDashboard();
  const ahtSec=computeAHTSec();
  renderAHTThresh(ahtSec);
  // NOTE: do NOT call renderThreshEditor(activeThreshTab) from the input handlers.
  // That fully rebuilds the row DOM (innerHTML='') on every keystroke,
  // which destroys/recreates the input the user is actively typing in
  // and kills focus after the first character. The editor rows already
  // reflect what the user just typed, so no re-render is needed here.
}
function resetThresholds(){
  const scopeLabel=threshEditorScope==='global'?'global defaults':threshEditorScope==='team'?'defaults for the Team View':'global defaults for this month';
  if(!confirm('Reset all thresholds and weights (including custom metrics) to '+scopeLabel+'?'))return;
  if(threshEditorScope==='global'){
    CSAT_THRESHOLDS=DEFAULT_CSAT_THRESHOLDS.map(t=>({...t}));
    AR_THRESHOLDS=DEFAULT_AR_THRESHOLDS.map(t=>({...t}));
    AHT_THRESHOLDS=DEFAULT_AHT_THRESHOLDS.map(t=>({...t}));
    KPI_WEIGHTS=JSON.parse(JSON.stringify(DEFAULT_KPI_WEIGHTS));
    CUSTOM_SCORING={};
    localStorage.removeItem('kpi_thresholds_v1');
  } else if(threshEditorScope==='team'){
    TEAM_CSAT_THRESHOLDS=DEFAULT_CSAT_THRESHOLDS.map(t=>({...t}));
    TEAM_AR_THRESHOLDS=DEFAULT_AR_THRESHOLDS.map(t=>({...t}));
    TEAM_AHT_THRESHOLDS=DEFAULT_AHT_THRESHOLDS.map(t=>({...t}));
    localStorage.removeItem('kpi_team_thresholds_v1');
    if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none')renderTeamView();
  } else {
    setMonthlyThresholdOverride(threshEditorScope,null);
  }
  applyActivePeriodThresholds();
  _syncThreshEditorScope();
  refreshAfterThresh();
  showToast('Thresholds reset to defaults');
}

// Modal
function openNewPeriodModal(){
  const now=new Date();
  document.getElementById('modal-month').value=now.getMonth()+1;
  document.getElementById('modal-year').value=now.getFullYear();
  document.getElementById('new-period-modal').classList.add('open');
}
function closeModal(){document.getElementById('new-period-modal').classList.remove('open')}
function createPeriod(){
  const m=parseInt(document.getElementById('modal-month').value);
  const y=parseInt(document.getElementById('modal-year').value);
  closeModal();setActivePeriod(m,y);showPage('dashboard');
  showToast('Period created: '+periodLabel(m,y));
}

// Nav
const PAGE_IDS=['dashboard','survey','history','weekly','monthsummary','team','insights','simulator','thresholds','settings'];
function goDashboard(){
  const now=new Date();
  const curKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  if(activePeriodKey!==curKey){setActivePeriod(now.getMonth()+1,now.getFullYear());renderDashboard();}
  showPage('dashboard');
}
function showPage(name){
  // Any side-nav navigation should dismiss an open member dashboard popup —
  // it's a floating overlay on top of Team View, not tied to page switching,
  // so without this it stayed open over whatever page you clicked into.
  const memberModal=document.getElementById('member-dashboard-modal');
  if(memberModal)memberModal.classList.remove('open');
  PAGE_IDS.forEach(p=>{const el=document.getElementById('page-'+p);if(el)el.style.display='none';});
  PAGE_IDS.forEach(p=>{const el=document.getElementById('nav-'+p);if(el)el.classList.remove('active');});
  const pageEl=document.getElementById('page-'+name);if(pageEl)pageEl.style.display='block';
  const navEl=document.getElementById('nav-'+name);if(navEl)navEl.classList.add('active');
  if(name==='history')renderHistory();
  if(name==='weekly')renderWeeklyView();
  if(name==='monthsummary')renderMonthSummary();
  if(name==='team')renderTeamView();
  if(name==='simulator')renderSimulator();
  if(name==='insights'&&typeof renderInsightsPage==='function')renderInsightsPage();
  if(name==='settings')renderSettingsPage();
  window.scrollTo(0,0);
}

// ── Team View ─────────────────────────────────────────────────────────────
// ── Team tile: "next tier" needs ─────────────────────────────────────────────
// Per-member version of the main dashboard's threshold "Need" column, limited to
// the next grade up, graded against the TEAM thresholds. Returns
// {top:true} | {text,style,title} | null (no data).
function _ahtPerDayNeededForMember(p,agent,targetMaxSec,rd){
  // Monthly total overrides daily rows; no monthly total -> daily rows (see _ahtProjBase).
  const rem=rd&&rd.remainingDays;
  if(!rem||rem<=0)return null;
  const b=_ahtProjBase(p,agent,rem,rd.daysElapsed,rd.todayOnly);
  if(!b||!(b.P>0))return null;
  return(targetMaxSec*(b.W+b.P)-b.S)/b.P;
}
function _teamNextTier(metric,value,ctx){
  if(value===null||value===undefined)return null;
  const th=metric==='csat'?TEAM_CSAT_THRESHOLDS:metric==='ar'?TEAM_AR_THRESHOLDS:TEAM_AHT_THRESHOLDS;
  const cur=metric==='csat'?gradeCSATTeam(value):metric==='ar'?gradeARTeam(value):gradeAHTTeam(value);
  const idx=th.findIndex(t=>t.grade===cur.grade);
  if(idx<=0)return{top:true};
  const next=th[idx-1];
  const red='color:#ef4444;font-weight:600',teal='color:var(--teal);font-weight:700';
  if(metric==='csat'){
    const n=needed5sForCSAT(next.min,ctx.csatSurveys);
    return{next,text:n>0?'Need '+n:'—',style:n>0?red:'color:var(--text-muted)',title:'5-star surveys needed to reach '+next.grade+' ('+next.min.toFixed(2)+'+)'};
  }
  if(metric==='ar'){
    const n=neededYesForAR(next.min,ctx.surveys);
    return{next,text:n>0?'Need '+n:'—',style:n>0?red:'color:var(--text-muted)',title:'"Yes" responses needed to reach '+next.grade+' ('+next.min.toFixed(0)+'%+)'};
  }
  // AHT — lower is better
  const gap=value-next.max;
  let text='Cut '+fmtSec(gap),style=red,title='Reduce average AHT by this much to reach '+next.grade+' (≤ '+fmtSec(next.max)+')';
  const rd=ctx.rd;
  if(rd&&rd.isCurrentMonth&&(rd.remainingDays>0||rd.todayOnly)){
    const x=_ahtPerDayNeededForMember(ctx.p,ctx.agent,next.max,rd);
    if(x!==null&&x>0){
      const daysStr=rd.todayOnly?'today':rd.remainingDays+(rd.usingWorkingDays?'wd':'d')+' left';
      text=fmtSec(Math.round(x))+'/day<span class="team-next-sub">'+daysStr+'</span>';style=teal;
      title='Average AHT needed per day to reach '+next.grade+' (≤ '+fmtSec(next.max)+')';
    } else if(x!==null){
      text='Out of reach';style='color:var(--text-muted)';
      title='Even a 0s average on the remaining days would not lift the period average to '+next.grade+' (≤ '+fmtSec(next.max)+')';
    }
  }
  return{next,text,style,title};
}

// ── Member dashboard: full threshold lists (same layout as the main dashboard) ─
// Graded against the TEAM thresholds, with "Need" values computed for this one member.
// AHT prefers the per-day framing (member's own working days); falls back to a flat
// "Cut" when there's no window to project over or the tier can't be reached.
function _memberThreshSectionHTML(metric,value,ctx){
  const isCSAT=metric==='csat',isAR=metric==='ar';
  const th=isCSAT?TEAM_CSAT_THRESHOLDS:isAR?TEAM_AR_THRESHOLDS:TEAM_AHT_THRESHOLDS;
  const title=isCSAT?'CSAT thresholds':isAR?'AR thresholds':'AHT thresholds';
  const hasVal=value!==null&&value!==undefined&&!(metric==='aht'&&!(value>0));
  const curGrade=hasVal?(isCSAT?gradeCSATTeam(value):isAR?gradeARTeam(value):gradeAHTTeam(value)).grade:null;
  const red='color:#ef4444;font-weight:600',muted='color:var(--text-muted)',cur='color:var(--text);font-weight:700';
  const rows=th.map(t=>{
    const isCur=curGrade===t.grade;
    let label,needText='—',needStyle=muted,needLong=false,needTitle='';
    if(isCSAT){
      label=t.min>0?t.min.toFixed(2)+'+':'< '+th[th.length-2].min.toFixed(2);
      if(isCur){needText=fmtCsat(value);needStyle=cur;}
      else if(hasVal&&t.min>0){const n=needed5sForCSAT(t.min,ctx.csatSurveys);if(n>0){needText='Need '+n;needStyle=red;}}
    } else if(isAR){
      label=t.min>0?t.min.toFixed(0)+'%+':'< '+th[th.length-2].min.toFixed(0)+'%';
      if(isCur){needText=value.toFixed(2)+'%';needStyle=cur;}
      else if(hasVal&&t.min>0){const n=neededYesForAR(t.min,ctx.surveys);if(n>0){needText='Need '+n;needStyle=red;}}
    } else {
      label=t.max<Infinity?'≤ '+fmtSec(t.max):'> '+fmtSec(th[th.length-2].max);
      if(isCur){needText=fmtSec(value);needStyle=cur;}
      else if(hasVal&&t.max<Infinity&&value>t.max){
        needText='Cut '+fmtSec(value-t.max);needStyle=red;
        const rd=ctx.rd;
        if(rd&&rd.isCurrentMonth&&(rd.remainingDays>0||rd.todayOnly)){
          const x=_ahtPerDayNeededForMember(ctx.p,ctx.agent,t.max,rd);
          const daysStr=rd.todayOnly?'today':rd.remainingDays+(rd.usingWorkingDays?'wd':'d')+' left';
          if(x!==null&&x>0){
            needText=fmtSec(Math.round(x))+'/day &middot; '+daysStr;needStyle='color:var(--teal);font-weight:700';needLong=true;
          } else if(x!==null){
            // Would need a negative daily AHT — no per-day figure exists for this tier any more.
            needText='Out of reach';needStyle=muted;
            needTitle='Even a 0s AHT on the remaining days ('+daysStr+') would not bring the average down to '+fmtSec(t.max);
          }
        }
      }
    }
    return `<div class="daily-aht-list-item thresh-row${isCur?' thresh-row-cur':''}" style="display:flex;align-items:center;min-height:36px">
        <span class="grade-pill ${t.cls} thresh-pill"><span class="thresh-pill-full">${t.grade}</span><span class="thresh-pill-abbr">${gradeAbbr(t.grade)}</span></span>
        <span class="thresh-label">${label}</span>
        <span class="thresh-need${needLong?' thresh-need-long':''}" style="${needStyle}"${needTitle?` title="${needTitle}"`:''}>${needText}</span>
      </div>`;
  }).join('');
  return `<div class="daily-aht-section" data-ph-click="event.stopPropagation()" style="margin-top:auto;flex-shrink:0;border-top:1px solid var(--border);padding-top:8px"><div class="daily-aht-label">${title}</div><div class="daily-aht-list" style="max-height:none;overflow:visible">${rows}</div></div>`;
}

function renderTeamView(){
  if(!document.querySelector('.team-title-input'))renderTeamViewTitle();
  const body=document.getElementById('team-view-body');
  if(!body)return;
  const agentMap=getAgentsForPeriod(activePeriodKey);
  // Include members who only have AHT/chat-count logged this period (no surveys yet) —
  // whether logged day-by-day or as a "for the month" running total.
  const _ahtPeriodForTeam=getPeriod(activePeriodKey);
  const ahtOnlyNames=getAHTLoggedAgents(_ahtPeriodForTeam).filter(n=>!agentMap.has(n)&&getMemberAHTStats(_ahtPeriodForTeam,n));
  ahtOnlyNames.forEach(n=>agentMap.set(n,[]));
  // Manually added members always get a tile, even with no surveys/AHT yet.
  const _manual=getManualMembers();
  _manual.forEach(n=>{if(!agentMap.has(n))agentMap.set(n,[]);});
  const names=[...agentMap.keys()].sort((a,b)=>a.localeCompare(b));
  if(!names.length){
    const [py,pm]=activePeriodKey.split('-').map(Number);
    const lbl=periodLabel(pm,py);
    body.innerHTML=`<div class="empty-state"><svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><p>No team members yet for ${escHtml(lbl)}. Add one with <strong>Add member</strong>, or import surveys and they'll be detected automatically.</p></div>`;
    return;
  }
  const p=getPeriod(activePeriodKey);
  const _teamRD=getProjectionWindow();
  const tiles=names.map(name=>{
    const surveys=agentMap.get(name);
    const total=surveys.length;
    const csatSurveys=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
    const avgCSAT=csatSurveys.length?calcCSAT(csatSurveys):null;
    const arResponded=surveys.filter(s=>s.ar==='yes'||s.ar==='no');
    const arYes=surveys.filter(s=>s.ar==='yes').length;
    const arPct=arResponded.length?arYes/arResponded.length*100:null;
    const csatG=avgCSAT!==null?gradeCSATTeam(avgCSAT):null;
    const arG=arPct!==null?gradeARTeam(arPct):null;
    const ahtStats=getMemberAHTStats(p,name);
    const ahtG=ahtStats?gradeAHTTeam(ahtStats.avgSec):null;
    const hasAny=avgCSAT!==null||arPct!==null||!!ahtStats;
    const kpiRaw=hasAny?(weightCSATTeam(avgCSAT)+weightARTeam(arPct)+weightAHTTeam(ahtStats?ahtStats.avgSec:0)+customMetricsPoints(activePeriodKey,'team')):null;
    const kpiG=kpiRaw!==null?kpiScoreGrade(kpiRaw):null;
    const displayName=prettifyAgentName(name);
    const initials=displayName.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?';
    const metricRow=(label,val,g)=>`<div class="team-tile-metric-row">
          <span class="team-tile-metric-label">${label}</span>
          <span class="team-tile-metric-val ${g?g.gcls:''}" style="${g?'':'color:var(--text-muted)'}">${val}</span>
          ${g?`<span class="grade-pill ${g.cls}" style="font-size:10px;padding:2px 8px">${g.grade||g.label}</span>`:''}
        </div>`;
    const nextRow=(label,info)=>{
      let right='<span class="team-next-need" style="color:var(--text-muted)">—</span>',pill='';
      if(info&&info.top){right='<span class="team-next-need" style="color:var(--green,#4ade80)">Top tier</span>';}
      else if(info){
        pill=`<span class="grade-pill ${info.next.cls}" style="font-size:10px;padding:2px 8px">${info.next.grade}</span>`;
        right=`<span class="team-next-need" style="${info.style}" title="${escHtml(info.title)}">${info.text}</span>`;
      }
      return `<div class="team-tile-metric-row"><span class="team-tile-metric-label">${label}</span>${pill}${right}</div>`;
    };
    const _nctx={csatSurveys,surveys,rd:getMemberProjectionWindow(name),p,agent:name};
    const nextTierHtml=`<div class="team-tile-next">
        <div class="team-tile-next-title">Next tier</div>
        ${nextRow('CSAT',_teamNextTier('csat',avgCSAT,_nctx))}
        ${nextRow('AR',_teamNextTier('ar',arPct,_nctx))}
        ${nextRow('AHT',_teamNextTier('aht',ahtStats?ahtStats.avgSec:null,_nctx))}
      </div>`;
    return `<div class="team-tile" data-ph-click="openMemberDashboard(this.dataset.agent)" data-agent="${escHtml(name)}" title="Click to open ${escHtml(displayName)}'s own dashboard">
      <div class="team-tile-name" style="display:flex;align-items:center;gap:6px">
        ${memberAvatarHTML(name,36,true)}
        <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${escHtml(displayName)}</span>
        ${_manual.includes(name)?`<button class="icon-btn" title="Remove from the manual list (keeps any surveys / AHT logs)" data-agent="${escHtml(name)}" data-ph-click="removeManualMemberClick(this.dataset.agent)"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`:''}
        <button class="icon-btn" title="Delete this member's data for chosen months" data-agent="${escHtml(name)}" data-ph-click="openDeleteMemberDataModal(this.dataset.agent)"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        <button class="icon-btn" title="Rename this member" data-agent="${escHtml(name)}" data-ph-click="openRenameMemberModal(this.dataset.agent)"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      </div>
      <div class="team-tile-metrics">
        ${metricRow('CSAT',avgCSAT!==null?fmtCsat(avgCSAT):'—',csatG)}
        ${metricRow('AR',arPct!==null?arPct.toFixed(2)+'%':'—',arG)}
        ${metricRow('AHT',ahtStats?fmtSec(ahtStats.avgSec):'—',ahtG)}
        ${metricRow('KPI',kpiRaw!==null?kpiRaw.toFixed(2)+'%':'—',kpiG)}
      </div>
      ${nextTierHtml}
      <div class="team-tile-total">${total} survey${total!==1?'s':''}${ahtStats?' · '+ahtStats.totalChats+' chats logged':''} this period</div>
    </div>`;
  }).join('');
  body.innerHTML=`<div class="team-grid">${tiles}</div>`;
}
// Shared row renderer for a member's per-day AHT/chat-count log, with a delete button per row.
function _memberAHTRowsHTML(agent,entries){
  return entries.map(e=>{
    const g=gradeAHTTeam(e.aht);
    const d=new Date(e.dk+'T00:00:00');
    const label=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span style="font-family:var(--mono);color:var(--text-dim);width:55px;flex-shrink:0">${label}</span>
      <span style="font-family:var(--mono);color:var(--text-muted);width:70px;flex-shrink:0">${e.count>0?e.count+' chats':'—'}</span>
      <span style="font-family:var(--mono);font-weight:600;width:60px;flex-shrink:0" class="${g.gcls}">${fmtSec(e.aht)}</span>
      <span class="grade-pill ${g.cls}" style="font-size:10px;padding:1px 7px">${g.grade}</span>
      <button class="icon-btn danger" style="margin-left:auto" title="Delete" data-ph-click="deleteMemberAHT(this.dataset.agent,this.dataset.dk)" data-agent="${escHtml(agent)}" data-dk="${e.dk}"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
    </div>`;
  }).join('');
}
function openMemberSurveyList(name){
  if(!name)return;
  const p=getPeriod(activePeriodKey);
  const surveys=(p.surveys||[]).filter(s=>(s.agent||'').trim()===name);
  const ahtEntries=getMemberAHTEntries(p,name);
  const stats=getMemberAHTStats(p,name);
  if(!surveys.length&&!stats){showToast('No matching data');return;}
  document.getElementById('tile-survey-title').textContent=`${prettifyAgentName(name)} — ${surveys.length} survey${surveys.length!==1?'s':''}`;
  let html='';
  if(stats){
    html+=`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:6px">AHT &amp; chat count — avg ${fmtSec(stats.avgSec)} · ${stats.totalChats} chats${stats.isMonthly?' · month total':''}</div>`;
    if(stats.isMonthly){
      html+=`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
        <span style="font-family:var(--mono);color:var(--text-dim);flex:1">Running total for the month</span>
        <span style="font-family:var(--mono);color:var(--text-muted)">${stats.totalChats} chats</span>
        <span style="font-family:var(--mono);font-weight:600">${fmtSec(stats.avgSec)}</span>
        <button class="icon-btn danger" title="Remove month total" data-ph-click="deleteMemberMonthlyAHT('${escHtml(name)}')"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
      </div>`;
      if(ahtEntries.length)html+=`<div style="font-size:11px;color:var(--text-muted);font-style:italic;padding:6px 0">${ahtEntries.length} daily ${ahtEntries.length===1?'entry is':'entries are'} also on file but hidden from totals while the month total is set.</div>`;
    } else {
      html+=_memberAHTRowsHTML(name,ahtEntries);
    }
    html+=`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin:14px 0 6px">Surveys</div>`;
  }
  html+=surveys.length?_tileSurveyRowsHTML(surveys):`<div style="font-size:12px;color:var(--text-muted);font-style:italic;padding:6px 0">No surveys this period.</div>`;
  document.getElementById('tile-survey-body').innerHTML=html;
  document.getElementById('tile-survey-modal').classList.add('open');
}

// ── Member Dashboard (per-member scoped dashboard) ──────────────────────────
// Reuses the exact same grading logic/thresholds as the Team View tiles
// (TEAM_CSAT_THRESHOLDS / TEAM_AR_THRESHOLDS / TEAM_AHT_THRESHOLDS + the shared
// KPI_WEIGHTS), just scoped to one member's own surveys + AHT log instead of
// the whole team. Kept intentionally lean: the 5 headline KPI cards only, no
// daily grid / heatmap / mini-cal — those already live on the main dashboard.
function _progressBarHTML(current,thresholds,colorVar,labelFn){
  if(current===null)return '';
  const currentG=thresholds.find(t=>current>=t.min);
  if(!currentG)return '';
  const currentIdx=thresholds.findIndex(t=>t.grade===currentG.grade);
  if(currentIdx<=0){
    return `<div class="progress-bar-wrap"><div class="progress-bar-label"><span>🏆 At top grade</span><span>100%</span></div><div class="progress-bar-track"><div class="progress-bar-fill" style="width:100%;background:${colorVar}"></div></div></div>`;
  }
  const nextBetter=thresholds[currentIdx-1];
  const prevFloor=thresholds[currentIdx].min;
  const range=nextBetter.min-prevFloor;
  const progress=Math.max(0,Math.min(100,(current-prevFloor)/range*100));
  return `<div class="progress-bar-wrap"><div class="progress-bar-label"><span>${currentG.grade} (${labelFn(prevFloor)}) → ${nextBetter.grade} (${labelFn(nextBetter.min)})</span><span>${Math.round(progress)}%</span></div>
    <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${progress}%;background:${colorVar}"></div></div></div>`;
}
function _ahtProgressBarHTML(sec,thresholds,agent){
  if(!sec||sec<=0)return{bar:'',need:''};
  const currentG=gradeAHTWith(sec,thresholds);
  const currentIdx=thresholds.findIndex(t=>t.grade===currentG.grade);
  if(currentIdx<=0)return{bar:'',need:''};
  const nextBetter=thresholds[currentIdx-1];
  const isOpenEndedTier=currentIdx>=thresholds.length-1;
  const prevThresh=isOpenEndedTier?sec+500:thresholds[currentIdx].max;
  const range=prevThresh-nextBetter.max;
  const progress=Math.max(0,Math.min(100,(prevThresh-sec)/range*100));
  const leftLabel=isOpenEndedTier?fmtSec(sec):fmtSec(prevThresh);
  const bar=`<div class="progress-bar-wrap"><div class="progress-bar-label"><span>${currentG.grade} (${leftLabel}) → ${nextBetter.grade} (${fmtSec(nextBetter.max)})</span><span>${Math.round(progress)}%</span></div>
    <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${progress}%;background:var(--teal)"></div></div></div>`;
  const cutSec=sec-nextBetter.max;
  let pacing='';
  if(cutSec>0&&agent){
    const pw=getMemberProjectionWindow(agent);
    if(pw.isCurrentMonth&&pw.remainingDays>0){
      const x=memberNeededDailyAHTForThreshold(nextBetter.max,pw.remainingDays,agent);
      if(x!==null){
        const dLbl=pw.usingWorkingDays?'wd':'d';
        const daysStr=pw.todayOnly?'today':pw.remainingDays+dLbl+' left';
        pacing=x>0
          ?`<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:var(--teal);background:var(--teal-dim);border:1px solid rgba(20,184,166,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">🎯 avg ${fmtSec(Math.round(x))}/day · ${daysStr}</span>`
          :`<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">&#9888; not reachable ${daysStr}</span>`;
      }
    }
  }
  const need=cutSec>0?`<div class="need-info" style="display:block">Cut <span>${fmtSec(cutSec)}</span> for <span>${nextBetter.grade}</span>${pacing}</div>`:'';
  return{bar,need};
}
function openMemberDashboard(name){
  if(!name)return;
  // Year picked in this member's YTD strip survives month-to-month reloads of the open popup,
  // but resets when the popup is freshly opened or switched to a different member.
  if(!document.getElementById('member-dashboard-modal').classList.contains('open')||name!==_memberYTDAgent)_memberYTDYear=null;
  _memberYTDAgent=name;
  const p=getPeriod(activePeriodKey);
  const surveys=(p.surveys||[]).filter(s=>(s.agent||'').trim()===name);
  const total=surveys.length;

  const displayName=prettifyAgentName(name);
  const firstName=displayName.split(/\s+/)[0]||displayName;
  document.getElementById('member-dash-name').textContent=`${firstName}${firstName.toLowerCase().endsWith('s')?"'":"'s"} Dashboard`;
  document.getElementById('member-dash-name').dataset.agent=name;
  document.getElementById('member-dash-log-btn').dataset.agent=name;
  const _mdd=document.getElementById('member-dash-delete-btn');if(_mdd)_mdd.dataset.agent=name;
  const _mds=document.getElementById('member-dash-sim-btn');if(_mds)_mds.dataset.agent=name;
  const [py,pm]=activePeriodKey.split('-').map(Number);
  document.getElementById('member-dash-period').textContent=periodLabel(pm,py);
  const initials=displayName.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?';
  const _mda=document.getElementById('member-dash-avatar');_mda.dataset.agent=name;_mda.setAttribute('data-ph-click','openAvatarPicker(this.dataset.agent)');_mda.title='Change avatar';_mda.innerHTML=memberAvatarInner(name,42);

  // This member's own Working Days calendar (independent of the team-wide one)
  document.getElementById('member-wday-open-btn').dataset.agent=name;
  refreshMemberWdayBadge(name);
  const memberRD=getMemberRemainingDays(name);
  const wdayDaysEl=document.getElementById('member-wday-days-left');
  if(wdayDaysEl){
    if(memberRD.isCurrentMonth){
      wdayDaysEl.textContent=memberRD.usingWorkingDays
        ?` · ${memberRD.remainingDays} working day${memberRD.remainingDays!==1?'s':''} left`
        :` · ${memberRD.remainingDays} day${memberRD.remainingDays!==1?'s':''} left (no working days set)`;
    } else {
      wdayDaysEl.textContent='';
    }
  }

  // CSAT
  const csatSurveys=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
  const avgCSAT=csatSurveys.length?calcCSAT(csatSurveys):null;
  const csatG=avgCSAT!==null?gradeCSATTeam(avgCSAT):null;
  const csatScoreBuckets=[5,4.5,4,3.5,3,2.5,2,1.5,1];
  const escName=escHtml(name);
  const csatTile=(label,cnt,fg,bg,clickAttr)=>`<div class="total-breakdown-tile"${clickAttr?` data-ph-click="${clickAttr}" style="cursor:pointer;background:${bg||'var(--surface2)'};border:1px solid var(--border);border-radius:6px;padding:2px 6px 3px;min-width:28px;text-align:center;line-height:1.15" title="Click to see these surveys"`:` style="background:${bg||'var(--surface2)'};border:1px solid var(--border);border-radius:6px;padding:2px 6px 3px;min-width:28px;text-align:center;line-height:1.15"`}><div style="font-size:9px;color:var(--text-muted);font-family:var(--mono)">${label}</div><div style="font-size:12px;font-weight:600;font-family:var(--mono);color:${fg}">${cnt}</div></div>`;
  const csatBreakdownTiles=csatScoreBuckets.map(sc=>{
    const cnt=csatSurveys.filter(s=>s.csat===sc).length;
    return cnt>0?csatTile(sc,cnt,'var(--orange)',null,`openMemberTileList('${escName}','csat',${sc})`):'';
  }).filter(Boolean).join('');
  const csatBreakdown=csatScoreBuckets.map(sc=>{
    const cnt=csatSurveys.filter(s=>s.csat===sc).length;
    return cnt>0?`<span style="white-space:nowrap;font-family:var(--mono)"><span style="color:var(--amber);font-size:13px;font-weight:600">${sc}</span><span style="color:var(--text-muted);font-size:11px"> x </span><span style="color:var(--accent);font-size:14px;font-weight:700">${cnt}</span></span>`:'';
  }).filter(Boolean).join(' <span style="color:var(--border2)">·</span> ');

  // AR
  const arResponded=surveys.filter(s=>s.ar==='yes'||s.ar==='no');
  const arYes=surveys.filter(s=>s.ar==='yes').length;
  const arNo=arResponded.length-arYes;
  const arPct=arResponded.length?arYes/arResponded.length*100:null;
  const arG=arPct!==null?gradeARTeam(arPct):null;
  const arBreakdownTiles=arResponded.length>0
    ? csatTile('Yes',arYes,'#4ade80','rgba(74,222,128,0.12)',arYes>0?`openMemberTileList('${escName}','ar','yes')`:null)+csatTile('No',arNo,'#f87171','rgba(248,113,113,0.12)',arNo>0?`openMemberTileList('${escName}','ar','no')`:null)
    : '';

  // AHT
  const ahtStats=getMemberAHTStats(p,name);
  const ahtG=ahtStats?gradeAHTTeam(ahtStats.avgSec):null;

  // Final KPI
  const hasAny=avgCSAT!==null||arPct!==null||!!ahtStats;
  const wc=weightCSATTeam(avgCSAT),wa=weightARTeam(arPct),wh=weightAHTTeam(ahtStats?ahtStats.avgSec:0);
  const cmRows=customMetricBreakdown(activePeriodKey,'team');
  const wcm=Math.round(cmRows.reduce((a,r)=>a+r.pts,0)*100)/100;
  const kpiRaw=hasAny?(wc+wa+wh+wcm):null;
  const kpiG=kpiRaw!==null?kpiScoreGrade(kpiRaw):null;

  const card=(cls,iconCls,iconSvg,label,valHtml,sub,badge,progressHtml,needHtml,iconStyle,clickAttr,sparkHtml)=>`
    <div class="kpi-card ${cls}"${clickAttr?` data-ph-click="${clickAttr}" style="cursor:pointer" title="Click for details"`:''}>
      <div class="kpi-icon ${iconCls}"${iconStyle?` style="${iconStyle}"`:''}>${iconSvg}</div>
      <div class="kpi-metric-label">${label}</div>
      <div class="kpi-value">${valHtml}</div>
      <div class="kpi-sub">${sub}</div>
      ${badge?`<div>${badge}</div>`:''}
      ${progressHtml||''}
      ${sparkHtml||''}
      ${needHtml||''}
    </div>`;

  const totalIcon='<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  const csatIcon='<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
  const arIcon='<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  const ahtIcon='<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  const kpiIcon='<svg fill="none" stroke="#a855f7" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

  const ahtProg=ahtStats?_ahtProgressBarHTML(ahtStats.avgSec,TEAM_AHT_THRESHOLDS,name):{bar:'',need:''};
  const _mctx={csatSurveys,surveys,rd:getMemberProjectionWindow(name),p,agent:name};

  const sparkTotal='<canvas class="sparkline" id="member-spark-total" width="120" height="28" style="margin-top:4px"></canvas>';
  const sparkCSAT='<canvas class="sparkline" id="member-spark-csat" width="120" height="28" style="margin-top:4px"></canvas>';
  const sparkAR='<canvas class="sparkline" id="member-spark-ar" width="120" height="28" style="margin-top:4px"></canvas>';
  const sparkAHT='<canvas class="sparkline" id="member-spark-aht" width="120" height="28" style="margin-top:4px"></canvas>';
  const sparkKPI='<canvas class="sparkline" id="member-spark-kpi" width="120" height="28" style="margin-top:4px"></canvas>';

  // Final KPI tile — same layout as the main dashboard's tile (grade-coloured score,
  // trend vs last month, EOM projection, sparkline, score breakdown, KPI history),
  // fed with this member's own numbers and the Team thresholds / team-scoped metrics.
  const kx=_memberKpiTileExtras(name,{avgCSAT,arPct,ahtStats,wc,wa,wh,kpiRaw,csatSurveys,surveys});
  const kpiCardHtml=`
    <div class="kpi-card" style="position:relative;overflow:hidden;${kpiRaw!==null?'cursor:pointer':''}"${kpiRaw!==null?` data-ph-click="openMemberCardDetail('${escName}','kpi')" title="Click for details"`:''}>
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--teal),var(--green))"></div>
      <div class="kpi-icon" style="background:rgba(168,85,247,0.12);margin-bottom:0.75rem">${kpiIcon}</div>
      <div class="kpi-metric-label">Final KPI Score</div>
      <div style="display:flex;align-items:baseline;gap:4px">
        <div class="kpi-value ${kpiG?kpiG.gcls:''}"${kpiG?'':' style="color:var(--purple)"'}>${kpiRaw!==null?kpiRaw.toFixed(2)+'%':'—'}</div>
        <span class="trend-arrow">${kx.trend}</span>
      </div>
      <div class="kpi-sub" style="font-size:11px;color:var(--text-muted)">${kpiFormulaLabel('team')}</div>
      ${kpiG?`<div style="margin-top:6px"><div class="grade-pill ${kpiG.cls}">${kpiG.label}</div></div>`:''}
      ${kx.proj}
      ${sparkKPI}
      <div class="daily-aht-section" data-ph-click="event.stopPropagation()" style="margin-top:auto;flex-shrink:0">
        <div class="daily-aht-label">Score breakdown</div>
        <div style="margin-bottom:6px">${kx.breakdown}</div>
        <div class="daily-aht-label" style="margin-top:6px">KPI history</div>
        <div class="daily-aht-list">${kx.history}</div>
      </div>
    </div>`;

  const cards=[
    card('total-card',
      'orange',totalIcon,'Total surveys',
      total,
      total===1?'survey this period':'surveys this period',
      '',
      '',
      (csatBreakdownTiles||arBreakdownTiles)?`<div class="daily-aht-section" style="border-top:1px solid var(--border);padding-top:8px;margin-top:8px">
          ${csatBreakdownTiles?`<div class="daily-aht-label" style="margin-bottom:4px">Score breakdown</div><div style="display:flex;flex-wrap:wrap;gap:4px">${csatBreakdownTiles}</div>`:''}
          ${arBreakdownTiles?`<div class="daily-aht-label" style="margin:6px 0 4px">AR breakdown</div><div style="display:flex;flex-wrap:wrap;gap:4px">${arBreakdownTiles}</div>`:''}
        </div>`:'',
      '',
      total>0?`openMemberCardDetail('${escName}','total')`:null,
      sparkTotal
    ),
    card('csat-card',
      'blue',csatIcon,'CSAT Score',
      avgCSAT!==null?`<span class="${csatG.gcls}">${fmtCsat(avgCSAT)}</span>`:'—',
      csatSurveys.length?csatSurveys.length+' survey'+(csatSurveys.length!==1?'s':''):'0 surveys',
      csatG?`<div class="grade-pill ${csatG.cls}">${csatG.grade}</div>`:'',
      avgCSAT!==null?_progressBarHTML(avgCSAT,TEAM_CSAT_THRESHOLDS,'var(--accent)',v=>fmtCsat(v)):'',
      (()=>{if(avgCSAT===null)return'';const nextG=TEAM_CSAT_THRESHOLDS.find(t=>t.min>avgCSAT&&t.min>0);if(!nextG)return'';const n=needed5sForCSAT(nextG.min,csatSurveys);
        let pacing='';
        const pw=getMemberProjectionWindow(name);
        if(pw.isCurrentMonth&&pw.remainingDays>0){
          const r=memberAvgCSATNeededPerDay(nextG.min,csatSurveys,pw.remainingDays,pw.daysElapsed);
          if(r){
            const dLbl=pw.usingWorkingDays?'wd':'d';
            const daysStr=pw.todayOnly?'today':pw.remainingDays+dLbl+' left';
            if(r.avgNeeded>0&&r.avgNeeded<=5){
              pacing=`<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:var(--teal);background:var(--teal-dim);border:1px solid rgba(20,184,166,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">🎯 avg ${r.avgNeeded.toFixed(2)}/day · ${daysStr}</span>`;
            } else if(r.avgNeeded>5){
              pacing=`<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">&#9888; not reachable ${daysStr}</span>`;
            }
          }
        }
        return`<div class="need-info" style="display:block">Need <span>${n}</span> more 5 for <span>${nextG.grade}</span>${pacing}</div>`;})()+_memberThreshSectionHTML('csat',avgCSAT,_mctx),
      '',
      csatSurveys.length?`openMemberCardDetail('${escName}','csat')`:null,
      sparkCSAT
    ),
    card('ar-card',
      'green',arIcon,'Agent Resolution (AR)',
      arPct!==null?`<span class="${arG.gcls}">${arPct.toFixed(2)}%</span>`:'—',
      arResponded.length?`<span style="color:#4ade80">Yes: <strong>${arYes}</strong></span> · <span style="color:#f87171">No: <strong>${arNo}</strong></span>`:'0 surveys',
      arG?`<div class="grade-pill ${arG.cls}">${arG.grade}</div>`:'',
      arPct!==null?_progressBarHTML(arPct,TEAM_AR_THRESHOLDS,'var(--green)',v=>v.toFixed(2)+'%'):'',
      (()=>{if(arPct===null)return'';const nextG=TEAM_AR_THRESHOLDS.find(t=>t.min>arPct&&t.min>0);if(!nextG)return'';const n=neededYesForAR(nextG.min,surveys);
        let pacing='';
        const pw=getMemberProjectionWindow(name);
        if(pw.isCurrentMonth&&pw.remainingDays>0){
          const r=memberAvgARNeededPerDay(nextG.min,surveys,pw.remainingDays,pw.daysElapsed);
          if(r){
            const dLbl=pw.usingWorkingDays?'wd':'d';
            const daysStr=pw.todayOnly?'today':pw.remainingDays+dLbl+' left';
            if(r.pctNeeded>0&&r.pctNeeded<=100){
              pacing=`<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:var(--teal);background:var(--teal-dim);border:1px solid rgba(20,184,166,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">🎯 avg ${r.pctNeeded.toFixed(1)}% YES/day · ${daysStr}</span>`;
            } else if(r.pctNeeded>100){
              pacing=`<br><span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:5px;padding:2px 7px;white-space:nowrap">&#9888; not reachable ${daysStr}</span>`;
            }
          }
        }
        return`<div class="need-info" style="display:block">Need <span>${n}</span> more YES for <span>${nextG.grade}</span>${pacing}</div>`;})()+_memberThreshSectionHTML('ar',arPct,_mctx),
      '',
      arResponded.length?`openMemberCardDetail('${escName}','ar')`:null,
      sparkAR
    ),
    card('aht-card',
      'teal',ahtIcon,'Avg Handle Time (AHT)',
      ahtStats?`<span class="${ahtG.gcls}">${fmtSec(ahtStats.avgSec)}</span>`:'—',
      ahtStats?ahtStats.totalChats+' chats logged':'No AHT logged',
      ahtG?`<div class="grade-pill ${ahtG.cls}">${ahtG.grade}</div>`:'',
      ahtProg.bar,
      ahtProg.need+_memberThreshSectionHTML('aht',ahtStats?ahtStats.avgSec:null,_mctx),
      '',
      ahtStats?`openMemberCardDetail('${escName}','aht')`:null,
      sparkAHT
    ),
    kpiCardHtml
  ].join('');

  document.getElementById('member-dashboard-body').innerHTML=`
    <div id="member-ytd-strip" style="display:none"></div>
    <div class="kpi-grid" style="margin-bottom:0">${cards}</div>
    <div class="section-header" style="margin-top:1rem">
      <div class="section-title">Daily breakdown</div>
    </div>
    <div class="daily-grid" id="member-daily-grid">
      <div class="day-tile"><div class="day-empty">No survey data yet.</div></div>
    </div>`;
  document.getElementById('member-dashboard-modal').classList.add('open');
  renderMemberYTDStrip(name);
  dailyFilter.member=null;
  renderMemberDailyGrid(name,surveys);

  // Sparklines — same drawSparkline/click-to-expand infra as the main dashboard,
  // just fed this member's own surveys + AHT log instead of the whole team's.
  (function(){
    const mdays=getDailyStats(surveys);
    const dkeys=Object.keys(mdays).sort();
    if(dkeys.length>=2){
      const csatPairs=dkeys.map(dk=>{const s=mdays[dk].surveys.filter(sv=>sv.csat!==null&&!isNaN(sv.csat));return s.length>0?{dk,v:calcCSAT(s)}:null}).filter(Boolean);
      const arPairs=dkeys.map(dk=>{const s=mdays[dk].surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');const y=mdays[dk].surveys.filter(sv=>sv.ar==='yes').length;return s.length>0?{dk,v:y/s.length*100}:null}).filter(Boolean);
      const totalPairs=dkeys.map(dk=>({dk,v:mdays[dk].surveys.length}));
      if(csatPairs.length>=2)drawSparkline('member-spark-csat',csatPairs.map(pt=>pt.v),'#3b82f6',{labels:csatPairs.map(pt=>fmtSparkDate(pt.dk)),formatValue:v=>fmtCsat(v),title:`${displayName} — CSAT Score`});else drawNoDataSparkline('member-spark-csat');
      if(arPairs.length>=2)drawSparkline('member-spark-ar',arPairs.map(pt=>pt.v),'#22c55e',{labels:arPairs.map(pt=>fmtSparkDate(pt.dk)),formatValue:v=>v.toFixed(2)+'%',title:`${displayName} — Agent Resolution (AR)`});else drawNoDataSparkline('member-spark-ar');
      if(totalPairs.length>=2)drawSparkline('member-spark-total',totalPairs.map(pt=>pt.v),'#f97316',{labels:totalPairs.map(pt=>fmtSparkDate(pt.dk)),formatValue:v=>Math.round(v)+(Math.round(v)===1?' survey':' surveys'),title:`${displayName} — Total Surveys`});else drawNoDataSparkline('member-spark-total');
    } else {
      drawNoDataSparkline('member-spark-csat');
      drawNoDataSparkline('member-spark-ar');
      drawNoDataSparkline('member-spark-total');
    }
    const ahtEntries=getMemberAHTEntries(p,name);
    if(ahtEntries.length>=2){
      drawSparkline('member-spark-aht',ahtEntries.map(e=>e.aht),'#14b8a6',{labels:ahtEntries.map(e=>fmtSparkDate(e.dk)),formatValue:v=>fmtSec(Math.round(v)),title:`${displayName} — Avg Handle Time (AHT)`});
    } else {
      drawNoDataSparkline('member-spark-aht');
    }
    const kpiMonthly=_memberMonthlyKPIPairs(name);
    const kpiPairs=_memberDailyKPIPairs(surveys,ahtEntries);
    if(kpiMonthly.length>=2){
      drawSparkline('member-spark-kpi',kpiMonthly.map(pt=>pt.v),'#a855f7',{labels:kpiMonthly.map(pt=>fmtSparkMonth(pt.k)),formatValue:v=>v.toFixed(2)+'%',title:`${displayName} — Final KPI Score`});
    } else if(kpiPairs.length>=2){
      drawSparkline('member-spark-kpi',kpiPairs.map(pt=>pt.v),'#a855f7',{labels:kpiPairs.map(pt=>fmtSparkDate(pt.dk)),formatValue:v=>v.toFixed(1)+'%',title:`${displayName} — Final KPI Score`});
    } else {
      drawNoDataSparkline('member-spark-kpi');
    }
  })();
}

// ── Member Year-to-Date strip ───────────────────────────────────────────────
// Same strip as the main Dashboard's (title, year picker, Surveys / CSAT / AR / AHT / KPI /
// Months tracked, plus one tile per month), scoped to this one member and graded against the
// Team thresholds like the rest of the member dashboard. Shown/hidden by the same
// "Year-to-date strip" switch in Settings (_showYTDStrip).
let _memberYTDYear=null,_memberYTDAgent=null,_memberYTDYears=[];
// One member's numbers for one month (surveys, CSAT, AR, AHT + chat weight, KPI).
function _memberMonthStats(k,name){
  const p=state[k];if(!p)return null;
  const surveys=(p.surveys||[]).filter(sv=>(sv.agent||'').trim()===name);
  const csatS=surveys.filter(sv=>sv.csat!==null&&sv.csat!==undefined&&!isNaN(sv.csat));
  const avgCSAT=csatS.length?calcCSAT(csatS):null;
  const arR=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arY=arR.filter(sv=>sv.ar==='yes').length;
  const arPct=arR.length?arY/arR.length*100:null;
  const ahtStats=getMemberAHTStats(p,name);
  let ahtSec=0,ahtW=0;
  if(ahtStats){
    ahtSec=ahtStats.avgSec;
    ahtW=ahtStats.isMonthly?(ahtStats.totalChats||1):getMemberAHTEntries(p,name).reduce((a,e)=>a+(e.count||1),0);
  }
  const hasAny=avgCSAT!==null||arPct!==null||ahtSec>0;
  const kpi=hasAny?weightCSATTeam(avgCSAT)+weightARTeam(arPct)+weightAHTTeam(ahtSec)+customMetricsPoints(k,'team'):null;
  return{k,surveys,avgCSAT,arPct,ahtSec,ahtW,kpi,hasData:surveys.length>0||ahtSec>0};
}
// Year-to-date roll-up for one member (null when they have nothing logged that year).
function getMemberYTDStats(name,year){
  const keys=Object.keys(state).filter(k=>/^\d{4}-\d{2}$/.test(k)&&parseInt(k.slice(0,4))===year).sort();
  const months=keys.map(k=>_memberMonthStats(k,name)).filter(m=>m&&m.hasData);
  if(!months.length)return null;
  const allSurveys=months.reduce((a,m)=>a.concat(m.surveys),[]);
  const csatS=allSurveys.filter(sv=>sv.csat!==null&&sv.csat!==undefined&&!isNaN(sv.csat));
  const avgCSAT=csatS.length?calcCSAT(csatS):null;
  const arR=allSurveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arPct=arR.length?arR.filter(sv=>sv.ar==='yes').length/arR.length*100:null;
  const ahtMonths=months.filter(m=>m.ahtSec>0);
  const ahtW=ahtMonths.reduce((a,m)=>a+m.ahtW,0);
  const avgAHT=ahtW?Math.round(ahtMonths.reduce((a,m)=>a+m.ahtSec*m.ahtW,0)/ahtW):0;
  const hasAny=avgCSAT!==null||arPct!==null||avgAHT>0;
  const kpi=hasAny?weightCSATTeam(avgCSAT)+weightARTeam(arPct)+weightAHTTeam(avgAHT)+customMetricsPointsYTD(months.map(m=>m.k),'team'):null;
  return{year,months,total:allSurveys.length,avgCSAT,arPct,avgAHT,kpi};
}
function renderMemberYTDStrip(name){
  const el=document.getElementById('member-ytd-strip');
  if(!el)return;
  if(typeof _showYTDStrip!=='undefined'&&!_showYTDStrip){el.style.display='none';el.innerHTML='';return;}
  const curY=parseInt(activePeriodKey.split('-')[0]);
  const y=_memberYTDYear||curY;
  // Years this member has anything logged in (plus the active year) for the year reel.
  const years=[...new Set(Object.keys(state).filter(k=>/^\d{4}-\d{2}$/.test(k)).map(k=>{const m=_memberMonthStats(k,name);return m&&m.hasData?parseInt(k.slice(0,4)):null;}).filter(v=>v!==null))];
  if(!years.includes(curY))years.push(curY);
  if(!years.includes(y))years.push(y);
  years.sort((a,b)=>b-a);
  _memberYTDYears=years;
  const ytd=getMemberYTDStats(name,y);
  const dash='—';
  const cell=(label,id,color,val,cls)=>`<div class="daily-avg-divider" style="height:28px"></div><div class="daily-avg-item"><div class="daily-avg-label">${label}</div><div class="daily-avg-val ${cls||''}" id="${id}" style="${cls?'':'color:'+color}">${val}</div></div>`;
  let title='YTD '+y,cells,grid;
  if(!ytd){
    cells=cell('Surveys','member-ytd-total','var(--orange)',dash)+cell('CSAT','member-ytd-csat','var(--accent)',dash)+cell('Agent Resolution','member-ytd-ar','var(--green)',dash)+cell('Avg AHT','member-ytd-aht','var(--teal)',dash)+cell('KPI Score','member-ytd-kpi','var(--purple)',dash)+cell('Months tracked','member-ytd-months','var(--text-dim)','0');
    grid='<div style="font-size:11px;color:var(--text-muted);padding:8px 0">No data for this year</div>';
  }else{
    title+=' (Jan–'+MONTHS[parseInt(ytd.months[ytd.months.length-1].k.split('-')[1])-1].slice(0,3)+')';
    const cg=ytd.avgCSAT!==null?gradeCSATTeam(ytd.avgCSAT):null;
    const ag=ytd.arPct!==null?gradeARTeam(ytd.arPct):null;
    const hg=ytd.avgAHT>0?gradeAHTTeam(ytd.avgAHT):null;
    const kg=ytd.kpi!==null?kpiScoreGrade(ytd.kpi):null;
    cells=cell('Surveys','member-ytd-total','var(--orange)',ytd.total)
      +cell('CSAT','member-ytd-csat','var(--accent)',ytd.avgCSAT!==null?fmtCsat(ytd.avgCSAT):dash,cg&&cg.gcls)
      +cell('Agent Resolution','member-ytd-ar','var(--green)',ytd.arPct!==null?ytd.arPct.toFixed(2)+'%':dash,ag&&ag.gcls)
      +cell('Avg AHT','member-ytd-aht','var(--teal)',ytd.avgAHT>0?fmtSec(ytd.avgAHT):dash,hg&&hg.gcls)
      +cell('KPI Score','member-ytd-kpi','var(--purple)',ytd.kpi!==null?ytd.kpi.toFixed(2)+'%':dash,kg&&kg.gcls)
      +cell('Months tracked','member-ytd-months','var(--text-dim)',ytd.months.length);
    grid=ytd.months.map(m=>{
      const cG=m.avgCSAT!==null?gradeCSATTeam(m.avgCSAT):null;
      const aG=m.arPct!==null?gradeARTeam(m.arPct):null;
      const hG=m.ahtSec>0?gradeAHTTeam(m.ahtSec):null;
      const g=m.kpi!==null?kpiScoreGrade(m.kpi):null;
      const isActive=m.k===activePeriodKey;
      const mIdx=parseInt(m.k.split('-')[1])-1;
      return `<div class="highlight-tile ym-tile" style="background:var(--surface3);border:1px solid ${isActive?'var(--accent)':'var(--border)'};border-radius:8px;padding:8px 10px;cursor:pointer;${isActive?'box-shadow:0 0 0 1px var(--accent);':''}" data-ph-click="memberYTDGoToMonth(this.dataset.pk)" data-pk="${m.k}" title="Open ${MONTHS[mIdx]} ${m.k.slice(0,4)}">
      <div class="ym-tooltip">
        <div class="ym-row"><span>Surveys</span><span style="font-family:var(--mono)">${m.surveys.length}</span></div>
        <div class="ym-row"><span>CSAT</span><span style="font-family:var(--mono)" class="${cG?cG.gcls:''}">${m.avgCSAT!==null?fmtCsat(m.avgCSAT):dash}</span></div>
        <div class="ym-row"><span>Agent Resolution</span><span style="font-family:var(--mono)" class="${aG?aG.gcls:''}">${m.arPct!==null?m.arPct.toFixed(2)+'%':dash}</span></div>
        <div class="ym-row"><span>AHT</span><span style="font-family:var(--mono)" class="${hG?hG.gcls:''}">${m.ahtSec>0?fmtSec(m.ahtSec):dash}</span></div>
        <div class="ym-row"><span>Final KPI</span><span style="font-family:var(--mono)" class="${g?g.gcls:''}">${m.kpi!==null?m.kpi.toFixed(2)+'%':dash}</span></div>
      </div>
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:3px">${MONTHS[mIdx].slice(0,3)}</div>
      <div style="font-size:15px;font-weight:600;font-family:var(--mono)" class="${g?g.gcls:''}">${m.kpi!==null?m.kpi.toFixed(2)+'%':dash}</div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${m.surveys.length} surveys</div>
    </div>`;
    }).join('');
  }
  el.style.cssText='display:flex;flex-direction:column;gap:0.75rem;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 16px;margin-bottom:1rem;outline:none';
  el.innerHTML=`<div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;width:100%">
      <div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);flex-shrink:0;white-space:nowrap">${title}</div>
      <button type="button" id="member-ytd-year-select" data-ph-click="event.stopPropagation();openMemberYTDYearPicker(this)" style="background:var(--surface3);border:1px solid var(--border);color:var(--text);font-size:11px;border-radius:6px;padding:3px 8px;font-family:var(--mono);cursor:pointer">${y}</button>
      ${cells}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px">${grid}</div>`;
}
// Clicking a month tile jumps this member's dashboard to that month (setActivePeriod reloads the open popup).
function memberYTDGoToMonth(pk){
  if(!pk)return;
  const [py,pm]=pk.split('-').map(Number);
  _memberYTDYear=null;
  setActivePeriod(pm,py);
}

// ── Member Daily Breakdown Grid ──────────────────────────────────────────
// Same day-tile visuals as the main dashboard's daily grid (score rows,
// CSAT distribution bars, low-score alert, daily-target progress), scoped to
// one member's own surveys + AHT log and graded against the same Team
// thresholds as the rest of the member view. Deliberately leaves out the
// mood picker and sticky-note annotation button from the main grid — those
// are whole-team, one-per-day concepts, not this member's to set from inside
// their own scoped dashboard. Tapping a tile opens that member's surveys for
// just that day (via the shared Tile Survey List modal).
function renderMemberDailyGrid(agent,surveys){
  const grid=document.getElementById('member-daily-grid');
  if(!grid)return;
  _memberGridCtx={agent,surveys};
  const _f=dailyFilter.member;
  if(_f)surveys=surveys.filter(sv=>_dailyFilterMatch(_f,sv));
  const days=getDailyStats(surveys);
  const p=getPeriod(activePeriodKey);
  const ahtEntries=getMemberAHTEntries(p,agent);
  const ahtByDay={};
  ahtEntries.forEach(e=>{ahtByDay[e.dk]=e.aht;});
  // Include days that only have an AHT entry logged (no CSAT/AR surveys) so they still get a tile
  if(!_f)Object.keys(ahtByDay).forEach(dk=>{if(!days[dk])days[dk]={surveys:[]};});
  const keys=Object.keys(days).sort();
  _renderDailyFilterBar('member',grid,keys.length,surveys.length);
  if(keys.length===0){
    grid.innerHTML='<div class="day-tile"><div class="day-empty">'+(_f?'No surveys match this filter.':'No survey data yet.')+'</div></div>';
    return;
  }
  const target=_f?0:getDailyTarget();
  grid.innerHTML='';
  keys.forEach(dk=>{
    const daySurveys=days[dk].surveys;
    const csatDaySurveys=daySurveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const csatAvg=csatDaySurveys.length>0?calcCSAT(csatDaySurveys):null;
    const arResponded=daySurveys.filter(s=>s.ar==='yes'||s.ar==='no');
    const arYes=daySurveys.filter(s=>s.ar==='yes').length;
    const arPct=arResponded.length>0?arYes/arResponded.length*100:null;
    const arNo=arResponded.length-arYes;
    const arYesNoHTML=arResponded.length>0
      ?`<div class="day-score-row"><span class="day-score-key">Yes/No</span><span class="day-score-val" style="font-size:11px">${_dfChip('member','ar','yes',arYes,'var(--green)','Yes')}<span style="color:var(--text-muted)"> / </span>${_dfChip('member','ar','no',arNo,'var(--red)','No')}</span></div>`
      :`<div class="day-score-row"><span class="day-score-key">Yes/No</span><span class="day-score-val" style="color:var(--text-muted)">—</span></div>`;
    const dayAHTSec=ahtByDay[dk]||0;

    let distHTML='';
    if(csatDaySurveys.length>0){
      const scores=[5,4.5,4,3.5,3,2.5,2,1.5,1];
      const maxCount=Math.max(...scores.map(sc=>csatDaySurveys.filter(s=>s.csat===sc).length));
      const bars=scores.map(sc=>{
        const cnt=csatDaySurveys.filter(s=>s.csat===sc).length;
        if(!cnt)return'';
        const barH=maxCount>0?Math.max(3,Math.round(cnt/maxCount*18)):3;
        const col=sc>=4.9?'var(--green)':sc>=4.5?'var(--accent)':sc>=4?'var(--amber)':'var(--red)';
        return`<div data-filter-chip="1" data-action="event.stopPropagation();setDailyFilter('member','csat',${sc})" style="display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;padding:1px 2px;border-radius:3px;${(_f&&_f.type==='csat'&&_f.val===sc)?'outline:1px solid var(--accent);background:rgba(148,163,184,.18)':''}" title="${sc}×${cnt} — click to filter by this score">
          <span style="font-size:8px;font-family:var(--mono);color:var(--text-muted);line-height:1">${cnt}</span>
          <div style="width:6px;height:${barH}px;background:${col};border-radius:2px 2px 0 0"></div>
          <span style="font-size:7px;font-family:var(--mono);color:var(--text-muted);line-height:1">${sc}</span>
        </div>`;
      }).filter(Boolean).join('');
      distHTML=`<div style="display:flex;align-items:flex-end;gap:3px;margin-top:3px;padding-top:3px;border-top:1px solid var(--border)">${bars}</div>`;
    }

    const tile=document.createElement('div');
    tile.className='day-tile';
    tile.style.cursor='pointer';
    tile.title="Click to view this member's surveys for the day";
    tile.addEventListener('click',function(e){if(e.target.closest('[data-filter-chip]'))return;openMemberDayDetail(agent,dk);});

    const csatHTML=csatAvg!==null
      ?`<div class="day-score-row"><span class="day-score-key">CSAT</span><span class="day-score-val ${gradeCSATTeam(csatAvg).gcls}">${fmtCsat(csatAvg)}</span></div>`
      :`<div class="day-score-row"><span class="day-score-key">CSAT</span><span class="day-score-val" style="color:var(--text-muted)">—</span></div>`;
    const arHTML=arPct!==null
      ?`<div class="day-score-row"><span class="day-score-key">AR</span><span class="day-score-val ${gradeARTeam(arPct).gcls}">${arPct.toFixed(2)}%</span></div>`
      :`<div class="day-score-row"><span class="day-score-key">AR</span><span class="day-score-val" style="color:var(--text-muted)">—</span></div>`;
    const ahtHTML=dayAHTSec>0
      ?`<div class="day-score-row"><span class="day-score-key">AHT</span><span class="day-score-val ${gradeAHTTeam(dayAHTSec).gcls}" style="font-size:11px">${fmtSec(dayAHTSec)}</span></div>`
      :`<div class="day-score-row"><span class="day-score-key">AHT</span><span class="day-score-val" style="color:var(--text-muted)">—</span></div>`;
    const lowScores=csatDaySurveys.filter(s=>s.csat<4);
    const lowAlertHTML=lowScores.length?`<div class="day-low-alert">⚠ ${lowScores.length} low score${lowScores.length>1?'s':''}</div>`:'';
    let targetHTML='';
    if(target>0){
      const pct=Math.min(100,Math.round(daySurveys.length/target*100));
      const col=pct>=100?'var(--green)':pct>=60?'var(--amber)':'var(--red)';
      targetHTML=`<div class="day-target-bar"><div class="day-target-fill" style="width:${pct}%;background:${col}"></div></div>
      <div class="day-target-label"><span>${daySurveys.length}/${target}</span><span style="color:${col}">${pct}%</span></div>`;
    }
    tile.innerHTML=`
      <div class="day-label">${fmtDayLabel(dk)}</div>
      <div class="day-scores">
        ${csatHTML}
        ${arHTML}
        ${arYesNoHTML}
        ${ahtHTML}
        <div class="day-score-row" style="margin-top:2px;border-top:1px solid var(--border);padding-top:2px">
          <span class="day-score-key" style="color:var(--text-muted);font-size:9px">${target>0?'':daySurveys.length+' survey'+(daySurveys.length!==1?'s':'')}</span>
        </div>
      </div>
      ${lowAlertHTML}
      ${targetHTML}
      ${distHTML}
      <div class="day-tile-open-hint">tap to view surveys</div>`;
    grid.appendChild(tile);
  });
}

// Click a day tile in a member's own Daily Breakdown grid — reuses the shared
// Tile Survey List modal, filtered to this member + this one day.
function openMemberDayDetail(agent,dk){
  const p=getPeriod(activePeriodKey);
  const surveys=(p.surveys||[]).filter(s=>(s.agent||'').trim()===agent&&parseDateKey(s.date)===dk);
  if(!surveys.length){showToast('No surveys logged that day');return;}
  // Reset shared modal state — otherwise agent-filter chips left over from a
  // prior team-wide openTileSurveyList() call (or another member's popup)
  // stay visible here and can be clicked to pull in other members' surveys.
  _tileSurveyState=null;
  const agentsEl=document.getElementById('tile-survey-agents');
  if(agentsEl)agentsEl.innerHTML='';
  _memberDayState={agent,dk,surveys,result:null};
  renderMemberDayDetail();
  document.getElementById('tile-survey-modal').classList.add('open');
}
// State + renderer for the member's day popup: Yes/No + score distribution at
// the top (clickable — narrows the list below to those surveys).
var _memberDayState=null;
function renderMemberDayDetail(){
  const st=_memberDayState;
  if(!st)return;
  const list=st.result?st.surveys.filter(sv=>_dailyFilterMatch(st.result,sv)):st.surveys;
  document.getElementById('tile-survey-title').textContent=`${prettifyAgentName(st.agent)} — ${fmtDayLabel(st.dk)} (${st.result?list.length+' of '+st.surveys.length:st.surveys.length})`;
  document.getElementById('tile-survey-body').innerHTML=_resultDistHTML(st.surveys,st.result,'filterMemberDayByResult')
    +(list.length?_tileSurveyRowsHTML(list):'<div style="padding:14px 4px;font-size:12px;color:var(--text-muted)">No surveys match this filter.</div>');
}
function filterMemberDayByResult(type,val){
  if(!_memberDayState)return;
  const cur=_memberDayState.result;
  _memberDayState.result=(!type||(cur&&cur.type===type&&cur.val===val))?null:{type,val};
  renderMemberDayDetail();
}

// Per-day Final KPI (CSAT+AR+AHT weighted, Team-threshold-graded) for one
// member — merges that day's survey stats with that day's AHT log entry
// (if any). A day only shows up if it has at least one of the three.
// One member's CSAT / AR / AHT / KPI for any month, graded with the Team thresholds
// and weights (the same ones the member dashboard tiles use). Custom metrics are
// logged for the whole team, so they're added the same way the tile does.
function _memberPeriodStats(agent,key){
  const p=state[key];
  if(!p)return null;
  const surveys=(p.surveys||[]).filter(s=>(s.agent||'').trim()===agent);
  const csatS=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
  const avgCSAT=csatS.length?calcCSAT(csatS):null;
  const arR=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arPct=arR.length?arR.filter(sv=>sv.ar==='yes').length/arR.length*100:null;
  const ast=getMemberAHTStats(p,agent);
  const ahtSec=ast?ast.avgSec:0;
  if(avgCSAT===null&&arPct===null&&!(ahtSec>0))return null;
  const cm=customMetricsPoints(key,'team');
  const kpi=weightCSATTeam(avgCSAT)+weightARTeam(arPct)+weightAHTTeam(ahtSec)+cm;
  return{key,avgCSAT,arPct,ahtSec,kpi,surveys,ahtWeight:ast?(ast.totalChats||ast.days||1):0};
}
function _memberKPIHistory(agent){
  return Object.keys(state).sort().map(k=>{
    const st=_memberPeriodStats(agent,k);
    if(!st)return null;
    const [y,m]=k.split('-');
    return{...st,label:periodLabel(parseInt(m),parseInt(y))};
  }).filter(Boolean);
}
// Year-to-date for one member: surveys pooled across the year's months, AHT averaged
// across months (weighted by chats logged), same approach as the main dashboard's YTD.
function _memberYTDStats(agent,year,history){
  const rows=history.filter(h=>h.key.startsWith(year+'-'));
  if(!rows.length)return null;
  const all=rows.reduce((a,r)=>a.concat(r.surveys),[]);
  const csatS=all.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
  const avgCSAT=csatS.length?calcCSAT(csatS):null;
  const arR=all.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arPct=arR.length?arR.filter(sv=>sv.ar==='yes').length/arR.length*100:null;
  const ar2=rows.filter(r=>r.ahtSec>0);
  const tw=ar2.reduce((a,r)=>a+(r.ahtWeight||1),0);
  const avgAHT=tw?ar2.reduce((a,r)=>a+r.ahtSec*(r.ahtWeight||1),0)/tw:0;
  const cm=customMetricsPointsYTD(rows.map(r=>r.key),'team');
  const kpi=weightCSATTeam(avgCSAT)+weightARTeam(arPct)+weightAHTTeam(avgAHT)+cm;
  return{kpi,avgCSAT,arPct,avgAHT,months:rows.length,wc:weightCSATTeam(avgCSAT),wa:weightARTeam(arPct),wh:weightAHTTeam(avgAHT)};
}

// ── Member Final KPI tile extras ─────────────────────────────────────────────
// Everything the main dashboard's Final KPI tile shows beyond the score, but computed
// for one member: trend vs last month, "on track for" projection, score-breakdown rows
// (CSAT / AR / AHT + team-scoped custom metrics + Total) and the month-by-month history.
function _memberKpiTileExtras(name,c){
  const gradeCls=g=>g&&g.gcls?g.gcls:'gc-needs';
  const row=(label,val,cls,style)=>`<div class="daily-aht-list-item"><span style="font-size:11px;color:var(--text-muted)">${label}</span><span class="daily-aht-list-val ${cls||''}" style="${style||''}">${val}</span></div>`;
  const hasAny=c.kpiRaw!==null;
  // Trend vs previous month (this member's own KPI last month)
  let trend='';
  if(hasAny){
    const prev=_memberMonthStats(prevPeriodKey(activePeriodKey),name);
    trend=trendArrow(c.kpiRaw,prev&&prev.kpi!==null?prev.kpi:null,false);
  }
  // "On track for X% by <month end>" — same rules as the main tile
  let proj='';
  (function(){
    const [y,m]=activePeriodKey.split('-').map(Number);
    const now=new Date();
    if(!(now.getFullYear()===y&&(now.getMonth()+1)===m))return;
    const dim=new Date(y,m,0).getDate();
    if(now.getDate()>=dim||!c.surveys.length)return;
    const arR=c.surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    if(c.csatSurveys.length<3||arR.length<3)return;
    const projKPI=c.wc+c.wa+c.wh+customMetricsPoints(activePeriodKey,'team');
    const g=kpiScoreGrade(projKPI);
    const cls=(g.label==='Exceptional'||g.label==='Good')?'proj-on-track':g.label==='Average'?'proj-warn':'proj-behind';
    proj=`<div class="eom-proj ${cls}" style="display:flex"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;opacity:.6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg><span>On track for <span class="eom-proj-val">${projKPI.toFixed(2)}%</span> by ${MONTHS[m-1].slice(0,3)} ${dim}</span></div>`;
  })();
  // Score breakdown table
  let breakdown='<div style="font-size:11px;color:var(--text-muted);font-style:italic;padding:3px 6px">No data yet</div>';
  if(hasAny){
    const cmTh=getThresholdsForPeriod(activePeriodKey);
    const cmRows=CUSTOM_METRIC_DEFS.filter(d=>customMetricInScope(d,'team')).map(def=>{
      const sc=customScoringFor(def.id,cmTh);
      const avg=customMetricAvg(getPeriod(activePeriodKey),def.id);
      const on=customMetricIsScored(sc);
      const g=on?customMetricGrade(def,avg,sc):null;
      const gcls=(g&&g!=='Needs improvement')?'gc-'+g.toLowerCase():'gc-needs';
      const val=!on?'not scored yet':(avg===null?'—':weightCustomMetric(def,avg,sc)+'%');
      return row(escHtml(def.name),val,on&&avg!==null?gcls:'',(!on||avg===null)?'color:var(--text-muted);font-style:'+(on?'normal':'italic'):'');
    }).join('');
    const ahtSec=c.ahtStats?c.ahtStats.avgSec:0;
    const total=c.kpiRaw;
    breakdown=
      row('CSAT',c.avgCSAT!==null?c.wc+'%':'—',c.avgCSAT!==null?gradeCls(gradeCSATTeam(c.avgCSAT)):'',c.avgCSAT===null?'color:var(--text-muted)':'')+
      row('AR',c.arPct!==null?c.wa+'%':'—',c.arPct!==null?gradeCls(gradeARTeam(c.arPct)):'',c.arPct===null?'color:var(--text-muted)':'')+
      row('AHT',ahtSec>0?c.wh+'%':'—',ahtSec>0?gradeCls(gradeAHTTeam(ahtSec)):'',ahtSec>0?'':'color:var(--text-muted)')+
      cmRows+
      `<div class="daily-aht-list-item" style="border-top:1px solid var(--border);margin-top:2px;padding-top:4px"><span style="font-size:11px;color:var(--text-muted);font-weight:600">Total</span><span class="daily-aht-list-val ${gradeCls(kpiScoreGrade(total))}">${total.toFixed(2)}%</span></div>`;
  }
  // KPI history: every month this member has a score, newest first
  const hist=Object.keys(state).filter(k=>/^\d{4}-(0[1-9]|1[0-2])$/.test(k)).sort().reverse()
    .map(k=>_memberMonthStats(k,name)).filter(ms=>ms&&ms.kpi!==null);
  const history=hist.length?hist.map(ms=>{
    const [yy,mm]=ms.k.split('-').map(Number);
    const isCur=ms.k===activePeriodKey;
    return `<div class="daily-aht-list-item"${isCur?' style="background:rgba(168,85,247,0.1)"':''}><span class="daily-aht-list-date">${MONTHS[mm-1]} ${yy}${isCur?' ●':''}</span><span class="daily-aht-list-val ${gradeCls(kpiScoreGrade(ms.kpi))}">${ms.kpi.toFixed(2)}%</span></div>`;
  }).join(''):'<div style="font-size:11px;color:var(--text-muted);font-style:italic;padding:3px 6px">No history yet</div>';
  return{trend,proj,breakdown,history};
}
// Month-by-month Final KPI points for one member across the active year (the main
// dashboard's KPI sparkline does the same for the whole team).
function _memberMonthlyKPIPairs(name){
  const activeYear=activePeriodKey?activePeriodKey.split('-')[0]:'';
  return Object.keys(state).filter(k=>/^\d{4}-(0[1-9]|1[0-2])$/.test(k)&&(!activeYear||k.startsWith(activeYear+'-'))).sort()
    .map(k=>{const ms=_memberMonthStats(k,name);return ms&&ms.kpi!==null?{k,v:ms.kpi}:null;}).filter(Boolean);
}

function _memberDailyKPIPairs(surveys,ahtEntries){
  const days=getDailyStats(surveys);
  const ahtByDay={};
  ahtEntries.forEach(e=>{ahtByDay[e.dk]=e;});
  const dkeys=new Set([...Object.keys(days),...Object.keys(ahtByDay)]);
  const pairs=[];
  [...dkeys].sort().forEach(dk=>{
    const ds=(days[dk]&&days[dk].surveys)||[];
    const csatDs=ds.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
    const avgCSAT=csatDs.length?calcCSAT(csatDs):null;
    const arDs=ds.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arYes=ds.filter(sv=>sv.ar==='yes').length;
    const arPct=arDs.length?arYes/arDs.length*100:null;
    const ahtSec=(ahtByDay[dk]&&ahtByDay[dk].aht)||0;
    if(avgCSAT===null&&arPct===null&&!(ahtSec>0))return;
    const cm=customMetricsPointsForDay(activePeriodKey,dk,'team');
    const kpi=weightCSATTeam(avgCSAT)+weightARTeam(arPct)+weightAHTTeam(ahtSec)+cm;
    pairs.push({dk,v:kpi,csat:avgCSAT,ar:arPct,aht:ahtSec,cm,surveyCount:ds.length});
  });
  return pairs;
}

// Click a mini score/AR tile inside a member's Total card — same idea as the
// main dashboard's openTileSurveyList, just pre-filtered to this member.
function openMemberTileList(agent,kind,val){
  if(!agent)return;
  const p=getPeriod(activePeriodKey);
  const surveys=(p.surveys||[]).filter(s=>(s.agent||'').trim()===agent);
  const list=kind==='csat'?surveys.filter(s=>s.csat===val):surveys.filter(s=>s.ar===val);
  if(!list.length){showToast('No matching surveys');return;}
  // Reset shared modal state — otherwise agent-filter chips left over from a
  // prior team-wide openTileSurveyList() call (or another member's popup)
  // stay visible here and can be clicked to pull in other members' surveys.
  _tileSurveyState=null;
  const agentsEl=document.getElementById('tile-survey-agents');
  if(agentsEl)agentsEl.innerHTML='';
  const label=kind==='csat'?`${val} CSAT`:`AR: ${val==='yes'?'Yes':'No'}`;
  document.getElementById('tile-survey-title').textContent=`${prettifyAgentName(agent)} — ${label} (${list.length})`;
  document.getElementById('tile-survey-body').innerHTML=_tileSurveyRowsHTML(list);
  document.getElementById('tile-survey-modal').classList.add('open');
}

// Shared daily breakdown table body (Day / Surveys / CSAT Avg / AR Rate),
// scoped to one member's surveys. Used by every openMemberCardDetail type.
function _memberDailyBreakdownRowsHTML(surveys){
  const days=getDailyStats(surveys);
  const dkeys=Object.keys(days).sort().reverse();
  if(!dkeys.length)return'';
  return dkeys.map(dk=>{
    const ds=days[dk].surveys;
    const csatDs=ds.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const dayAvg=csatDs.length?calcCSAT(csatDs):null;
    const arDs=ds.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arYes=ds.filter(sv=>sv.ar==='yes').length;
    const arPct=arDs.length?arYes/arDs.length*100:null;
    const csatCell=dayAvg!==null?`<span class="${gradeCSATTeam(dayAvg).gcls}" style="font-family:var(--mono)">${fmtCsat(dayAvg)}</span>`:`<span style="color:var(--text-muted)">—</span>`;
    const arCell=arPct!==null?`<span class="${gradeARTeam(arPct).gcls}" style="font-family:var(--mono)">${arPct.toFixed(2)}%</span><div style="font-size:10px;font-family:var(--mono);color:var(--text-muted)"><span style="color:var(--green)">${arYes} yes</span> · <span style="color:var(--red)">${arDs.length-arYes} no</span></div>`:`<span style="color:var(--text-muted)">—</span>`;
    return`<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim);white-space:nowrap">${fmtDayLabel(dk)}</td>
      <td style="padding:8px 10px;font-family:var(--mono);font-size:13px;font-weight:600;color:var(--orange)">${ds.length}</td>
      <td style="padding:8px 10px">${csatCell}</td>
      <td style="padding:8px 10px">${arCell}</td>
    </tr>`;
  }).join('');
}

// ── Member Card Detail Modal ─────────────────────────────────────────────
// Click-through from a member dashboard card (Total/CSAT/AR/AHT) into a
// scoped drill-down — mirrors the main dashboard's per-metric detail modals
// (progress-to-next-grade bar, full daily breakdown table) graded against
// the same Team thresholds as the rest of the member view. Intentionally
// lighter than the main dashboard's modals: no YTD banner (would need
// aggregating this member's data across every past period — a bigger lift)
// and no channel/no-response breakdown tables. The Final KPI card has no
// drill-down of its own — a fair per-day KPI trend would need re-deriving
// the weighted CSAT+AR+AHT math per day, so it stays a static summary tile.
var _memberCardCtx=null,_memberCardFilter=null;
// Click a score / Yes / No inside the member's CSAT or AR popup to filter its Daily Breakdown.
function setMemberCardFilter(type,val){
  if(!_memberCardCtx)return;
  const cur=_memberCardFilter;
  _memberCardFilter=(!type||(cur&&cur.type===type&&cur.val===val))?null:{type,val};
  const bodyEl=document.getElementById('member-detail-body');
  const keep=[];
  for(let n=bodyEl;n;n=n.parentElement){keep.push([n,n.scrollTop]);}
  openMemberCardDetail(_memberCardCtx.agent,_memberCardCtx.type,true);
  keep.forEach(([n,t])=>{n.scrollTop=t;});
}
function openMemberCardDetail(agent,type,keepFilter){
  if(!agent)return;
  if(!keepFilter)_memberCardFilter=null;
  _memberCardCtx={agent,type};
  const p=getPeriod(activePeriodKey);
  const surveys=(p.surveys||[]).filter(s=>(s.agent||'').trim()===agent);
  const displayName=prettifyAgentName(agent);
  const titleEl=document.getElementById('member-detail-title');
  const bodyEl=document.getElementById('member-detail-body');
  const _mf=(type==='csat'||type==='ar')?_memberCardFilter:null;
  const fSurveys=_mf?surveys.filter(sv=>_dailyFilterMatch(_mf,sv)):surveys;
  const dayRows=_memberDailyBreakdownRowsHTML(fSurveys);
  const dailyTableHTML=dayRows?`
    ${_distFilterBarHTML(_mf,fSurveys.length,Object.keys(getDailyStats(fSurveys)).length,"setMemberCardFilter(null,null)")}
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Daily Breakdown</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Day</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Surveys</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">CSAT Avg</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">AR Rate</th>
        </tr></thead>
        <tbody>${dayRows}</tbody>
      </table>
    </div>`:`<div style="font-size:12px;color:var(--text-muted);font-style:italic">No surveys yet this period.</div>`;

  if(type==='total'){
    titleEl.textContent=`${displayName} — Total Surveys`;
    const days=getDailyStats(surveys);
    const dkeys=Object.keys(days);
    const activeDays=dkeys.length;
    const avgDay=activeDays?(surveys.length/activeDays).toFixed(1):'0.0';
    const channelMap={};
    surveys.forEach(sv=>{const ch=(sv.channel||'Unknown').trim();channelMap[ch]=(channelMap[ch]||0)+1;});
    const channels=Object.entries(channelMap).sort((a,b)=>b[1]-a[1]);
    const channelRows=channels.map(([ch,cnt])=>{
      const pct=Math.round(cnt/surveys.length*100);
      return`<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:7px 10px;font-size:12px;color:var(--text-dim)">${escHtml(ch)}</td>
        <td style="padding:7px 10px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;height:6px;background:var(--surface3);border-radius:3px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:var(--orange);border-radius:3px"></div>
            </div>
            <span style="font-family:var(--mono);font-size:12px;min-width:20px">${cnt}</span>
            <span style="font-size:11px;color:var(--text-muted);min-width:32px">${pct}%</span>
          </div>
        </td>
      </tr>`;
    }).join('');
    bodyEl.innerHTML=`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1.25rem">
        ${[['Total',''+surveys.length,'var(--orange)'],['Active Days',''+activeDays,'var(--teal)'],['Daily Avg',avgDay,'var(--text)']].map(([label,val,color])=>`
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
            <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:${color}">${val}</div>
          </div>`).join('')}
      </div>
      ${channels.length?`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">By Channel</div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.25rem">
        <table style="width:100%;border-collapse:collapse">${channelRows}</table>
      </div>`:''}
      ${dailyTableHTML}`;
  } else if(type==='csat'){
    const csatSurveys=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
    if(!csatSurveys.length){showToast('No CSAT data yet');return;}
    const avg=calcCSAT(csatSurveys);
    const g=gradeCSATTeam(avg);
    const buckets=[5,4.5,4,3.5,3,2.5,2,1.5,1];
    const distRows=buckets.map(sc=>{
      const cnt=csatSurveys.filter(s=>s.csat===sc).length;
      if(!cnt)return'';
      const pct=Math.round(cnt/csatSurveys.length*100);
      const scoreColor=sc>=4.9?'var(--green)':sc>=4.5?'var(--accent)':sc>=4?'var(--amber)':'var(--red)';
      return`<tr data-ph-click="setMemberCardFilter('csat',${sc})" title="Click to filter the daily breakdown to ${sc}" style="${_distRowStyle(_memberCardFilter&&_memberCardFilter.type==='csat'&&_memberCardFilter.val===sc,scoreColor)}">
        <td style="font-family:var(--mono);font-weight:600;color:${scoreColor};padding:7px 10px;width:50px">${sc}</td>
        <td style="padding:7px 10px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;height:6px;background:var(--surface3);border-radius:3px;overflow:hidden">
              <div style="width:${Math.max(2,pct)}%;height:100%;background:${scoreColor};border-radius:3px"></div>
            </div>
            <span style="font-family:var(--mono);font-size:12px;color:var(--text);min-width:20px">${cnt}</span>
            <span style="font-size:11px;color:var(--text-muted);min-width:32px">${pct}%</span>
          </div>
        </td>
      </tr>`;
    }).join('');
    titleEl.textContent=`${displayName} — CSAT Score`;
    bodyEl.innerHTML=`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1.25rem">
        ${[['Average',fmtCsat(avg),g.gcls],['Grade',g.grade,''],['Responses',''+csatSurveys.length,'']].map(([label,val,cls])=>`
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
            <div style="font-size:18px;font-weight:600;font-family:var(--mono)" class="${cls}">${val}</div>
          </div>`).join('')}
      </div>
      ${_progressBarHTML(avg,TEAM_CSAT_THRESHOLDS,'var(--accent)',v=>fmtCsat(v))}
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin:1rem 0 6px">Score Distribution <span style="font-weight:400;text-transform:none;letter-spacing:0">· click a score to filter the daily breakdown</span></div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.25rem">
        <table style="width:100%;border-collapse:collapse">${distRows}</table>
      </div>
      ${dailyTableHTML}`;
  } else if(type==='ar'){
    const arSurveys=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    if(!arSurveys.length){showToast('No AR data yet');return;}
    const arYes=arSurveys.filter(sv=>sv.ar==='yes').length;
    const arNo=arSurveys.length-arYes;
    const arPct=arYes/arSurveys.length*100;
    const g=gradeARTeam(arPct);
    const yesPct=Math.round(arYes/arSurveys.length*100);
    titleEl.textContent=`${displayName} — Agent Resolution (AR)`;
    bodyEl.innerHTML=`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1.25rem">
        ${[['Rate',arPct.toFixed(2)+'%',g.gcls],['Yes',''+arYes,'gc-good'],['No',''+arNo,'gc-needs']].map(([label,val,cls])=>{
          const yn=(label==='Yes'||label==='No')?label.toLowerCase():null;
          const on=!!(yn&&_mf&&_mf.val===yn);
          return `
          <div ${yn?_filterTileAttrs(on,'',"setMemberCardFilter('ar',",yn):''} style="background:var(--surface2);border:1px solid ${on?'var(--accent)':'var(--border)'};border-radius:10px;padding:10px 12px;${yn?'cursor:pointer;':''}">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
            <div style="font-size:18px;font-weight:600;font-family:var(--mono)" class="${cls}">${val}</div>
          </div>`;}).join('')}
      </div>
      ${_progressBarHTML(arPct,TEAM_AR_THRESHOLDS,'var(--green)',v=>v.toFixed(2)+'%')}
      <div style="margin-top:1rem">${_yesNoCardHTML(arYes,arNo,_mf?_mf.val:null,"setMemberCardFilter('ar',")}</div>
      ${dailyTableHTML}`;
  } else if(type==='aht'){
    const ahtEntries=getMemberAHTEntries(p,agent).slice().reverse();
    const stats=getMemberAHTStats(p,agent);
    if(!stats){showToast('No AHT logged yet');return;}
    const g=gradeAHTTeam(stats.avgSec);
    titleEl.textContent=`${displayName} — Avg Handle Time (AHT)`;
    const histRows=ahtEntries.map(e=>{
      const sg=gradeAHTTeam(e.aht);
      const countBadge=e.count>0?`<span style="font-size:10px;color:var(--text-muted);margin-left:4px">${e.count}c</span>`:'';
      return`<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim)">${fmtDayLabel(e.dk)}</td>
        <td style="padding:8px 10px;font-family:var(--mono);font-weight:600" class="${sg.gcls}">${fmtSec(e.aht)}${countBadge}</td>
        <td style="padding:8px 10px"><span class="grade-pill ${sg.cls}" style="font-size:11px">${sg.grade}</span></td>
      </tr>`;
    }).join('');
    bodyEl.innerHTML=`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1.25rem">
        ${[['Avg AHT',fmtSec(stats.avgSec),g.gcls],['Grade',g.grade,''],['Chats',''+stats.totalChats,'']].map(([label,val,cls])=>`
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
            <div style="font-size:18px;font-weight:600;font-family:var(--mono)" class="${cls}">${val}</div>
          </div>`).join('')}
      </div>
      ${_ahtProgressBarHTML(stats.avgSec,TEAM_AHT_THRESHOLDS).bar}
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin:1rem 0 6px">${stats.isMonthly?'AHT History (not counted while a month total is set)':'AHT History'}</div>
      ${stats.isMonthly?`<div style="font-size:11px;color:var(--text-muted);font-style:italic;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:${ahtEntries.length?'8px':'0'}">This month's AHT was entered as one month total, so the number above comes from that total${ahtEntries.length?'. Any daily rows below are kept but ignored while the total is set.':', with no day-by-day breakdown.'}</div>`:''}
      ${ahtEntries.length?`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Day</th>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">AHT</th>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Grade</th>
          </tr></thead>
          <tbody>${histRows}</tbody>
        </table>
      </div>`:''}`;
  } else if(type==='kpi'){
    const ahtEntries=getMemberAHTEntries(p,agent);
    const kpiPairs=_memberDailyKPIPairs(surveys,ahtEntries).slice().reverse();
    const csatS=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
    const avgCSAT=csatS.length?calcCSAT(csatS):null;
    const arR=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arY=surveys.filter(sv=>sv.ar==='yes').length;
    const arPct=arR.length?arY/arR.length*100:null;
    const stats=getMemberAHTStats(p,agent);
    const ahtSec=stats?stats.avgSec:0;
    const wc=weightCSATTeam(avgCSAT),wa=weightARTeam(arPct),wh=weightAHTTeam(ahtSec);
    const cmRows=customMetricBreakdown(activePeriodKey,'team');
    const total=wc+wa+wh+cmRows.reduce((a,r)=>a+r.pts,0);
    if(avgCSAT===null&&arPct===null&&!(ahtSec>0)&&!cmRows.some(r=>r.pts>0)){showToast('No KPI data yet');return;}
    const g=kpiScoreGrade(total);
    const csatG=avgCSAT!==null?gradeCSATTeam(avgCSAT):null;
    const arG=arPct!==null?gradeARTeam(arPct):null;
    const ahtG=ahtSec>0?gradeAHTTeam(ahtSec):null;
    // KPI history across months + year-to-date, same layout as the main dashboard's KPI popup
    const kpiHist=_memberKPIHistory(agent);
    const bestEver=kpiHist.length?Math.max(...kpiHist.map(h=>h.kpi)):null;
    const ytdYear=parseInt(activePeriodKey.split('-')[0]);
    const ytd=_memberYTDStats(agent,ytdYear,kpiHist);
    const ytdHTML=ytd?(()=>{
      const yg=kpiScoreGrade(ytd.kpi);
      return`<div style="background:rgba(168,85,247,0.07);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--purple);margin-bottom:8px">📅 Year-to-Date ${ytdYear}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">YTD KPI</div><div style="font-size:18px;font-weight:600;font-family:var(--mono)" class="${yg.gcls}">${ytd.kpi.toFixed(2)}%</div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Grade</div><div style="margin-top:4px"><span class="grade-pill ${yg.cls}" style="font-size:10px">${yg.label}</span></div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Months Tracked</div><div style="font-size:16px;font-weight:600;font-family:var(--mono);color:var(--text-dim)">${ytd.months}</div></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted)">CSAT <span style="color:var(--accent);font-weight:600">${ytd.wc}%</span> · AR <span style="color:var(--green);font-weight:600">${ytd.wa}%</span> · AHT <span style="color:var(--teal);font-weight:600">${ytd.wh}%</span></div>
      </div>`;
    })():'';
    const histRowsHTML=kpiHist.slice().reverse().map(h=>{
      const sg=kpiScoreGrade(h.kpi);
      const isCur=h.key===activePeriodKey;
      return`<tr style="border-bottom:1px solid var(--border)${isCur?';background:rgba(168,85,247,0.06)':''}">
        <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim)">${escHtml(h.label)}${isCur?' <span style="color:var(--purple);font-size:10px">●</span>':''}</td>
        <td style="padding:8px 10px;font-family:var(--mono);font-weight:600" class="${sg.gcls}">${h.kpi.toFixed(2)}%</td>
        <td style="padding:8px 10px"><span class="grade-pill ${sg.cls}" style="font-size:11px">${sg.label}</span></td>
        <td style="padding:8px 10px;min-width:100px"><div style="height:5px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="width:${Math.max(0,Math.min(100,Math.round(h.kpi)))}%;height:100%;background:var(--purple);border-radius:3px"></div></div></td>
      </tr>`;
    }).join('');
    titleEl.textContent=`${displayName} — Final KPI Score`;
    const compRows=[
      stockInScope('csat','team')?['CSAT Score',avgCSAT!==null?fmtCsat(avgCSAT):'—',wc,KPI_WEIGHTS.csat.Exceptional,csatG,'var(--accent)']:null,
      stockInScope('ar','team')?['Agent Resolution',arPct!==null?arPct.toFixed(2)+'%':'—',wa,KPI_WEIGHTS.ar.Exceptional,arG,'var(--green)']:null,
      stockInScope('aht','team')?['Avg Handle Time',ahtSec>0?fmtSec(ahtSec):'—',wh,KPI_WEIGHTS.aht.Exceptional,ahtG,'var(--teal)']:null,
      ...cmRows.map(r=>[r.def.name,r.avg!==null?(Math.round(r.avg*100)/100)+(r.def.unit?' '+r.def.unit:''):'—',r.pts,r.max,r.grade?{cls:CM_GRADE_CLS[r.grade],grade:r.grade}:null,'#a855f7']),
    ].filter(Boolean).map(([label,val,weight,maxWeight,grade,color])=>`
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:12px;color:var(--text-dim);font-weight:500">${label}</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-family:var(--mono);font-size:13px;font-weight:600;color:${color}">${val}</span>
            ${grade?`<span class="grade-pill ${grade.cls}" style="font-size:10px">${grade.grade||grade.label}</span>`:''}
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:4px">
          <span>KPI contribution</span><span style="font-weight:600;color:var(--text)">${weight}% <span style="color:var(--text-muted);font-weight:400">of max ${maxWeight}%</span></span>
        </div>
        <div style="height:6px;background:var(--surface3);border-radius:3px;overflow:hidden">
          <div style="width:${maxWeight>0?Math.round(weight/maxWeight*100):0}%;height:100%;background:${color};border-radius:3px"></div>
        </div>
      </div>`).join('');
    const kpiRows=kpiPairs.map(pt=>{
      const sg=kpiScoreGrade(pt.v);
      const barW=Math.round(pt.v);
      const csatCell=pt.csat!==null?fmtCsat(pt.csat):'—';
      const arCell=pt.ar!==null?pt.ar.toFixed(2)+'%':'—';
      const ahtCell=pt.aht>0?fmtSec(pt.aht)+(pt.cm>0?' · +'+pt.cm+' custom':''):'—'+(pt.cm>0?' · +'+pt.cm+' custom':'');
      return`<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim);white-space:nowrap">${fmtDayLabel(pt.dk)}</td>
        <td style="padding:8px 10px;font-family:var(--mono);font-weight:600" class="${sg.gcls}">${pt.v.toFixed(1)}%</td>
        <td style="padding:8px 10px"><span class="grade-pill ${sg.cls}" style="font-size:10px">${sg.label}</span></td>
        <td style="padding:8px 10px;font-size:11px;color:var(--text-muted);font-family:var(--mono)">${csatCell} · ${arCell} · ${ahtCell}</td>
      </tr>`;
    }).join('');
    const dailyKPIHTML=kpiPairs.length?`
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin:1rem 0 6px">Daily KPI Breakdown <span style="font-weight:400;color:var(--text-dim);text-transform:none;letter-spacing:normal">(CSAT · AR · AHT)</span></div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Day</th>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">KPI</th>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Grade</th>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Components</th>
          </tr></thead>
          <tbody>${kpiRows}</tbody>
        </table>
      </div>`:`<div style="font-size:11px;color:var(--text-muted);font-style:italic;margin-top:1rem">No day-by-day KPI to show for this month (AHT was entered as a month total and there are no dated surveys).</div>`;
    const historyHTML=kpiHist.length>1?`
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin:1.25rem 0 6px">KPI History</div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Period</th>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">KPI</th>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Grade</th>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Score</th>
          </tr></thead>
          <tbody>${histRowsHTML}</tbody>
        </table>
      </div>`:'';
    bodyEl.innerHTML=`
      ${ytdHTML}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1.25rem">
        ${[['Final KPI',total.toFixed(2)+'%','var(--purple)'],['Grade',g.label,''],['Best Ever',bestEver!==null?bestEver.toFixed(2)+'%':'—','var(--green)']].map(([label,val,color])=>`
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
            <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:${color||'var(--text)'}"><span class="${!color?g.gcls:''}">${val}</span></div>
          </div>`).join('')}
      </div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px">Score Breakdown</div>
      ${compRows}
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-top:4px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-muted)">Total KPI Score</span>
        <span style="font-size:20px;font-weight:600;font-family:var(--mono);color:var(--purple)">${total.toFixed(2)}% <span class="grade-pill ${g.cls}" style="font-size:12px;margin-left:4px">${g.label}</span></span>
      </div>
      ${historyHTML}
      ${dailyKPIHTML}`;
  } else {
    return;
  }
  document.getElementById('member-detail-modal').classList.add('open');
}

// Toast
let toastTimer;
function showToast(msg){
  const t=document.getElementById('toast');
  t.innerHTML=`<span>${msg}</span>`;
  t.style.display='flex';
  clearTimeout(toastTimer);
  // clear any pending undo
  if(undoState.timer){clearInterval(undoState.timer);undoState={timer:null,surveys:null,key:null,countdown:null};}
  toastTimer=setTimeout(()=>t.style.display='none',2500);
}

// Undo delete state
let undoState={timer:null,surveys:null,key:null,countdown:null};

function showUndoToast(deletedCount){
  const t=document.getElementById('toast');
  clearTimeout(toastTimer);
  if(undoState.timer){clearInterval(undoState.timer);}
  let secs=30;
  const render=()=>{
    t.innerHTML=`<span>${deletedCount} row${deletedCount!==1?'s':''} deleted</span>
      <button data-action="undoDelete()" style="margin-left:10px;background:var(--accent);color:#fff;border:none;border-radius:6px;padding:3px 10px;font-family:var(--font);font-size:12px;font-weight:500;cursor:pointer">Undo (${secs}s)</button>`;
    t.style.display='flex';
  };
  render();
  undoState.timer=setInterval(()=>{
    secs--;
    if(secs<=0){
      clearInterval(undoState.timer);
      undoState={timer:null,surveys:null,key:null,countdown:null};
      t.style.display='none';
    } else { render(); }
  },1000);
}

function undoDelete(){
  if(!undoState.surveys||!undoState.key)return;
  clearInterval(undoState.timer);
  state[undoState.key].surveys=undoState.surveys;
  saveState();renderDashboard();renderSurveyTable();
  undoState={timer:null,surveys:null,key:null,countdown:null};
  showToast('Delete undone');
}

document.getElementById('new-period-modal').addEventListener('click',function(e){if(e.target===this)closeModal()});
document.getElementById('edit-row-modal').addEventListener('click',function(e){if(e.target===this)closeEditModal()});
document.getElementById('thresh-editor-modal').addEventListener('click',function(e){if(e.target===this)closeThreshEditor()});
document.getElementById('csat-detail-modal').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});
document.getElementById('ar-detail-modal').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});
document.getElementById('total-detail-modal').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});
document.getElementById('json-import-modal').addEventListener('click',function(e){if(e.target===this)closeJSONImportModal()});
document.getElementById('aht-detail-modal').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});
document.getElementById('kpi-detail-modal').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});
document.getElementById('spark-chart-modal').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});
document.getElementById('tile-survey-modal').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});
document.getElementById('member-dashboard-modal').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});
document.getElementById('member-detail-modal').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});



// ── Team View: editable page title ────────────────────────────────────────
// The side-nav label always stays "Team View"; only the page heading is renamed.
const TEAM_VIEW_NAME_KEY='kpi_team_view_name_v1';
const TEAM_VIEW_DEFAULT_NAME='Team View';
function getTeamViewName(){
  try{const v=(localStorage.getItem(TEAM_VIEW_NAME_KEY)||'').trim();return v||TEAM_VIEW_DEFAULT_NAME;}
  catch(e){return TEAM_VIEW_DEFAULT_NAME;}
}
function renderTeamViewTitle(){
  const row=document.getElementById('team-title-row');
  if(!row)return;
  const name=getTeamViewName();
  row.innerHTML=memberAvatarHTML(TEAM_AVATAR_KEY,36,true)+'<h1 id="team-view-title"></h1>'+
    '<button class="team-title-edit-btn" id="team-title-edit-btn" data-ph-click="startTeamNameEdit()" title="Rename this page (the side nav keeps saying Team View)">'+
    '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>';
  document.getElementById('team-view-title').textContent=name;
}
function startTeamNameEdit(){
  const row=document.getElementById('team-title-row');
  if(!row)return;
  row.innerHTML=memberAvatarHTML(TEAM_AVATAR_KEY,36,true);
  const input=document.createElement('input');
  input.type='text';input.className='team-title-input';input.maxLength=40;
  input.value=getTeamViewName();input.placeholder=TEAM_VIEW_DEFAULT_NAME;
  const save=document.createElement('button');
  save.className='team-title-btn primary';save.textContent='Save';
  const cancel=document.createElement('button');
  cancel.className='team-title-btn';cancel.textContent='Cancel';
  row.append(input,save,cancel);
  input.focus();input.select();
  save.addEventListener('click',()=>saveTeamName(input.value));
  cancel.addEventListener('click',renderTeamViewTitle);
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();saveTeamName(input.value);}
    else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();renderTeamViewTitle();}
  });
}
function saveTeamName(val){
  const name=(val||'').trim().slice(0,40);
  try{
    if(!name||name===TEAM_VIEW_DEFAULT_NAME)localStorage.removeItem(TEAM_VIEW_NAME_KEY);
    else localStorage.setItem(TEAM_VIEW_NAME_KEY,name);
  }catch(e){}
  renderTeamViewTitle();
  showToast(name&&name!==TEAM_VIEW_DEFAULT_NAME?'Renamed to "'+name+'"':'Reset to "'+TEAM_VIEW_DEFAULT_NAME+'"');
}

document.getElementById('avatar-picker-modal').addEventListener('click',function(e){if(e.target===this)closeAvatarPicker()});
