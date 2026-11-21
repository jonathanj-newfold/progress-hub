// ── Guided tour for new users (v3.15.99.0) ───────────────────────────────────
// • First visit on a device with NO data yet  → welcome card: "Start the tour" or "Explore on my own".
// • Anyone can replay it later from the sidebar ("Take a tour") or Settings → About.
// • Whether the tour was already offered is remembered per device (kpi_tour_done, a device-only key),
//   so it never nags. People who already have data are marked as done silently and never see the welcome.
const PH_TOUR_KEY='kpi_tour_done';
let _tourIdx=-1,_tourEls=null,_tourSteps=null,_tourRaf=0;

function tourDone(){try{return localStorage.getItem(PH_TOUR_KEY)==='1';}catch(e){return false;}}
function tourMarkDone(){try{localStorage.setItem(PH_TOUR_KEY,'1');}catch(e){}}

// True when any month already holds surveys or AHT / chat-count numbers.
function tourHasAnyData(){
  try{
    return Object.keys(state||{}).some(k=>{
      if(!/^\d{4}-\d{2}$/.test(k))return false;
      const p=state[k];if(!p)return false;
      return (p.surveys&&p.surveys.length>0)||(+p.aht>0)||(+p.monthlyAHT>0)
        ||Object.keys(p.dailyAHT||{}).length>0||Object.keys(p.dailyAHTByMember||{}).length>0
        ||Object.keys(p.monthlyAHTByMember||{}).length>0;
    });
  }catch(e){return false;}
}

function _tq(sel){return function(){return document.querySelector(sel);};}
function _tPanelByTitle(txt){
  return function(){
    const t=[...document.querySelectorAll('#page-survey .panel-title')].find(el=>el.textContent.indexOf(txt)>-1);
    return t?t.closest('.panel'):null;
  };
}

function tourBuildSteps(){
  return [
    {page:'dashboard',target:_tq('.sidebar-nav'),place:'right',
     title:'Welcome to Progress Hub 👋',
     body:'This menu takes you everywhere. <b>Dashboard</b> shows your numbers, <b>Data</b> is where you add them, and the rest are extras you can explore later.'},
    {page:'survey',target:_tq('#page-survey .import-panel'),
     title:'Step 1 · Add your surveys',
     body:'Paste your survey rows here, then press <b>Import rows</b>. The month is detected from the dates automatically.'},
    {page:'survey',target:_tq('#page-survey .btn-row-fixed'),
     title:'Prefer typing it in?',
     body:'Use <b>Add survey</b> for a single survey or <b>Add in bulk</b> for many. They count exactly like pasted ones.'},
    {page:'survey',target:_tPanelByTitle('Import AHT'),
     title:'Step 2 · Add AHT and chats (paste)',
     body:'Paste your daily stats report here and press <b>Confirm import</b>. Dates, chat counts and AHT are picked up automatically.'},
    {page:'survey',target:_tq('#aht-mode-toggle'),
     title:'Or type AHT in by hand, per day',
     body:'In the <b>AHT &amp; Chat Count</b> panel, keep <b>Daily</b> selected, pick a date and enter the chats and AHT for that day.'},
    {page:'survey',target:_tq('#aht-mode-monthly-btn'),
     title:'Or enter one monthly total',
     body:'Switch to <b>Monthly</b> to enter a single AHT and chat count for the whole month.<br><br><b>Important:</b> a monthly total <b>overrides</b> every daily entry. If your daily numbers seem ignored, <b>remove the monthly value</b> and the daily ones will count again.'},
    {page:'dashboard',target:_tq('#page-dashboard .period-badge-btn'),
     title:'Pick the month',
     body:'Use the arrows or click the month to switch periods. Everything on the Dashboard follows the period you pick.'},
    {page:'dashboard',target:_tq('#wday-open-btn'),
     title:'Set your working days',
     body:'Click <b>Working Days</b> and mark the days you work this month. Keep it updated: the closer it matches your real schedule, the more accurate the <b>AHT needed per day</b> until the end of the month.'},
    {page:'dashboard',target:_tq('#page-dashboard .csat-card'),
     title:'CSAT',
     body:'The average of your survey ratings. The list shows each grade and the score you need to reach it. Click the card for details.'},
    {page:'dashboard',target:_tq('#page-dashboard .ar-card'),
     title:'AR (Agent Resolution)',
     body:'How often customers answered <b>Yes</b> when asked if their issue was resolved. Same idea: grades on the card, details on click.'},
    {page:'dashboard',target:_tq('#page-dashboard .aht-card'),
     title:'AHT',
     body:'Your average handling time. Lower is better, and the card shows how much you need to improve to reach the next grade.'},
    {page:'dashboard',target:_tq('#kpi-score-card'),
     title:'Final KPI score',
     body:'CSAT, AR and AHT combined into one score using your weights. You can change grades and weights in <b>Settings → Scoring</b>.'},
    {page:'dashboard',target:_tq('#nav-simulator'),place:'right',
     title:'What-if simulator',
     body:'Try a CSAT, AR or AHT before it happens and see how your score would change.'},
    {page:'dashboard',target:_tq('#nav-settings'),place:'right',
     title:'Settings',
     body:'Themes, thresholds, password lock and backups live here. Export a backup once in a while to keep your data safe.'},
    {page:'dashboard',target:null,
     title:'You are all set 🎉',
     body:'Start by importing a few surveys on the <b>Data</b> page.<br><br>Want to see this again? Use <b>Take a tour</b> in the sidebar or <b>Settings → About</b>. <b>Team View</b> unlocks once surveys for 2 or more agents are in.'}
  ];
}

// ── Welcome card ─────────────────────────────────────────────────────────────
function tourOpenWelcome(){
  if(document.getElementById('ph-tour-welcome'))return;
  const ov=document.createElement('div');
  ov.id='ph-tour-welcome';ov.className='ph-tour-welcome';
  ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','ph-tour-wtitle');
  ov.innerHTML=
    '<div class="ph-tour-wcard">'+
      '<div class="ph-tour-wemoji">👋</div>'+
      '<h2 id="ph-tour-wtitle">Welcome to Progress Hub</h2>'+
      '<p>Track your CSAT, AR and AHT in one place. Want a quick tour (about a minute), or would you rather look around yourself?</p>'+
      '<button type="button" class="btn btn-primary ph-tour-wbtn" id="ph-tour-w-start">Start the tour</button>'+
      '<button type="button" class="btn btn-ghost ph-tour-wbtn" id="ph-tour-w-skip">Explore on my own</button>'+
      '<div class="ph-tour-wnote">You can start the tour anytime from <b>Take a tour</b> in the sidebar or <b>Settings → About</b>.</div>'+
    '</div>';
  document.body.appendChild(ov);
  const close=function(){document.removeEventListener('keydown',onKey,true);ov.remove();};
  const onKey=function(e){
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();tourMarkDone();close();}
  };
  document.addEventListener('keydown',onKey,true);
  document.getElementById('ph-tour-w-start').addEventListener('click',function(){close();tourStart();});
  document.getElementById('ph-tour-w-skip').addEventListener('click',function(){tourMarkDone();close();});
  setTimeout(function(){const b=document.getElementById('ph-tour-w-start');if(b)b.focus();},50);
}

// ── Tour engine ──────────────────────────────────────────────────────────────
function tourStart(){
  if(_tourEls)return;
  // Close anything that could sit on top of the page we are about to highlight.
  document.querySelectorAll('.modal-overlay.open').forEach(function(m){m.classList.remove('open');});
  _tourSteps=tourBuildSteps();
  const catcher=document.createElement('div');catcher.className='ph-tour-catch';
  const spot=document.createElement('div');spot.className='ph-tour-spot';spot.style.display='none';
  const card=document.createElement('div');card.className='ph-tour-card';
  card.setAttribute('role','dialog');card.setAttribute('aria-live','polite');
  card.innerHTML=
    '<div class="ph-tour-count"></div>'+
    '<div class="ph-tour-title"></div>'+
    '<div class="ph-tour-body"></div>'+
    '<div class="ph-tour-dots"></div>'+
    '<div class="ph-tour-actions">'+
      '<button type="button" class="ph-tour-skip">Skip tour</button>'+
      '<span class="ph-tour-spacer"></span>'+
      '<button type="button" class="btn btn-ghost ph-tour-back">Back</button>'+
      '<button type="button" class="btn btn-primary ph-tour-next">Next</button>'+
    '</div>';
  document.body.appendChild(catcher);document.body.appendChild(spot);document.body.appendChild(card);
  _tourEls={catcher:catcher,spot:spot,card:card,
    count:card.querySelector('.ph-tour-count'),title:card.querySelector('.ph-tour-title'),
    body:card.querySelector('.ph-tour-body'),dots:card.querySelector('.ph-tour-dots'),
    skip:card.querySelector('.ph-tour-skip'),back:card.querySelector('.ph-tour-back'),next:card.querySelector('.ph-tour-next')};
  _tourEls.skip.addEventListener('click',function(){tourEnd();});
  _tourEls.back.addEventListener('click',function(){tourGo(_tourIdx-1);});
  _tourEls.next.addEventListener('click',function(){
    if(_tourIdx>=_tourSteps.length-1)tourEnd();else tourGo(_tourIdx+1);
  });
  document.addEventListener('keydown',_tourKey,true);
  window.addEventListener('resize',_tourReflow);
  window.addEventListener('scroll',_tourReflow,true);
  tourGo(0);
}

function _tourKey(e){
  if(!_tourEls)return;
  if(e.ctrlKey||e.metaKey||e.altKey||e.key==='Tab')return;
  // Keep the app's own single-key shortcuts (1-6 for pages, etc.) from firing mid-tour.
  e.stopImmediatePropagation();
  if(e.key==='Escape'){e.preventDefault();tourEnd();}
  else if(e.key==='ArrowRight'||e.key==='Enter'){e.preventDefault();_tourEls.next.click();}
  else if(e.key==='ArrowLeft'){e.preventDefault();if(_tourIdx>0)tourGo(_tourIdx-1);}
}

function tourGo(i){
  if(!_tourEls||i<0||i>=_tourSteps.length)return;
  _tourIdx=i;
  const st=_tourSteps[i],e=_tourEls;
  try{if(st.page)showPage(st.page);}catch(err){}
  e.count.textContent='Step '+(i+1)+' of '+_tourSteps.length;
  e.title.innerHTML=st.title;
  e.body.innerHTML=st.body;
  e.dots.innerHTML=_tourSteps.map(function(_,k){return '<span class="'+(k===i?'on':(k<i?'done':''))+'"></span>';}).join('');
  e.back.style.visibility=i===0?'hidden':'visible';
  const last=i===_tourSteps.length-1;
  e.next.textContent=last?'Finish':'Next';
  e.skip.style.display=last?'none':'';
  // Let the new page render, then bring the target into view and measure it.
  cancelAnimationFrame(_tourRaf);
  _tourRaf=requestAnimationFrame(function(){
    const el=st.target?st.target():null;
    if(el&&el.getBoundingClientRect().width>0){
      try{el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});}catch(err){el.scrollIntoView();}
    }
    _tourRaf=requestAnimationFrame(_tourReflow);
  });
  e.next.focus({preventScroll:true});
}

function _tourReflow(){
  if(!_tourEls||_tourIdx<0)return;
  const st=_tourSteps[_tourIdx],e=_tourEls;
  const el=st.target?st.target():null;
  const r=el?el.getBoundingClientRect():null;
  const vw=window.innerWidth,vh=window.innerHeight,gap=14,pad=6;
  const card=e.card;
  card.style.maxWidth=Math.min(360,vw-24)+'px';
  if(!r||r.width<2||r.height<2){
    // No target (or hidden, e.g. sidebar on a small screen): centred card, no spotlight.
    e.spot.style.display='none';
    card.style.left=Math.max(12,(vw-card.offsetWidth)/2)+'px';
    card.style.top=Math.max(12,(vh-card.offsetHeight)/2)+'px';
    return;
  }
  const x=Math.max(0,r.left-pad),y=Math.max(0,r.top-pad);
  const w=Math.min(vw-x,r.width+pad*2),h=Math.min(vh-y,r.height+pad*2);
  e.spot.style.display='block';
  e.spot.style.left=x+'px';e.spot.style.top=y+'px';e.spot.style.width=w+'px';e.spot.style.height=h+'px';
  const cw=card.offsetWidth,ch=card.offsetHeight;
  const fits={
    bottom:y+h+gap+ch<=vh-8,
    top:y-gap-ch>=8,
    right:x+w+gap+cw<=vw-8,
    left:x-gap-cw>=8
  };
  const order=st.place?[st.place,'bottom','top','right','left']:['bottom','top','right','left'];
  const pick=order.find(function(k){return fits[k];});
  let cx,cy;
  if(pick==='bottom'){cx=x;cy=y+h+gap;}
  else if(pick==='top'){cx=x;cy=y-gap-ch;}
  else if(pick==='right'){cx=x+w+gap;cy=y;}
  else if(pick==='left'){cx=x-gap-cw;cy=y;}
  else{cx=(vw-cw)/2;cy=vh-ch-16;} // target fills the screen: park the card at the bottom
  cx=Math.min(Math.max(12,cx),vw-cw-12);
  cy=Math.min(Math.max(12,cy),vh-ch-12);
  card.style.left=cx+'px';card.style.top=cy+'px';
}

function tourEnd(){
  if(!_tourEls)return;
  cancelAnimationFrame(_tourRaf);
  document.removeEventListener('keydown',_tourKey,true);
  window.removeEventListener('resize',_tourReflow);
  window.removeEventListener('scroll',_tourReflow,true);
  _tourEls.catcher.remove();_tourEls.spot.remove();_tourEls.card.remove();
  _tourEls=null;_tourIdx=-1;_tourSteps=null;
  tourMarkDone();
  try{showPage('dashboard');}catch(e){}
}

// Public entry points (used by the sidebar button and Settings → About through data-ph-click).
function startTour(){
  const w=document.getElementById('ph-tour-welcome');if(w)w.remove();
  tourStart();
}

// ── First-run check ──────────────────────────────────────────────────────────
(function tourAutoCheck(){
  function waitUnlocked(cb,tries){
    const ls=document.getElementById('lock-screen');
    // The lock screen only exists for people who set a password, so they are never "new".
    if(!ls||ls.classList.contains('unlocked')){cb();return;}
    if(tries>240)return;
    setTimeout(function(){waitUnlocked(cb,(tries||0)+1);},500);
  }
  function run(){
    if(tourDone())return;
    if(tourHasAnyData()){tourMarkDone();return;} // existing user: never show the welcome
    waitUnlocked(tourOpenWelcome,0);
  }
  const ready=window.__storageReady||Promise.resolve();
  ready.then(function(){setTimeout(run,800);});
})();
