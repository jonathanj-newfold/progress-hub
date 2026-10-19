// ── Total Surveys Detail Modal ───────────────────────────────────────────────
function openTotalDetail(){
  const surveys=getPeriod(activePeriodKey).surveys;
  if(!surveys.length){showToast('No survey data yet');return;}

  // Summary stats
  const days=getDailyStats(surveys);
  const dkeys=Object.keys(days).sort();
  const activeDays=dkeys.length;
  const dailyCounts=dkeys.map(dk=>days[dk].surveys.length);
  const maxDay=Math.max(...dailyCounts);
  const minDay=Math.min(...dailyCounts);
  const avgDay=(surveys.length/activeDays).toFixed(1);
  const streak=calcStreak(surveys);

  // Channel breakdown
  const channelMap={};
  surveys.forEach(sv=>{const ch=(sv.channel||'Unknown').trim();channelMap[ch]=(channelMap[ch]||0)+1;});
  const channels=Object.entries(channelMap).sort((a,b)=>b[1]-a[1]);
  const channelRows=channels.map(([ch,cnt])=>{
    const pct=Math.round(cnt/surveys.length*100);
    return`<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:7px 10px;font-size:12px;color:var(--text-dim)">${ch}</td>
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

  // Daily breakdown table (newest first)
  const dayRows=dkeys.slice().reverse().map(dk=>{
    const ds=days[dk].surveys;
    const cnt=ds.length;
    const barW=Math.round(cnt/maxDay*100);
    const csatDs=ds.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const dayAvg=csatDs.length?calcCSAT(csatDs):null;
    const arDs=ds.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arYes=ds.filter(sv=>sv.ar==='yes').length;
    const arPct=arDs.length?arYes/arDs.length*100:null;
    const csatCell=dayAvg!==null?`<span class="${gradeCSAT(dayAvg).gcls}" style="font-family:var(--mono)">${fmtCsat(dayAvg)}</span>`:`<span style="color:var(--text-muted)">—</span>`;
    const arCell=arPct!==null?`<span class="${gradeAR(arPct).gcls}" style="font-family:var(--mono)">${arPct.toFixed(1)}%</span><div style="font-size:10px;font-family:var(--mono);color:var(--text-muted)"><span style="color:var(--green)">${arYes} yes</span> · <span style="color:var(--red)">${arDs.length-arYes} no</span></div>`:`<span style="color:var(--text-muted)">—</span>`;
    return`<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim);white-space:nowrap">${fmtDayLabel(dk)}</td>
      <td style="padding:8px 10px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:80px;height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;flex-shrink:0">
            <div style="width:${barW}%;height:100%;background:var(--orange);border-radius:3px"></div>
          </div>
          <span style="font-family:var(--mono);font-size:13px;font-weight:600;color:var(--orange)">${cnt}</span>
        </div>
      </td>
      <td style="padding:8px 10px">${csatCell}</td>
      <td style="padding:8px 10px">${arCell}</td>
    </tr>`;
  }).join('');

  document.getElementById('total-detail-body').innerHTML=`
    <!-- YTD Banner -->
    ${(()=>{
      const y=parseInt(activePeriodKey.split('-')[0]);
      const ytd=getYTDStats(y);
      if(!ytd||ytd.total===0)return'';
      return`<div style="background:rgba(168,85,247,0.07);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--purple);margin-bottom:8px">📅 Year-to-Date ${y}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${[['Total Surveys',''+ytd.total,'var(--orange)'],['Months Tracked',''+ytd.months,'var(--text-dim)'],['Daily Avg',(ytd.total/Math.max(1,Object.keys(getDailyStats(ytd.allSurveys)).length)).toFixed(1),'var(--text)']].map(([l,v,c])=>`<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">${l}</div><div style="font-size:16px;font-weight:600;font-family:var(--mono);color:${c}">${v}</div></div>`).join('')}
        </div>
      </div>`;
    })()}
    <!-- Summary tiles -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.25rem">
      ${[
        ['Total',''+surveys.length,'','var(--orange)'],
        ['Active Days',''+activeDays,'','var(--teal)'],
        ['Daily Avg',avgDay,'','var(--text)'],
        ['Streak',streak+'d','','var(--orange)']
      ].map(([label,val,cls,color])=>`
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
          <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:${color}">${val}</div>
        </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:1.25rem">
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Best Day</div>
        <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:var(--green)">${maxDay} surveys</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${fmtDayLabel(dkeys[dailyCounts.indexOf(maxDay)])}</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Lowest Day</div>
        <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:var(--amber)">${minDay} surveys</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${fmtDayLabel(dkeys[dailyCounts.lastIndexOf(minDay)])}</div>
      </div>
    </div>

    <!-- Channel breakdown -->
    ${channels.length?`
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">By Channel</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.25rem">
      <table style="width:100%;border-collapse:collapse">${channelRows}</table>
    </div>`:''}

    <!-- Daily breakdown -->
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
    </div>`;
  document.getElementById('total-detail-modal').classList.add('open');
}

// ── CSAT Detail Modal ────────────────────────────────────────────────────────
function openCSATDetail(){_detailFilter.csat=null;_renderCSATDetail();}
function _renderCSATDetail(){
  const surveys=getPeriod(activePeriodKey).surveys;
  const csatSurveys=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
  if(!csatSurveys.length){showToast('No CSAT data yet');return;}

  // Overall stats
  const avg=calcCSAT(csatSurveys);
  const g=gradeCSAT(avg);
  const min=Math.min(...csatSurveys.map(s=>s.csat));
  const max=Math.max(...csatSurveys.map(s=>s.csat));

  // Progress to next better grade
  const csatIdx=CSAT_THRESHOLDS.findIndex(t=>t.grade===g.grade);
  const nextBetterCSAT=csatIdx>0?CSAT_THRESHOLDS[csatIdx-1]:null;
  let csatProgressHTML='';
  if(nextBetterCSAT){
    const floor=CSAT_THRESHOLDS[csatIdx].min;
    const ceiling=nextBetterCSAT.min;
    const range=ceiling-floor;
    const pct=Math.max(0,Math.min(100,range>0?(avg-floor)/range*100:0));
    const neededStars=needed5sForCSAT(nextBetterCSAT.min,csatSurveys);
    csatProgressHTML=`<div style="margin-bottom:1.25rem">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Progress to ${nextBetterCSAT.grade}</div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:6px">
          <span>Need &ge; ${nextBetterCSAT.min.toFixed(2)}</span><span>${Math.round(pct)}% there</span>
        </div>
        <div style="height:8px;background:var(--surface3);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:var(--accent);border-radius:4px;transition:width .4s"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px">Need <span style="color:var(--accent);font-weight:600">${neededStars}</span> more 5 for ${nextBetterCSAT.grade}</div>
      </div>
    </div>`;
  } else {
    csatProgressHTML=`<div style="background:var(--green-dim);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem;font-size:13px;color:#4ade80">🏆 At top grade — Exceptional CSAT!</div>`;
  }

  // Score distribution
  const buckets=[5,4.5,4,3.5,3,2.5,2,1.5,1];
  const distRows=buckets.map(sc=>{
    const cnt=csatSurveys.filter(s=>s.csat===sc).length;
    if(!cnt)return'';
    const pct=Math.round(cnt/csatSurveys.length*100);
    const barW=Math.max(2,pct);
    const scoreColor=sc>=4.9?'var(--green)':sc>=4.5?'var(--accent)':sc>=4?'var(--amber)':'var(--red)';
    return`<tr data-ph-click="setDetailFilter('csat','csat',${sc})" title="Click to filter the daily breakdown to ${sc}" style="${_distRowStyle(_detailFilter.csat&&_detailFilter.csat.val===sc,scoreColor)}">
      <td style="font-family:var(--mono);font-weight:600;color:${scoreColor};padding:7px 10px;width:50px">${sc}</td>
      <td style="padding:7px 10px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:6px;background:var(--surface3);border-radius:3px;overflow:hidden">
            <div style="width:${barW}%;height:100%;background:${scoreColor};border-radius:3px"></div>
          </div>
          <span style="font-family:var(--mono);font-size:12px;color:var(--text);min-width:20px">${cnt}</span>
          <span style="font-size:11px;color:var(--text-muted);min-width:32px">${pct}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Daily breakdown
  const _cf=_detailFilter.csat;
  const fCsat=_cf?csatSurveys.filter(s=>_dailyFilterMatch(_cf,s)):csatSurveys;
  const days=getDailyStats(fCsat);
  const dkeys=Object.keys(days).sort().reverse();
  const csatFilterBar=_distFilterBarHTML(_cf,fCsat.length,dkeys.length,"setDetailFilter('csat',null,null)");
  const dayRows=dkeys.map(dk=>{
    const ds=days[dk].surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
    if(!ds.length)return'';
    const dayAvg=calcCSAT(ds);
    const dg=gradeCSAT(dayAvg);
    // mini distribution for this day
    const dayDist=buckets.filter(sc=>ds.some(s=>s.csat===sc)).map(sc=>{
      const cnt=ds.filter(s=>s.csat===sc).length;
      const scoreColor=sc>=4.9?'var(--green)':sc>=4.5?'var(--accent)':sc>=4?'var(--amber)':'var(--red)';
      return`<span style="font-size:11px;font-family:var(--mono);color:${scoreColor}">${sc}×${cnt}</span>`;
    }).join('<span style="color:var(--border2);margin:0 3px">·</span>');
    return`<tr>
      <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim);white-space:nowrap">${fmtDayLabel(dk)}</td>
      <td style="padding:8px 10px;font-family:var(--mono);font-weight:600" class="${dg.gcls}">${dayAvg.toFixed(2)}</td>
      <td style="padding:8px 10px;font-size:11px;color:var(--text-muted)">${ds.length} survey${ds.length!==1?'s':''}</td>
      <td style="padding:8px 10px">${dayDist}</td>
    </tr>`;
  }).join('');

  const cb=csatBreakdown(csatSurveys);
  document.getElementById('csat-detail-body').innerHTML=`
    <!-- YTD Banner -->
    ${(()=>{
      const y=parseInt(activePeriodKey.split('-')[0]);
      const ytd=getYTDStats(y);
      if(!ytd||ytd.avgCSAT===null)return'';
      const yg=gradeCSAT(ytd.avgCSAT);
      const csatS=ytd.allSurveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
      const buckets=[5,4.5,4,3.5,3,2.5,2,1.5,1];
      const dist=buckets.map(sc=>{const c=csatS.filter(s=>s.csat===sc).length;return c>0?`<span style="font-size:11px;font-family:var(--mono);color:${sc>=4.9?'var(--green)':sc>=4.5?'var(--accent)':sc>=4?'var(--amber)':'var(--red)'}">${sc}×${c}</span>`:'';}).filter(Boolean).join('<span style="color:var(--border2);margin:0 2px">·</span>');
      return`<div style="background:rgba(168,85,247,0.07);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--purple);margin-bottom:8px">📅 Year-to-Date ${y}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">YTD CSAT</div><div style="font-size:16px;font-weight:600;font-family:var(--mono)" class="${yg.gcls}">${fmtCsat(ytd.avgCSAT)}</div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Grade</div><div style="margin-top:2px"><span class="grade-pill ${yg.cls}" style="font-size:10px">${yg.grade}</span></div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Responses</div><div style="font-size:16px;font-weight:600;font-family:var(--mono);color:var(--text-dim)">${csatS.length}</div></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted)">Score mix: ${dist||'—'}</div>
      </div>`;
    })()}
    <!-- Summary row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.25rem">
      ${[
        ['Average',fmtCsat(avg),g.gcls],
        ['Grade',g.grade,''],
        ['Lowest',min,''],
        ['Highest',max,'']
      ].map(([label,val,cls])=>`
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
          <div style="font-size:18px;font-weight:600;font-family:var(--mono)" class="${cls}">${val}</div>
        </div>`).join('')}
    </div>

    <!-- CSAT formula breakdown: Knowledge / Courtesy / Overall (pooled ratings) -->
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:1.25rem">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${[
          ['CSAT Knowledge',cb.knowledge,`${cb.kSum} ÷ ${cb.kN}`],
          ['CSAT Courtesy',cb.courtesy,`${cb.cSum} ÷ ${cb.cN}`],
          ['CSAT Overall',cb.overall,`${cb.sum} ÷ ${cb.n}`]
        ].map(([lbl,v,calc])=>`<div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:2px">${lbl}</div>
          <div style="font-size:16px;font-weight:600;font-family:var(--mono)" ${v!==null?`class="${gradeCSAT(v).gcls}"`:''}>${v!==null?fmtCsat(v):'—'}</div>
          <div style="font-size:10px;color:var(--text-muted);font-family:var(--mono)" title="total score ÷ surveys completed">${calc}</div>
        </div>`).join('')}
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:8px">Overall = (Knowledge scores + Courtesy scores) ÷ (Knowledge surveys + Courtesy surveys completed). Only surveys with both ratings answered are counted.</div>
    </div>

    ${csatProgressHTML}
    <!-- Score distribution -->
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Score Distribution <span style="font-weight:400;text-transform:none;letter-spacing:0">· click a score to filter the daily breakdown</span></div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.25rem">
      <table style="width:100%;border-collapse:collapse">${distRows}</table>
    </div>

    <!-- Daily breakdown -->
    ${csatFilterBar}
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Daily Breakdown</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Day</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Avg</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Count</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Scores</th>
        </tr></thead>
        <tbody>${dayRows}</tbody>
      </table>
    </div>`;
  document.getElementById('csat-detail-modal').classList.add('open');
}

// ── AR Detail Modal ──────────────────────────────────────────────────────────
function openARDetail(){_detailFilter.ar=null;_renderARDetail();}
function _renderARDetail(){
  const surveys=getPeriod(activePeriodKey).surveys;
  const arSurveys=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  if(!arSurveys.length){showToast('No AR data yet');return;}

  const arYes=arSurveys.filter(sv=>sv.ar==='yes').length;
  const arNo=arSurveys.filter(sv=>sv.ar==='no').length;
  const arPct=arYes/arSurveys.length*100;
  const g=gradeAR(arPct);
  const yesPct=Math.round(arYes/arSurveys.length*100);
  const noPct=Math.round(arNo/arSurveys.length*100);

  // Progress to next better grade
  const arIdx=AR_THRESHOLDS.findIndex(t=>t.grade===g.grade);
  const nextBetterAR=arIdx>0?AR_THRESHOLDS[arIdx-1]:null;
  let arProgressHTML='';
  if(nextBetterAR){
    const floor=AR_THRESHOLDS[arIdx].min;
    const ceiling=nextBetterAR.min;
    const range=ceiling-floor;
    const pct=Math.max(0,Math.min(100,range>0?(arPct-floor)/range*100:0));
    const neededYes=neededYesForAR(nextBetterAR.min,surveys);
    arProgressHTML=`<div style="margin-bottom:1.25rem">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Progress to ${nextBetterAR.grade}</div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:6px">
          <span>Need &ge; ${nextBetterAR.min}%</span><span>${Math.round(pct)}% there</span>
        </div>
        <div style="height:8px;background:var(--surface3);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:var(--green);border-radius:4px;transition:width .4s"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px">Need <span style="color:var(--green);font-weight:600">${neededYes}</span> more YES for ${nextBetterAR.grade}</div>
      </div>
    </div>`;
  } else {
    arProgressHTML=`<div style="background:var(--green-dim);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem;font-size:13px;color:#4ade80">🏆 At top grade — Exceptional AR!</div>`;
  }

  // Daily breakdown
  const _af=_detailFilter.ar;
  const fAr=_af?arSurveys.filter(sv=>_dailyFilterMatch(_af,sv)):arSurveys;
  const days=getDailyStats(fAr);
  const dkeys=Object.keys(days).sort().reverse();
  const arFilterBar=_distFilterBarHTML(_af,fAr.length,dkeys.length,"setDetailFilter('ar',null,null)");
  const dayRows=dkeys.map(dk=>{
    const ds=days[dk].surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    if(!ds.length)return'';
    const yes=ds.filter(sv=>sv.ar==='yes').length;
    const no=ds.filter(sv=>sv.ar==='no').length;
    const pct=yes/ds.length*100;
    const dg=gradeAR(pct);
    const barYes=Math.round(yes/ds.length*100);
    return`<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim);white-space:nowrap">${fmtDayLabel(dk)}</td>
      <td style="padding:8px 10px;font-family:var(--mono);font-weight:600" class="${dg.gcls}">${pct.toFixed(1)}%</td>
      <td style="padding:8px 10px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="color:#4ade80;font-size:12px;font-family:var(--mono)">Y:${yes}</span>
          <span style="color:var(--border2)">·</span>
          <span style="color:#f87171;font-size:12px;font-family:var(--mono)">N:${no}</span>
        </div>
      </td>
      <td style="padding:8px 10px;min-width:100px">
        <div style="height:6px;background:var(--red-dim);border-radius:3px;overflow:hidden">
          <div style="width:${barYes}%;height:100%;background:var(--green);border-radius:3px"></div>
        </div>
      </td>
      <td style="padding:8px 10px;font-size:11px;color:var(--text-muted)">${ds.length} total</td>
    </tr>`;
  }).join('');

  // No responses list
  const noSurveys=arSurveys.filter(sv=>sv.ar==='no');
  const noRows=noSurveys.slice(-20).reverse().map(sv=>`
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:7px 10px;font-family:var(--mono);font-size:11px;color:var(--text-dim)">${sv.id||'—'}</td>
      <td style="padding:7px 10px;font-size:12px;color:var(--text-dim)">${sv.agent||'—'}</td>
      <td style="padding:7px 10px;font-size:11px;color:var(--text-muted)">${sv.date||'—'}</td>
      <td style="padding:7px 10px;font-size:11px;color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sv.comment?escHtml(sv.comment):'—'}</td>
    </tr>`).join('');

  document.getElementById('ar-detail-body').innerHTML=`
    <!-- YTD Banner -->
    ${(()=>{
      const y=parseInt(activePeriodKey.split('-')[0]);
      const ytd=getYTDStats(y);
      if(!ytd||ytd.arPct===null)return'';
      const yg=gradeAR(ytd.arPct);
      const yesPct=ytd.arTotal?Math.round(ytd.arY/ytd.arTotal*100):0;
      return`<div style="background:rgba(168,85,247,0.07);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--purple);margin-bottom:8px">📅 Year-to-Date ${y}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">YTD AR Rate</div><div style="font-size:16px;font-weight:600;font-family:var(--mono)" class="${yg.gcls}">${ytd.arPct.toFixed(1)}%</div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Grade</div><div style="margin-top:2px"><span class="grade-pill ${yg.cls}" style="font-size:10px">${yg.grade}</span></div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Yes / No</div><div style="font-size:14px;font-weight:600;font-family:var(--mono)"><span style="color:#4ade80">${ytd.arY}</span> <span style="color:var(--border2)">·</span> <span style="color:#f87171">${ytd.arTotal-ytd.arY}</span></div></div>
        </div>
        <div style="height:7px;background:var(--red-dim);border-radius:4px;overflow:hidden"><div style="width:${yesPct}%;height:100%;background:var(--green);border-radius:4px"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:4px"><span>Yes ${yesPct}%</span><span>No ${100-yesPct}%</span></div>
      </div>`;
    })()}
    <!-- Summary row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.25rem">
      ${[
        ['Rate',arPct.toFixed(2)+'%',g.gcls],
        ['Grade',g.grade,''],
        ['Yes',arYes,'gc-good'],
        ['No',arNo,'gc-needs']
      ].map(([label,val,cls])=>{
        const yn=(label==='Yes'||label==='No')?label.toLowerCase():null;
        const on=!!(yn&&_af&&_af.val===yn);
        return `
        <div ${yn?_filterTileAttrs(on,'',"setDetailFilter('ar','ar',",yn):''} style="background:var(--surface2);border:1px solid ${on?'var(--accent)':'var(--border)'};border-radius:10px;padding:10px 12px;${yn?'cursor:pointer;':''}">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
          <div style="font-size:18px;font-weight:600;font-family:var(--mono)" class="${cls}">${val}</div>
        </div>`;}).join('')}
    </div>

    <div style="font-size:11px;color:var(--text-muted);margin:-.5rem 0 1.25rem;line-height:1.5">AR = Yes responses (first contact) &divide; FCR surveys completed = <span style="font-family:var(--mono);color:var(--text)">${arYes} &divide; ${arSurveys.length}</span> = <span style="font-family:var(--mono);color:var(--text)">${arPct.toFixed(2)}%</span>. Surveys with no FCR answer aren't counted.</div>

    ${arProgressHTML}
    <!-- Yes/No bar -->
    ${_yesNoCardHTML(arYes,arNo,_af?_af.val:null,"setDetailFilter('ar','ar',")}

    <!-- Daily breakdown -->
    ${arFilterBar}
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Daily Breakdown</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.25rem">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Day</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Rate</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Yes / No</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Split</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Total</th>
        </tr></thead>
        <tbody>${dayRows}</tbody>
      </table>
    </div>

    <!-- No responses list -->
    ${noSurveys.length?`
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">
      No Responses <span style="color:#f87171;font-weight:400">(${noSurveys.length}${noSurveys.length>20?' — showing last 20':''})</span>
    </div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Interaction</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Agent</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Date</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Comment</th>
        </tr></thead>
        <tbody>${noRows}</tbody>
      </table>
    </div>`:''}`;
  document.getElementById('ar-detail-modal').classList.add('open');
}

// ── AHT Detail Modal ────────────────────────────────────────────────────────
function openAHTDetail(){
  const p=getPeriod(activePeriodKey);
  const ahtSec=p.aht||0;
  if(!ahtSec){showToast('No AHT set yet — enter seconds in the card');return;}
  const g=gradeAHT(ahtSec);
  // Daily AHT entries for the active period (month), newest first
  // Day-by-day numbers behind the tile (member logs, else the legacy personal log)
  const dailyAHTMap=getTileDailyAHTMap(p);
  const ahtHistory=Object.entries(dailyAHTMap)
    .map(([dk,v])=>({dk,...normAHTEntry(v)}))
    .filter(e=>e.aht>0)
    .sort((a,b)=>b.dk.localeCompare(a.dk));

  // Next better threshold
  const currentIdx=AHT_THRESHOLDS.findIndex(t=>t.grade===g.grade);
  const nextBetter=currentIdx>0?AHT_THRESHOLDS[currentIdx-1]:null;
  const prevWorse=currentIdx<AHT_THRESHOLDS.length-1?AHT_THRESHOLDS[currentIdx+1]:null;

  // Progress to next better
  let progressHTML='';
  if(nextBetter&&nextBetter.max!==Infinity){
    const floor=prevWorse?prevWorse.max:ahtSec+500;
    const range=floor-nextBetter.max;
    const pct=Math.max(0,Math.min(100,(floor-ahtSec)/range*100));
    // Avg daily AHT needed for the remaining working days to hit nextBetter
    let dailyTargetHTML='';
    const rd=getProjectionWindow();
    if(rd.isCurrentMonth&&(rd.remainingDays>0||rd.todayOnly)){
      const x=neededDailyAHTForThreshold(nextBetter.max,rd.remainingDays);
      if(x!==null){
        const dLabel=rd.usingWorkingDays?'wd':'d';
        const daysStr=rd.todayOnly?'today':rd.remainingDays+dLabel+' left';
        dailyTargetHTML=x>0
          ?`<div style="margin-top:8px"><span style="display:inline-block;font-size:11px;font-weight:700;color:var(--teal);background:var(--teal-dim);border:1px solid rgba(20,184,166,0.4);border-radius:5px;padding:3px 8px">🎯 avg ${fmtSec(Math.round(x))}/day &middot; ${daysStr}</span></div>`
          :`<div style="margin-top:8px"><span style="display:inline-block;font-size:11px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:5px;padding:3px 8px">&#9888; not reachable ${daysStr}</span></div>`;
      }
    }
    progressHTML=`<div style="margin-bottom:1.25rem">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Progress to ${nextBetter.grade}</div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:6px">
          <span>Need ≤ ${fmtSec(nextBetter.max)}</span><span>${Math.round(pct)}% there</span>
        </div>
        <div style="height:8px;background:var(--surface3);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:var(--teal);border-radius:4px;transition:width .4s"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px">Need to reduce by <span style="color:var(--teal);font-weight:600">${fmtSec(ahtSec-nextBetter.max)}</span></div>
        ${dailyTargetHTML}
      </div>
    </div>`;
  } else if(currentIdx===0){
    progressHTML=`<div style="background:var(--green-dim);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem;font-size:13px;color:#4ade80">🏆 At top grade — Exceptional AHT!</div>`;
  }

  // Daily AHT history within the active period (month)
  const todayKey=(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})();
  const histRows=ahtHistory.map(({dk,aht,count})=>{
    const sg=gradeAHT(aht);
    const isToday=dk===todayKey;
    const countBadge=count>0?`<span style="font-size:10px;color:var(--text-muted);margin-left:4px">${count}c</span>`:'';
    return`<tr style="border-bottom:1px solid var(--border)${isToday?';background:rgba(20,184,166,0.06)':''}">
      <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim)">${fmtDayLabel(dk)}${isToday?' <span style="color:var(--teal);font-size:10px">●</span>':''}</td>
      <td style="padding:8px 10px;font-family:var(--mono);font-weight:600" class="${sg.gcls}">${fmtSec(aht)}${countBadge}</td>
      <td style="padding:8px 10px"><span class="grade-pill ${sg.cls}" style="font-size:11px">${sg.grade}</span></td>
      <td style="padding:8px 10px;min-width:100px">
        <div style="height:5px;background:var(--surface3);border-radius:3px;overflow:hidden">
          <div style="width:${Math.max(5,Math.min(100,Math.round((2000-aht)/2000*100)))}%;height:100%;background:var(--teal);border-radius:3px"></div>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Threshold table
  const threshRows=AHT_THRESHOLDS.map((t,i)=>{
    const isCur=g.grade===t.grade;
    const maxLabel=t.max===Infinity?'above Satisfactory':'≤ '+fmtSec(t.max);
    const weights=['15%','14.25%','12.75%','12%','0%'];
    return`<tr style="border-bottom:1px solid var(--border)${isCur?';background:rgba(20,184,166,0.06)':''}">
      <td style="padding:8px 10px"><span class="grade-pill ${t.cls}" style="font-size:11px">${t.grade}${isCur?' ●':''}</span></td>
      <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim)">${maxLabel}</td>
      <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-muted)">${weights[i]}</td>
    </tr>`;
  }).join('');

  // Who's behind the number: the tile is the average of each member's own AHT.
  const memberAHT=getAHTLoggedAgents(p).map(a=>({a,s:getMemberAHTStats(p,a)})).filter(x=>x.s).sort((x,y)=>x.s.avgSec-y.s.avgSec);
  const memberTableHTML=memberAHT.length?`
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">By member</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.25rem">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Member</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Logged</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">AHT</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Chats</th>
        </tr></thead>
        <tbody>${memberAHT.map(({a,s})=>{const mg=gradeAHT(s.avgSec);return`<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:8px 10px;font-size:12px">${escHtml(prettifyAgentName(a))}</td>
          <td style="padding:8px 10px;font-size:12px;color:var(--text-dim)">${s.isMonthly?'Month total':s.days+' day'+(s.days!==1?'s':'')}</td>
          <td style="padding:8px 10px;font-family:var(--mono);font-weight:600" class="${mg.gcls}">${fmtSec(Math.round(s.avgSec))}</td>
          <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-muted)">${s.totalChats||'—'}</td>
        </tr>`;}).join('')}</tbody>
      </table>
    </div>`:'';

  document.getElementById('aht-detail-body').innerHTML=`
    <!-- YTD Banner -->
    ${(()=>{
      const y=parseInt(activePeriodKey.split('-')[0]);
      const ytd=getYTDStats(y);
      if(!ytd||!ytd.avgAHT)return'';
      const yg=gradeAHT(ytd.avgAHT);
      const wh=weightAHT(ytd.avgAHT);
      return`<div style="background:rgba(168,85,247,0.07);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--purple);margin-bottom:8px">📅 Year-to-Date ${y}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">YTD Avg AHT</div><div style="font-size:16px;font-weight:600;font-family:var(--mono)" class="${yg.gcls}">${fmtSec(ytd.avgAHT)}</div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Grade</div><div style="margin-top:2px"><span class="grade-pill ${yg.cls}" style="font-size:10px">${yg.grade}</span></div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">KPI Contrib.</div><div style="font-size:16px;font-weight:600;font-family:var(--mono);color:var(--purple)">${wh}%</div></div>
        </div>
      </div>`;
    })()}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1.25rem">
      ${[
        ['Current AHT',fmtSec(ahtSec),'var(--teal)'],
        ['Grade',g.grade,''],
        ['KPI Weight',currentIdx===0?'15%':currentIdx===1?'14.25%':currentIdx===2?'12.75%':currentIdx===3?'12%':'0%','var(--purple)'],
      ].map(([label,val,color])=>`
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
          <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:${color||'var(--text)'}"><span class="${!color?g.gcls:''}">${val}</span></div>
        </div>`).join('')}
    </div>
    ${progressHTML}
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Grade Thresholds</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.25rem">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Grade</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Threshold</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">KPI Weight</th>
        </tr></thead>
        <tbody>${threshRows}</tbody>
      </table>
    </div>
    ${memberTableHTML}
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">AHT History — ${(()=>{const[ahtY,ahtM]=activePeriodKey.split('-').map(Number);return periodLabel(ahtM,ahtY);})()}</div>
    ${ahtHistory.length?`
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Day</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">AHT</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Grade</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Relative</th>
        </tr></thead>
        <tbody>${histRows}</tbody>
      </table>
    </div>`:`<div style="font-size:11px;color:var(--text-muted);font-style:italic;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px">${memberAHT.length&&memberAHT.every(x=>x.s.isMonthly)?'Only month totals are logged for this period, so there is no day-by-day breakdown.':'No daily entries logged yet this month — add them in the AHT card to see a day-by-day breakdown.'}</div>`}`;
  document.getElementById('aht-detail-modal').classList.add('open');
}

// ── KPI Score Detail Modal ───────────────────────────────────────────────────
function openKPIDetail(){
  const p=getPeriod(activePeriodKey);
  const surveys=p.surveys||[];
  const csatS=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  const avgCSAT=csatS.length?calcCSAT(csatS):null;
  const arR=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arY=surveys.filter(sv=>sv.ar==='yes').length;
  const arPct=arR.length?arY/arR.length*100:null;
  const ahtSec=p.aht||0;
  const wc=weightCSAT(avgCSAT),wa=weightAR(arPct),wh=weightAHT(ahtSec);
  const cmRows=customMetricBreakdown(activePeriodKey);
  const wCustom=customMetricsPoints(activePeriodKey);
  const hasAny=avgCSAT!==null||arPct!==null||ahtSec>0||wCustom>0;
  if(!hasAny){showToast('No KPI data yet');return;}
  const total=wc+wa+wh+wCustom;
  const g=kpiScoreGrade(total);
  const csatG=avgCSAT!==null?gradeCSAT(avgCSAT):null;
  const arG=arPct!==null?gradeAR(arPct):null;
  const ahtG=ahtSec>0?gradeAHT(ahtSec):null;

  // History
  const allStats=getAllPeriodStats().sort((a,b)=>a.key.localeCompare(b.key));
  const kpiHistory=allStats.map(s=>{
    const wc2=weightCSAT(s.csat),wa2=weightAR(s.ar),wh2=weightAHT(s.aht||0);
    const kpi2=(s.csat!==null||s.ar!==null||(s.aht&&s.aht>0))?wc2+wa2+wh2+customMetricsPoints(s.key):null;
    return{...s,kpi:kpi2};
  }).filter(s=>s.kpi!==null);
  const kpiVals=kpiHistory.map(s=>s.kpi);
  const best=kpiVals.length?Math.max(...kpiVals):null;
  const worst=kpiVals.length?Math.min(...kpiVals):null;

  const histRows=kpiHistory.reverse().map(s=>{
    const sg=kpiScoreGrade(s.kpi);
    const isCur=s.key===activePeriodKey;
    const barW=Math.round(s.kpi);
    return`<tr style="border-bottom:1px solid var(--border)${isCur?';background:rgba(168,85,247,0.06)':''}">
      <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:var(--text-dim)">${s.label}${isCur?' <span style="color:var(--purple);font-size:10px">●</span>':''}</td>
      <td style="padding:8px 10px;font-family:var(--mono);font-weight:600" class="${sg.gcls}">${s.kpi.toFixed(2)}%</td>
      <td style="padding:8px 10px"><span class="grade-pill ${sg.cls}" style="font-size:11px">${sg.label}</span></td>
      <td style="padding:8px 10px;min-width:100px">
        <div style="height:5px;background:var(--surface3);border-radius:3px;overflow:hidden">
          <div style="width:${barW}%;height:100%;background:var(--purple);border-radius:3px"></div>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Component breakdown visual
  const compRows=[
    stockInScope('csat','dashboard')?['CSAT Score',avgCSAT!==null?fmtCsat(avgCSAT):'—',wc,50,csatG,'var(--accent)']:null,
    stockInScope('ar','dashboard')?['Agent Resolution',arPct!==null?arPct.toFixed(1)+'%':'—',wa,35,arG,'var(--green)']:null,
    stockInScope('aht','dashboard')?['Avg Handle Time',ahtSec>0?fmtSec(ahtSec):'—',wh,15,ahtG,'var(--teal)']:null,
    ...cmRows.map(r=>[
      r.def.name,
      (r.avg!==null&&!isNaN(r.avg))?(Math.round(r.avg*100)/100)+(r.def.unit?' '+r.def.unit:''):'—',
      r.pts,r.max,
      (r.grade&&CM_GRADE_CLS[r.grade])?{cls:CM_GRADE_CLS[r.grade],grade:r.grade}:null,
      'var(--orange)'
    ]),
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

  document.getElementById('kpi-detail-body').innerHTML=`
    <!-- YTD Banner -->
    ${(()=>{
      const y=parseInt(activePeriodKey.split('-')[0]);
      const ytd=getYTDStats(y);
      if(!ytd||ytd.kpi===null)return'';
      const yg=kpiScoreGrade(ytd.kpi);
      const ywc=weightCSAT(ytd.avgCSAT),ywa=weightAR(ytd.arPct),ywh=weightAHT(ytd.avgAHT);
      return`<div style="background:rgba(168,85,247,0.07);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--purple);margin-bottom:8px">📅 Year-to-Date ${y}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">YTD KPI</div><div style="font-size:18px;font-weight:600;font-family:var(--mono)" class="${yg.gcls}">${ytd.kpi.toFixed(2)}%</div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Grade</div><div style="margin-top:4px"><span class="grade-pill ${yg.cls}" style="font-size:10px">${yg.label}</span></div></div>
          <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Months Tracked</div><div style="font-size:16px;font-weight:600;font-family:var(--mono);color:var(--text-dim)">${ytd.months}</div></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted)">CSAT <span style="color:var(--accent);font-weight:600">${ywc}%</span> · AR <span style="color:var(--green);font-weight:600">${ywa}%</span> · AHT <span style="color:var(--teal);font-weight:600">${ywh}%</span>${ytd.custom>0?' · Custom <span style="color:var(--orange);font-weight:600">'+ytd.custom+'%</span>':''}</div>
      </div>`;
    })()}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1.25rem">
      ${[
        ['Final KPI',total.toFixed(2)+'%','var(--purple)'],
        ['Grade',g.label,''],
        ['Best Ever',best!==null?best.toFixed(2)+'%':'—','var(--green)'],
      ].map(([label,val,color])=>`
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</div>
          <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:${color||'var(--text)'}"><span class="${!color?g.gcls:''}">${val}</span></div>
        </div>`).join('')}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px">Score Breakdown</div>
    ${compRows}

    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;color:var(--text-muted)">Total KPI Score</span>
      <span style="font-size:20px;font-weight:600;font-family:var(--mono);color:var(--purple)">${total.toFixed(2)}% <span class="grade-pill ${g.cls}" style="font-size:12px;margin-left:4px">${g.label}</span></span>
    </div>

    ${kpiHistory.length>1?`
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">KPI History</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Period</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">KPI</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Grade</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Score</th>
        </tr></thead>
        <tbody>${histRows}</tbody>
      </table>
    </div>`:''}`;
  document.getElementById('kpi-detail-modal').classList.add('open');
}

// ── Theme System ─────────────────────────────────────────────────────────────
const THEME_DEFS=[
  {id:'dark',     name:'Midnight Dark',    desc:'Classic deep dark interface',        swatch:'linear-gradient(135deg,#0d1117,#151b23)',dot:'#2f81f7'},
  {id:'light',    name:'Clean Slate',      desc:'Bright, airy workspace',             swatch:'linear-gradient(135deg,#f0f4f8,#e8eef4)',dot:'#2563eb'},
  {id:'newfold',  name:'Newfold Orange',   desc:'Official Newfold brand identity',    swatch:'linear-gradient(135deg,#0f1117,#f97316)',dot:'#f97316'},
  {id:'nature',   name:'Forest Canopy',    desc:'Earthy greens, fresh air feel',      swatch:'linear-gradient(135deg,#0b1209,#4ade80)',dot:'#4ade80'},
  {id:'galaxy',   name:'Galactic Core',    desc:'Deep cosmos & nebula glow',          swatch:'linear-gradient(135deg,#03050f,#60a5fa)',dot:'#60a5fa'},
  {id:'sunrise',  name:'Rise & Shine',     desc:'Warm gold light, daily inspiration', swatch:'linear-gradient(135deg,#fffbf0,#d97706)',dot:'#d97706'},
  {id:'cyberpunk',name:'Neon District',    desc:'Electric city nights, cyber vibes',  swatch:'linear-gradient(135deg,#060812,#00ffc8)',dot:'#00ffc8'},
  {id:'ocean',    name:'Deep Blue',        desc:'Ocean depth, calm & laser-focused',  swatch:'linear-gradient(135deg,#020b12,#06b6d4)',dot:'#06b6d4'},
  // ── Photo themes ──
  {id:'img-nature',   name:'Into the Forest',  desc:'📸 Live forest photo background',    swatch:'url(https://images.unsplash.com/photo-1448375240586-882707db888b?w=80&q=60)',dot:'#4ade80',isPhoto:true},
  {id:'img-mountain', name:'Summit Light',      desc:'📸 Mountain peak photo background',  swatch:'url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=80&q=60)',dot:'#94a3b8',isPhoto:true},
  {id:'img-ocean',    name:'Open Ocean',        desc:'🌊 Built-in underwater scene',     swatch:'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 1920 1080%27 preserveAspectRatio=%27xMidYMid slice%27%3E%3Cdefs%3E%3ClinearGradient id=%27w%27 x1=%270%27 y1=%270%27 x2=%270%27 y2=%271%27%3E%3Cstop offset=%270%27 stop-color=%27%231aa6c9%27/%3E%3Cstop offset=%27.28%27 stop-color=%27%230b6b94%27/%3E%3Cstop offset=%27.65%27 stop-color=%27%23073553%27/%3E%3Cstop offset=%271%27 stop-color=%27%23020d18%27/%3E%3C/linearGradient%3E%3ClinearGradient id=%27r%27 x1=%270%27 y1=%270%27 x2=%270%27 y2=%271%27%3E%3Cstop offset=%270%27 stop-color=%27%23bff4ff%27 stop-opacity=%27.55%27/%3E%3Cstop offset=%271%27 stop-color=%27%23bff4ff%27 stop-opacity=%270%27/%3E%3C/linearGradient%3E%3CradialGradient id=%27g%27 cx=%27.5%27 cy=%270%27 r=%27.9%27%3E%3Cstop offset=%270%27 stop-color=%27%237fe3f5%27 stop-opacity=%27.55%27/%3E%3Cstop offset=%271%27 stop-color=%27%237fe3f5%27 stop-opacity=%270%27/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width=%271920%27 height=%271080%27 fill=%27url(%23w)%27/%3E%3Crect width=%271920%27 height=%271080%27 fill=%27url(%23g)%27/%3E%3Cpolygon points=%27180,0 300,0 560,918 416,918%27 fill=%27url(%23r)%27 opacity=%270.16%27/%3E%3Cpolygon points=%27520,0 720,0 1020,918 780,918%27 fill=%27url(%23r)%27 opacity=%270.14%27/%3E%3Cpolygon points=%27860,0 1010,0 1350,918 1170,918%27 fill=%27url(%23r)%27 opacity=%270.19%27/%3E%3Cpolygon points=%271180,0 1420,0 1720,918 1432,918%27 fill=%27url(%23r)%27 opacity=%270.13%27/%3E%3Cpolygon points=%271500,0 1640,0 2000,918 1832,918%27 fill=%27url(%23r)%27 opacity=%270.18%27/%3E%3Cpolygon points=%271760,0 1940,0 2180,918 1964,918%27 fill=%27url(%23r)%27 opacity=%270.16%27/%3E%3Cpath d=%27M0,0 L0,46.0 L40,51.7 L80,56.4 L120,59.3 L160,59.9 L200,58.0 L240,54.1 L280,48.7 L320,42.9 L360,37.6 L400,33.7 L440,32.0 L480,32.8 L520,35.9 L560,40.7 L600,46.5 L640,52.1 L680,56.7 L720,59.5 L760,59.9 L800,57.8 L840,53.7 L880,48.3 L920,42.4 L960,37.2 L1000,33.5 L1040,32.0 L1080,33.0 L1120,36.2 L1160,41.1 L1200,46.9 L1240,52.5 L1280,57.0 L1320,59.6 L1360,59.8 L1400,57.6 L1440,53.3 L1480,47.8 L1520,42.0 L1560,36.8 L1600,33.3 L1640,32.0 L1680,33.1 L1720,36.5 L1760,41.6 L1800,47.4 L1840,52.9 L1880,57.3 L1920,59.7 L1920,0 Z%27 fill=%27%23d9fbff%27 opacity=%270.18%27/%3E%3Cpath d=%27M0,0 L0,39.9 L40,37.6 L80,32.9 L120,27.3 L160,22.5 L200,20.1 L240,20.9 L280,24.5 L320,29.9 L360,35.3 L400,39.0 L440,39.9 L480,37.6 L520,32.9 L560,27.3 L600,22.5 L640,20.1 L680,20.9 L720,24.5 L760,29.9 L800,35.3 L840,39.1 L880,39.9 L920,37.6 L960,32.9 L1000,27.3 L1040,22.5 L1080,20.1 L1120,20.9 L1160,24.5 L1200,29.9 L1240,35.4 L1280,39.1 L1320,39.9 L1360,37.6 L1400,32.9 L1440,27.2 L1480,22.5 L1520,20.1 L1560,20.9 L1600,24.6 L1640,30.0 L1680,35.4 L1720,39.1 L1760,39.9 L1800,37.6 L1840,32.8 L1880,27.2 L1920,22.5 L1920,0 Z%27 fill=%27%239eeaf7%27 opacity=%270.22%27/%3E%3Cpath d=%27M0,0 L0,16.3 L40,11.6 L80,9.1 L120,10.1 L160,14.1 L200,19.1 L240,22.5 L280,22.6 L320,19.4 L360,14.5 L400,10.3 L440,9.0 L480,11.3 L520,15.9 L560,20.6 L600,22.9 L640,21.8 L680,17.7 L720,12.7 L760,9.5 L800,9.5 L840,12.8 L880,17.7 L920,21.8 L960,22.9 L1000,20.6 L1040,15.9 L1080,11.3 L1120,9.0 L1160,10.3 L1200,14.5 L1240,19.4 L1280,22.6 L1320,22.5 L1360,19.0 L1400,14.1 L1440,10.1 L1480,9.1 L1520,11.6 L1560,16.3 L1600,20.9 L1640,23.0 L1680,21.5 L1720,17.3 L1760,12.4 L1800,9.3 L1840,9.6 L1880,13.2 L1920,18.1 L1920,0 Z%27 fill=%27%23e8feff%27 opacity=%270.2%27/%3E%3Ccircle cx=%27118%27 cy=%27639%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.19%27/%3E%3Ccircle cx=%27888%27 cy=%27548%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.24%27/%3E%3Ccircle cx=%271128%27 cy=%27554%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.40%27/%3E%3Ccircle cx=%27253%27 cy=%27348%27 r=%277%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.35%27/%3E%3Ccircle cx=%27126%27 cy=%27710%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.29%27/%3E%3Ccircle cx=%27452%27 cy=%27167%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.41%27/%3E%3Ccircle cx=%27593%27 cy=%27549%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.33%27/%3E%3Ccircle cx=%271169%27 cy=%27435%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.40%27/%3E%3Ccircle cx=%27370%27 cy=%27225%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.33%27/%3E%3Ccircle cx=%27384%27 cy=%27501%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.33%27/%3E%3Ccircle cx=%27128%27 cy=%27697%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.35%27/%3E%3Ccircle cx=%271016%27 cy=%27816%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.30%27/%3E%3Ccircle cx=%27643%27 cy=%27596%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.43%27/%3E%3Ccircle cx=%27740%27 cy=%27426%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.39%27/%3E%3Ccircle cx=%271431%27 cy=%27918%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.20%27/%3E%3Ccircle cx=%27614%27 cy=%27657%27 r=%274%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.42%27/%3E%3Ccircle cx=%271493%27 cy=%27579%27 r=%273%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.34%27/%3E%3Ccircle cx=%27149%27 cy=%27240%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.29%27/%3E%3Ccircle cx=%271550%27 cy=%27470%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.43%27/%3E%3Ccircle cx=%27863%27 cy=%27160%27 r=%277%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.20%27/%3E%3Ccircle cx=%271142%27 cy=%27706%27 r=%273%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.27%27/%3E%3Ccircle cx=%27717%27 cy=%27728%27 r=%274%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.34%27/%3E%3Ccircle cx=%27934%27 cy=%27190%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.44%27/%3E%3Ccircle cx=%27970%27 cy=%27833%27 r=%277%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.20%27/%3E%3Ccircle cx=%271497%27 cy=%27838%27 r=%273%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.35%27/%3E%3Ccircle cx=%271395%27 cy=%27961%27 r=%274%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.26%27/%3E%3Ccircle cx=%27790%27 cy=%27804%27 r=%273%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.19%27/%3E%3Ccircle cx=%27945%27 cy=%27483%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.34%27/%3E%3Ccircle cx=%271011%27 cy=%27180%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.39%27/%3E%3Ccircle cx=%27264%27 cy=%27876%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.29%27/%3E%3Ccircle cx=%271877%27 cy=%271012%27 r=%274%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.20%27/%3E%3Ccircle cx=%27919%27 cy=%27531%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.26%27/%3E%3Ccircle cx=%27280%27 cy=%27958%27 r=%274%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.41%27/%3E%3Ccircle cx=%27570%27 cy=%27843%27 r=%274%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.45%27/%3E%3Ccircle cx=%271398%27 cy=%27509%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.22%27/%3E%3Ccircle cx=%27360%27 cy=%27274%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.36%27/%3E%3Ccircle cx=%2724%27 cy=%27616%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.23%27/%3E%3Ccircle cx=%27577%27 cy=%27124%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.29%27/%3E%3Ccircle cx=%27756%27 cy=%27744%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.27%27/%3E%3Ccircle cx=%27257%27 cy=%27827%27 r=%275%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.44%27/%3E%3Ccircle cx=%271341%27 cy=%27812%27 r=%277%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.19%27/%3E%3Ccircle cx=%271842%27 cy=%271011%27 r=%277%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.40%27/%3E%3Ccircle cx=%27803%27 cy=%27527%27 r=%274%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.29%27/%3E%3Ccircle cx=%27986%27 cy=%27769%27 r=%274%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.20%27/%3E%3Ccircle cx=%27137%27 cy=%27333%27 r=%274%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.22%27/%3E%3Ccircle cx=%27696%27 cy=%27735%27 r=%272%27 fill=%27none%27 stroke=%27%23bff4ff%27 stroke-width=%271.2%27 opacity=%270.21%27/%3E%3Cpath d=%27M0,1080 L0,1010 L0,1010 L80,986 L160,986 L240,992 L320,978 L400,964 L480,975 L560,998 L640,1003 L720,999 L800,992 L880,997 L960,988 L1040,967 L1120,966 L1200,987 L1280,997 L1360,991 L1440,999 L1520,1004 L1600,999 L1680,977 L1760,964 L1840,977 L1920,991 L1920,1080 Z%27 fill=%27%2301080f%27 opacity=%27.85%27/%3E%3C/svg%3E")',dot:'#06b6d4',isPhoto:true},
  {id:'img-city',     name:'City Lights',       desc:'📸 Night cityscape photo background',swatch:'url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=80&q=60)',dot:'#facc15',isPhoto:true},
  {id:'img-supercar',  name:'Supercar Garage',   desc:'📸 Orange sports car photo background',swatch:'url(https://images.unsplash.com/photo-1725199259099-4fa8b9172da9?w=80&q=60)',dot:'#fb923c',isPhoto:true},
  {id:'img-sportbike', name:'Sportbike Run',     desc:'📸 Red sport motorcycle photo background',swatch:'url(https://images.unsplash.com/photo-1767275090329-331c0ffb1005?w=80&q=60)',dot:'#ef4444',isPhoto:true},

  // ── Holiday themes (animated) ──
  {id:'hol-christmas',name:"Christmas",desc:'❄️ Falling snow, festive green & red',swatch:'linear-gradient(135deg,#0a2a1c,#ef4444)',dot:'#ef4444',isPhoto:true},
  {id:'hol-halloween',name:"Halloween",desc:'🦇 Flying bats & glowing embers',swatch:'linear-gradient(135deg,#160a24,#f97316)',dot:'#f97316',isPhoto:true},
  {id:'hol-haunted',name:"Haunted Graveyard",desc:'👻 Cemetery, candles, ghosts, bats & a drifting reaper',swatch:'linear-gradient(135deg,#120a20,#7c3aed 60%,#f97316)',dot:'#a78bfa',isPhoto:true},
  {id:'hol-xmasvillage',name:"Christmas Village",desc:'🎅 Santa\'s sleigh, lit cabin, glowing tree, aurora & snowfall',swatch:'linear-gradient(135deg,#0e1830,#ef4444 60%,#22c55e)',dot:'#ef4444',isPhoto:true},
  {id:'hol-newyear',name:"New Year",desc:'🎆 Fireworks & confetti',swatch:'linear-gradient(135deg,#0b1030,#fbbf24)',dot:'#fbbf24',isPhoto:true},
  {id:'hol-cny',name:"Chinese New Year",desc:'🐉 Dancing dragons, fireworks & lanterns',swatch:'linear-gradient(135deg,#7f1020,#fbbf24)',dot:'#fbbf24',isPhoto:true},
  {id:'hol-valentine',name:"Valentine's Day",desc:'💘 Cupids, doves & hearts',swatch:'linear-gradient(135deg,#3a0f2a,#f472b6)',dot:'#f472b6',isPhoto:true},
  {id:'hol-holyweek',name:"Holy Week",desc:'🕯️ Quiet light & drifting golden motes',swatch:'linear-gradient(135deg,#2a1650,#fde68a)',dot:'#c4b5fd',isPhoto:true},
  {id:'hol-easter',name:"Easter",desc:'🐰 Easter Bunny, hatching chicks & painted eggs',swatch:'linear-gradient(135deg,#2d2250,#6ee7b7)',dot:'#6ee7b7',isPhoto:true},
  {id:'hol-autumn',name:"Autumn / Thanksgiving",desc:'🍂 Falling leaves in warm colors',swatch:'linear-gradient(135deg,#4a1d0b,#d97706)',dot:'#d97706',isPhoto:true},
  {id:'hol-diwali',name:"Diwali",desc:'🪔 Flickering diyas & rising golden sparks',swatch:'linear-gradient(135deg,#3b0764,#f59e0b)',dot:'#e879f9',isPhoto:true},
  {id:'hol-stpat',name:"St. Patrick's Day",desc:'☘️ Falling shamrocks & gold glitter',swatch:'linear-gradient(135deg,#0f4a28,#facc15)',dot:'#22c55e',isPhoto:true},
  {id:'hol-parol',name:"Parol (Pasko)",desc:'🏮 Giant Pampanga-style lanterns with chasing stained-glass lights',swatch:'linear-gradient(135deg,#0f1c4a,#facc15)',dot:'#facc15',isPhoto:true},
  {id:'hol-allsaints',name:"All Saints' & All Souls' (Undas)",desc:'🕯️ Cemetery at night: candles, families, tents & a tolling church bell',swatch:'linear-gradient(135deg,#1c1710,#e7c27d)',dot:'#e7c27d',isPhoto:true},
  {id:'hol-rain',name:"Rainy Day",desc:'🌧️ Steady rain over a cool blue-grey sky',swatch:'linear-gradient(135deg,#1b2a3a,#60a5fa)',dot:'#60a5fa',isPhoto:true},
  {id:'hol-ramadan',name:"Ramadan",desc:'🌙 Crescent moon, stars & swaying fanous lanterns',swatch:'linear-gradient(135deg,#0b2a3d,#f5c542)',dot:'#f5c542',isPhoto:true},
  {id:'hol-eid',name:"Eid Mubarak",desc:'✨ Gold & emerald fireworks, drifting crescents',swatch:'linear-gradient(135deg,#0a4a38,#fbbf24)',dot:'#34d399',isPhoto:true},
  {id:'hol-holi',name:"Holi",desc:'🎨 Festival of colours — exploding powder bursts',swatch:'linear-gradient(135deg,#ec4899,#facc15 50%,#22d3ee)',dot:'#ec4899',isPhoto:true},
  {id:'hol-hanukkah',name:"Hanukkah",desc:'🕎 Glowing menorah & silver stars of David',swatch:'linear-gradient(135deg,#0d1b5a,#60a5fa)',dot:'#60a5fa',isPhoto:true},
  {id:'hol-midautumn',name:"Mid-Autumn Festival",desc:'🥮 Giant harvest moon & rising lanterns',swatch:'linear-gradient(135deg,#2a1636,#fde68a)',dot:'#fbbf24',isPhoto:true},
  {id:'hol-july4',name:"Independence Day (US)",desc:'🎆 Red, white & blue fireworks, falling stars',swatch:'linear-gradient(135deg,#1d2f7a,#ef4444)',dot:'#ef4444',isPhoto:true},
  {id:'hol-phindep',name:"Araw ng Kalayaan (PH)",desc:'☀️ Katipuneros charging with bolos, waving flags, doves & fireworks',swatch:'linear-gradient(135deg,#0038a8,#fcd116 60%,#ce1126)',dot:'#fcd116',isPhoto:true},
  {id:'hol-dayofdead',name:"Día de los Muertos",desc:'🏵️ Papel picado, ofrenda, sugar skulls & monarch butterflies',swatch:'linear-gradient(135deg,#3b0f5a,#fb923c)',dot:'#fb923c',isPhoto:true},
    {id:'hol-sinulog',name:"Sinulog (Cebu)",desc:'🎺 Banderitas, golden sunburst & festival confetti',swatch:'linear-gradient(135deg,#7f1020,#fbbf24 60%,#14b8a6)',dot:'#fbbf24',isPhoto:true},

  // ── User photo themes ──
  {id:'img-mist', name:'Misty Pines', desc:'📸 Foggy sunrise forest', swatch:'url(data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAsAFADASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAABAUCAwABBgf/xAAsEAACAQQABQMDBQEBAAAAAAABAgMABBEhBRIxQVETImEycYEGFCOxwfCh/8QAGAEAAwEBAAAAAAAAAAAAAAAAAAECAwT/xAAcEQEAAwACAwAAAAAAAAAAAAAAAQIREkEhMWH/2gAMAwEAAhEDEQA/AOQto/UuFSMgc7sPvgCn1s78Pu/USMRODhtZ33pLbtDiA9GEjFjjeCfP2ptbpO0Q9eQSYOiB1p9FIj9XyC5u7MqV5Tblv/fNJOHApIrMMrnIwehFNeIPBJe2iYLckDBgB0Of6qmwgMV8jxEcsmvjP5pSHYcIt4+H29vIrMVuXIMYPtX5x2NXfqm7Nlw2RY4y0rDTFdJnvnz8VZxT2LaGM+5FB5QMAd6jxS9luuFMSkKqXA5i2SPxRqseZS2Zt2LTNh8KxAB1mjkt4pLERLcASKxwhGAR1yKcNAZopAeV8tH+d1GytIgrvL9fqOF333vNRNxxBcFkEEV9HIIR9QBZctnA0KG4Zw8cQkVZAwIZ1JU4PbZ+N1Sbn9txG5AX6nYZIoe0lmFxI9uXVuVhzIdgf7VxKO2ikYtYGQkSbzv5plBxKYgJMVdRvmHXp5pd6kKOqOM4QbrZBEXOjAqevxU8gu9cXHEQx0ApHt1370zsGCyL7PafJ/7FJbUATMznCYHuXeac2qfyDHuHle9LlGnh8s0lxMGkYtnyetMEi9UPCOj9B/lKraTEuShx2FFJxmG0kDEqCM83fFZ3tvprX6x7ImV0VQMFDj7E1ZHw9AZ10Qk7f0aW3HHiZv3AP8fLynWMnOa1PxhpLK6khyPVuCwbO8YqOj2HMXwiee8KjJExwM9qASSaOUeizRdclT0HepySh3n5gWy+c9aHaQKuMHIz1rojwykYrWzSp6inAQHP4rDyJEFBBQHWTsnzS0ys/KTrAC68VZ9PKep+aU1Gj1hiAD/uGG+gGDR8LwxMrRTBVI3gf9ikRlZjk4z8VhnkCkBtDtSmulEunnuLVJwnqczFeYEGgXnhkkICkEaPikYkZiSTsbqaOyhSDthulFcEj7ySWYkRsOTxVMc8hQxMzFTrAOKpUnez0NWMoBB3kgd6rBCDDkbA9vkGoSqpXse+qrGx9s1EOSxp4H//2Q==)',dot:'#a3c48a',isPhoto:true},
  {id:'img-reef', name:'Coral Reef', desc:'📸 Sunlit coral & sea life', swatch:'url(data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAA1AFADASIAAhEBAxEB/8QAGgAAAwEBAQEAAAAAAAAAAAAAAwQFAAYCAf/EADEQAAIBAwIEBQEHBQAAAAAAAAECAwAEERIhBTFBURMiYXGBFCMyM6HR4fBCUpGxwf/EABkBAAIDAQAAAAAAAAAAAAAAAAIEAAMFAf/EACURAAICAgICAQQDAAAAAAAAAAECAAMRIQQSMUETFCJRYXGB4f/aAAwDAQACEQMRAD8A5iCCR3BGw/uJpqS4lSTzAKVGFYbmgRyEAAo6Z3UsNv8ANMhED4uDp1bggZPxTYAH3E6iDMSegG4zaTTzQgg65ozlcoGJHb2HrVBLiadvDljXI2Ojytj3HSkbdoYJFWFEd3OBrJOB3OCK9swA0RnPiHdsnG23KotwsOFkek1DsxGJ0/DryOV0htocxry1Pk59zV5p/Ei0lkUcvMetcpwfwolLs4XGcEgZPrVSW4ReHh4xqGdRZ9id+1L21MzRmrkKFiV5KEm1JbpMwOCXGNH7etKXt0t1aqkmGnA/p5D0o9/fPcwieFwGXyyL0IqZalIpyWj1rIMEMOQ603VWVXcTu5Ad8D3Jcy65AGVY0A3yaFoUq+Ngo2AGx9c0zMqpdlE86qSAMYyCO1egsmkaYJBAo3yudvnpVV3K+J8S+jimxJKgv3jDWynUkq/d9e4r6kklq0a3MRzzUsMUKa1WZFlh1K4G4JAGPbnmjx3cRSKO5lDMp3JjOcdt6FG67EOxA2jGrdlaQmNgGbmx/Wix7yBCfKo5nnQpDBd3OuG4ijwoGCuhWxz9s14D6S6yFUIO2W3cH22/1TCXoTsYillBxoypLPpPho2V2UY2p2a6LweHsF8NgRn1/audjceU55dKPNO/kXG52x702epG4j8bKwxKUILYa3UtkYIB60pFcEXAZCzNnIwc6RSjXkqW2iOZgTsccuWN6Ja2txNBoQliw2YjCn0zSRsZM5x+vz/f5mnTxlscDf7/AMjE/E4LWRvDXXIdjg7n+dqn3l9IkxkcTQxMMnRyOf51ol/wy6imE7SpKFcMzKMMaDc3c7pl4zEoOosRjPQZrLZT3Deczcz0XqNYjTSSzQwyKIZZ1UiORdjn1J/L2zU88Il04uXK6js+NWPftT/D7mMR6IIshgQRjO+OWeuKcnWTUJbYnEj4KgYHLp2HPnU+rZHZR78ytuNlQ3mRo+EzQsI7kmJDnTIozqHvyFWZ+Imewex+mBGkBHRRgEduxoEctvPaxo8rIY5D+IuRvtgjnt3qtwrgSySCeCczQodLruqNjpk0bVraA7Dx4/mLk9fsEl2FlcXKM8/2Tg5YyKRn15YxXm7iaaPShjjUnCtg+bpt1ro76Q2oQC0CQlsSN94ItRr6W2mjX6UeG+cgluff5/U023K6gLFqeAbH7HcYsLSO3sSzAKwAy2PNn56bUJL9UneUkCNBjYZHpnsaBNdB49AnUyE6SQ2VG23/AGozgyy6Zp1jiU5Zd9RHek2xY+ZtIEpQASs3FILyQxvFlM9BhmPSvk1/Z2y+D9LBg7Fxh8+nWoLoTdeFbZEufKc7U7BY6FLXLwpL1R11FfjlvXHqzrMDs1hyoi/CriUYhjcpzbI71QS5k8b6UnKqoZm5F9+tatXHRWByPUrV2AGD7lOGKPipmWWKJXDALJoBYfPxVK1t4OHHVBENRwCSx82e+DvWrVK3boBmcdF7k4jNzxLXKsJt4whG5HOuf45YEu1zHO6qAMIQD+g/KtWowo1OBiviS7MGABzh9WQoxgLvz/KqUEqcSgkgkhREC6wF71q1A8qQlnwYOOWJFV4YdBY+GMtq07ZyNqQnunY/bBZRnG/T2NatRrsmaCnCACf/2Q==)',dot:'#fb923c',isPhoto:true},
  {id:'img-hongkong', name:'Harbor Dusk', desc:'📸 Hong Kong sunrise skyline', swatch:'url(data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAA1AFADASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAQBAgUGA//EAC8QAAIBAwMDAgUDBQEAAAAAAAECAwAEERIhMQUTQSJRFGFxgaEyQpIzkbHB0eH/xAAYAQADAQEAAAAAAAAAAAAAAAAAAQMCBP/EAB8RAAMAAgIDAQEAAAAAAAAAAAABAgMRMUESIWEEUf/aAAwDAQACEQMRAD8A4JFJppLd2xvWjH02LSCbiD+W/wDinIelxmVY1uYizcYfap1nfR2xglcmfDZORnAJ4xTPwbLtg5Fbi9AuosDQ32YUxFYsjEOGyvI1rtXJWazpShcHPrbN5jyD5Ne0fTtXq0rj5111r0gTKcQt9zXhcdO7ZKiCQfSpL9F/wTcv0jmpLMdvPaFLSdPDqSAtdFJZygECCX70lJBKuR23H0NWnN8MudmE9iI9yoxS02iMDKI3zrUuYLgH0LLvzmkbi1mKeoN/GuqMyXZC8LYusygDAz74PFORzxIVOA229ZSSQZfXCx8DD1bvIl8qqpMOQNJPO2+/1o1sgraN5Lz1Y2wOMtVLeU/HTB9I33GeDSiXsQm0LCFC8YPO/mqicJczSvknfJ5rKXwp5709nb9Nv1hX+tJGuOSKSur2O4nylw2ffVisKDqWpcRk7DzS7XPrORnFQnC02y1ZJ5RqSXM8kZbuRgKD+qUkn80lcvcpAJmk0Ix/UdxSE1zjSNQ0sdh8vNTeTh7REhB0PyDyCPH5qqloi72RJe3LACO9k25wT9sVnzySuDqnkc+QSTUNcdpNOhWJIIJ8Yzt+aqrM0i6crqGTvVV6It7C1TvyModUIGcvkA1QSD4nubFdWcGq4IgAK+ok1aMIj5mJKD9qHBzTZkYBjVmkbWQU9ONjk8famcqluAACZVBDMNxjn81mNMdK4+Y39qlZWYrnOBnAzjFJyPZoRXAt4lbthy2cH++2PrUDqOkkEZVmyPcDekFy2QSCQpAFDoAw07gbbmhSg8mO3t000yooBAbAP/KlCVtJGZtSRyDkjJJ/NZ5ZxvuKqGJkO/uaHO/QKuxq4jR0Qowck7qAcr/5Xvd2vZ7bITGCuAeaQSfR+wHwMk/6r1hnHbkEjHQMFVzx9Kw1S4Ny5fJ4KxAx7moT1bnfFFFWJAT6T86F4oooAsGJ32BO+23moVjrz55oopdB2QWJOaqW9ROKKKYEZ5qKKKAP/9k=)',dot:'#fb923c',isPhoto:true},
  {id:'img-fuji', name:'Sakura & Fuji', desc:'🌸 Falling cherry blossoms, Mt. Fuji', swatch:'url(data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAA2AFADASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAUCAwQBBv/EADEQAAIBAwIDBwIFBQAAAAAAAAECAwAEERIhBTFBEyJRYXGBkRQjFTJCobFDUnLR4f/EABkBAAIDAQAAAAAAAAAAAAAAAAIDAAEEBf/EACARAAICAgICAwAAAAAAAAAAAAABAhEDIRJBFDEEE1H/2gAMAwEAAhEDEQA/AHjQv41ExTdD+1Vm4Yc9VAuscx8109ma0DJOP6efSojtQO9GwHzVy3oPJR81YLnP6Kmya/TBIVxhsD/IUvuIomORp9qfF1bnGp9RUCkL84k+KKM6Fzhy7PNiFM7VIQrjIGa9C1pbFSdHIZ2rLY2dvPw+CVmZWdASMUf3K6FeO6sTmHwFR7A+Bp2/D7f9M+D5is7WeD3XDUxZEKeJofNawN5VWbCM8nAoN3CPzOnzUTf26/qz6Vy1kZ25Yo9nfw4dHB9q59CR4GuLxG1Aywc+Qrr8StyQYw2eq4o1kkKeGJBrZl6N7GoiFujyCtScRgYcyPUVXeXNpLAVkuDGpO5jbB+RVvNSBWC/Qr4lxC24cuLi5bJ2ICZI9awcO4zYCxjQ3UaFBp0k70s4ovCLd3a3imuWOdTu5bGQd98Hz9qSJ9J26sIxIP7CG3+N6R5EnK6DlgilVnuRxHh8jqovIGZjgANkk0yS2I6EUltOIcLtIleDhMsRA/MLfr6mmqcYVT95ggPI09ZmKXx0Kjbx5BZyfRsVEWSSHa4KjOMBs13VpTV9piRgZBB9qqhdMlmOnmQNO4APIDpWe2uzc0n0Wvw7SBi6IIO+cmhrNkTKSdpnwYj2q6S4hSATHvKTjB3x5bVnl4nFEdUA3AzuCceGfCopMjjFEpLWVIS4U69sDtN/ikv08kTPNeNcRguN42BOfmtltcPeOvfkkbJyxQqMHqOlaLeCRJPvdk6DBLFc4HjQO5ANKtIqvZZ1tNUUE8iFXJdiNSjGGOM8sV5/tzHMsiNKjqcg6MEH1zXo722E8bql0F1ZUgnkPSklzw60t01TXEkpPWFBgfJ/fyoFFrbJNt1VkriXUw7aSaVueNYx/NaLO4jkQLcTYC7nVuQPXFKjJZE4QzsqjbUAD/NchuEjZniDKNJDKd+oxTEtAKWx4lxLIThyc9ScY9MVTkRSSQyFjI35WGSAD70UVb9jlsvsbUvpUEaWXfJPexnf/laYjAjpGke+dWobb58KKKpvYSSohxK/WG8S3KEkAkEbDPn40qfid0DGvbMycguAAKKKtPQuZ28DRBSG+4x72OVZLiV5V+7hh1BGx/1RRVWZuTsypDEg1NqwfCtcNrHcD7YKKwwTnf4ooq0Vez//2Q==)',dot:'#f4b6d3',isPhoto:true},
  {id:'img-anime', name:'Anime Ensemble', desc:'📸 Fan-art character collage', swatch:'url(data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAtAFADASIAAhEBAxEB/8QAGgAAAwEBAQEAAAAAAAAAAAAABAUGAwECAP/EADAQAAIBAgUDAgYCAQUAAAAAAAECAwQRAAUSITETQVEiYQYUcYGRoTJCsTNDwfDx/8QAGAEBAQEBAQAAAAAAAAAAAAAAAgMBBAD/xAAeEQACAgMAAwEAAAAAAAAAAAABAgAREiExAyJRQf/aAAwDAQACEQMRAD8AWtklJHklU7SxvVQy9PSt31drADf/AMxhPlmXxZQ0tLGJXSXUXudYANzz2A+/nDbIqgS1knRp1pwiqJNOqx52Pi9zv7e2PnpZajM5ICqVSy1BmcRpq6S203P/AHtgNbHf5LLQGoLQPCKgVME8bNUD5bTJAzIrHj1d+Dt9sNa3KIGgKoYiJCxdQo9Hp4B8ex4ODqfKISxYt6S+mI/xFr7G31wtppLyPBLKesSxBW7aGFxxt/UbjjEmWm72UUsQaEE+E5ZZZpIRFVgRAJIxUMiW7XH0wTUyyBvnqulgNHMwBdWKueQCb88fsYYZJWU9JTxU0LdGN5CGZgNTtfnSDsbcm9tsLs3qqSsSFTO7s097Aiwvzse1he+MxJawIlYEUxmz1xzDNoad6D0OrysrSXKoym534PG2AavJYpsxeUMaeczAorEFNJtfje+/7x4pc7jnqZXklaKrmj6RluLBALWv235OOrVmJoxTTa6WXSAG/owG4va/J8746kH0yHkPtkg5GtDHldHPK0HTkqLqFMouxIHANtt8O0qZjCJlVJFdgFYMLG5tb83xGUU82V1sMlZSCqjKmQRUo1HULbtq5Ft7DxgmBqyseVqaQ5Zl8rXMWr1NfewHY7nxgZgNQ59mOR09iXJJZaCAT16MwmiL07FtQtexOnzsbX98VtBWrXUCPR6KdiLOHW1t7Hjk3/ziWoauOpAaufVLJbUjR+nbg3/zgunqmdXdTTUtLLaOyH1xk2O/ng4DDI6lEXDZlJmywEwU6RqZ3YsmtL8A7/nCr4jaKCgppZJepVsDoaEBWDFbXv3F74K+fipk1hpGuTGGLDXt58i//GJyGCoqYZZJ5709OWXWSA7DcgeObYyqNsYWsrrkJp4YFWCaKlqqmlVk60rIVS2+seOSPxjkVGtelSkULRLGsk6Mi3LoCdI9+++H/Xip8njp3lJfoiOMwelRfg2PO9/qML4oZYaaCnpESnshRpLai3nbvtfbGobG57FqyEWwQVWVJNEkAY1JiiElriNz6rW3P48Y2pKqbL65JpdJZGKvoAcAH/c8bm/0t2w/aK9DEJoIVndlYy8oAu68d99id8J/mo0kRJIB00mYsrnV1dzftwdvzh7AuEsAauZ518xWqskDKktS9tSnRqUiw4PsdsA5DVwUVJNAzGN21i+gNdxa30FxuRi3zR4RBE8NFuw1FxEC0dxstu1x37YnFNNX5zFBNBE92Nha1yU9vf8AeDsCjC1GCwUdE7ZVE9HURVMy65QHvcAG1h2LG3NrYyzmnmyiscUtPJo0iW4j1BAQQAT7b/fFLNmQL9WOBY5IkQXB5u2/bwSMYR5w08M8ssKs0BOkFjY78HyMIAqdROcgLiN0kqwtXV0cgp1kkeV41PUFlGzA9rjn648wVSHJZI5WSJZGYCLhzdtrHiw7jBWYympy6eruyNUOodQ2x2IPvvpG2J2GcLC6dNSzXGok+ntsOPvhkWIBoynmqaPVHFUutM1JGoLqQwNttIPi3fDVaGCtiSakqHCD+RTctf77fbEll9a82aAyKryQqArsAeBYXGKb4fgAraqN7NEwU6AtgNTG+OcGjUuTvFZ7r0rqaaihoimmSRYZtttxyf3bA9DWLDmLSyRpHewjeRSFC335477++KWmRaapMIGtZAT6u24GIX4rr5I66qjX/TWWwW5Nit7EXv3JNuMVr5AzaoiOqzMWhE09w0hNzGjE8Gy79uScLsnWJMzMiqLSJpGp9TahuT98KKGqkqI3WRjar9DWNradNj747FWGigI0CRmkNibek+QMbVmb4tif/9k=)',dot:'#c084fc',isPhoto:true},
  {id:'img-galaxy', name:'Deep Starfield', desc:'📸 Nebula & starlight', swatch:'url(data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCACOAFADASIAAhEBAxEB/8QAGwAAAwADAQEAAAAAAAAAAAAAAwQFAAECBgf/xAA0EAACAgEEAQMCBAUCBwAAAAABAgMRAAQSITFBEyJRBWEycYGRFCNCodEG8BUzQ3KxweH/xAAYAQADAQEAAAAAAAAAAAAAAAABAgMABP/EACARAAMBAQEAAgIDAAAAAAAAAAABEQIhAxIxE0EiUXH/2gAMAwEAAhEDEQA/APBegwF7WCcA8+cxAAdvzxxjbRjshSAb4wbR0VfcDZIr+oZstlN5huSBVQFgaqxirLwKFcfONOzsF3WVHtHOAdDRIHjG0TBBFY17gP35znab5BB7H5YUL3Xj5zjpv/OBGMb2Myk2erHIP/zNyu7lbJKqNq8AV9jX65oVupg1dHnrDQhVbo2DfV3+mFJvgr4DIQRcMTJu6C8V83ff2zSk+bI+cw+5iQCO+s6qm94JA7FkYo6KspjWMoN13zzxio2FidoH65ehj02mhlE8AdmW4yewbv8AbEJVhlv2iLapO4Ld/avH54c8KenRVF94IFgGwa/bBaiIg7uyeRjcSGzVUR5zsRCQbf6h1XWP9k4SNpBHBNZyydkcqfJy9B9PYDeKcsvn+k31kzVwmElQb7HGCCiJQnn785tdysKaj42nDFyYljboHgfBOcbAMyV+jGfhZQx/DzQN85ojcxoUOwB4wixF+FHXNV3mBNobu67HNYXmATL+pDEratRHts8Ef7GLCI+oCwIU2P2yrqYtvQU8Xx/nFY4wW5rk+O8RItp042hU75PHA8+MNo4UhlLSU5vbWc6hGLUAQK4Bwe4R8FXJA6uucP0wQt/w8IiLeqgUjmheRNZpzKzBJQWZaPt7AyhC4ZFBAW+NxJxWVTu3Ku2sar6M+kSTT7X2shBBzRQMvsBNAkk1eV/TVz7j9sT1UBU2aonj7YrcMsUQg5fbVn58jCPEVNrVD5zNoDKdtC+8d9IOAVFjMnUZ5h6fVadHjBVBytUCTRyXqIWWV9qkrfZ85cmBEYA8Gj4/viTIksyKSDuHLHkfvhyb0UYijtKojcngmjV4VII9ysVMpB/CfJ8g/bDaKNJJxHKKLUN1hdovnvPSR6CDTxmSGYNNHwvtv9sZpE/kzx0rKrFbKqPA6zTBnRWBsDGtWACSU5+QPPm8QLPGzAAjd2MR8LZ6jNy9KLb4GdemZFIIsnNAhlACEHxt+cNE9mmUkg0BXJxWUQl/w+UxtMEJhU7WcDgXm1cw0QdrKeLyqqPMmyPdsPIrrEJvp7gsCwQoC/uH4vsMVPsQ+scrPSS723H0XdBftNcj7fOJQI+5woqRTtMZ/Ep7HGXBtliSaHmORd1+KOJPCGBWOww5o+PmsfK/ZP1d4Lemkjb0UUtbl6secOupABJLqoIF91iqh42KmTcl2D+ed6pBsVhSnsH5zo+NOOi4Gnk/iGebYi/g45bEZkR5FAdHFXY/evzzcgB1PuO0lqN+PvhdToY9FNFJFqodQkhNcdfmMV4KZ9ZwQaYhGRMXVnaQWxA+R3lHXaNYBEUnSQyKGpf6fsfvkuexztoqaqsilfos9FnSatdNtDOCbohbPHjB/VdedW24sEYtW0jx4N9V/jJxtUWpAxIBJFivt+mKTuUPBNVxfnAsdqGfp/GH0R540RUiAVU9oXoAfGTtSfYa4vxg4tTU6FuSD1jGpdZrKqqgk8A9E5TzhH00xBWZR+Khf74SaQFkQuEtq3MaofOJzTEEqE5bsnE5ZJN9FSWrwLy8IUPMsTSEOX4J9wFWPGIs9sR7uDxjEkhkJZyVZybpaAGc/wANJ/0jvbzXNjC1wHygIylTzyeDx4wc8jGS2IZm5N+c61IkSIhk2Emxfj7DE95kAB4P/d2MCSpntw3E++VweAQfyzNRslRmZmEnAVQLB+b+OKwUAY6hShA91VjUukuctdAm8ZZqor3wpza+L1g9bSeCosAZg+oBpAIxuB4FHznnZndmDL7V8DsYx9PZRMpd6/LznDnh2N1ws6gyf8yRwHINJd0fH/vJckjvZLdDkX0Mf1J9a9p5vi/OT3QlWJNGwAM7MycObf2FhnkK0xtfuMtfQtXHo9Ykkieoi9D5yHErx1Zst5Bwqz7GAW+Or/3xha+SjAudKf8Aqj6hHrNUJYFEYPVDo55kxnaSR10MoTMZWN/27xhdEZYVYDkDkZs4SUNqt0l6NWbUJwSboZ6BNL6xtiEQjjjE9LMmmaRGjRnfjleRz4yz9LZdTqwZB/JhQu4+T4H98olMkvvUPMzRx7lJZVB4PnOkYiT2sCoHkePtgdXKqAIBZPJPziyy8AEkDwR4zkaSL502ym0u4i7BF9d3mRRTSOCpJ3nm819KibVs24AJ8nzl1I0jVFsd9XVYVtfoqsVAT9Pj9EF32V3839sUl0I/HuAUf0+cLJKEZV37wgoA9k/fJv8AGkSktbOTSqOv1yyf9iaiHmiCRksoodAd4fT6hGZUqr+DiEH1A6j+VQBPHWGXZCh2kyvuN0Pw/fGTB/gbW/SmZDNDIrAEcE0Rlb6eK+lICeWLAbvixiOk9XUhYy6qtGjXOW9BpWk+krEy7mDEE/N84rcXQrNdR80djLMAPw/JyhoYkNEhifPGLvCsaX2W5v4zsTNEAQeG9v7ZFebsFXp+y1okHr2jKgA2g1nay/zqdQwHg5KXWejyobcT2TmLqXWZieSfGH8TT4VXqmujmtgneMhFf04+WI6W/wDOSpYJNtGgDXGMjXSNKVY9GwRnU8nqMC9lzzeNhNsG/jKjrRaAyFBK464qj+mVo4I9DfpkG1ogi8X0UJjet3PZ++OsfV3RVSrRPPZx5DZSgX6VqoX1exdu5lqq6y9A40YdFYs1mxfWeZXSDS6qUqxLIavKX0gFpKYkhrqz8YfTClF89tuM/9k=)',dot:'#a78bfa',isPhoto:true},
];
const ALL_THEME_CLASSES=THEME_DEFS.map(t=>t.id).filter(id=>id!=='dark');
function _getCurrentTheme(){
  const h=document.documentElement;
  for(const c of ALL_THEME_CLASSES){if(h.classList.contains(c))return c;}
  return'dark';
}
function _applyTheme(t){
  const h=document.documentElement;
  h.classList.remove(...ALL_THEME_CLASSES);
  if(t!=='dark')h.classList.add(t);
  // Toggle photo background class on body
  const isPhoto=THEME_DEFS.find(d=>d.id===t)?.isPhoto||false;
  document.body.classList.toggle('has-bg-image',isPhoto);
  // Update accent dot color
  const dot=document.getElementById('theme-active-dot');
  if(dot){const def=THEME_DEFS.find(d=>d.id===t);if(def){dot.style.background=def.dot;dot.style.boxShadow=`0 0 6px ${def.dot}88`;}}
}
function openThemePicker(){
  const cur=_getCurrentTheme();
  const grid=document.getElementById('theme-grid');
  if(!grid)return;
  const autoRow=`<label style="grid-column:1/-1;display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--radius-lg);border:1.5px dashed var(--border2);background:var(--surface2);cursor:pointer;font-size:12px;color:var(--text-dim)">
      <input type="checkbox" ${_autoThemeOn()?'checked':''} data-change="toggleThemeAuto(this.checked)" style="accent-color:var(--accent)">
      <span><strong style="color:var(--text)">Auto holiday themes</strong> — switch to the matching holiday theme around each holiday, back to yours after</span></label>`;
  grid.innerHTML=autoRow+THEME_DEFS.map(t=>`
    <button class="theme-option${t.id===cur?' active':''}" data-action="selectTheme('${t.id}')">
      <div class="theme-swatch" style="${t.isPhoto?`background-image:${t.swatch};border-color:rgba(255,255,255,0.2)`:`background:${t.swatch}`}"></div>
      <div>
        <div class="theme-option-name">${t.name}</div>
        <div class="theme-option-desc">${t.desc}</div>
      </div>
    </button>`).join('');
  document.getElementById('theme-picker-overlay').classList.add('open');
}
function closeThemePicker(){document.getElementById('theme-picker-overlay').classList.remove('open');}
function selectTheme(t){
  _applyTheme(t);
  localStorage.setItem('kpi_theme',t);
  if(_autoThemeOn())localStorage.setItem('kpi_theme_manual_day',_todayKey());
  closeThemePicker();
  showToast('Theme applied ✓');
}

// ── Seasonal auto-theme ──────────────────────────────────────────────────────
// Optional (toggle at the top of the theme picker, kpi_theme_auto). While a holiday is
// near, the matching holiday theme is applied automatically for that day without touching
// the saved theme (kpi_theme) — the day after, your own theme is back. Picking a theme by
// hand turns auto off for the rest of that day. Moveable holidays (Easter, Ramadan, Eid,
// CNY, Diwali, Holi, Hanukkah, Mid-Autumn) come from a lookup table covering 2026-2040
// ([key,start,end] as yyyymmdd); fixed-date ones are computed.
const _HOL_WIN=[["hanukkah",20251214,20251222],["cny",20260216,20260224],["ramadan",20260217,20260318],["holi",20260303,20260305],["eid",20260319,20260322],["holiweek",20260329,20260404],["easter",20260405,20260407],["eid",20260526,20260529],["midautumn",20260923,20260927],["diwali",20261106,20261111],["hanukkah",20261204,20261212],["cny",20270205,20270213],["ramadan",20270207,20270308],["eid",20270309,20270312],["holiweek",20270321,20270327],["holi",20270321,20270323],["easter",20270328,20270330],["eid",20270516,20270519],["midautumn",20270913,20270917],["diwali",20271027,20271101],["hanukkah",20271224,20280101],["cny",20280125,20280202],["ramadan",20280127,20280225],["eid",20280226,20280229],["holi",20280310,20280312],["holiweek",20280409,20280415],["easter",20280416,20280418],["eid",20280504,20280507],["midautumn",20281001,20281005],["diwali",20281015,20281020],["hanukkah",20281212,20281220],["ramadan",20290115,20290213],["cny",20290212,20290220],["eid",20290214,20290217],["holi",20290228,20290302],["holiweek",20290325,20290331],["easter",20290401,20290403],["eid",20290423,20290426],["midautumn",20290920,20290924],["diwali",20291103,20291108],["hanukkah",20291201,20291209],["ramadan",20300105,20300203],["cny",20300202,20300210],["eid",20300204,20300207],["holi",20300319,20300321],["eid",20300413,20300416],["holiweek",20300414,20300420],["easter",20300421,20300423],["midautumn",20300910,20300914],["diwali",20301024,20301029],["hanukkah",20301220,20301228],["ramadan",20301225,20310123],["cny",20310122,20310130],["eid",20310124,20310127],["holi",20310308,20310310],["eid",20310402,20310405],["holiweek",20310406,20310412],["easter",20310413,20310415],["midautumn",20310929,20311003],["diwali",20311112,20311117],["hanukkah",20311209,20311217],["ramadan",20311214,20320112],["eid",20320113,20320116],["cny",20320210,20320218],["holiweek",20320321,20320327],["eid",20320321,20320324],["holi",20320325,20320327],["easter",20320328,20320330],["midautumn",20320917,20320921],["diwali",20321031,20321105],["hanukkah",20321127,20321205],["ramadan",20321203,20330101],["eid",20330102,20330105],["cny",20330130,20330207],["eid",20330311,20330314],["holi",20330314,20330316],["holiweek",20330410,20330416],["easter",20330417,20330419],["midautumn",20330906,20330910],["diwali",20331020,20331025],["ramadan",20331122,20331221],["hanukkah",20331216,20331224],["eid",20331222,20331225],["cny",20340218,20340226],["eid",20340228,20340303],["holi",20340304,20340306],["holiweek",20340402,20340408],["easter",20340409,20340411],["midautumn",20340925,20340929],["diwali",20341108,20341113],["ramadan",20341111,20341210],["hanukkah",20341206,20341214],["eid",20341211,20341214],["cny",20350207,20350215],["eid",20350217,20350220],["holiweek",20350318,20350324],["holi",20350324,20350326],["easter",20350325,20350327],["midautumn",20350914,20350918],["diwali",20351028,20351102],["ramadan",20351101,20351130],["eid",20351201,20351204],["hanukkah",20351225,20360102],["cny",20360127,20360204],["eid",20360207,20360210],["holi",20360312,20360314],["holiweek",20360406,20360412],["easter",20360413,20360415],["midautumn",20361002,20361006],["diwali",20361017,20361022],["ramadan",20361020,20361118],["eid",20361119,20361122],["hanukkah",20361213,20361221],["eid",20370126,20370129],["cny",20370214,20370222],["holi",20370302,20370304],["holiweek",20370329,20370404],["easter",20370405,20370407],["midautumn",20370922,20370926],["ramadan",20371010,20371108],["diwali",20371105,20371110],["eid",20371109,20371112],["hanukkah",20371202,20371210],["eid",20380116,20380119],["cny",20380203,20380211],["holi",20380321,20380323],["holiweek",20380418,20380424],["easter",20380425,20380427],["midautumn",20380911,20380915],["ramadan",20380929,20381028],["diwali",20381025,20381030],["eid",20381029,20381101],["hanukkah",20381221,20381229],["eid",20390105,20390108],["cny",20390123,20390131],["holi",20390311,20390313],["holiweek",20390403,20390409],["easter",20390410,20390412],["ramadan",20390918,20391017],["midautumn",20390930,20391004],["diwali",20391015,20391020],["eid",20391018,20391021],["hanukkah",20391211,20391219],["eid",20391225,20391228],["cny",20400211,20400219],["holi",20400229,20400302],["holiweek",20400325,20400331],["easter",20400401,20400403],["ramadan",20400907,20401006],["midautumn",20400918,20400922],["eid",20401007,20401010],["diwali",20401102,20401107],["eid",20401214,20401217]];
const _HOL_ORDER=['holi','diwali','hanukkah','midautumn','cny','eid','easter','holiweek','sinulog','newyear','valentine','stpat','phindep','july4','allsaints','thanksgiving','xmasvillage','halloween','ramadan','christmas','parol'];
const _HOL_THEME={holi:'hol-holi',diwali:'hol-diwali',hanukkah:'hol-hanukkah',midautumn:'hol-midautumn',cny:'hol-cny',eid:'hol-eid',easter:'hol-easter',holiweek:'hol-holyweek',sinulog:'hol-sinulog',newyear:'hol-newyear',valentine:'hol-valentine',stpat:'hol-stpat',phindep:'hol-phindep',july4:'hol-july4',allsaints:'hol-allsaints',thanksgiving:'hol-autumn',xmasvillage:'hol-xmasvillage',halloween:'hol-halloween',ramadan:'hol-ramadan',christmas:'hol-christmas',parol:'hol-parol'};
const _HOL_FIXED={newyear:[1230,102],valentine:[212,215],stpat:[315,317],phindep:[610,613],july4:[702,705],allsaints:[1101,1102],halloween:[1024,1031],parol:[1201,1215],christmas:[1216,1219],xmasvillage:[1220,1226]};
function _holidayFor(d){
  const y=d.getFullYear(),m=d.getMonth()+1,dd=d.getDate(),n=y*10000+m*100+dd,md=m*100+dd,hit=new Set();
  for(const w of _HOL_WIN)if(n>=w[1]&&n<=w[2])hit.add(w[0]);
  for(const k in _HOL_FIXED){const a=_HOL_FIXED[k][0],b=_HOL_FIXED[k][1];if(a<=b?(md>=a&&md<=b):(md>=a||md<=b))hit.add(k);}
  if(m===1){const sun=1+((7-new Date(y,0,1).getDay())%7)+14;if(dd>=sun-4&&dd<=sun+1)hit.add('sinulog');}   // Sinulog: 3rd Sunday of Jan (Thu before - Mon after)
  if(m===11){const thu=1+((4-new Date(y,10,1).getDay()+7)%7)+21;if(dd>=thu-3&&dd<=thu+1)hit.add('thanksgiving');}   // 4th Thursday of Nov
  for(const k of _HOL_ORDER)if(hit.has(k))return _HOL_THEME[k];
  return null;
}
function _todayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function _autoThemeOn(){try{return localStorage.getItem('kpi_theme_auto')==='1';}catch(e){return false;}}
function _resolveAutoTheme(saved){
  if(!_autoThemeOn())return saved;
  try{if(localStorage.getItem('kpi_theme_manual_day')===_todayKey())return saved;}catch(e){}
  return _holidayFor(new Date())||saved;
}
function toggleThemeAuto(on){
  try{localStorage.setItem('kpi_theme_auto',on?'1':'0');localStorage.removeItem('kpi_theme_manual_day');}catch(e){}
  const saved=localStorage.getItem('kpi_theme')||'dark',t=_resolveAutoTheme(saved);
  _applyTheme(t);updateThemeLabel(t);
  const def=THEME_DEFS.find(d=>d.id===t);
  showToast(on?(t!==saved?'Auto holiday themes on — '+(def?def.name:t)+' is active today':'Auto holiday themes on — no holiday today, using your theme'):'Auto holiday themes off');
  openThemePicker();
}
setInterval(function(){
  if(!_autoThemeOn())return;
  const t=_resolveAutoTheme(localStorage.getItem('kpi_theme')||'dark');
  if(t!==_getCurrentTheme()){_applyTheme(t);updateThemeLabel(t);}
},3600000);
// legacy alias so any remaining calls to toggleTheme() still work
function toggleTheme(){openThemePicker();}
function updateThemeLabel(t){
  const dot=document.getElementById('theme-active-dot');
  if(dot){const def=THEME_DEFS.find(d=>d.id===t);if(def){dot.style.background=def.dot;dot.style.boxShadow=`0 0 6px ${def.dot}88`;}}
}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){const o=document.getElementById('theme-picker-overlay');if(o&&o.classList.contains('open'))closeThemePicker();}});

// ── Annotations ──────────────────────────────────────────────────────────────
let _annDk=null;
function openAnnModal(dk){
  _annDk=dk;
  document.getElementById('ann-modal-title').textContent='Note for '+fmtDayLabel(dk);
  document.getElementById('ann-input').value=(getPeriod(activePeriodKey).annotations||{})[dk]||'';
  document.getElementById('ann-modal').classList.add('open');
  setTimeout(()=>document.getElementById('ann-input').focus(),60);
}
function closeAnnModal(){document.getElementById('ann-modal').classList.remove('open');_annDk=null;}
function saveAnn(){
  if(!_annDk)return;
  const p=getPeriod(activePeriodKey);
  const val=document.getElementById('ann-input').value.trim();
  if(val)p.annotations[_annDk]=val;else delete p.annotations[_annDk];
  saveState();closeAnnModal();renderDashboard();showToast(val?'Note saved':'Note removed');
}
document.addEventListener('click',function(e){if(e.target===document.getElementById('ann-modal'))closeAnnModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&_annDk)closeAnnModal();});

// ── Day Detail Modal ──────────────────────────────────────────────────────────
function navDay(dir){
  const dk=window._currentDayDk;
  if(!dk)return;
  const allDayKeys=Object.keys(getDailyStats(getPeriod(activePeriodKey).surveys||[])).sort();
  const idx=allDayKeys.indexOf(dk);
  const target=allDayKeys[idx+dir];
  if(target)openDayDetail(target);
}
// ── Clickable distributions inside the metric detail popups ───────────────
// Click a score (CSAT popup) or Yes / No (AR popup) to narrow that popup's Daily Breakdown
// to just those surveys — same idea as the filter chips on the dashboard's Daily Breakdown.
// Click it again (or "Clear filter") to reset. Used by the main dashboard popups and the
// team-member popups.
var _detailFilter={csat:null,ar:null};
function _distRowStyle(active,col){return 'cursor:pointer;'+(active?'background:rgba(148,163,184,.18);box-shadow:inset 3px 0 0 '+col+';':'');}
function _yesNoPillHTML(v,cnt,pct,active,callPrefix){
  const yes=v==='yes',col=yes?'#4ade80':'#f87171',label=yes?'Yes':'No';
  return `<span data-ph-click="${callPrefix}'${v}')" title="Click to filter the daily breakdown to ${label}" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;color:${col};font-weight:600;font-size:12px;padding:4px 12px;border-radius:999px;border:1px solid ${active?col:'var(--border2)'};background:${active?'rgba(148,163,184,.22)':'var(--surface3)'};user-select:none">${label}<span style="font-family:var(--mono)">${cnt}</span><span style="font-weight:400;font-size:11px;opacity:.85">${pct}%</span></span>`;
}
// Whole Yes/No card: two clickable pills + a split bar whose green / red halves are clickable too.
function _yesNoCardHTML(yes,no,activeVal,callPrefix){
  const tot=(yes+no)||1,yp=Math.round(yes/tot*100),np=100-yp;
  const seg=(v,w,col)=>`<div data-ph-click="${callPrefix}'${v}')" title="Click to filter the daily breakdown to ${v==='yes'?'Yes':'No'}" style="cursor:pointer;width:${w}%;height:100%;background:${col};${activeVal===v?'box-shadow:inset 0 0 0 2px rgba(255,255,255,.55);':''}${activeVal&&activeVal!==v?'opacity:.45;':''}"></div>`;
  return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:1.25rem">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
        ${_yesNoPillHTML('yes',yes,yp,activeVal==='yes',callPrefix)}
        <span style="font-size:10px;color:var(--text-muted);text-align:center">click Yes or No to filter the daily breakdown</span>
        ${_yesNoPillHTML('no',no,np,activeVal==='no',callPrefix)}
      </div>
      <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:var(--red-dim)">${seg('yes',yp,'var(--green)')}${seg('no',np,'var(--red)')}</div>
    </div>`;
}
// Summary tiles (Yes / No numbers) double as filter buttons.
function _filterTileAttrs(isOn,col,callPrefix,v){
  return `data-ph-click="${callPrefix}'${v}')" title="Click to filter the daily breakdown to ${v==='yes'?'Yes':'No'}" `;
}
function _distFilterBarHTML(f,surveyCount,dayCount,clearCall){
  if(!f)return'';
  const lbl=f.type==='ar'?'AR = '+(f.val==='yes'?'Yes':'No'):'CSAT score = '+f.val;
  return `<div style="display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:11px;color:var(--text-dim);flex-wrap:wrap"><span style="background:var(--surface2);border:1px solid var(--border);border-radius:999px;padding:3px 10px">Filter: <b style="color:var(--text)">${lbl}</b> · ${surveyCount} survey${surveyCount!==1?'s':''} across ${dayCount} day${dayCount!==1?'s':''}</span><span data-ph-click="${clearCall}" style="cursor:pointer;color:var(--accent)">✕ Clear filter</span></div>`;
}
// kind: 'csat' | 'ar' (main dashboard popups). Pass (null,null) to clear.
function setDetailFilter(kind,type,val){
  const cur=_detailFilter[kind];
  _detailFilter[kind]=(!type||(cur&&cur.type===type&&cur.val===val))?null:{type,val};
  const bodyEl=document.getElementById(kind==='csat'?'csat-detail-body':'ar-detail-body');
  const keep=[];
  for(let n=bodyEl;n;n=n.parentElement){keep.push([n,n.scrollTop]);}
  if(kind==='csat')_renderCSATDetail();else _renderARDetail();
  keep.forEach(([n,t])=>{n.scrollTop=t;});
}

// ── Tile Survey List Modal ────────────────────────────────────────────────
// Shared row renderer for a plain list of surveys (used by the tile popup
// below, kept separate from the day-detail modal's richer per-day rows).
let _tileSurveyState=null; // {list, baseTitle, agent} — powers the agent-filter chips/click below
function _tileSurveyRowsHTML(list){
  return list.map((s,i)=>{
    const csatCol=s.csat>=4.9?'var(--green)':s.csat>=4.5?'var(--accent)':s.csat>=4?'var(--amber)':'var(--red)';
    const arCol=s.ar==='yes'?'var(--green)':s.ar==='no'?'var(--red)':'var(--text-muted)';
    const hasComment=s.comment&&s.comment.trim().length>0;
    const agent=(s.agent||'').trim()||'Unassigned';
    return`<div style="display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span style="font-family:var(--mono);color:var(--text-muted);width:18px;flex-shrink:0;padding-top:1px">${i+1}</span>
      <span style="font-family:var(--mono);font-weight:600;color:${s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat)?csatCol:'var(--text-muted)'};width:36px;flex-shrink:0">${s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat)?s.csat:'—'}</span>
      <span style="font-family:var(--mono);font-weight:600;color:${arCol};width:36px;flex-shrink:0">${s.ar==='yes'?'YES':s.ar==='no'?'NO':'—'}</span>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span data-agent="${escHtml(agent)}" data-ph-click="filterTileSurveyByAgent(this.dataset.agent)" style="cursor:pointer;font-size:11px;font-weight:600;color:${agent==='Unassigned'?'var(--text-muted)':'var(--purple)'};${agent==='Unassigned'?'font-style:italic':''}" title="Click to filter to ${escHtml(agent==='Unassigned'?agent:prettifyAgentName(agent))}">${escHtml(agent==='Unassigned'?agent:prettifyAgentName(agent))}</span>
          ${s.id?`<span style="font-size:10px;color:var(--text-muted);font-family:var(--mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(s.id)}</span>`:''}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:1px">${s.date?escHtml(s.date):''}${s.channel?' · <span style="color:var(--teal)">'+escHtml(s.channel)+'</span>':''}</div>
        ${hasComment?`<div style="font-size:10px;color:var(--text-dim);margin-top:2px;line-height:1.4;white-space:pre-wrap;word-break:break-word">${escHtml(s.comment.length>120?s.comment.slice(0,120)+'…':s.comment)}</div>`:''}
      </div>
    </div>`;
  }).join('');
}
// Clickable Yes/No + Score distribution shown at the top of a day's survey popup.
// `active` is {type:'ar'|'csat',val} or null; `fn` is the global click handler
// (called as fn('ar','yes') / fn('csat',4.5) / fn(null,null) to clear).
function _resultDistHTML(list,active,fn){
  const csatS=list.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
  const yes=list.filter(s=>s.ar==='yes').length;
  const no=list.filter(s=>s.ar==='no').length;
  const arTot=yes+no;
  const isOn=(ty,v)=>!!active&&active.type===ty&&active.val===v;
  const arg=v=>typeof v==='number'?String(v):"'"+v+"'";
  const secTitle=txt=>`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">${txt}</div>`;
  const card=inner=>`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:6px 8px;margin-bottom:1rem">${inner}</div>`;
  const row=(ty,v,label,col,cnt,pct,barW)=>`<div data-ph-click="${fn}('${ty}',${arg(v)})" title="Click to filter to ${label}" style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-bottom:1px solid var(--border);cursor:pointer;border-radius:6px;${isOn(ty,v)?'background:rgba(148,163,184,.18);outline:1px solid '+col+';':''}">
      <span style="font-family:var(--mono);font-weight:600;color:${col};width:32px;font-size:12px;flex-shrink:0">${label}</span>
      <div style="flex:1;height:8px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="width:${barW}%;height:100%;background:${col};border-radius:4px"></div></div>
      <span style="font-family:var(--mono);font-size:12px;color:var(--text);width:24px;text-align:right;flex-shrink:0">${cnt}</span>
      <span style="font-size:11px;color:var(--text-muted);width:34px;text-align:right;flex-shrink:0">${pct}%</span>
    </div>`;
  let html='';
  if(!arTot&&!csatS.length)return html;
  html+=`<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Click a Yes/No or score to filter the surveys${active?` · <span data-ph-click="${fn}(null,null)" style="cursor:pointer;color:var(--accent)">✕ Clear filter</span>`:''}</div>`;
  if(arTot){
    const rows=[['yes','Yes','var(--green)',yes],['no','No','var(--red)',no]]
      .map(([v,lbl,col,cnt])=>{const pct=Math.round(cnt/arTot*100);return row('ar',v,lbl,col,cnt,pct,Math.max(cnt?2:0,pct));}).join('');
    html+=secTitle('Yes / No Distribution')+card(rows);
  }
  if(csatS.length){
    const scores=[5,4.5,4,3.5,3,2.5,2,1.5,1];
    const maxCnt=Math.max(...scores.map(sc=>csatS.filter(s=>s.csat===sc).length));
    const rows=scores.map(sc=>{
      const cnt=csatS.filter(s=>s.csat===sc).length;
      if(!cnt)return'';
      const col=sc>=4.9?'var(--green)':sc>=4.5?'var(--accent)':sc>=4?'var(--amber)':'var(--red)';
      return row('csat',sc,String(sc),col,cnt,Math.round(cnt/csatS.length*100),Math.max(2,Math.round(cnt/maxCnt*100)));
    }).filter(Boolean).join('');
    html+=secTitle('Score Distribution')+card(rows);
  }
  return html;
}
// filterType: 'csat' (filterValue is the score, e.g. 5, 4.5) or 'ar' (filterValue is 'yes'/'no')
function openTileSurveyList(filterType,filterValue){
  const surveys=getPeriod(activePeriodKey).surveys||[];
  let list,baseTitle;
  if(filterType==='csat'){
    list=surveys.filter(s=>s.csat===filterValue);
    baseTitle=`CSAT ${filterValue}`;
  } else {
    list=surveys.filter(s=>s.ar===filterValue);
    baseTitle=`AR: ${filterValue==='yes'?'Yes':'No'}`;
  }
  if(!list.length){showToast('No matching surveys');return;}
  _tileSurveyState={list,baseTitle,agent:null};
  renderTileSurveyAgents();
  renderTileSurveyBody();
  document.getElementById('tile-survey-modal').classList.add('open');
}
// Click an agent's name (chip or row) to narrow the list to just their surveys;
// click the same one again (or the "Show all" chip) to clear the filter.
function filterTileSurveyByAgent(name){
  if(!_tileSurveyState)return;
  _tileSurveyState.agent=(_tileSurveyState.agent===name)?null:(name||null);
  renderTileSurveyAgents();
  renderTileSurveyBody();
}
function renderTileSurveyAgents(){
  const agentEl=document.getElementById('tile-survey-agents');
  if(!agentEl||!_tileSurveyState)return;
  const {list,agent}=_tileSurveyState;
  const counts={};
  list.forEach(s=>{const n=(s.agent||'').trim()||'Unassigned';counts[n]=(counts[n]||0)+1;});
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  if(entries.length<=1){agentEl.innerHTML='';return;}
  const chips=entries.map(([name,cnt])=>{
    const active=agent===name;
    const label=name==='Unassigned'?name:prettifyAgentName(name);
    return`<span data-agent="${escHtml(name)}" data-ph-click="filterTileSurveyByAgent(this.dataset.agent)" title="Click to filter to ${escHtml(label)}" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;background:${active?'var(--purple)':'var(--surface2)'};border:1px solid ${active?'var(--purple)':'var(--border)'};border-radius:6px;padding:3px 8px;font-size:11px">
      <span style="color:${active?'#fff':'var(--purple)'};font-weight:600">${escHtml(label)}</span>
      <span style="color:${active?'rgba(255,255,255,.85)':'var(--text-muted)'};font-family:var(--mono)">${cnt}</span>
    </span>`;
  }).join('');
  const clearChip=agent?`<span data-ph-click="filterTileSurveyByAgent(null)" style="cursor:pointer;display:inline-flex;align-items:center;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px;color:var(--text-muted)">Show all</span>`:'';
  agentEl.innerHTML=chips+clearChip;
}
function renderTileSurveyBody(){
  if(!_tileSurveyState)return;
  const {list,agent,baseTitle}=_tileSurveyState;
  const filtered=agent?list.filter(s=>((s.agent||'').trim()||'Unassigned')===agent):list;
  const titleEl=document.getElementById('tile-survey-title');
  if(titleEl)titleEl.textContent=`${baseTitle}${agent?' · '+agent:''} — ${filtered.length} survey${filtered.length!==1?'s':''}`;
  const header=`<div style="position:sticky;top:0;z-index:2;background:var(--surface);display:flex;gap:10px;padding:4px 0 6px;border-bottom:1px solid var(--border);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted)">
    <span style="width:18px">#</span>
    <span style="width:36px">CSAT</span>
    <span style="width:36px">AR</span>
    <span>Member / ID / Channel / Comment</span>
  </div>`;
  document.getElementById('tile-survey-body').innerHTML=header+_tileSurveyRowsHTML(filtered);
}

function openDayDetail(dk){
  const p=getPeriod(activePeriodKey);
  const allSurveys=p.surveys||[];
  const ann=(p.annotations||{})[dk]||'';
  const daySurveys=allSurveys.filter(s=>parseDateKey(s.date)===dk);
  _dayDetailState={daySurveys,agent:null,result:null}; // powers the agent-filter chips/click in the Individual Surveys section
  const csatS=daySurveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  const arAll=daySurveys.filter(s=>s.ar==='yes'||s.ar==='no');
  const arYes=daySurveys.filter(s=>s.ar==='yes').length;
  const csatAvg=csatS.length?calcCSAT(csatS):null;
  const arPct=arAll.length?arYes/arAll.length*100:null;
  // AHT for this day
  const dailyAHT=getTileDailyAHTMap(p);
  const ahtEntry=dailyAHT[dk]?normAHTEntry(dailyAHT[dk]):null;
  const ahtSec=ahtEntry&&ahtEntry.aht>0?ahtEntry.aht:null;
  // Grades
  const csatG=csatAvg!==null?gradeCSAT(csatAvg):null;
  const arG=arPct!==null?gradeAR(arPct):null;
  const ahtG=ahtSec!==null?gradeAHT(ahtSec):null;
  // Day KPI
  const dayCustomPts=customMetricsPointsForDay(activePeriodKey,dk);
  const kpiRaw=(csatAvg!==null||arPct!==null||ahtSec!==null||dayCustomPts>0)
    ?(weightCSAT(csatAvg)+weightAR(arPct)+weightAHT(ahtSec||0)+dayCustomPts):null;
  const kpiG=kpiRaw!==null?kpiScoreGrade(kpiRaw):null;

  // Score distribution
  const scores=[5,4.5,4,3.5,3,2.5,2,1.5,1];
  const maxCnt=csatS.length?Math.max(...scores.map(sc=>csatS.filter(s=>s.csat===sc).length)):0;
  const distRows=scores.map(sc=>{
    const cnt=csatS.filter(s=>s.csat===sc).length;
    if(!cnt)return'';
    const pct=Math.round(cnt/csatS.length*100);
    const barW=maxCnt>0?Math.max(2,Math.round(cnt/maxCnt*100)):2;
    const col=sc>=4.9?'var(--green)':sc>=4.5?'var(--accent)':sc>=4?'var(--amber)':'var(--red)';
    return`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
      <span style="font-family:var(--mono);font-weight:600;color:${col};width:32px;font-size:12px;flex-shrink:0">${sc}</span>
      <div style="flex:1;height:8px;background:var(--surface3);border-radius:4px;overflow:hidden">
        <div style="width:${barW}%;height:100%;background:${col};border-radius:4px"></div>
      </div>
      <span style="font-family:var(--mono);font-size:12px;color:var(--text);width:20px;text-align:right;flex-shrink:0">${cnt}</span>
      <span style="font-size:11px;color:var(--text-muted);width:34px;text-align:right;flex-shrink:0">${pct}%</span>
    </div>`;
  }).filter(Boolean).join('');

  // Individual surveys — rendered separately (renderDayDetailSurveyRows) so the
  // agent-filter chips can update just this section without a full re-render.

  // Channel breakdown
  const channels={};
  daySurveys.forEach(s=>{const ch=s.channel||'Unknown';channels[ch]=(channels[ch]||0)+1;});
  const channelEntries=Object.entries(channels).sort((a,b)=>b[1]-a[1]);
  const channelHTML=channelEntries.length>1?`
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Channel Breakdown</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:1.25rem;display:flex;flex-wrap:wrap;gap:8px">
      ${channelEntries.map(([ch,cnt])=>`<div style="display:flex;align-items:center;gap:6px;background:var(--surface3);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:12px">
        <span style="color:var(--teal);font-family:var(--mono)">${ch}</span>
        <span style="color:var(--text-muted)">·</span>
        <span style="font-family:var(--mono);font-weight:600;color:var(--orange)">${cnt}</span>
      </div>`).join('')}
    </div>`:'';

  // Day navigation — get sorted list of all days with data
  const allDayKeys=Object.keys(getDailyStats(getPeriod(activePeriodKey).surveys||[])).sort();
  const curIdx=allDayKeys.indexOf(dk);
  const prevDk=curIdx>0?allDayKeys[curIdx-1]:null;
  const nextDk=curIdx<allDayKeys.length-1?allDayKeys[curIdx+1]:null;

  document.getElementById('day-detail-title').textContent=fmtDayLabel(dk);
  // Update nav button states (buttons always exist in DOM, just enable/disable)
  const prevBtn=document.getElementById('day-nav-prev');
  const nextBtn=document.getElementById('day-nav-next');
  if(prevBtn){prevBtn.style.opacity=prevDk?'1':'0.3';prevBtn.style.cursor=prevDk?'pointer':'not-allowed';prevBtn.disabled=!prevDk;}
  if(nextBtn){nextBtn.style.opacity=nextDk?'1':'0.3';nextBtn.style.cursor=nextDk?'pointer':'not-allowed';nextBtn.disabled=!nextDk;}
  // Store current day key for navDay()
  window._currentDayDk=dk;

  // Best-day records
  const records=getBestDayRecords(dk,csatAvg,arPct,daySurveys);
  const bestBanner=records.length?`<div class="best-day-banner">
    <div style="font-size:22px">🏆</div>
    <div style="font-size:12px;color:var(--amber);font-weight:500;line-height:1.5">
      <strong>Personal record${records.length>1?'s':''}!</strong><br>${records.join(' · ')}
    </div>
  </div>`:'';

  // Week-over-week: find same weekday from the previous week
  const dDate=new Date(dk+'T00:00:00');
  const prevWeekDate=new Date(dDate);prevWeekDate.setDate(prevWeekDate.getDate()-7);
  const prevWkDk=`${prevWeekDate.getFullYear()}-${String(prevWeekDate.getMonth()+1).padStart(2,'0')}-${String(prevWeekDate.getDate()).padStart(2,'0')}`;
  const prevWkSurveys=(getPeriod(activePeriodKey).surveys||[]).filter(s=>parseDateKey(s.date)===prevWkDk);
  const prevWkCsat=prevWkSurveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  const prevWkCsatAvg=prevWkCsat.length?calcCSAT(prevWkCsat):null;
  const prevWkAR=prevWkSurveys.filter(s=>s.ar==='yes'||s.ar==='no');
  const prevWkARPct=prevWkAR.length?prevWkSurveys.filter(s=>s.ar==='yes').length/prevWkAR.length*100:null;
  const wowCount=prevWkSurveys.length?getWowBadge('count',daySurveys.length,prevWkSurveys.length):'';
  const wowCSAT=prevWkCsatAvg!==null&&csatAvg!==null?getWowBadge('csat',csatAvg,prevWkCsatAvg):'';
  const wowAR=prevWkARPct!==null&&arPct!==null?getWowBadge('ar',arPct,prevWkARPct):'';
  const hasWow=wowCount||wowCSAT||wowAR;
  const wowSection=hasWow?`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-bottom:1rem;font-size:11px;color:var(--text-muted)">
    <span style="font-weight:600;margin-right:6px">vs last week (${fmtDayLabel(prevWkDk)}):</span>
    ${wowCount?`Surveys ${wowCount}`:''}
    ${wowCSAT?`CSAT ${wowCSAT}`:''}
    ${wowAR?`AR ${wowAR}`:''}
  </div>`:'';

  // Mood section
  const mood=getMood(dk);
  const moodRow=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem;flex-wrap:wrap">
    <span style="font-size:11px;color:var(--text-muted)">Mood:</span>
    ${MOODS.map(m=>`<button data-action="pickMood('${dk}','${m}');document.getElementById('day-detail-mood-display').textContent='${m}'" style="background:${mood===m?'var(--surface3)':'none'};border:1px solid ${mood===m?'var(--border2)':'transparent'};cursor:pointer;font-size:18px;padding:2px 5px;border-radius:6px;transition:all .1s" title="${m}">${m}</button>`).join('')}
    <button data-action="pickMood('${dk}','');document.getElementById('day-detail-mood-display').textContent=''" style="background:none;border:1px solid var(--border);cursor:pointer;font-size:11px;padding:2px 8px;border-radius:6px;color:var(--text-muted)">Clear</button>
    <span id="day-detail-mood-display" style="font-size:18px">${mood}</span>
  </div>`;

  document.getElementById('day-detail-body').innerHTML=`
    ${bestBanner}
    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.25rem">
      ${[
        ['CSAT',csatAvg!==null?fmtCsat(csatAvg):'—',csatG,'var(--accent)'],
        ['AR',arPct!==null?arPct.toFixed(1)+'%':'—',arG,'var(--green)'],
        ['AHT',ahtSec!==null?fmtSec(ahtSec):'—',ahtG,'var(--teal)'],
        ['KPI',kpiRaw!==null?kpiRaw.toFixed(1)+'%':'—',kpiG,'var(--purple)']
      ].map(([lbl,val,g,col])=>`
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${lbl}</div>
          <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:${g?'':col}" ${g?`class="${g.gcls||g.cls||''}"`:''}>${val}</div>
          ${g?`<div style="margin-top:5px"><span class="grade-pill ${g.cls||''}" style="font-size:10px">${g.grade||g.label||''}</span></div>`:''}
        </div>`).join('')}
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
      <span style="font-size:11px;color:var(--text-muted)">${daySurveys.length} survey${daySurveys.length!==1?'s':''} · ${csatS.length} with CSAT · ${arAll.length} with AR</span>
      <div style="display:flex;gap:6px">
        <button class="copy-day-btn" data-action="copyDaySummary('${dk}',${csatAvg!==null?csatAvg:'null'},${arPct!==null?arPct:'null'},${ahtSec!==null?ahtSec:'null'},${kpiRaw!==null?kpiRaw:'null'},${daySurveys.length})">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy summary
        </button>
      </div>
    </div>

    ${wowSection}
    ${ann?`<div style="background:var(--amber-dim);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--amber);margin-bottom:1rem">📌 ${ann}</div>`:''}
    ${moodRow}
    ${channelHTML}

    <div id="day-detail-dist">${_resultDistHTML(daySurveys,null,'filterDayDetailByResult')}</div>

    ${daySurveys.length?`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted)">Individual Surveys</div>
      <span id="day-detail-survey-count" style="font-size:11px;color:var(--text-muted)"></span>
    </div>
    <div id="day-detail-agents" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px"></div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:8px 12px;height:300px;overflow-y:auto">
      <div id="day-detail-survey-rows"></div>
    </div>`:''}
  `;
  if(daySurveys.length){renderDayDetailAgents();renderDayDetailSurveyRows();}
  document.getElementById('day-detail-modal').classList.add('open');
}
document.addEventListener('click',function(e){if(e.target===document.getElementById('day-detail-modal'))document.getElementById('day-detail-modal').classList.remove('open');});

let _dayDetailState=null; // {daySurveys, agent} — set by openDayDetail, powers the section below
function _dayDetailSurveyRowsHTML(list){
  return list.map((s,i)=>{
    const csatCol=s.csat>=4.9?'var(--green)':s.csat>=4.5?'var(--accent)':s.csat>=4?'var(--amber)':'var(--red)';
    const arCol=s.ar==='yes'?'var(--green)':s.ar==='no'?'var(--red)':'var(--text-muted)';
    const hasComment=s.comment&&s.comment.trim().length>0;
    const agent=(s.agent||'').trim()||'Unassigned';
    return`<div style="display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span style="font-family:var(--mono);color:var(--text-muted);width:18px;flex-shrink:0;padding-top:1px">${i+1}</span>
      <span style="font-family:var(--mono);font-weight:600;color:${s.csat!==null?csatCol:'var(--text-muted)'};width:36px;flex-shrink:0">${s.csat!==null?s.csat:'—'}</span>
      <span style="font-family:var(--mono);font-weight:600;color:${arCol};width:36px;flex-shrink:0">${s.ar==='yes'?'YES':s.ar==='no'?'NO':'—'}</span>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span data-agent="${escHtml(agent)}" data-ph-click="filterDayDetailByAgent(this.dataset.agent)" style="cursor:pointer;font-size:11px;font-weight:600;color:${agent==='Unassigned'?'var(--text-muted)':'var(--purple)'};${agent==='Unassigned'?'font-style:italic':''}" title="Click to filter to ${escHtml(agent==='Unassigned'?agent:prettifyAgentName(agent))}">${escHtml(agent==='Unassigned'?agent:prettifyAgentName(agent))}</span>
          ${s.id?`<span style="font-size:10px;color:var(--text-muted);font-family:var(--mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(s.id)}</span>`:''}
        </div>
        ${s.channel?`<div style="font-size:10px;color:var(--teal);margin-top:1px">${escHtml(s.channel)}</div>`:''}
        ${hasComment?`<div style="font-size:10px;color:var(--text-dim);margin-top:2px;line-height:1.4;white-space:pre-wrap;word-break:break-word">${escHtml(s.comment.length>120?s.comment.slice(0,120)+'…':s.comment)}</div>`:''}
      </div>
    </div>`;
  }).join('');
}
function renderDayDetailAgents(){
  const el=document.getElementById('day-detail-agents');
  if(!el||!_dayDetailState)return;
  const {daySurveys,agent}=_dayDetailState;
  const counts={};
  daySurveys.forEach(s=>{const n=(s.agent||'').trim()||'Unassigned';counts[n]=(counts[n]||0)+1;});
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  if(entries.length<=1){el.innerHTML='';return;}
  const chips=entries.map(([name,cnt])=>{
    const active=agent===name;
    const label=name==='Unassigned'?name:prettifyAgentName(name);
    return`<span data-agent="${escHtml(name)}" data-ph-click="filterDayDetailByAgent(this.dataset.agent)" title="Click to filter to ${escHtml(label)}" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;background:${active?'var(--purple)':'var(--surface3)'};border:1px solid ${active?'var(--purple)':'var(--border)'};border-radius:6px;padding:3px 8px;font-size:11px">
      <span style="color:${active?'#fff':'var(--purple)'};font-weight:600">${escHtml(label)}</span>
      <span style="color:${active?'rgba(255,255,255,.85)':'var(--text-muted)'};font-family:var(--mono)">${cnt}</span>
    </span>`;
  }).join('');
  const clearChip=agent?`<span data-ph-click="filterDayDetailByAgent(null)" style="cursor:pointer;display:inline-flex;align-items:center;background:var(--surface3);border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px;color:var(--text-muted)">Show all</span>`:'';
  el.innerHTML=chips+clearChip;
}
function renderDayDetailSurveyRows(){
  const el=document.getElementById('day-detail-survey-rows');
  if(!el||!_dayDetailState)return;
  const {daySurveys,agent,result}=_dayDetailState;
  let filtered=agent?daySurveys.filter(s=>((s.agent||'').trim()||'Unassigned')===agent):daySurveys;
  if(result)filtered=filtered.filter(s=>_dailyFilterMatch(result,s));
  el.innerHTML=filtered.length?_dayDetailSurveyRowsHTML(filtered):'<div style="padding:14px 4px;font-size:12px;color:var(--text-muted)">No surveys match this filter.</div>';
  const countEl=document.getElementById('day-detail-survey-count');
  const resLbl=result?(result.type==='ar'?'AR '+(result.val==='yes'?'Yes':'No'):'CSAT '+result.val):'';
  if(countEl)countEl.textContent=`${filtered.length} survey${filtered.length!==1?'s':''}${agent?' · '+agent:''}${resLbl?' · '+resLbl:''}`;
}
// Click a Yes/No or score row in the day popup to narrow the Individual Surveys
// list to just those surveys (combines with the agent filter); click it again,
// or "Clear filter", to reset.
function filterDayDetailByResult(type,val){
  if(!_dayDetailState)return;
  const cur=_dayDetailState.result;
  _dayDetailState.result=(!type||(cur&&cur.type===type&&cur.val===val))?null:{type,val};
  const el=document.getElementById('day-detail-dist');
  if(el)el.innerHTML=_resultDistHTML(_dayDetailState.daySurveys,_dayDetailState.result,'filterDayDetailByResult');
  renderDayDetailSurveyRows();
}
// Click an agent's name (chip or row) to narrow the Individual Surveys list to
// just their surveys for this day; click it again (or "Show all") to clear it.
function filterDayDetailByAgent(name){
  if(!_dayDetailState)return;
  _dayDetailState.agent=(_dayDetailState.agent===name)?null:(name||null);
  renderDayDetailAgents();
  renderDayDetailSurveyRows();
}

// ── Weekly View ───────────────────────────────────────────────────────────────
function renderWeeklyView(){
  const container=document.getElementById('weekly-body');
  const p=getPeriod(activePeriodKey);
  const surveys=p.surveys||[];
  const annotations=p.annotations||{};
  const [y,m]=activePeriodKey.split('-').map(Number);
  const daysInMonth=new Date(y,m,0).getDate();
  if(!surveys.length){
    container.innerHTML='<div class="empty-state"><svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" width="40" height="40" style="display:block;margin:0 auto 1rem;opacity:.4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><p>No survey data for this period.</p></div>';
    return;
  }
  const dayStats=getDailyStats(surveys);
  // Build week groups: 1-7, 8-14, 15-21, 22-28, 29-end
  const weeks=[];
  for(let start=1,wn=1;start<=daysInMonth;start+=7,wn++){
    weeks.push({wn,start,end:Math.min(start+6,daysInMonth)});
  }
  container.innerHTML='';

  // ── Header: month title + expand-all toggle ───────────────────
  const monthName=MONTHS[m-1]+' '+y;
  const header=document.createElement('div');
  header.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:10px';
  header.innerHTML=`
    <div style="font-size:15px;font-weight:600;color:var(--text);letter-spacing:-.01em;display:flex;align-items:center;gap:8px">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color:var(--accent);flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      ${monthName}
    </div>
    <button id="weekly-expand-btn" class="weekly-expand-btn" data-action="toggleAllWeeks()" style="display:inline-flex;align-items:center;gap:6px;background:var(--accent-dim);border:1px solid rgba(59,130,246,0.3);color:var(--accent);padding:6px 14px;border-radius:8px;font-family:var(--font);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s">
      <svg id="weekly-expand-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
      <span id="weekly-expand-label">Expand All</span>
    </button>`;
  container.appendChild(header);

  let allExpanded=false;
  window.toggleAllWeeks=function(){
    allExpanded=!allExpanded;
    weeks.forEach(({wn})=>{
      const body=document.getElementById('wb'+wn);
      const chev=document.getElementById('chev-'+wn);
      if(!body)return;
      if(allExpanded){body.classList.add('open');if(chev)chev.style.transform='rotate(180deg)';}
      else{body.classList.remove('open');if(chev)chev.style.transform='rotate(0deg)';}
    });
    const icon=document.getElementById('weekly-expand-icon');
    const label=document.getElementById('weekly-expand-label');
    if(icon)icon.style.transform=allExpanded?'rotate(180deg)':'rotate(0deg)';
    if(label)label.textContent=allExpanded?'Collapse All':'Expand All';
  };

  const pData=getPeriod(activePeriodKey);
  const dailyAHTmap=getTileDailyAHTMap(pData);

  weeks.forEach(({wn,start,end})=>{
    // Build day keys for this week
    const dayKeys=[];
    for(let dd=start;dd<=end;dd++){
      dayKeys.push({dd,dk:y+'-'+String(m).padStart(2,'0')+'-'+String(dd).padStart(2,'0')});
    }
    // Aggregate week stats
    let wSurveys=0,wCsatSum=0,wCsatN=0,wArYes=0,wArN=0;
    let wAHTtot=0,wAHTweight=0;
    dayKeys.forEach(({dk})=>{
      const ds=dayStats[dk];if(!ds)return;
      wSurveys+=ds.surveys.length;
      ds.surveys.forEach(sv=>{
        if(sv.csat!==null&&!isNaN(sv.csat)){const _r=csatRatingsOf(sv);wCsatSum+=_r.sum;wCsatN+=_r.n;}
        if(sv.ar==='yes'){wArYes++;wArN++;}else if(sv.ar==='no'){wArN++;}
      });
      // AHT: weighted by call count if available
      const entry=dailyAHTmap[dk]?normAHTEntry(dailyAHTmap[dk]):null;
      if(entry&&entry.aht>0){
        const w=entry.count||1;
        wAHTtot+=entry.aht*w;
        wAHTweight+=w;
      }
    });
    const wCSAT=wCsatN?wCsatSum/wCsatN:null;
    const wAR=wArN?wArYes/wArN*100:null;
    const wAHT=wAHTweight>0?Math.round(wAHTtot/wAHTweight):null;
    const wCSATG=wCSAT!==null?gradeCSAT(wCSAT):null;
    const wARG=wAR!==null?gradeAR(wAR):null;
    const wAHTG=wAHT!==null?gradeAHT(wAHT):null;
    // Week KPI
    const wCustomPts=customMetricsPointsForDays(activePeriodKey,dayKeys.map(d=>d.dk));
    const wKPIraw=(wCSAT!==null||wAR!==null||wAHT!==null||wCustomPts>0)
      ?(weightCSAT(wCSAT)+weightAR(wAR)+weightAHT(wAHT||0)+wCustomPts):null;
    const wKPIG=wKPIraw!==null?kpiScoreGrade(wKPIraw):null;

    const bodyId='wb'+wn;
    const block=document.createElement('div');
    block.className='week-block';
    block.innerHTML=`
      <div class="week-head" data-action="toggleWeek('${bodyId}','${wn}')">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:13px;font-weight:600;font-family:var(--mono)">Week ${wn}</span>
          <span style="font-size:11px;color:var(--text-muted)">Days ${start}–${end}</span>
          ${wSurveys===0?'<span style="font-size:11px;color:var(--text-muted);font-style:italic">no data</span>':''}
        </div>
        <div class="week-meta">
          ${wCSAT!==null?`<div class="week-stat"><div class="week-stat-lbl">CSAT</div><div class="week-stat-val ${wCSATG.gcls}">${fmtCsat(wCSAT)}</div></div>`:''}
          ${wAR!==null?`<div class="week-stat"><div class="week-stat-lbl">AR</div><div class="week-stat-val ${wARG.gcls}">${wAR.toFixed(1)}%</div></div>`:''}
          ${wAHT!==null?`<div class="week-stat"><div class="week-stat-lbl">AHT</div><div class="week-stat-val ${wAHTG.gcls}">${fmtSec(wAHT)}</div></div>`:''}
          ${wKPIraw!==null?`<div class="week-stat"><div class="week-stat-lbl">KPI</div><div class="week-stat-val ${wKPIG.gcls}">${wKPIraw.toFixed(1)}%</div></div>`:''}
          ${wSurveys>0?`<div class="week-stat"><div class="week-stat-lbl">Surveys</div><div class="week-stat-val" style="color:var(--orange)">${wSurveys}</div></div>`:''}
          <svg id="chev-${wn}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14" style="color:var(--text-muted);transition:transform .2s;flex-shrink:0"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      <div id="${bodyId}" class="week-body">
        ${dayKeys.map(({dd,dk})=>{
          const ds=dayStats[dk];
          const ann=annotations[dk]||'';
          const daySurveys=ds?ds.surveys:[];
          const csatDs=daySurveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
          const dayCSAT=csatDs.length?calcCSAT(csatDs):null;
          const arResp=daySurveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
          const dayARYes=daySurveys.filter(sv=>sv.ar==='yes').length;
          const dayAR=arResp.length?dayARYes/arResp.length*100:null;
          const dCSATG=dayCSAT!==null?gradeCSAT(dayCSAT):null;
          const dARG=dayAR!==null?gradeAR(dayAR):null;
          // Day AHT
          const dAHTentry=dailyAHTmap[dk]?normAHTEntry(dailyAHTmap[dk]):null;
          const dAHTsec=dAHTentry&&dAHTentry.aht>0?dAHTentry.aht:null;
          const dAHTG=dAHTsec!==null?gradeAHT(dAHTsec):null;
          // Day KPI
          const dCustomPts=customMetricsPointsForDay(activePeriodKey,dk);
          const dKPIraw=(dayCSAT!==null||dayAR!==null||dAHTsec!==null||dCustomPts>0)
            ?(weightCSAT(dayCSAT)+weightAR(dayAR)+weightAHT(dAHTsec||0)+dCustomPts):null;
          const dKPIG=dKPIraw!==null?kpiScoreGrade(dKPIraw):null;
          return`<div class="week-day-tile">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
              <span style="font-size:10px;color:var(--text-muted);font-family:var(--mono)">${fmtDayLabel(dk)}</span>
              <button data-action="openAnnModal('${dk}')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:10px;padding:0;line-height:1" title="Add note">✏</button>
            </div>
            ${daySurveys.length||dAHTsec!==null?`
              ${dayCSAT!==null?`<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:9px;color:var(--text-muted);text-transform:uppercase">CSAT</span><span class="${dCSATG.gcls}" style="font-size:12px;font-weight:600;font-family:var(--mono)">${fmtCsat(dayCSAT)}</span></div>`:''}
              ${dayAR!==null?`<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:9px;color:var(--text-muted);text-transform:uppercase">AR</span><span class="${dARG.gcls}" style="font-size:12px;font-weight:600;font-family:var(--mono)">${dayAR.toFixed(1)}%</span></div>`:''}
              ${dAHTsec!==null?`<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:9px;color:var(--text-muted);text-transform:uppercase">AHT</span><span class="${dAHTG.gcls}" style="font-size:12px;font-weight:600;font-family:var(--mono)">${fmtSec(dAHTsec)}</span></div>`:''}
              ${dKPIraw!==null?`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;padding-top:2px;border-top:1px solid var(--border)"><span style="font-size:9px;color:var(--text-muted);text-transform:uppercase">KPI</span><span class="${dKPIG.gcls}" style="font-size:12px;font-weight:600;font-family:var(--mono)">${dKPIraw.toFixed(1)}%</span></div>`:''}
              ${daySurveys.length?`<div style="font-size:9px;color:var(--text-muted);margin-top:3px">${daySurveys.length} survey${daySurveys.length!==1?'s':''}</div>`:''}
            `:'<div style="font-size:11px;color:var(--text-muted);font-style:italic">—</div>'}
            ${ann?`<div style="font-size:10px;color:var(--amber);margin-top:4px;padding-top:3px;border-top:1px solid var(--border)">📌 ${ann}</div>`:''}
          </div>`;
        }).join('')}
      </div>`;
    container.appendChild(block);
  });
}
function toggleWeek(bodyId,wn){
  const body=document.getElementById(bodyId);
  const chev=document.getElementById('chev-'+wn);
  const open=body.classList.toggle('open');
  if(chev)chev.style.transform=open?'rotate(180deg)':'rotate(0deg)';
}

// ── Month Summary ─────────────────────────────────────────────────────────────
function renderMonthSummary(){
  if(getMsTab()==='team'){applyMsTabUI('team');renderTeamScorecard();return;}
  applyMsTabUI('summary');
  const container=document.getElementById('monthsummary-body');
  const p=getPeriod(activePeriodKey);
  const surveys=p.surveys||[];
  const annotations=p.annotations||{};
  const [y,m]=activePeriodKey.split('-').map(Number);
  const label=periodLabel(m,y);
  if(!surveys.length){
    container.innerHTML='<div class="empty-state"><svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" width="40" height="40" style="display:block;margin:0 auto 1rem;opacity:.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>No survey data for this period.</p></div>';
    return;
  }
  const csatSurveys=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  const avgCSAT=csatSurveys.length?calcCSAT(csatSurveys):null;
  const arResp=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arYes=surveys.filter(sv=>sv.ar==='yes').length;
  const arPct=arResp.length?arYes/arResp.length*100:null;
  const ahtSec=p.aht||0;
  const wc=weightCSAT(avgCSAT),wa=weightAR(arPct),wh=weightAHT(ahtSec);
  const sumCmRows=customMetricBreakdown(activePeriodKey);
  const sumCmPts=customMetricsPoints(activePeriodKey);
  const kpi=(avgCSAT!==null||arPct!==null||ahtSec>0||sumCmPts>0)?wc+wa+wh+sumCmPts:null;
  const csatG=avgCSAT!==null?gradeCSAT(avgCSAT):null;
  const arG=arPct!==null?gradeAR(arPct):null;
  const ahtG=ahtSec>0?gradeAHT(ahtSec):null;
  const kpiG=kpi!==null?kpiScoreGrade(kpi):null;
  const days=getDailyStats(surveys);
  const dkeys=Object.keys(days).sort();
  let bestCSATDay=null,worstCSATDay=null,bestCSATVal=-1,worstCSATVal=6;
  let bestSurveyDay=null,bestSurveyCount=0;
  dkeys.forEach(dk=>{
    const ds=days[dk].surveys;
    const cs=ds.filter(s=>s.csat!==null&&!isNaN(s.csat));
    if(cs.length){const avg=calcCSAT(cs);if(avg>bestCSATVal){bestCSATVal=avg;bestCSATDay=dk;}if(avg<worstCSATVal){worstCSATVal=avg;worstCSATDay=dk;}}
    if(ds.length>bestSurveyCount){bestSurveyCount=ds.length;bestSurveyDay=dk;}
  });
  const annEntries=Object.entries(annotations).filter(([dk])=>dk.startsWith(y+'-'+String(m).padStart(2,'0'))).sort();
  const copyLines=[
    label+' — KPI Summary',
    '═══════════════════════════════',
    'Total surveys : '+surveys.length,
    'Active days   : '+dkeys.length,
    'CSAT          : '+(avgCSAT!==null?fmtCsat(avgCSAT):'—')+' ('+(csatG?csatG.grade:'—')+')',
    'AR            : '+(arPct!==null?arPct.toFixed(2)+'%':'—')+' ('+(arG?arG.grade:'—')+')',
    'AHT           : '+(ahtSec>0?fmtSec(ahtSec):'—')+' ('+(ahtG?ahtG.grade:'—')+')',
    ...sumCmRows.map(r=>(r.def.name+'                 ').slice(0,14)+' : '+((r.avg!==null&&!isNaN(r.avg))?(Math.round(r.avg*100)/100)+(r.def.unit?' '+r.def.unit:''):'—')+' ('+(r.grade||'—')+', '+r.pts+' pts)'),
    'Final KPI     : '+(kpi!==null?kpi.toFixed(2)+'%':'—')+' ('+(kpiG?kpiG.label:'—')+')',
    '───────────────────────────────',
    'Best CSAT day : '+(bestCSATDay?fmtDayLabel(bestCSATDay)+' ('+fmtCsat(bestCSATVal)+')':'—'),
    'Worst CSAT day: '+(worstCSATDay&&worstCSATDay!==bestCSATDay?fmtDayLabel(worstCSATDay)+' ('+fmtCsat(worstCSATVal)+')':'—'),
    'Most surveys  : '+(bestSurveyDay?fmtDayLabel(bestSurveyDay)+' ('+bestSurveyCount+')':'—'),
  ];
  if(annEntries.length){copyLines.push('───────────────────────────────','Notes:');annEntries.forEach(([dk,v])=>copyLines.push('  '+fmtDayLabel(dk)+': '+v));}
  const copyText=copyLines.join('\n');
  container.innerHTML=`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.5rem;margin-bottom:1rem">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem;flex-wrap:wrap">
        <div>
          <div style="font-size:18px;font-weight:600">${label}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px">${surveys.length} surveys · ${dkeys.length} active days</div>
          ${kpiG?`<div style="margin-top:8px"><span class="grade-pill ${kpiG.cls}">Final KPI: ${kpi.toFixed(2)}%</span></div>`:''}
        </div>
        <button class="btn btn-ghost" data-action="copyMonthSummary()" style="flex-shrink:0">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy summary
        </button>
      </div>
      <!-- Grades -->
      <div class="sum-grid">
        ${[
          ['CSAT Score',avgCSAT!==null?fmtCsat(avgCSAT):'—',csatG,'var(--accent)'],
          ['Agent Resolution',arPct!==null?arPct.toFixed(2)+'%':'—',arG,'var(--green)'],
          ['AHT',ahtSec>0?fmtSec(ahtSec):'—',ahtG,'var(--teal)'],
          ...sumCmRows.map(r=>[r.def.name,(r.avg!==null&&!isNaN(r.avg))?(Math.round(r.avg*100)/100)+(r.def.unit?' '+r.def.unit:''):'—',(r.grade&&CM_GRADE_CLS[r.grade])?{cls:CM_GRADE_CLS[r.grade],grade:r.grade}:null,'var(--orange)']),
          ['Final KPI',kpi!==null?kpi.toFixed(2)+'%':'—',kpiG,'var(--purple)'],
        ].map(([lbl,val,g,color])=>{
          const gc={'grade-exceptional':'#00b050','grade-good':'#92d050','grade-average':'#ffff00','grade-satisfactory':'#ffc000','grade-needs':'#ff0000'};
          const c=(lbl!=='Final KPI'&&g&&gc[g.cls])?gc[g.cls]:color;
          return `
          <div class="sum-card">
            <div class="sum-card-lbl">${lbl}</div>
            <div class="sum-card-val" style="color:${c}">${val}</div>
            ${g?`<div style="margin-top:6px"><span class="grade-pill ${g.cls}" style="font-size:11px">${g.grade||g.label}</span></div>`:'<div style="font-size:11px;color:var(--text-muted);margin-top:6px">No data</div>'}
          </div>`}).join('')}
      </div>
      <!-- Highlights -->
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px">Highlights</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-bottom:${annEntries.length?'1.25rem':'0'}">
        ${bestCSATDay?`<div class="highlight-tile" style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:3px">Best CSAT day</div><div style="font-size:16px;font-weight:600;font-family:var(--mono);color:var(--green)">${fmtCsat(bestCSATVal)}</div><div style="font-size:11px;color:var(--text-muted)">${fmtDayLabel(bestCSATDay)}</div></div>`:''}
        ${worstCSATDay&&worstCSATDay!==bestCSATDay?`<div class="highlight-tile" style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:3px">Lowest CSAT day</div><div style="font-size:16px;font-weight:600;font-family:var(--mono);color:var(--amber)">${fmtCsat(worstCSATVal)}</div><div style="font-size:11px;color:var(--text-muted)">${fmtDayLabel(worstCSATDay)}</div></div>`:''}
        ${bestSurveyDay?`<div class="highlight-tile" style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:3px">Most surveys in a day</div><div style="font-size:16px;font-weight:600;font-family:var(--mono);color:var(--orange)">${bestSurveyCount}</div><div style="font-size:11px;color:var(--text-muted)">${fmtDayLabel(bestSurveyDay)}</div></div>`:''}
        ${(()=>{const gc={'grade-exceptional':'#00b050','grade-good':'#92d050','grade-average':'#ffff00'};const col=(kpiG&&gc[kpiG.cls])||'var(--text)';return `<div class="highlight-tile" style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:3px">Total surveys</div><div style="font-size:16px;font-weight:600;font-family:var(--mono);color:${col}">${surveys.length}</div><div style="font-size:11px;color:var(--text-muted)">this period</div></div>`})()}
        <div class="highlight-tile" style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:3px">Daily average</div><div style="font-size:16px;font-weight:600;font-family:var(--mono)">${(surveys.length/dkeys.length).toFixed(1)}</div><div style="font-size:11px;color:var(--text-muted)">surveys / day</div></div>
      </div>
      <!-- Annotations -->
      ${annEntries.length?`
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px">Period notes</div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
        ${annEntries.map(([dk,v],i)=>`<div style="display:flex;gap:10px;padding:8px 12px;${i<annEntries.length-1?'border-bottom:1px solid var(--border)':''}">
          <span style="font-family:var(--mono);font-size:11px;color:var(--text-muted);flex-shrink:0;padding-top:1px">${fmtDayLabel(dk)}</span>
          <span style="font-size:12px;color:var(--amber);flex-shrink:0">📌</span>
          <span style="font-size:12px;color:var(--text)">${v}</span>
        </div>`).join('')}
      </div>`:''}
      <textarea id="_sum-copy" style="position:fixed;left:-9999px;top:0;opacity:0">${copyText}</textarea>
    </div>`;
  // Render month-over-month panel below summary
  renderMoM(surveys,avgCSAT,arPct,ahtSec);
}
function copyMonthSummary(){
  const el=document.getElementById('_sum-copy');
  if(!el)return;
  el.select();
  try{document.execCommand('copy');showToast('Summary copied!');}catch(e){showToast('Copy failed — try manual select');}
}

// ── Month Summary → Team scorecard ────────────────────────────────────────────
// A second "page" inside Month summary: one colour-coded row per team member
// (Survey Count / Agent Resolution / CSAT / AHT / any extra metrics / Final KPI) plus a
// Team total row, styled like the shared spreadsheet scorecard. Built-in columns use the
// same per-member numbers and Team thresholds as Team View, so grades never disagree.
// Date: month-to-date, or a single day (surveys + AHT logged for that day only).
// Extra metrics (Survey Take Rate, Transfer to Survey, anything custom) are typed in by hand.
const MS_TAB_KEY='kpi_monthsummary_tab_v1';
const SC_CFG_KEY='kpi_scorecard_cfg_v1';
const SC_EXTRA_KEY='kpi_scorecard_extra_v1';
const SC_DEFAULT_TITLE='FORECASTED PERFORMANCE';
const SC_DEFAULT_ASOF='11:59 PM';
// Same five tier colours the main dashboard and member dashboards use for grade pills/heatmaps.
const SC_PALETTE={'grade-exceptional':'#00b050','grade-good':'#92d050','grade-average':'#ffff00','grade-satisfactory':'#ffc000','grade-needs':'#ff0000'};
const SC_BLUE='#2e75b6',SC_YELLOW='#ffff00',SC_NAMEBG='#dde1f0',SC_COUNTBG='#f79646',SC_EMPTYBG='#d9d9d9',SC_UNGRADED='#bdd7ee',SC_BORDER='#1b1b1b';
const SC_BASE_SORTS=[['name','Name'],['count','Survey count'],['csat','CSAT'],['ar','Agent Resolution'],['aht','AHT (fastest first)'],['kpi','Final KPI']];
const SC_PRESETS=['Survey Take Rate','Transfer to Survey'];

function getMsTab(){try{return localStorage.getItem(MS_TAB_KEY)==='team'?'team':'summary';}catch(e){return 'summary';}}
function setMonthSummaryTab(tab){
  try{localStorage.setItem(MS_TAB_KEY,tab==='team'?'team':'summary');}catch(e){}
  renderMonthSummary();
}
function applyMsTabUI(tab){
  const isTeam=tab==='team';
  const sb=document.getElementById('monthsummary-body');
  const tb=document.getElementById('monthsummary-team-body');
  const mom=document.getElementById('mom-panel');
  if(sb)sb.style.display=isTeam?'none':'';
  if(tb)tb.style.display=isTeam?'':'none';
  if(isTeam&&mom)mom.style.display='none';
  [['summary','ms-tab-summary'],['team','ms-tab-team']].forEach(([t,id])=>{
    const b=document.getElementById(id);
    if(!b)return;
    b.classList.toggle('active',t===tab);
    b.setAttribute('aria-selected',t===tab?'true':'false');
  });
}

// ── Header / date settings ──
function getScCfg(){
  let c={};
  try{c=JSON.parse(localStorage.getItem(SC_CFG_KEY)||'{}')||{};}catch(e){c={};}
  const sortOk=SC_BASE_SORTS.some(x=>x[0]===c.sort)||(typeof c.sort==='string'&&c.sort.startsWith('m:')&&getScExtra().metrics.some(m=>'m:'+m.id===c.sort));
  return{
    title:typeof c.title==='string'&&c.title.trim()?c.title:SC_DEFAULT_TITLE,
    asOf:typeof c.asOf==='string'&&c.asOf.trim()?c.asOf:SC_DEFAULT_ASOF,
    dateText:typeof c.dateText==='string'?c.dateText:'',
    arTarget:typeof c.arTarget==='string'?c.arTarget:'',
    csatTarget:typeof c.csatTarget==='string'?c.csatTarget:'',
    ahtTarget:typeof c.ahtTarget==='string'?c.ahtTarget:'',
    mode:c.mode==='day'?'day':'month',
    day:/^\d{4}-\d{2}-\d{2}$/.test(c.day||'')?c.day:'',
    sort:sortOk?c.sort:'name',
    layout:(c.layout==='weights'||c.layout==='both')?c.layout:'standard',
    through:/^\d{4}-\d{2}-\d{2}$/.test(c.through||'')?c.through:'',
    showAr:c.showAr!==false,
    showCsat:c.showCsat!==false,
    showAht:c.showAht!==false
  };
}
function saveScCfg(c){try{localStorage.setItem(SC_CFG_KEY,JSON.stringify(c));}catch(e){}}
function setScCfg(key,val){
  const c=getScCfg();
  let v=String(val==null?'':val).trim().slice(0,60);
  // Column targets: blank = automatic (top tier of the Team thresholds); otherwise must be a number.
  if(key==='arTarget'||key==='csatTarget'||key==='ahtTarget'){
    if(v!==''){
      const n=parseFloat(v.replace('%','').replace(',','.'));
      if(!isFinite(n)||n<=0){showToast('Target must be a positive number (or blank for auto)');renderTeamScorecard();return;}
      v=String(n);
    }
  }
  c[key]=v;
  saveScCfg(c);
  renderTeamScorecard();
}
function setScCol(key,on){
  if(key!=='showAr'&&key!=='showCsat'&&key!=='showAht')return;
  const c=getScCfg();
  c[key]=!!on;
  saveScCfg(c);
  renderTeamScorecard();
}
function resetScCfg(){
  try{localStorage.removeItem(SC_CFG_KEY);}catch(e){}
  renderTeamScorecard();
  showToast('Scorecard header, date and targets reset');
}
function scFmtLongDate(dk){
  const [y,mo,d]=dk.split('-').map(Number);
  return new Date(y,mo-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
}
function scPeriodBounds(){
  const [y,m]=activePeriodKey.split('-').map(Number);
  const pad=n=>String(n).padStart(2,'0');
  const last=new Date(y,m,0).getDate();
  return{min:y+'-'+pad(m)+'-01',max:y+'-'+pad(m)+'-'+pad(last)};
}
// Day actually shown in single-day mode: the saved one if it falls inside the active month,
// otherwise the latest day with surveys (or today if the month is empty).
function scEffectiveDay(cfg){
  const b=scPeriodBounds();
  if(cfg.day&&cfg.day>=b.min&&cfg.day<=b.max)return cfg.day;
  const p=getPeriod(activePeriodKey);
  const latest=Object.keys(getDailyStats(p.surveys||[])).sort().pop();
  if(latest&&latest>=b.min&&latest<=b.max)return latest;
  const t=new Date(),pad=n=>String(n).padStart(2,'0');
  const today=t.getFullYear()+'-'+pad(t.getMonth()+1)+'-'+pad(t.getDate());
  return(today>=b.min&&today<=b.max)?today:b.min;
}
function setScMode(v){setScCfg('mode',v==='day'?'day':'month');}
function setScDay(v){
  const b=scPeriodBounds();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v||'')||v<b.min||v>b.max){showToast('Pick a date inside '+periodLabel(+activePeriodKey.split('-')[1],+activePeriodKey.split('-')[0]));renderTeamScorecard();return;}
  const c=getScCfg();if(c.mode==='day')c.day=v;else c.through=v;saveScCfg(c);renderTeamScorecard();
}
function scClearThrough(){const c=getScCfg();c.through='';saveScCfg(c);renderTeamScorecard();}
function scStepDay(delta){
  const c=getScCfg(),b=scPeriodBounds();
  const cur=(c.mode==='day'?scEffectiveDay(c):(scEffectiveThrough(c)||scEffectiveDay(c))).split('-').map(Number);
  const d=new Date(cur[0],cur[1]-1,cur[2]+delta),pad=n=>String(n).padStart(2,'0');
  const nk=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  if(nk<b.min||nk>b.max){showToast('That is outside this month');return;}
  if(c.mode==='day')c.day=nk;else c.through=nk;saveScCfg(c);renderTeamScorecard();
}

// ── Extra (manual) metrics ──
// {metrics:[{id,name,unit:'%'|'',target:number|null,dir:'higher'|'lower'}],
//  values:{ 'YYYY-MM':{ 'mtd'|'YYYY-MM-DD':{ metricId:{ memberName:number, __team:number } } } }}
function getScExtra(){
  let x={};
  try{x=JSON.parse(localStorage.getItem(SC_EXTRA_KEY)||'{}')||{};}catch(e){x={};}
  if(!Array.isArray(x.metrics))x.metrics=[];
  if(!x.values||typeof x.values!=='object')x.values={};
  x.metrics=x.metrics.filter(m=>m&&m.id&&typeof m.name==='string');
  return x;
}
function saveScExtra(x){try{localStorage.setItem(SC_EXTRA_KEY,JSON.stringify(x));}catch(e){}}
// Month-to-date cutoff: when a date is picked in Month to date mode, only data up to and including
// that day counts. Blank / outside the active month = the whole month so far.
function scEffectiveThrough(cfg){
  if(cfg.mode==='day'||!cfg.through)return '';
  const b=scPeriodBounds();
  return(cfg.through>=b.min&&cfg.through<=b.max)?cfg.through:'';
}
function scScopeKey(cfg){
  if(cfg.mode==='day')return scEffectiveDay(cfg);
  const th=scEffectiveThrough(cfg);
  return th?'mtd@'+th:'mtd';
}
function scAddMetric(name){
  const x=getScExtra();
  const nm=String(name||'').trim()||'New metric';
  if(x.metrics.some(m=>m.name.toLowerCase()===nm.toLowerCase())){showToast('"'+nm+'" is already a column');return;}
  x.metrics.push({id:'sx_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:nm.slice(0,40),unit:'%',target:null,dir:'higher'});
  saveScExtra(x);renderTeamScorecard();
}
function setScMetric(id,field,val){
  const x=getScExtra();
  const m=x.metrics.find(q=>q.id===id);
  if(!m)return;
  const v=String(val==null?'':val).trim();
  if(field==='name'){if(!v){showToast('Name cannot be empty');renderTeamScorecard();return;}m.name=v.slice(0,40);}
  else if(field==='unit'){m.unit=v==='%'?'%':'';}
  else if(field==='dir'){m.dir=v==='lower'?'lower':'higher';}
  else if(field==='target'){
    if(v==='')m.target=null;
    else{const n=parseFloat(v.replace('%','').replace(',','.'));if(!isFinite(n)||n<0){showToast('Target must be a number (or blank for none)');renderTeamScorecard();return;}m.target=n;}
  }
  saveScExtra(x);renderTeamScorecard();
}
function scRemoveMetric(id){
  const x=getScExtra();
  const m=x.metrics.find(q=>q.id===id);
  if(!m)return;
  if(!confirm('Remove the "'+m.name+'" column and every score you typed into it?'))return;
  x.metrics=x.metrics.filter(q=>q.id!==id);
  Object.values(x.values).forEach(per=>Object.values(per).forEach(sc=>{delete sc[id];}));
  saveScExtra(x);
  const c=getScCfg();if(c.sort==='m:'+id){c.sort='name';saveScCfg(c);}
  renderTeamScorecard();
}
function scParseNum(t){
  const n=parseFloat(String(t==null?'':t).replace('%','').replace(',','.'));
  return isFinite(n)?n:null;
}
function scFmtVal(v,unit){
  if(v===null||v===undefined)return '—';
  return(Math.round(v*100)/100)+(unit==='%'?'%':'');
}
// Tier a typed score against its target: 100% of target = green, then 95 / 90 / 80% steps.
function scGradeExtra(v,mt){
  if(v===null||v===undefined)return{bg:SC_EMPTYBG,fg:'#555'};
  if(mt.target===null||mt.target===undefined||!(mt.target>0))return{bg:SC_UNGRADED,fg:'#000'};
  let r;
  if(mt.dir==='lower')r=v<=0?1:mt.target/v;else r=v/mt.target;
  const cls=r>=1?'grade-exceptional':r>=.95?'grade-good':r>=.9?'grade-average':r>=.8?'grade-satisfactory':'grade-needs';
  return{bg:SC_PALETTE[cls],fg:cls==='grade-needs'?'#3b0000':'#000'};
}
// Saves one typed score (member cell or team override) and repaints in place so Tab keeps working.
function setScVal(el){
  if(!el||!el.dataset)return;
  const id=el.dataset.id,mem=el.dataset.m;
  const x=getScExtra();
  if(!x.metrics.some(q=>q.id===id))return;
  const cfg=getScCfg();
  const pk=activePeriodKey,sk=scScopeKey(cfg);
  const raw=String(el.value||'').trim();
  const bucket=((x.values[pk]=x.values[pk]||{})[sk]=x.values[pk][sk]||{});
  const per=(bucket[id]=bucket[id]||{});
  if(raw===''){delete per[mem];}
  else{
    const n=scParseNum(raw);
    if(n===null||n<0){showToast('Enter a number');const prev=per[mem];const mt=x.metrics.find(q=>q.id===id);el.value=prev===undefined?'':scFmtVal(prev,mt.unit);return;}
    per[mem]=n;
  }
  saveScExtra(x);
  scRepaintExtras();
}
function scRepaintExtras(){
  const m=buildScorecardModel();
  if(!m)return;
  const card=document.getElementById('sc-card');
  if(!card)return;
  m.rows.forEach(r=>r.cells.forEach(c=>{
    if(!c.xid)return;
    const td=[...card.querySelectorAll('td[data-xid]')].find(t=>t.dataset.xid===c.xid&&t.dataset.xm===r.rawName);
    if(!td)return;
    td.style.background=c.bg;td.style.color=c.fg;
    const inp=td.querySelector('input');
    if(inp&&document.activeElement!==inp)inp.value=c.t==='—'?'':c.t;
  }));
  m.team.cells.forEach(c=>{
    if(!c.xid)return;
    const td=[...card.querySelectorAll('td[data-xid]')].find(t=>t.dataset.xid===c.xid&&t.dataset.xm==='__team');
    if(!td)return;
    const inp=td.querySelector('input');
    if(inp){
      inp.placeholder=c.auto||'—';
      if(document.activeElement!==inp)inp.value=c.manual?c.t:'';
    }
  });
}

// Builds everything the card needs (HTML table and PNG share this one model).
function buildScorecardModel(){
  const key=activePeriodKey;
  const p=getPeriod(key);
  const cfg=getScCfg();
  const isDay=cfg.mode==='day';
  const day=isDay?scEffectiveDay(cfg):null;
  const through=scEffectiveThrough(cfg);
  const agentMapAll=getAgentsForPeriod(key);
  // Members with only AHT/chat-count logged (no surveys yet) still get a row, same as Team View.
  getAHTLoggedAgents(p).filter(n=>!agentMapAll.has(n)&&getMemberAHTStats(p,n)).forEach(n=>agentMapAll.set(n,[]));
  const names=[...agentMapAll.keys()];
  if(!names.length)return null;
  const agentMap=new Map();
  names.forEach(n=>{
    const all=agentMapAll.get(n);
    agentMap.set(n,isDay?all.filter(sv=>parseDateKey(sv.date)===day):(through?all.filter(sv=>{const d=parseDateKey(sv.date);return d&&d<=through;}):all));
  });
  const memberAHT=n=>{
    if(!isDay&&through){
      // Cutoff: weighted AHT from daily rows up to that day (a saved "for the month" total can't be split by day).
      const es=getMemberAHTEntries(p,n).filter(e=>e.dk<=through);
      if(!es.length)return 0;
      const wu=es.reduce((a,e)=>a+(e.count||1),0);
      return es.reduce((a,e)=>a+e.aht*(e.count||1),0)/wu;
    }
    if(!isDay){const st=getMemberAHTStats(p,n);return st?st.avgSec:0;}
    const e=getMemberAHTEntries(p,n).find(q=>q.dk===day);
    return e?e.aht:0;
  };
  const extra=getScExtra();
  const metrics=extra.metrics;
  const sk=scScopeKey(cfg);
  const vals=((extra.values[key]||{})[sk])||{};
  const calc=(surveys,ahtSec)=>{
    const csatS=surveys.filter(s=>s.csat!==null&&s.csat!==undefined&&!isNaN(s.csat));
    const avgCSAT=csatS.length?calcCSAT(csatS):null;
    const arR=surveys.filter(s=>s.ar==='yes'||s.ar==='no');
    const arPct=arR.length?surveys.filter(s=>s.ar==='yes').length/arR.length*100:null;
    const aht=ahtSec>0?ahtSec:null;
    const hasAny=avgCSAT!==null||arPct!==null||aht!==null;
    const kpi=hasAny?(weightCSATTeam(avgCSAT)+weightARTeam(arPct)+weightAHTTeam(aht||0)+(through?customMetricsPointsThrough(key,through,'team'):customMetricsPoints(key,'team'))):null;
    return{count:surveys.length,csat:avgCSAT,ar:arPct,aht,kpi};
  };
  const cellOf=(txt,g,isCount)=>{
    if(txt===null)return{t:'—',bg:SC_EMPTYBG,fg:'#555'};
    if(isCount)return{t:txt,bg:SC_COUNTBG,fg:'#000'};
    const bg=(g&&SC_PALETTE[g.cls])||SC_EMPTYBG;
    return{t:txt,bg,fg:(g&&g.cls==='grade-needs')?'#3b0000':'#000'};
  };
  // Which of the three default metrics (AR / CSAT / AHT) are shown; Survey Count, extras and Final KPI always stay.
  // Hiding is display-only: Final KPI is still calculated from all three.
  const keepFlags=[true,cfg.showAr,cfg.showCsat,cfg.showAht,...metrics.map(()=>true),true];
  const keep=arr=>arr.filter((_,i)=>keepFlags[i]);
  const rows=names.map(name=>{
    const v=calc(agentMap.get(name),memberAHT(name));
    const kg=v.kpi!==null?kpiScoreGrade(v.kpi):null;
    const ex=metrics.map(mt=>{
      const raw=vals[mt.id]&&vals[mt.id][name];
      const num=(raw===undefined||raw===null)?null:raw;
      const g=scGradeExtra(num,mt);
      return{t:scFmtVal(num,mt.unit),bg:g.bg,fg:g.fg,xid:mt.id,raw:num};
    });
    return{name:prettifyAgentName(name),rawName:name,raw:v,xs:ex,cells:keep([
      cellOf(String(v.count),null,true),
      cellOf(v.ar!==null?v.ar.toFixed(2)+'%':null,v.ar!==null?gradeARTeam(v.ar):null),
      cellOf(v.csat!==null?fmtCsat(v.csat):null,v.csat!==null?gradeCSATTeam(v.csat):null),
      cellOf(v.aht!==null?String(Math.round(v.aht)):null,v.aht!==null?gradeAHTTeam(v.aht):null),
      ...ex,
      cellOf(v.kpi!==null?v.kpi.toFixed(2)+'%':null,kg)
    ])};
  });
  const sortKey=cfg.sort;
  const mIdx=sortKey.startsWith('m:')?metrics.findIndex(q=>'m:'+q.id===sortKey):-1;
  const cmp=mIdx>=0?((a,b)=>{
    const lower=metrics[mIdx].dir==='lower';
    const av=a.xs[mIdx].raw,bv=b.xs[mIdx].raw;
    if(av===null&&bv===null)return 0;if(av===null)return 1;if(bv===null)return -1;
    return lower?av-bv:bv-av;
  }):({
    name:(a,b)=>a.name.localeCompare(b.name),
    count:(a,b)=>b.raw.count-a.raw.count,
    csat:(a,b)=>(b.raw.csat??-1)-(a.raw.csat??-1),
    ar:(a,b)=>(b.raw.ar??-1)-(a.raw.ar??-1),
    aht:(a,b)=>(a.raw.aht??Infinity)-(b.raw.aht??Infinity),
    kpi:(a,b)=>(b.raw.kpi??-1)-(a.raw.kpi??-1)
  }[sortKey]||((a,b)=>a.name.localeCompare(b.name)));
  rows.sort((a,b)=>cmp(a,b)||a.name.localeCompare(b.name));
  // Team total: CSAT/AR pooled across every survey; AHT = average of the members' AHTs
  // (same rule the dashboard's team AHT uses).
  const allSurveys=[].concat(...names.map(n=>agentMap.get(n)));
  const ahts=names.map(memberAHT).filter(v=>v>0);
  const teamAHT=ahts.length?ahts.reduce((a,b)=>a+b,0)/ahts.length:0;
  const t=calc(allSurveys,teamAHT);
  const tName=getTeamViewName();
  const teamLabel=tName===TEAM_VIEW_DEFAULT_NAME?'Team total':(/^team\b/i.test(tName)?tName:'Team '+tName);
  const plain=s=>({t:s,bg:null,fg:'#fff'});
  // Team cell for a typed metric: a manual team score wins; otherwise the average of the members' scores.
  const teamEx=metrics.map(mt=>{
    const mv=vals[mt.id]||{};
    const manual=(mv.__team!==undefined&&mv.__team!==null)?mv.__team:null;
    const memberVals=names.map(n=>mv[n]).filter(v=>v!==undefined&&v!==null);
    const avg=memberVals.length?memberVals.reduce((a,b)=>a+b,0)/memberVals.length:null;
    const shown=manual!==null?manual:avg;
    return{t:scFmtVal(shown,mt.unit),bg:null,fg:'#fff',xid:mt.id,manual:manual!==null,auto:avg!==null?scFmtVal(avg,mt.unit):''};
  });
  const team={name:teamLabel,cells:keep([
    plain(String(t.count)),
    plain(t.ar!==null?(Math.round(t.ar*100)/100)+'%':'—'),
    plain(t.csat!==null?fmtCsat(t.csat):'—'),
    plain(t.aht!==null?String(Math.round(t.aht*100)/100):'—'),
    ...teamEx,
    plain(t.kpi!==null?t.kpi.toFixed(2)+'%':'—')
  ])};
  // Date line: custom text if set; single-day mode shows the picked day; month mode shows the latest survey day.
  let dateLabel=cfg.dateText;
  if(!dateLabel){
    if(isDay)dateLabel=scFmtLongDate(day);
    else if(through)dateLabel='Month to date \u2013 '+scFmtLongDate(through);
    else{
      const dk=Object.keys(getDailyStats(p.surveys||[])).sort().pop();
      dateLabel=dk?scFmtLongDate(dk):new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
    }
  }
  const autoTop=(arr,f)=>{const v=arr&&arr[0]?arr[0][f]:null;return(v===null||v===undefined||!isFinite(v))?null:v;};
  const tg=(custom,auto,suffix)=>{const v=custom!==''?custom:(auto===null?'':String(auto));return v===''?'':'('+v+(suffix||'')+')';};
  const headers=[
    {a:'Team Members',b:''},
    {a:'Survey Count',b:''},
    {a:'AGENT RESOLUTION',b:tg(cfg.arTarget,autoTop(TEAM_AR_THRESHOLDS,'min'),'%')},
    {a:'CSAT',b:tg(cfg.csatTarget,autoTop(TEAM_CSAT_THRESHOLDS,'min'))},
    {a:'AHT (seconds)',b:tg(cfg.ahtTarget,autoTop(TEAM_AHT_THRESHOLDS,'max'))},
    ...metrics.map(mt=>({a:mt.name,b:(mt.target===null||mt.target===undefined)?'':'('+mt.target+(mt.unit==='%'?'%':'')+')'})),
    {a:'FINAL KPI',b:''}
  ];
  const headersAll=headers;
  const autoT={ar:autoTop(TEAM_AR_THRESHOLDS,'min'),csat:autoTop(TEAM_CSAT_THRESHOLDS,'min'),aht:autoTop(TEAM_AHT_THRESHOLDS,'max')};
  const colWAll=[200,110,150,110,150,...metrics.map(()=>140),110];
  const nameFlags=[true,...keepFlags];
  const colW=colWAll.filter((_,i)=>nameFlags[i]);
  const headersShown=headersAll.filter((_,i)=>nameFlags[i]);
  const [y,mo]=key.split('-').map(Number);
  // ── Score + weight layout (each of AR / CSAT / AHT split into Score and Weight points) ──
  let wl=null;
  if(cfg.layout!=='standard'){
    const maxW=k=>{const v=Object.values((KPI_WEIGHTS&&KPI_WEIGHTS[k])||{}).filter(x=>isFinite(x));return v.length?Math.max(...v):0;};
    const r2=x=>Math.round(x*100)/100;
    const wt=x=>({t:r2(x)+'%',bg:'#ffffff',fg:'#000'});
    const sc=txt=>({t:txt,bg:'#ffffff',fg:'#000'});
    const wTeam=txt=>({t:txt,bg:null,fg:'#fff'});
    const defs=[
      cfg.showAr&&{k:'ar',a:'Agent Resolution (%)',fmt:v=>v===null?'—':v.toFixed(2)+'%',fmtT:v=>v===null?'—':r2(v)+'%',wf:weightARTeam},
      cfg.showCsat&&{k:'csat',a:'CSAT',fmt:v=>v===null?'—':fmtCsat(v),fmtT:v=>v===null?'—':fmtCsat(v),wf:weightCSATTeam},
      cfg.showAht&&{k:'aht',a:'AHT (seconds)',fmt:v=>v===null?'—':String(Math.round(v)),fmtT:v=>v===null?'—':String(r2(v)),wf:weightAHTTeam}
    ].filter(Boolean);
    const groups=[],colW2=[200];
    defs.forEach(d=>{
      groups.push({a:d.a,subs:['Score','Weight ('+r2(maxW(d.k))+'%)']});
      colW2.push(100,115);
    });
    metrics.forEach(mt=>{groups.push({a:mt.name,b:(mt.target===null||mt.target===undefined)?'':'('+mt.target+(mt.unit==='%'?'%':'')+')',subs:null});colW2.push(140);});
    groups.push({a:'KPI Score (Raw)',subs:null});colW2.push(140);
    const rows2=rows.map(r=>{
      const cells=[];
      defs.forEach(d=>{const v=r.raw[d.k];cells.push(sc(d.fmt(v)),wt(v===null||v===undefined?0:d.wf(v)));});
      r.xs.forEach(x=>cells.push(x));
      cells.push(r.cells[r.cells.length-1]);
      return{name:r.name,rawName:r.rawName,cells};
    });
    const tcells=[];
    defs.forEach(d=>{const v=t[d.k];tcells.push(wTeam(d.fmtT(v)),wTeam(r2(v===null||v===undefined?0:d.wf(v))+'%'));});
    team.cells.filter(c=>c.xid).forEach(c=>tcells.push(c));
    tcells.push(team.cells[team.cells.length-1]);
    wl={groups,colW:colW2,rows:rows2,team:{name:team.name,cells:tcells}};
  }
  return{wl,showStd:cfg.layout!=='weights',through,title:cfg.title,asOf:cfg.asOf,dateLabel,headers:headersShown,rows,team,cfg,autoT,metrics,colW,isDay,day,scope:sk,periodLabel:periodLabel(mo,y)};
}

function scWeightsTableHTML(m){
  const w=m.wl,bd='border:1px solid '+SC_BORDER+';';
  const total=w.colW.reduce((a,b)=>a+b,0);
  const pct=w.colW.map(x=>(x/total*100).toFixed(2)+'%');
  const hth=(txt,extra,i,attrs)=>`<th ${attrs||''} style="${i!==undefined?'width:'+pct[i]+';':''}background:${SC_BLUE};color:#fff;font-size:11px;font-weight:700;text-align:center;padding:6px 4px;line-height:1.25;${bd}${extra||''}">${txt}</th>`;
  let ci=1;const r1=[hth('Team Members','',0,'rowspan="2"')],r2=[];
  w.groups.forEach(g=>{
    const n=g.subs?g.subs.length:1;
    if(g.subs){r1.push(hth(escHtml(g.a),'font-size:13px;',ci,'colspan="'+n+'"'));g.subs.forEach((sv,k)=>r2.push(hth(escHtml(sv),'font-weight:400;',ci+k)));}
    else r1.push(hth(escHtml(g.a)+(g.b?'<br>'+escHtml(g.b):''),'font-size:13px;',ci,'rowspan="2"'));
    ci+=n;
  });
  const cellTd=(c,r)=>{
    if(c.xid)return`<td data-xid="${escHtml(c.xid)}" data-xm="${escHtml(r.rawName)}" style="background:${c.bg};color:${c.fg};padding:0;${bd}"><input class="sc-cell-in" type="text" inputmode="decimal" value="${c.t==='—'?'':escHtml(c.t)}" placeholder="—" data-id="${escHtml(c.xid)}" data-m="${escHtml(r.rawName)}" data-ph-change="setScVal(this)"></td>`;
    return`<td style="background:${c.bg};color:${c.fg};font-size:15px;font-weight:${c.bg==='#ffffff'?400:700};text-align:center;padding:4px 4px;${bd}">${escHtml(c.t)}</td>`;
  };
  const body=w.rows.map(r=>`<tr><td style="background:${SC_NAMEBG};color:#000;font-size:15px;text-align:center;padding:4px 6px;${bd}">${escHtml(r.name)}</td>${r.cells.map(c=>cellTd(c,r)).join('')}</tr>`).join('');
  const teamTd=c=>c.xid
    ?`<td data-xid="${escHtml(c.xid)}" data-xm="__team" style="background:${SC_BLUE};color:#fff;padding:0;${bd}"><input class="sc-cell-in sc-team-in" type="text" inputmode="decimal" value="${c.manual?escHtml(c.t):''}" placeholder="${escHtml(c.auto||'—')}" title="Auto = average of the member scores. Type a number to override." data-id="${escHtml(c.xid)}" data-m="__team" data-ph-change="setScVal(this)"></td>`
    :`<td style="background:${SC_BLUE};color:#fff;font-size:15px;font-weight:700;text-align:center;padding:6px 4px;${bd}">${escHtml(c.t)}</td>`;
  const teamRow=`<tr><td style="background:${SC_BLUE};color:#fff;font-size:15px;font-weight:700;text-align:left;padding:6px 10px;${bd}">${escHtml(w.team.name)}</td>${w.team.cells.map(teamTd).join('')}</tr>`;
  return`<table style="width:100%;min-width:${Math.max(640,Math.round(total*.85))}px;border-collapse:collapse;table-layout:fixed;font-family:Arial,Helvetica,sans-serif">
    <tr>
      <td style="background:${SC_YELLOW};color:#000;font-weight:700;text-align:center;font-size:15px;line-height:1.5;padding:8px 4px;${bd}">as of<br><span style="font-size:14px">${escHtml(m.asOf)}</span></td>
      <td colspan="${w.colW.length-1}" style="background:${SC_BLUE};color:${SC_YELLOW};font-weight:700;text-align:center;padding:8px 6px;line-height:1.5;${bd}"><span style="font-size:18px;letter-spacing:.02em">${escHtml(m.title)}</span><br><span style="font-size:14px">${escHtml(m.dateLabel)}</span></td>
    </tr>
    <tr>${r1.join('')}</tr><tr>${r2.join('')}</tr>
    ${body}${teamRow}
  </table>`;
}
function scTableHTML(m){
  const total=m.colW.reduce((a,b)=>a+b,0);
  const pct=m.colW.map(w=>(w/total*100).toFixed(2)+'%');
  const bd='border:1px solid '+SC_BORDER+';';
  const th=(h,i)=>`<th style="width:${pct[i]};background:${SC_BLUE};color:#fff;font-size:11px;font-weight:700;text-align:center;padding:8px 4px;line-height:1.25;${bd}">${escHtml(h.a)}${h.b?'<br>'+escHtml(h.b):''}</th>`;
  const cellTd=(c,r)=>{
    if(c.xid){
      return`<td data-xid="${escHtml(c.xid)}" data-xm="${escHtml(r.rawName)}" style="background:${c.bg};color:${c.fg};padding:0;${bd}"><input class="sc-cell-in" type="text" inputmode="decimal" value="${c.t==='—'?'':escHtml(c.t)}" placeholder="—" data-id="${escHtml(c.xid)}" data-m="${escHtml(r.rawName)}" data-ph-change="setScVal(this)"></td>`;
    }
    return`<td style="background:${c.bg};color:${c.fg};font-size:16px;font-weight:700;text-align:center;padding:5px 4px;${bd}">${escHtml(c.t)}</td>`;
  };
  const body=m.rows.map(r=>`<tr>
      <td style="background:${SC_NAMEBG};color:#000;font-size:15px;text-align:center;padding:5px 6px;${bd}">${escHtml(r.name)}</td>
      ${r.cells.map(c=>cellTd(c,r)).join('')}
    </tr>`).join('');
  const teamTd=c=>{
    if(c.xid){
      return`<td data-xid="${escHtml(c.xid)}" data-xm="__team" style="background:${SC_BLUE};color:#fff;padding:0;${bd}"><input class="sc-cell-in sc-team-in" type="text" inputmode="decimal" value="${c.manual?escHtml(c.t):''}" placeholder="${escHtml(c.auto||'—')}" title="Auto = average of the member scores. Type a number to override." data-id="${escHtml(c.xid)}" data-m="__team" data-ph-change="setScVal(this)"></td>`;
    }
    return`<td style="background:${SC_BLUE};color:#fff;font-size:16px;font-weight:700;text-align:center;padding:7px 4px;${bd}">${escHtml(c.t)}</td>`;
  };
  const teamRow=`<tr>
      <td style="background:${SC_BLUE};color:#fff;font-size:16px;font-weight:700;text-align:left;padding:7px 10px;${bd}">${escHtml(m.team.name)}</td>
      ${m.team.cells.map(teamTd).join('')}
    </tr>`;
  return`<table style="width:100%;min-width:${Math.max(640,Math.round(total*.85))}px;border-collapse:collapse;table-layout:fixed;font-family:Arial,Helvetica,sans-serif">
    <tr>
      <td style="background:${SC_YELLOW};color:#000;font-weight:700;text-align:center;font-size:15px;line-height:1.5;padding:8px 4px;${bd}">as of<br><span style="font-size:14px">${escHtml(m.asOf)}</span></td>
      <td colspan="${m.colW.length-1}" style="background:${SC_BLUE};color:${SC_YELLOW};font-weight:700;text-align:center;padding:8px 6px;line-height:1.5;${bd}"><span style="font-size:18px;letter-spacing:.02em">${escHtml(m.title)}</span><br><span style="font-size:14px">${escHtml(m.dateLabel)}</span></td>
    </tr>
    <tr>${m.headers.map(th).join('')}</tr>
    ${body}
    ${teamRow}
  </table>`;
}

function renderTeamScorecard(){
  const box=document.getElementById('monthsummary-team-body');
  if(!box)return;
  const m=buildScorecardModel();
  if(!m){
    const [y,mo]=activePeriodKey.split('-').map(Number);
    box.innerHTML=`<div class="empty-state"><svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" width="40" height="40" style="display:block;margin:0 auto 1rem;opacity:.4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><p>No team members with surveys or AHT logged for ${escHtml(periodLabel(mo,y))}.</p></div>`;
    return;
  }
  const c=m.cfg;
  const b=scPeriodBounds();
  const sorts=SC_BASE_SORTS.concat(m.metrics.map(mt=>['m:'+mt.id,mt.name+(mt.dir==='lower'?' (lowest first)':'')]));
  const metricRows=m.metrics.map(mt=>`
      <div class="sc-metric-row">
        <input class="sc-input" type="text" maxlength="40" style="width:170px" value="${escHtml(mt.name)}" title="Column name" data-id="${escHtml(mt.id)}" data-ph-change="setScMetric(this.dataset.id, 'name', this.value)">
        <input class="sc-input" type="text" inputmode="decimal" style="width:80px" placeholder="Target" value="${mt.target===null||mt.target===undefined?'':mt.target}" title="Target (blank = no colour grading)" data-id="${escHtml(mt.id)}" data-ph-change="setScMetric(this.dataset.id, 'target', this.value)">
        <select class="sc-input" title="Unit" data-id="${escHtml(mt.id)}" data-ph-change="setScMetric(this.dataset.id, 'unit', this.value)"><option value="%"${mt.unit==='%'?' selected':''}>Percent (%)</option><option value=""${mt.unit!=='%'?' selected':''}>Plain number</option></select>
        <select class="sc-input" title="Which direction is good" data-id="${escHtml(mt.id)}" data-ph-change="setScMetric(this.dataset.id, 'dir', this.value)"><option value="higher"${mt.dir!=='lower'?' selected':''}>Higher is better</option><option value="lower"${mt.dir==='lower'?' selected':''}>Lower is better</option></select>
        <button class="btn btn-ghost" title="Remove this column" data-id="${escHtml(mt.id)}" data-ph-click="scRemoveMetric(this.dataset.id)">Remove</button>
      </div>`).join('');
  const presetBtns=SC_PRESETS.filter(n=>!m.metrics.some(q=>q.name.toLowerCase()===n.toLowerCase()))
    .map(n=>`<button class="btn btn-ghost" data-ph-click="scAddMetric('${n}')">+ ${n}</button>`).join('');
  box.innerHTML=`
    <div class="sc-controls">
      <label class="sc-field"><span>Title</span><input class="sc-input" type="text" maxlength="60" value="${escHtml(c.title)}" data-ph-change="setScCfg('title', this.value)"></label>
      <label class="sc-field"><span>As of</span><input class="sc-input" type="text" maxlength="20" style="width:90px" value="${escHtml(c.asOf)}" data-ph-change="setScCfg('asOf', this.value)"></label>
      <label class="sc-field"><span>Date line</span><input class="sc-input" type="text" maxlength="60" placeholder="${m.isDay?'Auto (picked day)':'Auto (latest survey day)'}" value="${escHtml(c.dateText)}" data-ph-change="setScCfg('dateText', this.value)"></label>
      <label class="sc-field"><span>Sort by</span><select class="sc-input" data-ph-change="setScCfg('sort', this.value)">${sorts.map(([v,l])=>`<option value="${escHtml(v)}"${c.sort===v?' selected':''}>${escHtml(l)}</option>`).join('')}</select></label>
      <button class="btn btn-ghost" data-ph-click="resetScCfg()" title="Back to default title, time, date and targets (typed metric scores are kept)">Reset</button>
    </div>
    <div class="sc-controls">
      <label class="sc-field"><span>Layout</span><select class="sc-input" data-ph-change="setScCfg('layout', this.value)"><option value="standard"${c.layout==='standard'?' selected':''}>Standard</option><option value="weights"${c.layout==='weights'?' selected':''}>Score + weight (KPI breakdown)</option><option value="both"${c.layout==='both'?' selected':''}>Both (standard + score/weight)</option></select></label>
      <label class="sc-field"><span>Data shown</span><select class="sc-input" data-ph-change="setScMode(this.value)"><option value="month"${!m.isDay?' selected':''}>Month to date</option><option value="day"${m.isDay?' selected':''}>Single day</option></select></label>
      <div class="sc-field"><span>Date</span><div style="display:flex;gap:4px;align-items:center">
        <button class="btn btn-ghost" style="padding:5px 9px" title="Previous day" data-ph-click="scStepDay(-1)">‹</button>
        <input class="sc-input" type="date" min="${b.min}" max="${b.max}" value="${m.isDay?m.day:(m.through||scEffectiveDay(c))}" data-ph-change="setScDay(this.value)">
        <button class="btn btn-ghost" style="padding:5px 9px" title="Next day" data-ph-click="scStepDay(1)">›</button>
      </div></div>
      ${(!m.isDay&&m.through)?'<button class="btn btn-ghost" style="align-self:flex-end" data-ph-click="scClearThrough()">Whole month</button>':''}
      <span class="sc-hint" style="padding-bottom:7px">${m.isDay?'Showing surveys and AHT logged on this day only.':(m.through?'Showing month to date, counting only data up to and including the picked day.':'Showing the whole month so far. Pick a date (or use ‹ ›) to see the month to date as of that day.')}</span>
    </div>
    <div class="sc-controls">
      <span class="sc-field" style="justify-content:flex-end;padding-bottom:7px">Column targets</span>
      <label class="sc-field"><span>Agent Resolution %</span><input class="sc-input" type="text" inputmode="decimal" style="width:90px" placeholder="${m.autoT.ar!==null?m.autoT.ar:'none'}" value="${escHtml(c.arTarget)}" data-ph-change="setScCfg('arTarget', this.value)"></label>
      <label class="sc-field"><span>CSAT</span><input class="sc-input" type="text" inputmode="decimal" style="width:90px" placeholder="${m.autoT.csat!==null?m.autoT.csat:'none'}" value="${escHtml(c.csatTarget)}" data-ph-change="setScCfg('csatTarget', this.value)"></label>
      <label class="sc-field"><span>AHT (seconds)</span><input class="sc-input" type="text" inputmode="numeric" style="width:90px" placeholder="${m.autoT.aht!==null?m.autoT.aht:'none'}" value="${escHtml(c.ahtTarget)}" data-ph-change="setScCfg('ahtTarget', this.value)"></label>
      <div class="sc-field"><span>Show columns</span><div style="display:flex;gap:12px;align-items:center;padding:5px 0;text-transform:none;letter-spacing:0;font-size:12px;color:var(--text)">
        <label style="display:flex;gap:4px;align-items:center;cursor:pointer"><input type="checkbox"${c.showAr?' checked':''} data-ph-change="setScCol('showAr', this.checked)"> Agent Resolution</label>
        <label style="display:flex;gap:4px;align-items:center;cursor:pointer"><input type="checkbox"${c.showCsat?' checked':''} data-ph-change="setScCol('showCsat', this.checked)"> CSAT</label>
        <label style="display:flex;gap:4px;align-items:center;cursor:pointer"><input type="checkbox"${c.showAht?' checked':''} data-ph-change="setScCol('showAht', this.checked)"> AHT</label>
      </div></div>
      <span class="sc-hint" style="padding-bottom:7px">Leave blank for auto (top tier). Targets for these three are labels only; their cell colours follow your Team thresholds.</span>
    </div>
    <div class="sc-metrics">
      <div class="sc-actions" style="margin-bottom:6px">
        <span class="sc-field" style="padding-right:4px">Extra metrics</span>
        ${presetBtns}
        <button class="btn btn-ghost" data-ph-click="scAddMetric('')">+ Custom metric</button>
      </div>
      ${metricRows}
      <div class="sc-hint" style="margin:4px 0 10px">${m.metrics.length?'Type each member\u2019s score straight into the table below (Tab moves to the next cell). Scores are saved per '+(m.isDay?'day':'month-to-date view')+'. With a target set, cells colour at 100% / 95% / 90% / 80% of target. The Team cell averages the members unless you type over it.':'Add a column, then type each member\u2019s score into the table. Scores are entered by hand for now.'}</div>
    </div>
    <div class="sc-actions">
      <button class="btn btn-ghost" data-ph-click="copyScorecardImage()">Copy as image</button>
      <button class="btn btn-ghost" data-ph-click="downloadScorecardImage()">Download PNG</button>
      <button class="btn btn-ghost" data-ph-click="copyScorecardTable()" title="Tab-separated, pastes straight into Sheets/Excel">Copy as table</button>
      <span class="sc-hint">Grades use your Team thresholds (Settings → Scoring). Targets in the header are the top tier.</span>
    </div>
    <div class="sc-wrap"><div class="sc-card" id="sc-card">${m.showStd?scTableHTML(m):''}${(m.showStd&&m.wl)?'<div style="height:18px"></div>':''}${m.wl?scWeightsTableHTML(m):''}</div></div>`;
}

// ── PNG export (drawn on a canvas from the same model) ───────────────────────
function scDrawCanvasW(m){
  const w=m.wl,S=2,colW=w.colW,W=colW.reduce((a,b)=>a+b,0);
  const topH=62,hR=24,rowH=32,teamH=38;
  const H=topH+hR*2+rowH*w.rows.length+teamH;
  const cv=document.createElement('canvas');cv.width=W*S;cv.height=H*S;
  const g=cv.getContext('2d');g.scale(S,S);
  const F='Arial, Helvetica, sans-serif';
  g.textBaseline='middle';g.textAlign='center';
  const box=(x,y,wd,h,bg)=>{g.fillStyle=bg;g.fillRect(x,y,wd,h);g.strokeStyle=SC_BORDER;g.lineWidth=1;g.strokeRect(x+.5,y+.5,wd-1,h-1);};
  const fit=(txt,font,maxW,startPx)=>{let px=startPx;g.font=font.replace('{px}',px);while(px>9&&g.measureText(txt).width>maxW){px--;g.font=font.replace('{px}',px);}};
  const xs=[0];colW.forEach((x,i)=>xs.push(xs[i]+x));
  box(0,0,colW[0],topH,SC_YELLOW);
  g.fillStyle='#000';g.font='bold 15px '+F;g.fillText('as of',colW[0]/2,topH/2-10);
  fit(m.asOf,'bold {px}px '+F,colW[0]-12,15);g.fillText(m.asOf,colW[0]/2,topH/2+10);
  box(colW[0],0,W-colW[0],topH,SC_BLUE);
  const cx=colW[0]+(W-colW[0])/2,mw=W-colW[0]-16;
  g.fillStyle=SC_YELLOW;
  fit(m.title,'bold {px}px '+F,mw,19);g.fillText(m.title,cx,topH/2-10);
  fit(m.dateLabel,'bold {px}px '+F,mw,15);g.fillText(m.dateLabel,cx,topH/2+12);
  box(0,topH,colW[0],hR*2,SC_BLUE);g.fillStyle='#fff';g.font='bold 14px '+F;g.fillText('TEAM MEMBERS',colW[0]/2,topH+hR);
  let ci=1;
  w.groups.forEach(gp=>{
    if(gp.subs){
      const n=gp.subs.length,gw=xs[ci+n]-xs[ci];
      box(xs[ci],topH,gw,hR,SC_BLUE);g.fillStyle='#fff';fit(gp.a,'bold {px}px '+F,gw-8,13);g.fillText(gp.a,xs[ci]+gw/2,topH+hR/2);
      gp.subs.forEach((sv,k)=>{box(xs[ci+k],topH+hR,colW[ci+k],hR,SC_BLUE);g.fillStyle='#fff';fit(sv,'{px}px '+F,colW[ci+k]-6,12);g.fillText(sv,xs[ci+k]+colW[ci+k]/2,topH+hR*1.5);});
      ci+=n;
    }else{
      box(xs[ci],topH,colW[ci],hR*2,SC_BLUE);g.fillStyle='#fff';
      if(gp.b){fit(gp.a,'bold {px}px '+F,colW[ci]-8,13);g.fillText(gp.a,xs[ci]+colW[ci]/2,topH+hR-6);g.font='bold 11px '+F;g.fillText(gp.b,xs[ci]+colW[ci]/2,topH+hR+10);}
      else{fit(gp.a,'bold {px}px '+F,colW[ci]-8,13);g.fillText(gp.a,xs[ci]+colW[ci]/2,topH+hR);}
      ci++;
    }
  });
  const y0=topH+hR*2;
  w.rows.forEach((r,ri)=>{
    const y=y0+ri*rowH;
    box(0,y,colW[0],rowH,SC_NAMEBG);g.fillStyle='#000';fit(r.name,'{px}px '+F,colW[0]-12,16);g.fillText(r.name,colW[0]/2,y+rowH/2);
    r.cells.forEach((c,k)=>{box(xs[k+1],y,colW[k+1],rowH,c.bg);g.fillStyle=c.fg;g.font=(c.bg==='#ffffff'?'':'bold ')+'16px '+F;g.fillText(c.t,xs[k+1]+colW[k+1]/2,y+rowH/2);});
  });
  const ty=y0+w.rows.length*rowH;
  box(0,ty,colW[0],teamH,SC_BLUE);g.fillStyle='#fff';g.textAlign='left';fit(w.team.name,'bold {px}px '+F,colW[0]-20,16);g.fillText(w.team.name,10,ty+teamH/2);g.textAlign='center';
  w.team.cells.forEach((c,k)=>{box(xs[k+1],ty,colW[k+1],teamH,SC_BLUE);g.fillStyle='#fff';g.font='bold 16px '+F;g.fillText(c.t,xs[k+1]+colW[k+1]/2,ty+teamH/2);});
  return cv;
}
function scDrawCanvas(m){
  if(!m.wl)return scDrawCanvasStd(m);
  if(!m.showStd)return scDrawCanvasW(m);
  // Both layouts: stack them on one image with a gap.
  const a=scDrawCanvasStd(m),b=scDrawCanvasW(m),gap=36;
  const cv=document.createElement('canvas');
  cv.width=Math.max(a.width,b.width);cv.height=a.height+b.height+gap*2;
  const g=cv.getContext('2d');
  g.fillStyle='#ffffff';g.fillRect(0,0,cv.width,cv.height);
  g.drawImage(a,0,0);g.drawImage(b,0,a.height+gap*2);
  return cv;
}
function scDrawCanvasStd(m){
  const S=2;
  const colW=m.colW;
  const W=colW.reduce((a,b)=>a+b,0);
  const topH=62,headH=46,rowH=34,teamH=40;
  const H=topH+headH+rowH*m.rows.length+teamH;
  const cv=document.createElement('canvas');
  cv.width=W*S;cv.height=H*S;
  const g=cv.getContext('2d');
  g.scale(S,S);
  const F='Arial, Helvetica, sans-serif';
  g.textBaseline='middle';g.textAlign='center';
  const box=(x,y,w,h,bg)=>{g.fillStyle=bg;g.fillRect(x,y,w,h);g.strokeStyle=SC_BORDER;g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,h-1);};
  const fit=(txt,font,maxW,startPx)=>{let px=startPx;g.font=font.replace('{px}',px);while(px>9&&g.measureText(txt).width>maxW){px--;g.font=font.replace('{px}',px);}};
  const xs=[0];colW.forEach((w,i)=>xs.push(xs[i]+w));
  // top block
  box(0,0,colW[0],topH,SC_YELLOW);
  g.fillStyle='#000';g.font='bold 15px '+F;g.fillText('as of',colW[0]/2,topH/2-10);
  fit(m.asOf,'bold {px}px '+F,colW[0]-12,15);g.fillText(m.asOf,colW[0]/2,topH/2+10);
  box(colW[0],0,W-colW[0],topH,SC_BLUE);
  const cx=colW[0]+(W-colW[0])/2,mw=W-colW[0]-16;
  g.fillStyle=SC_YELLOW;
  fit(m.title,'bold {px}px '+F,mw,19);g.fillText(m.title,cx,topH/2-10);
  fit(m.dateLabel,'bold {px}px '+F,mw,15);g.fillText(m.dateLabel,cx,topH/2+12);
  // column headers
  m.headers.forEach((h,i)=>{
    box(xs[i],topH,colW[i],headH,SC_BLUE);
    g.fillStyle='#fff';
    if(h.b){
      fit(h.a,'bold {px}px '+F,colW[i]-8,11);g.fillText(h.a,xs[i]+colW[i]/2,topH+headH/2-8);
      g.font='bold 11px '+F;g.fillText(h.b,xs[i]+colW[i]/2,topH+headH/2+8);
    }else{fit(h.a,'bold {px}px '+F,colW[i]-8,11);g.fillText(h.a,xs[i]+colW[i]/2,topH+headH/2);}
  });
  // member rows
  m.rows.forEach((r,ri)=>{
    const y=topH+headH+ri*rowH;
    box(0,y,colW[0],rowH,SC_NAMEBG);
    g.fillStyle='#000';fit(r.name,'{px}px '+F,colW[0]-12,16);g.fillText(r.name,colW[0]/2,y+rowH/2);
    r.cells.forEach((c,ci)=>{
      box(xs[ci+1],y,colW[ci+1],rowH,c.bg);
      g.fillStyle=c.fg;g.font='bold 17px '+F;g.fillText(c.t,xs[ci+1]+colW[ci+1]/2,y+rowH/2);
    });
  });
  // team row
  const ty=topH+headH+m.rows.length*rowH;
  box(0,ty,colW[0],teamH,SC_BLUE);
  g.fillStyle='#fff';g.textAlign='left';fit(m.team.name,'bold {px}px '+F,colW[0]-20,17);g.fillText(m.team.name,10,ty+teamH/2);
  g.textAlign='center';
  m.team.cells.forEach((c,ci)=>{
    box(xs[ci+1],ty,colW[ci+1],teamH,SC_BLUE);
    g.fillStyle='#fff';g.font='bold 17px '+F;g.fillText(c.t,xs[ci+1]+colW[ci+1]/2,ty+teamH/2);
  });
  return cv;
}
function scFileName(){
  const m=buildScorecardModel();
  return 'team-scorecard-'+((m&&m.isDay)?m.day:activePeriodKey)+'.png';
}
function scMakeBlob(cb){
  const m=buildScorecardModel();
  if(!m){showToast('No team data for this period');return;}
  scDrawCanvas(m).toBlob(b=>{if(!b){showToast('Could not create image');return;}cb(b);},'image/png');
}
function scDownloadBlob(blob){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=scFileName();
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function downloadScorecardImage(){
  scMakeBlob(b=>{scDownloadBlob(b);showToast('Scorecard image downloaded');});
}
function copyScorecardImage(){
  scMakeBlob(async b=>{
    try{
      await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);
      showToast('Scorecard image copied!');
    }catch(e){
      scDownloadBlob(b);
      showToast('Clipboard blocked — downloaded the PNG instead');
    }
  });
}
function copyScorecardTable(){
  const m=buildScorecardModel();
  if(!m){showToast('No team data for this period');return;}
  let stdTxt='';
  if(m.showStd){
    const head0=m.headers.map(h=>(h.a+(h.b?' '+h.b:'')).trim()).join('\t');
    const line0=(name,cells)=>[name,...cells.map(c=>c.t)].join('\t');
    stdTxt=[head0,...m.rows.map(r=>line0(r.name,r.cells)),line0(m.team.name,m.team.cells)].join('\n');
  }
  if(m.wl){
    const w=m.wl,h1=['Team Members'],h2=[''];
    w.groups.forEach(g=>{if(g.subs){g.subs.forEach((sv,k)=>{h1.push(k===0?g.a:'');h2.push(sv);});}else{h1.push((g.a+(g.b?' '+g.b:'')).trim());h2.push('');}});
    const ln=(name,cells)=>[name,...cells.map(c=>c.t)].join('\t');
    const wTxt=[h1.join('\t'),h2.join('\t'),...w.rows.map(r=>ln(r.name,r.cells)),ln(w.team.name,w.team.cells)].join('\n');
    const out=m.showStd?stdTxt+'\n\n'+wTxt:wTxt;
    navigator.clipboard.writeText(out).then(()=>showToast('Table copied — paste into Sheets/Excel')).catch(()=>showToast('Copy failed'));
    return;
  }
  const head=m.headers.map(h=>(h.a+(h.b?' '+h.b:'')).trim()).join('\t');
  const line=(name,cells)=>[name,...cells.map(c=>c.t)].join('\t');
  const txt=[head,...m.rows.map(r=>line(r.name,r.cells)),line(m.team.name,m.team.cells)].join('\n');
  navigator.clipboard.writeText(txt).then(()=>showToast('Table copied — paste into Sheets/Excel')).catch(()=>showToast('Copy failed'));
}


// ═══════════════════════════════════════════════════════════════
// NEW FEATURES
// ═══════════════════════════════════════════════════════════════

// ── WORKING DAYS CALENDAR ─────────────────────────────────────
// Storage key per period, e.g. "wdays-2026-06"
function wdayStorageKey(){
  const [y,m]=activePeriodKey.split('-');
  return 'wdays-'+y+'-'+m;
}
function loadWorkingDays(){
  try{const v=localStorage.getItem(wdayStorageKey());return v?JSON.parse(v):[];}catch(e){return [];}
}
function saveWorkingDays(arr){
  try{localStorage.setItem(wdayStorageKey(),JSON.stringify(arr));}catch(e){}
}
// selected days: array of day-of-month numbers (1-based)
let wdaySelected=[];

// Drag-to-select state
let _wdayDragging=false,_wdayDragMode=null;

function buildWdayCal(){
  const [y,m]=activePeriodKey.split('-').map(Number);
  const now=new Date();
  const today=now.getDate();
  const isCurrentMonth=now.getFullYear()===y&&(now.getMonth()+1)===m;
  const daysInMonth=new Date(y,m,0).getDate();
  const firstDow=new Date(y,m-1,1).getDay(); // 0=Sun
  const MONTHS_LONG=['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('wday-cal-title').textContent=MONTHS_LONG[m-1]+' '+y+' — Working Days';
  const grid=document.getElementById('wday-cal-grid');
  const DOWS=['Su','Mo','Tu','We','Th','Fr','Sa'];
  let html='';
  DOWS.forEach((d,i)=>{
    html+=`<div class="wday-cal-dow${i===0||i===6?' weekend':''}">${d}</div>`;
  });
  for(let i=0;i<firstDow;i++) html+='<div class="wday-cal-day empty"></div>';
  for(let d=1;d<=daysInMonth;d++){
    const dow=new Date(y,m-1,d).getDay();
    const isWeekend=dow===0||dow===6;
    const isToday=isCurrentMonth&&d===today;
    const isFuture=isCurrentMonth&&d>today;
    const isSel=wdaySelected.includes(d);
    let cls='wday-cal-day';
    if(isToday)cls+=' today';
    if(isFuture)cls+=' future-day';
    if(isSel)cls+=' selected';
    if(isWeekend)cls+=' weekend-day';
    html+=`<div class="${cls}" data-day="${d}">${d}</div>`;
  }
  grid.innerHTML=html;
  grid.onmousedown=function(e){
    const cell=e.target.closest('.wday-cal-day:not(.empty)');
    if(!cell)return;
    e.preventDefault();
    const d=parseInt(cell.dataset.day);
    _wdayDragging=true;
    _wdayDragMode=wdaySelected.includes(d)?'remove':'add';
    wdayApplyDragTo(d);
  };
  grid.onmousemove=function(e){
    if(!_wdayDragging)return;
    const cell=e.target.closest('.wday-cal-day:not(.empty)');
    if(!cell)return;
    wdayApplyDragTo(parseInt(cell.dataset.day));
  };
  grid.onmouseup=function(){wdayEndDrag();};
  grid.ontouchstart=function(e){
    const touch=e.touches[0];
    const cell=document.elementFromPoint(touch.clientX,touch.clientY);
    const dc=cell&&cell.closest('.wday-cal-day:not(.empty)');
    if(!dc)return;
    e.preventDefault();
    const d=parseInt(dc.dataset.day);
    _wdayDragging=true;
    _wdayDragMode=wdaySelected.includes(d)?'remove':'add';
    wdayApplyDragTo(d);
  };
  grid.ontouchmove=function(e){
    if(!_wdayDragging)return;
    e.preventDefault();
    const touch=e.touches[0];
    const cell=document.elementFromPoint(touch.clientX,touch.clientY);
    const dc=cell&&cell.closest('.wday-cal-day:not(.empty)');
    if(!dc)return;
    wdayApplyDragTo(parseInt(dc.dataset.day));
  };
  grid.ontouchend=function(){wdayEndDrag();};
  updateWdaySummary();
}

function wdayApplyDragTo(d){
  if(_wdayDragMode==='add'){
    if(!wdaySelected.includes(d)) wdaySelected.push(d);
  } else {
    const idx=wdaySelected.indexOf(d);
    if(idx!==-1) wdaySelected.splice(idx,1);
  }
  const cell=document.querySelector(`#wday-cal-grid [data-day="${d}"]`);
  if(cell){
    if(wdaySelected.includes(d)) cell.classList.add('selected');
    else cell.classList.remove('selected');
  }
  updateWdaySummary();
}

function wdayEndDrag(){
  if(!_wdayDragging)return;
  _wdayDragging=false;
  _wdayDragMode=null;
  saveWorkingDays(wdaySelected);
  renderForecast(currentSurveysCache||[]);
  renderDashboard(); // refresh CSAT/AR/AHT thresholds together so wd counts stay in sync
}
// Stop drag if mouse releases outside the calendar grid
document.addEventListener('mouseup',()=>{if(_wdayDragging)wdayEndDrag();});

function wdayToggleDay(d){
  const idx=wdaySelected.indexOf(d);
  if(idx===-1) wdaySelected.push(d);
  else wdaySelected.splice(idx,1);
  saveWorkingDays(wdaySelected);
  const cell=document.querySelector(`#wday-cal-grid [data-day="${d}"]`);
  if(cell){
    if(wdaySelected.includes(d)) cell.classList.add('selected');
    else cell.classList.remove('selected');
  }
  updateWdaySummary();
  renderForecast(currentSurveysCache||[]);
  renderDashboard(); // refresh CSAT/AR/AHT thresholds together so wd counts stay in sync
}
function wdaySelectWeekdays(){
  const [y,m]=activePeriodKey.split('-').map(Number);
  const daysInMonth=new Date(y,m,0).getDate();
  wdaySelected=[];
  for(let d=1;d<=daysInMonth;d++){
    const dow=new Date(y,m-1,d).getDay();
    if(dow!==0&&dow!==6) wdaySelected.push(d);
  }
  saveWorkingDays(wdaySelected);
  buildWdayCal();
  renderForecast(currentSurveysCache||[]);
  renderDashboard(); // refresh CSAT/AR/AHT thresholds together so wd counts stay in sync
}
function wdayClearAll(){
  wdaySelected=[];
  saveWorkingDays(wdaySelected);
  buildWdayCal();
  renderForecast(currentSurveysCache||[]);
  renderDashboard(); // refresh CSAT/AR/AHT thresholds together so wd counts stay in sync
}
function updateWdaySummary(){
  const n=wdaySelected.length;
  document.getElementById('wday-cal-summary').innerHTML=`<strong>${n}</strong> day${n!==1?'s':''} selected`;
  const badge=document.getElementById('wday-count-badge');
  if(badge) badge.textContent=n;
}
// Refreshes the "Working Days" badge on the dashboard header for whichever
// period is currently active. Kept separate from renderForecast() because
// that function only recomputes when the REAL current month has survey
// data (it's an end-of-month projection, not tied to the browsed period) —
// so the badge used to go stale when paging to a different month via the
// Prev/Next buttons or the ← → keys.
function refreshWdayBadge(){
  const badge=document.getElementById('wday-count-badge');
  if(badge) badge.textContent=loadWorkingDays().length;
}
function openWdayCal(){
  const popup=document.getElementById('wday-cal-popup');
  const overlay=document.getElementById('wday-cal-overlay');
  const btn=document.getElementById('wday-open-btn');
  // Position popup near the button
  const rect=btn.getBoundingClientRect();
  const popupW=268;
  let left=rect.right-popupW;
  if(left<8) left=8;
  let top=rect.bottom+6;
  if(top+320>window.innerHeight) top=rect.top-330;
  popup.style.left=left+'px';
  popup.style.top=top+'px';
  wdaySelected=loadWorkingDays();
  buildWdayCal();
  overlay.style.display='block';
  popup.style.display='block';
}
function closeWdayCal(){
  document.getElementById('wday-cal-overlay').style.display='none';
  document.getElementById('wday-cal-popup').style.display='none';
  wdayEndDrag();
  renderForecast(currentSurveysCache||[]);
  renderDashboard(); // refresh CSAT/AR/AHT thresholds together so wd counts stay in sync
}

// ── MEMBER WORKING DAYS CALENDAR ─────────────────────────────────
// Same UI/UX as the team-wide Working Days calendar above, but each member
// gets their own independent calendar (stored per agent+period) since one
// member's schedule/PTO doesn't necessarily match anyone else's. Drives the
// "days left" badge + pacing hints inside that member's own dashboard only —
// never reads or writes wdaySelected / the team calendar / the Forecast strip.
let memberWdaySelected=[];
let memberWdayAgent=null;

function memberWdayStorageKey(agent){
  const [y,m]=activePeriodKey.split('-');
  return 'wdays-member-'+encodeURIComponent(agent)+'-'+y+'-'+m;
}
function loadMemberWorkingDays(agent){
  try{const v=localStorage.getItem(memberWdayStorageKey(agent));return v?JSON.parse(v):[];}catch(e){return [];}
}
function saveMemberWorkingDays(agent,arr){
  try{localStorage.setItem(memberWdayStorageKey(agent),JSON.stringify(arr));}catch(e){}
}
function refreshMemberWdayBadge(agent){
  const badge=document.getElementById('member-wday-count-badge');
  if(badge)badge.textContent=loadMemberWorkingDays(agent).length;
}
function buildMemberWdayCal(){
  const agent=memberWdayAgent;
  const [y,m]=activePeriodKey.split('-').map(Number);
  const now=new Date();
  const today=now.getDate();
  const isCurrentMonth=now.getFullYear()===y&&(now.getMonth()+1)===m;
  const daysInMonth=new Date(y,m,0).getDate();
  const firstDow=new Date(y,m-1,1).getDay();
  document.getElementById('member-wday-cal-title').textContent=prettifyAgentName(agent)+' — '+MONTHS[m-1]+' '+y;
  const grid=document.getElementById('member-wday-cal-grid');
  const DOWS=['Su','Mo','Tu','We','Th','Fr','Sa'];
  let html='';
  DOWS.forEach((d,i)=>{html+=`<div class="wday-cal-dow${i===0||i===6?' weekend':''}">${d}</div>`;});
  for(let i=0;i<firstDow;i++)html+='<div class="wday-cal-day empty"></div>';
  for(let d=1;d<=daysInMonth;d++){
    const dow=new Date(y,m-1,d).getDay();
    const isWeekend=dow===0||dow===6;
    const isToday=isCurrentMonth&&d===today;
    const isFuture=isCurrentMonth&&d>today;
    const isSel=memberWdaySelected.includes(d);
    let cls='wday-cal-day';
    if(isToday)cls+=' today';
    if(isFuture)cls+=' future-day';
    if(isSel)cls+=' selected';
    if(isWeekend)cls+=' weekend-day';
    html+=`<div class="${cls}" data-day="${d}" data-ph-click="memberWdayToggleDay(${d})">${d}</div>`;
  }
  grid.innerHTML=html;
  updateMemberWdaySummary();
}
function memberWdayToggleDay(d){
  const idx=memberWdaySelected.indexOf(d);
  if(idx===-1)memberWdaySelected.push(d);else memberWdaySelected.splice(idx,1);
  saveMemberWorkingDays(memberWdayAgent,memberWdaySelected);
  const cell=document.querySelector('#member-wday-cal-grid [data-day="'+d+'"]');
  if(cell){if(memberWdaySelected.includes(d))cell.classList.add('selected');else cell.classList.remove('selected');}
  updateMemberWdaySummary();
  refreshMemberWdayBadge(memberWdayAgent);
}
function memberWdaySelectWeekdays(){
  const [y,m]=activePeriodKey.split('-').map(Number);
  const daysInMonth=new Date(y,m,0).getDate();
  memberWdaySelected=[];
  for(let d=1;d<=daysInMonth;d++){
    const dow=new Date(y,m-1,d).getDay();
    if(dow!==0&&dow!==6)memberWdaySelected.push(d);
  }
  saveMemberWorkingDays(memberWdayAgent,memberWdaySelected);
  buildMemberWdayCal();
  refreshMemberWdayBadge(memberWdayAgent);
}
function memberWdayClearAll(){
  memberWdaySelected=[];
  saveMemberWorkingDays(memberWdayAgent,memberWdaySelected);
  buildMemberWdayCal();
  refreshMemberWdayBadge(memberWdayAgent);
}
function updateMemberWdaySummary(){
  const n=memberWdaySelected.length;
  const el=document.getElementById('member-wday-cal-summary');
  if(el)el.innerHTML=`<strong>${n}</strong> day${n!==1?'s':''} selected`;
  const badge=document.getElementById('member-wday-count-badge');
  if(badge)badge.textContent=n;
}
function openMemberWdayCal(agent){
  if(!agent)return;
  memberWdayAgent=agent;
  const popup=document.getElementById('member-wday-cal-popup');
  const overlay=document.getElementById('member-wday-cal-overlay');
  const btn=document.getElementById('member-wday-open-btn');
  const rect=btn.getBoundingClientRect();
  const popupW=268;
  let left=rect.right-popupW;
  if(left<8)left=8;
  let top=rect.bottom+6;
  if(top+320>window.innerHeight)top=rect.top-330;
  popup.style.left=left+'px';
  popup.style.top=top+'px';
  memberWdaySelected=loadMemberWorkingDays(agent);
  buildMemberWdayCal();
  overlay.style.display='block';
  popup.style.display='block';
}
function closeMemberWdayCal(){
  document.getElementById('member-wday-cal-overlay').style.display='none';
  document.getElementById('member-wday-cal-popup').style.display='none';
  // Refresh the member dashboard behind the popup so the days-left badge and
  // pacing hints reflect whatever was just selected.
  if(memberWdayAgent&&document.getElementById('member-dashboard-modal').classList.contains('open')){
    openMemberDashboard(memberWdayAgent);
  }
  // Team tiles use each member's own working days — refresh them too.
  if(document.getElementById('page-team')&&document.getElementById('page-team').style.display!=='none'&&typeof renderTeamView==='function')renderTeamView();
}

// Remaining days (this member's own working-day calendar if set, else
// calendar days) left in the active period for THIS member — mirrors
// getRemainingDaysForActivePeriod() but reads the member's own calendar
// instead of the shared team one. Only meaningful when the active period is
// the real current month.
function getMemberRemainingDays(agent){
  const [y,m]=activePeriodKey.split('-').map(Number);
  const now=new Date();
  const isCurrentMonth=now.getFullYear()===y&&(now.getMonth()+1)===m;
  if(!isCurrentMonth)return{remainingDays:0,isCurrentMonth:false,usingWorkingDays:false,totalWorkingDays:0,daysElapsed:0};
  const dayOfMonth=now.getDate();
  const wd=loadMemberWorkingDays(agent);
  if(wd.length>0){
    return{remainingDays:wd.filter(d=>d>dayOfMonth).length,isCurrentMonth:true,usingWorkingDays:true,totalWorkingDays:wd.length,daysElapsed:wd.filter(d=>d<=dayOfMonth).length};
  }
  const daysInMonth=new Date(y,m,0).getDate();
  return{remainingDays:Math.max(0,daysInMonth-dayOfMonth),isCurrentMonth:true,usingWorkingDays:false,totalWorkingDays:daysInMonth,daysElapsed:dayOfMonth};
}
// Wraps getMemberRemainingDays() with a "today" fallback, same idea as
// getProjectionWindow().
function getMemberProjectionWindow(agent){
  const rd=getMemberRemainingDays(agent);
  if(rd.remainingDays===0&&rd.isCurrentMonth){
    return{...rd,remainingDays:1,todayOnly:true};
  }
  return{...rd,todayOnly:false};
}
// Same math as avgCSATNeededPerDay/avgARNeededPerDay, just paced off this
// member's own elapsed working days instead of the whole team's.
function memberAvgCSATNeededPerDay(targetMin,csatSurveys,remainingDays,daysElapsed){
  if(!remainingDays||remainingDays<=0||!csatSurveys.length)return null;
  const cb=csatBreakdown(csatSurveys);
  const currentCount=csatSurveys.length;
  const dailyRate=daysElapsed>0?currentCount/daysElapsed:currentCount;
  const projectedNewCount=Math.round(dailyRate*remainingDays);
  if(projectedNewCount<=0)return null;
  const newRatings=projectedNewCount*cb.ratingsPerSurvey;
  const needed=(targetMin*(cb.n+newRatings)-cb.sum)/newRatings;
  return{avgNeeded:needed,perDay:dailyRate};
}
function memberAvgARNeededPerDay(targetMin,surveys,remainingDays,daysElapsed){
  if(!remainingDays||remainingDays<=0)return null;
  const arResponded=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  if(!arResponded.length)return null;
  const currentYes=surveys.filter(sv=>sv.ar==='yes').length;
  const currentTotal=arResponded.length;
  const dailyRate=daysElapsed>0?currentTotal/daysElapsed:currentTotal;
  const projectedNewTotal=Math.round(dailyRate*remainingDays);
  if(projectedNewTotal<=0)return null;
  const needed=(targetMin/100*(currentTotal+projectedNewTotal)-currentYes)/projectedNewTotal;
  return{pctNeeded:needed*100,perDay:dailyRate};
}
// Same idea as neededDailyAHTForThreshold(), but projects off this member's
// own dailyAHTByMember entries (via getMemberAHTEntries) instead of the team
// trend / personal daily log, and is paced by the member's own remaining
// working days (passed in) rather than the shared team calendar.
function memberNeededDailyAHTForThreshold(targetMaxSec,remainingDays,agent){
  if(!remainingDays||remainingDays<=0)return null;
  const p=getPeriod(activePeriodKey);
  const w=getMemberProjectionWindow(agent);
  const b=_ahtProjBase(p,agent,remainingDays,w.daysElapsed,w.todayOnly);
  if(!b||!(b.P>0))return null;
  return(targetMaxSec*(b.W+b.P)-b.S)/b.P;
}

// Cache surveys for use by working days recalc
let currentSurveysCache=[];

// Forecast window: number of recent active days to base forecast on (3, 5, or 7)
// Default here; real persisted value is loaded in _doInit() after storage-shim hydration
// (see app-04-interactions-init.js) so this survives the async chrome.storage.local hydration.
let fcWindow=7;

// ── 2. KPI FORECAST ───────────────────────────────────────────
function setFcWindow(n){
  fcWindow=n;
  try{localStorage.setItem('kpi_fcwindow',String(n));}catch(e){}
  [3,5,7].forEach(v=>{
    const btn=document.getElementById('fcw-'+v);
    if(btn) btn.classList.toggle('active',v===n);
  });
  renderForecast(currentSurveysCache||[]);
}

function renderForecast(surveys){
  currentSurveysCache=surveys;
  const strip=document.getElementById('forecast-strip');
  if(!strip)return;
  if(typeof _showForecastStrip!=='undefined'&&!_showForecastStrip){
    strip.style.display='none';
    return;
  }
  const now=new Date();
  const curKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const [y,m]=[now.getFullYear(),now.getMonth()+1];
  const curSurveys=(state[curKey]&&state[curKey].surveys)||[];
  strip.style.display='flex';
  if(!curSurveys.length){
    ['fc-csat','fc-ar','fc-surveys','fc-aht','fc-kpi','fc-days'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='\u2014';});
    return;
  }
  surveys=curSurveys;

  // ── Working days state ────────────────────────────────────────
  wdaySelected=loadWorkingDays();
  const badge=document.getElementById('wday-count-badge');
  if(badge) badge.textContent=wdaySelected.length;

  const daysInMonth=new Date(y,m,0).getDate();
  const dayOfMonth=now.getDate();

  // Remaining days for survey projection
  let remainingDays, daysLabel, daysDisplay, daysTitle;
  if(wdaySelected.length>0){
    const wdaysLeft=wdaySelected.filter(d=>d>dayOfMonth).length;
    const todayIsWorkday=wdaySelected.includes(dayOfMonth);
    remainingDays=wdaysLeft;
    daysLabel='Working Days Left';
    daysDisplay=wdaysLeft+'wd';
    daysTitle=wdaysLeft+' working days remaining of '+wdaySelected.length+' total'+(todayIsWorkday?' (today is a working day)':'');
  } else {
    remainingDays=daysInMonth-dayOfMonth;
    daysLabel='Calendar Days Left';
    daysDisplay=remainingDays+'d';
    daysTitle='Calendar days left. Select working days for a more accurate survey projection.';
  }
  const daysLabelEl=document.getElementById('fc-days-label');
  if(daysLabelEl) daysLabelEl.textContent=daysLabel;
  const fcDays=document.getElementById('fc-days');
  fcDays.textContent=daysDisplay;
  fcDays.title=daysTitle;

  // ── Helper: trend arrow html ──────────────────────────────────
  function trendHtml(recent, overall){
    if(recent===null||overall===null) return '';
    const diff=recent-overall;
    const thr=overall*0.005;
    if(Math.abs(diff)<=thr) return ' <span style="color:var(--text-muted);font-size:11px" title="Stable vs full-period avg">→</span>';
    if(diff>0) return ' <span style="color:var(--green);font-size:11px" title="Trending up vs full-period avg">↑</span>';
    return ' <span style="color:var(--red);font-size:11px" title="Trending down vs full-period avg">↓</span>';
  }
  function trendHtmlAHT(recent, overall){
    if(recent===null||overall===null) return '';
    const diff=recent-overall;
    const thr=overall*0.005;
    if(Math.abs(diff)<=thr) return ' <span style="color:var(--text-muted);font-size:11px" title="Stable vs full-period avg">→</span>';
    if(diff<0) return ' <span style="color:var(--green);font-size:11px" title="Improving (lower) vs full-period avg">↑</span>';
    return ' <span style="color:var(--red);font-size:11px" title="Getting slower vs full-period avg">↓</span>';
  }

  // ── Build daily buckets and identify recent days ──────────────
  const dailyBuckets=getDailyStats(surveys);
  const allDayKeys=Object.keys(dailyBuckets).sort();
  const activeDays=allDayKeys.length;
  // Use configurable window (last N active survey days)
  const recentKeys=allDayKeys.slice(-fcWindow);

  // ── CSAT: blend already-recorded surveys with the projected rest ──
  // of the month at the recent rate, so an already-imperfect score
  // earlier in the period can never be erased by a hot 3/5/7-day streak.
  const csatS=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  let projCSATavg=null;
  if(csatS.length){
    const overallCSATavg=calcCSAT(csatS);
    const existingCSATsum=overallCSATavg*csatS.length; // pooled avg, weighted per survey for the projection blend
    const recentCSATsurveys=surveys.filter(s=>{
      const dk=parseDateKey(s.date);
      return dk&&recentKeys.includes(dk)&&s.csat!==null&&!isNaN(s.csat);
    });
    const recentCSATavg=recentCSATsurveys.length
      ? calcCSAT(recentCSATsurveys)
      : null;
    const assumedCSATrate=recentCSATavg!==null?recentCSATavg:overallCSATavg;
    const csatDailyRate=csatS.length/activeDays;
    const projAdditionalCSAT=csatDailyRate*remainingDays;
    projCSATavg=(existingCSATsum+assumedCSATrate*projAdditionalCSAT)/(csatS.length+projAdditionalCSAT);
    const g=gradeCSAT(projCSATavg);
    document.getElementById('fc-csat').innerHTML=
      '<span class="'+g.gcls+'">'+fmtCsat(projCSATavg)+'</span>'+trendHtml(recentCSATavg,overallCSATavg);
  } else {
    document.getElementById('fc-csat').textContent='—';
  }

  // ── AR: blend already-recorded surveys with the projected rest ────
  // of the month at the recent rate (same reasoning as CSAT above).
  const arAll=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arYes=surveys.filter(sv=>sv.ar==='yes').length;
  let projARpct=null;
  if(arAll.length){
    const overallARpct=arYes/arAll.length*100;
    const recentArAll=surveys.filter(sv=>{
      const dk=parseDateKey(sv.date);
      return dk&&recentKeys.includes(dk)&&(sv.ar==='yes'||sv.ar==='no');
    });
    const recentArYes=recentArAll.filter(sv=>sv.ar==='yes').length;
    const recentARpct=recentArAll.length?recentArYes/recentArAll.length*100:null;
    const assumedARpct=recentARpct!==null?recentARpct:overallARpct;
    const arDailyRate=arAll.length/activeDays;
    const projAdditionalAR=arDailyRate*remainingDays;
    projARpct=(arYes+(assumedARpct/100)*projAdditionalAR)/(arAll.length+projAdditionalAR)*100;
    const g=gradeAR(projARpct);
    document.getElementById('fc-ar').innerHTML=
      '<span class="'+g.gcls+'">'+projARpct.toFixed(2)+'%</span>'+trendHtml(recentARpct,overallARpct);
  } else {
    document.getElementById('fc-ar').textContent='—';
  }

  // ── Survey count: genuine projection (cumulative count) ───────
  if(activeDays>0){
    const overallDailyRate=surveys.length/activeDays;
    // Use the recent fcWindow days to compute a windowed daily rate (same
    // window that drives CSAT/AR so all forecast values stay consistent).
    const recentSurveyCount=recentKeys.reduce((sum,dk)=>sum+(dailyBuckets[dk]?dailyBuckets[dk].surveys.length:0),0);
    const recentDayCount=recentKeys.length||activeDays;
    const recentDailyRate=recentDayCount>0?recentSurveyCount/recentDayCount:overallDailyRate;
    const projTotal=Math.round(surveys.length+recentDailyRate*remainingDays);
    document.getElementById('fc-surveys').textContent='~'+projTotal;
    const rateStr=recentDailyRate.toFixed(1)+'/day';
    const remStr=wdaySelected.length>0 ? remainingDays+'wd left' : remainingDays+'d left';
    document.getElementById('fc-note').textContent=rateStr+' avg (last '+recentDayCount+'d) · '+activeDays+' active days · '+remStr;
  } else {
    document.getElementById('fc-surveys').textContent='—';
    document.getElementById('fc-note').textContent='';
  }

  // ── AHT: based on recent window average (now a real projection) ─
  const fcAht=document.getElementById('fc-aht');
  let projAHTsec=0;
  if(fcAht){
    const overallAHTsec=computeAHTSec();
    const p=getPeriod(activePeriodKey);
    const daily=getTileDailyAHTMap(p);
    // Recent window AHT entries
    const recentAHTentries=recentKeys
      .map(dk=>daily[dk]?normAHTEntry(daily[dk]):null)
      .filter(e=>e&&e.aht>0);
    let recentAHTavg=null;
    if(recentAHTentries.length){
      const hasW=recentAHTentries.some(e=>e.count>0);
      if(hasW){
        const tot=recentAHTentries.reduce((a,e)=>a+(e.count||1),0);
        recentAHTavg=recentAHTentries.reduce((a,e)=>a+e.aht*(e.count||1),0)/tot;
      } else {
        recentAHTavg=recentAHTentries.reduce((a,e)=>a+e.aht,0)/recentAHTentries.length;
      }
    }
    projAHTsec=recentAHTavg!==null?Math.round(recentAHTavg):overallAHTsec;
    if(projAHTsec>0){
      const g=gradeAHT(projAHTsec);
      fcAht.innerHTML='<span class="'+g.gcls+'">'+fmtSec(projAHTsec)+'</span>'+trendHtmlAHT(recentAHTavg,overallAHTsec);
      // Update label to reflect it's now a projection
      const ahtLabelEl=document.querySelector('#forecast-strip .forecast-label[data-fc-aht-label]');
      if(ahtLabelEl) ahtLabelEl.textContent='EOM AHT';
    } else {
      fcAht.textContent='—';
    }
  }

  // ── Projected KPI Score ───────────────────────────────────────
  const fcKpi=document.getElementById('fc-kpi');
  if(fcKpi){
    const hasData=projCSATavg!==null||projARpct!==null||projAHTsec>0;
    if(hasData){
      const wc=weightCSAT(projCSATavg);
      const wa=weightAR(projARpct);
      const wh=weightAHT(projAHTsec);
      const projKPI=wc+wa+wh+customMetricsPoints(activePeriodKey);
      const g=kpiScoreGrade(projKPI);
      fcKpi.innerHTML='<span class="'+g.gcls+'">'+projKPI.toFixed(2)+'%</span>';
    } else {
      fcKpi.textContent='—';
    }
  }
}

// ── EOM Projection lines on KPI cards ────────────────────────
function renderEOMProjections(surveys){
  const [y,m]=activePeriodKey.split('-').map(Number);
  const now=new Date();
  const isCurrentMonth=now.getFullYear()===y&&(now.getMonth()+1)===m;

  function hideAll(){
    ['csat','ar','kpi'].forEach(id=>{
      const el=document.getElementById(id+'-eom-proj');
      if(el)el.style.display='none';
    });
  }

  if(!isCurrentMonth||!surveys.length){hideAll();return;}

  const daysInMonth=new Date(y,m,0).getDate();
  const dayOfMonth=now.getDate();
  if(dayOfMonth>=daysInMonth){hideAll();return;} // last day, projection meaningless

  const daysLeft=daysInMonth-dayOfMonth;
  const eomLabel='by '+MONTHS[m-1].slice(0,3)+' '+daysInMonth;

  // CSAT: current rolling avg is stable projection (score-based avg doesn't accumulate differently)
  const csatS=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  const csatEl=document.getElementById('csat-eom-proj');
  const csatTxt=document.getElementById('csat-eom-proj-text');
  if(csatEl&&csatTxt&&csatS.length>=3){
    // Compute last-7-days trend to nudge projection
    const recentDates=Object.keys(getDailyStats(csatS)).sort().slice(-7);
    const recentSurveys=csatS.filter(s=>{const dk=parseDateKey(s.date);return dk&&recentDates.includes(dk);});
    const recentAvg=recentSurveys.length?calcCSAT(recentSurveys):null;
    const overallAvg=calcCSAT(csatS);
    // Weighted blend: 70% overall (stable), 30% recent trend
    const projCSAT=recentAvg!==null?(overallAvg*0.7+recentAvg*0.3):overallAvg;
    const g=gradeCSAT(projCSAT);
    const cls=g.grade==='Exceptional'?'proj-on-track':g.grade==='Good'?'proj-on-track':g.grade==='Average'?'proj-warn':'proj-behind';
    csatEl.className='eom-proj '+cls;
    csatTxt.innerHTML=`On track for <span class="eom-proj-val">${fmtCsat(projCSAT)}</span> ${eomLabel}`;
    csatEl.style.display='flex';
  } else if(csatEl){csatEl.style.display='none';}

  // AR: current rate is stable projection
  const arR=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
  const arY=surveys.filter(sv=>sv.ar==='yes').length;
  const arEl=document.getElementById('ar-eom-proj');
  const arTxt=document.getElementById('ar-eom-proj-text');
  if(arEl&&arTxt&&arR.length>=3){
    const arPct=arY/arR.length*100;
    const g=gradeAR(arPct);
    const cls=g.grade==='Exceptional'?'proj-on-track':g.grade==='Good'?'proj-on-track':g.grade==='Average'?'proj-warn':'proj-behind';
    arEl.className='eom-proj '+cls;
    arTxt.innerHTML=`On track for <span class="eom-proj-val">${arPct.toFixed(2)}%</span> ${eomLabel}`;
    arEl.style.display='flex';
  } else if(arEl){arEl.style.display='none';}

  // KPI final score projection
  const kpiEl=document.getElementById('kpi-eom-proj');
  const kpiTxt=document.getElementById('kpi-eom-proj-text');
  if(kpiEl&&kpiTxt&&csatS.length>=3&&arR.length>=3){
    const projCSAT2=calcCSAT(csatS);
    const projAR=arY/arR.length*100;
    const ahtSec=computeAHTSec();
    const projKPI=weightCSAT(projCSAT2)+weightAR(projAR)+weightAHT(ahtSec)+customMetricsPoints(activePeriodKey);
    const g=kpiScoreGrade(projKPI);
    const cls=g.label==='Exceptional'?'proj-on-track':g.label==='Good'?'proj-on-track':g.label==='Average'?'proj-warn':'proj-behind';
    kpiEl.className='eom-proj '+cls;
    kpiTxt.innerHTML=`On track for <span class="eom-proj-val">${projKPI.toFixed(2)}%</span> ${eomLabel}`;
    kpiEl.style.display='flex';
  } else if(kpiEl){kpiEl.style.display='none';}
}

// ── 3. KPI SPARKLINE ACROSS PERIODS ───────────────────────────
function renderKPISparkline(){
  const activeYear=activePeriodKey?activePeriodKey.split('-')[0]:'';
  const monthKeys=Object.keys(state)
    .filter(k=>{
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(k))return false; // skip malformed period keys
      if(activeYear&&!k.startsWith(activeYear+'-'))return false;
      const p=state[k];
      if(!p)return false;
      const hasSurveys=(p.surveys||[]).length>0;
      const hasAHT=p.monthlyAHT>0||Object.values(p.dailyAHT||{}).some(v=>normAHTEntry(v).aht>0)||p.aht>0;
      return hasSurveys||hasAHT;
    })
    .sort();
  if(monthKeys.length<2){drawNoDataSparkline('spark-kpi');return;}
  const kpiPairs=monthKeys.map(k=>{
    const p=state[k];
    const surveys=p.surveys||[];
    const csatS=surveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
    const avgCSAT=csatS.length?calcCSAT(csatS):null;
    const arR=surveys.filter(sv=>sv.ar==='yes'||sv.ar==='no');
    const arY=surveys.filter(sv=>sv.ar==='yes').length;
    const arPct=arR.length?arY/arR.length*100:null;
    const ahtSec=(()=>{
      if(p.monthlyAHT&&p.monthlyAHT>0)return p.monthlyAHT;
      const entries=Object.values(p.dailyAHT||{}).map(normAHTEntry).filter(e=>e.aht>0);
      if(entries.length){
        const hasW=entries.some(e=>e.count>0);
        if(hasW){const tw=entries.reduce((a,e)=>a+(e.count||1),0);return Math.round(entries.reduce((a,e)=>a+e.aht*(e.count||1),0)/tw);}
        return Math.round(entries.reduce((a,e)=>a+e.aht,0)/entries.length);
      }
      return p.aht>0?p.aht:0;
    })();
    const wc=weightCSAT(avgCSAT),wa=weightAR(arPct),wh=weightAHT(ahtSec);
    const v=(avgCSAT!==null||arPct!==null||ahtSec>0)?wc+wa+wh+customMetricsPoints(k):null;
    return v!==null?{k,v}:null;
  }).filter(Boolean);
  if(kpiPairs.length>=2)drawSparkline('spark-kpi',kpiPairs.map(p=>p.v),'#a855f7',{labels:kpiPairs.map(p=>fmtSparkMonth(p.k)),formatValue:v=>v.toFixed(2)+'%',title:'Final KPI Score'});else drawNoDataSparkline('spark-kpi');
}

