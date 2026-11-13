/**
 * app-05-reel-picker.js
 * "Slot reel" pickers — same mechanics/feel as the calendar reel in
 * Proratalator (3D-tilted scroll wheel, wheel-notch stepping, drag, keyboard
 * nav) shown as an anchored popover next to whichever trigger was clicked,
 * instead of a centered modal or a native <select> dropdown.
 *
 * Two popovers share the same reel engine (createReel/wireReel etc.):
 *  - #reel-picker-pop   — the month+year "jump to period" picker, wired to
 *    the hidden #month-sel/#year-sel so changePeriod() etc. in app-01 keep
 *    working untouched.
 *  - #value-reel-pop    — a generic 1-or-more-column picker used wherever a
 *    plain <select> used to be (YTD year, Running score's month/day
 *    pickers). openValueReelPicker() builds its columns on the fly.
 */

const REEL_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const REEL_ITEM_H = 34;   // must match .reel-item{height} in components.css
const REEL_SPACER_H = 68; // must match .reel-spacer{height} — (frame height - item height) / 2

let reelMonth = null;
let reelYear = null;
let reelAnchorEl = null;

let ytdAvailableYears = []; // populated by renderYTDStrip() in app-01
let valueReelCols = [];     // [{state, values}] — active columns in #value-reel-pop
let valueReelAnchor = null;
let valueReelOnApply = null;

// ── one independent scroll-wheel reel ───────────────────────────────────────

function createReel(colEl, labels, startIndex, onEnter){
  const state = { colEl, items: [], els: [], target: 0, drag: null, justDragged: false, wheelAcc: 0, wheelAt: 0, framePending: false, settleTimer: null };
  buildReel(state, labels, startIndex);
  wireReel(state, onEnter);
  return state;
}

function buildReel(state, labels, startIndex){
  const el = state.colEl;
  el.innerHTML = '';
  state.items = labels;
  state.els = [];

  const top = document.createElement('div');
  top.className = 'reel-spacer';
  el.appendChild(top);

  labels.forEach((label,i)=>{
    const d = document.createElement('div');
    d.className = 'reel-item';
    d.dataset.index = String(i);
    d.setAttribute('role','option');
    d.textContent = label;
    el.appendChild(d);
    state.els.push(d);
  });

  const bottom = document.createElement('div');
  bottom.className = 'reel-spacer';
  el.appendChild(bottom);

  scrollReelTo(state, startIndex, false);
  updateReelVisuals(state);
}

function reelCurrentIndex(state){
  const max = state.els.length - 1;
  return Math.max(0, Math.min(max, Math.round(state.colEl.scrollTop / REEL_ITEM_H)));
}

function updateReelVisuals(state){
  const pos = state.colEl.scrollTop / REEL_ITEM_H;
  const current = reelCurrentIndex(state);
  state.els.forEach((el,i)=>{
    const d = i - pos, ad = Math.abs(d);
    if(ad > 3.4){
      el.style.opacity = '0';
      el.style.transform = '';
    } else {
      el.style.opacity = String(Math.max(0.15, 1 - ad*0.28));
      el.style.transform = `perspective(260px) rotateX(${(-d*26).toFixed(1)}deg) scale(${(1-ad*0.07).toFixed(3)})`;
    }
    el.classList.toggle('is-selected', i===current);
  });
}

function scrollReelTo(state, index, smooth){
  const max = state.els.length - 1;
  const idx = Math.max(0, Math.min(max, index));
  state.target = idx;
  const top = idx * REEL_ITEM_H;
  if(typeof state.colEl.scrollTo === 'function') state.colEl.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  else state.colEl.scrollTop = top;
}

function wireReel(state, onEnter){
  const el = state.colEl;

  el.addEventListener('scroll', ()=>{
    if(!state.framePending){
      state.framePending = true;
      requestAnimationFrame(()=>{ state.framePending = false; updateReelVisuals(state); });
    }
    clearTimeout(state.settleTimer);
    state.settleTimer = setTimeout(()=>{ scrollReelTo(state, reelCurrentIndex(state), true); }, 110);
  });

  // One mouse-wheel notch = one step (native wheel scrolling skips several rows).
  el.addEventListener('wheel', (e)=>{
    e.preventDefault();
    const now = Date.now();
    if(now - state.wheelAt > 250) state.wheelAcc = 0;
    state.wheelAt = now;
    state.wheelAcc += e.deltaY;
    if(Math.abs(state.wheelAcc) >= 40){
      const step = state.wheelAcc > 0 ? 1 : -1;
      state.wheelAcc = 0;
      scrollReelTo(state, state.target + step, true);
    }
  }, { passive:false });

  // Click-and-drag with a mouse (touch and trackpads scroll natively).
  el.addEventListener('pointerdown', (e)=>{
    if(e.pointerType !== 'mouse' || e.button !== 0) return;
    state.drag = { y: e.clientY, top: el.scrollTop, moved: false, id: e.pointerId };
  });
  el.addEventListener('pointermove', (e)=>{
    if(!state.drag) return;
    const dy = e.clientY - state.drag.y;
    if(!state.drag.moved && Math.abs(dy) > 4){
      state.drag.moved = true;
      el.classList.add('is-dragging');
      try{ el.setPointerCapture(state.drag.id); }catch(err){}
    }
    if(state.drag.moved) el.scrollTop = state.drag.top - dy;
  });
  function endDrag(){
    if(!state.drag) return;
    const moved = state.drag.moved;
    state.drag = null;
    el.classList.remove('is-dragging');
    if(moved){
      state.justDragged = true;
      setTimeout(()=>{ state.justDragged = false; }, 0);
      scrollReelTo(state, reelCurrentIndex(state), true);
    }
  }
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);

  // Tap an item to scroll it into the centre.
  el.addEventListener('click', (e)=>{
    if(state.justDragged) return;
    const item = e.target.closest('.reel-item');
    if(!item) return;
    scrollReelTo(state, Number(item.dataset.index), true);
  });

  el.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowDown'){ e.preventDefault(); scrollReelTo(state, state.target+1, true); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); scrollReelTo(state, state.target-1, true); }
    else if(e.key==='PageDown'){ e.preventDefault(); scrollReelTo(state, state.target+5, true); }
    else if(e.key==='PageUp'){ e.preventDefault(); scrollReelTo(state, state.target-5, true); }
    else if(e.key==='Home'){ e.preventDefault(); scrollReelTo(state, 0, true); }
    else if(e.key==='End'){ e.preventDefault(); scrollReelTo(state, state.els.length-1, true); }
    else if(e.key==='Enter'){ e.preventDefault(); if(typeof onEnter==='function') onEnter(); }
  });
}

// ── month + year "jump to period" popover ───────────────────────────────────

function openReelPicker(anchorEl){
  reelAnchorEl = anchorEl || reelAnchorEl;
  const monthSel = document.getElementById('month-sel');
  const yearSel = document.getElementById('year-sel');
  if(!monthSel || !yearSel || !reelAnchorEl) return;

  const curMonth = parseInt(monthSel.value) || (new Date().getMonth()+1);
  const years = Array.from(yearSel.options).map(o=>parseInt(o.value));
  const curYear = parseInt(yearSel.value) || years[0] || new Date().getFullYear();
  let yearIdx = years.indexOf(curYear);
  if(yearIdx < 0) yearIdx = 0;

  closeValueReelPicker();
  const pop = document.getElementById('reel-picker-pop');
  pop.classList.remove('is-hidden');

  reelMonth = createReel(document.getElementById('reel-col-month'), REEL_MONTH_NAMES, curMonth-1, applyReelPicker);
  reelYear = createReel(document.getElementById('reel-col-year'), years.map(String), yearIdx, applyReelPicker);

  positionReelPicker();
  // Re-settle once the popover has actually laid out at full size.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    scrollReelTo(reelMonth, curMonth-1, false);
    scrollReelTo(reelYear, yearIdx, false);
    positionReelPicker();
  }));
}

function closeReelPicker(){
  document.getElementById('reel-picker-pop').classList.add('is-hidden');
  reelAnchorEl = null;
}

function applyReelPicker(){
  if(!reelMonth || !reelYear) return;
  const monthSel = document.getElementById('month-sel');
  const yearSel = document.getElementById('year-sel');
  const month = reelCurrentIndex(reelMonth) + 1;
  const year = parseInt(reelYear.items[reelCurrentIndex(reelYear)]);
  const hasYear = Array.from(yearSel.options).some(o=>parseInt(o.value)===year);
  if(!hasYear) return;
  monthSel.value = month;
  yearSel.value = year;
  closeReelPicker();
  changePeriod();
}

function positionReelPicker(){
  positionPopover(document.getElementById('reel-picker-pop'), reelAnchorEl);
}

// ── generic value-reel popover (1+ columns, any list of values) ────────────
// columns: [{items:[{value,label}], current}]. onApply receives one arg per
// column, in order, each the .value of whichever item settled in the centre.

function openValueReelPicker(anchorEl, columns, onApply){
  if(!anchorEl || !columns || !columns.length) return;
  closeReelPicker();
  valueReelAnchor = anchorEl;
  valueReelOnApply = onApply;

  const body = document.getElementById('value-reel-body');
  body.innerHTML = '';
  valueReelCols = [];

  columns.forEach((col)=>{
    const frame = document.createElement('div');
    frame.className = 'reel-frame';
    const band = document.createElement('div');
    band.className = 'reel-band';
    frame.appendChild(band);
    const colEl = document.createElement('div');
    colEl.className = 'reel-col';
    colEl.tabIndex = 0;
    colEl.setAttribute('role','listbox');
    frame.appendChild(colEl);
    body.appendChild(frame);

    let startIdx = col.items.findIndex(it=>String(it.value)===String(col.current));
    if(startIdx < 0) startIdx = 0;
    const state = createReel(colEl, col.items.map(it=>it.label), startIdx, applyValueReelPicker);
    valueReelCols.push({ state, values: col.items.map(it=>it.value), startIdx });
  });

  const pop = document.getElementById('value-reel-pop');
  pop.classList.remove('is-hidden');
  positionValueReelPicker();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    valueReelCols.forEach(c=>scrollReelTo(c.state, c.startIdx, false));
    positionValueReelPicker();
  }));
}

function closeValueReelPicker(){
  document.getElementById('value-reel-pop').classList.add('is-hidden');
  valueReelAnchor = null;
  valueReelOnApply = null;
  valueReelCols = [];
}

function applyValueReelPicker(){
  if(!valueReelCols.length || typeof valueReelOnApply !== 'function') return;
  const values = valueReelCols.map(c=>c.values[reelCurrentIndex(c.state)]);
  const cb = valueReelOnApply;
  closeValueReelPicker();
  cb(...values);
}

function positionValueReelPicker(){
  positionPopover(document.getElementById('value-reel-pop'), valueReelAnchor);
}

// ── shared anchored-popover positioning ─────────────────────────────────────

function positionPopover(pop, anchorEl){
  if(!pop || !anchorEl || pop.classList.contains('is-hidden')) return;
  const r = anchorEl.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight, margin = 8;

  let left = r.left;
  left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));

  let top = r.bottom + 6;
  if(top + ph > window.innerHeight - margin){
    const above = r.top - ph - 6;
    top = above >= margin ? above : Math.max(margin, window.innerHeight - ph - margin);
  }

  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;
}

// ── specific value-reel pickers ─────────────────────────────────────────────

function openYTDYearPicker(anchorEl){
  const btn = document.getElementById('ytd-year-select');
  const curY = parseInt(btn && btn.textContent) || new Date().getFullYear();
  const years = ytdAvailableYears.length ? ytdAvailableYears : [curY];
  const items = years.map(y=>({ value:y, label:String(y) }));
  openValueReelPicker(anchorEl, [{ items, current:curY }], (y)=>{
    renderYTDStrip(parseInt(y));
  });
}

// Year reel for the YTD strip inside a team member's own dashboard (see renderMemberYTDStrip in app-02).
function openMemberYTDYearPicker(anchorEl){
  const btn = document.getElementById('member-ytd-year-select');
  const years = _memberYTDYears.length ? _memberYTDYears : [new Date().getFullYear()];
  const curY = parseInt(btn && btn.textContent) || years[0];
  const items = years.map(y=>({ value:y, label:String(y) }));
  openValueReelPicker(anchorEl, [{ items, current:curY }], (y)=>{
    _memberYTDYear = parseInt(y);
    if(_memberYTDAgent) renderMemberYTDStrip(_memberYTDAgent);
  });
}

// periodLabelShort() now lives in app-01-core-dashboard.js — render code in
// app-01..03 calls it during init, which can run before this file has loaded.

function openDayLookupPeriodPicker(anchorEl){
  if(typeof dayLookupPeriods !== 'function') return;
  const items = dayLookupPeriods().map(k=>{
    const [y,m] = k.split('-');
    return { value:k, label: periodLabelShort(parseInt(m), parseInt(y)) };
  });
  openValueReelPicker(anchorEl, [{ items, current:_dayLookupPeriodKey }], (pk)=>{
    dayLookupPeriodSelect(pk);
  });
}

function openDayLookupDayPicker(anchorEl){
  if(typeof dayLookupAllDayKeys !== 'function' || !_dayLookupPeriodKey) return;
  const items = dayLookupAllDayKeys(_dayLookupPeriodKey).map(k=>({ value:k, label: dayLookupLabel(k) }));
  openValueReelPicker(anchorEl, [{ items, current:_dayLookupSelectedDk }], (dk)=>{
    dayLookupSelect(dk);
  });
}

// ── plain mini calendar popover — Running score (MTD)'s day picker ─────────
// Anchored at the trigger button via positionPopover (same mechanism as the
// reel popovers above), deliberately bare — day numbers only, no scoring —
// unlike the full scored #dlcal-overlay modal opened from the calendar icon.

let daycalAnchorEl = null;
let _daycalPeriodKey = null;

function openDayPickerCal(anchorEl){
  if(typeof dayLookupPeriods !== 'function' || !_dayLookupPeriodKey) return;
  closeReelPicker();
  closeValueReelPicker();
  daycalAnchorEl = anchorEl;
  _daycalPeriodKey = _dayLookupPeriodKey;
  document.getElementById('daycal-pop').classList.remove('is-hidden');
  renderDayPickerCal();
  positionDayPickerCal();
}

function closeDayPickerCal(){
  const pop = document.getElementById('daycal-pop');
  if(pop) pop.classList.add('is-hidden');
  daycalAnchorEl = null;
}

function positionDayPickerCal(){
  positionPopover(document.getElementById('daycal-pop'), daycalAnchorEl);
}

function daycalShiftMonth(dir){
  const periodsAsc = dayLookupPeriods().slice().reverse();
  const idx = periodsAsc.indexOf(_daycalPeriodKey);
  const newIdx = Math.max(0, Math.min(periodsAsc.length-1, (idx<0?0:idx)+dir));
  const newPk = periodsAsc[newIdx];
  if(!newPk || newPk===_daycalPeriodKey) return;
  _daycalPeriodKey = newPk;
  renderDayPickerCal();
  positionDayPickerCal();
}

function daycalSelect(dk){
  closeDayPickerCal();
  if(_daycalPeriodKey !== _dayLookupPeriodKey) dayLookupPeriodSelect(_daycalPeriodKey);
  dayLookupSelect(dk);
}

function renderDayPickerCal(){
  const pk = _daycalPeriodKey;
  if(!pk) return;
  const [y,m] = pk.split('-').map(Number);
  const labelEl = document.getElementById('daycal-period-label');
  if(labelEl) labelEl.textContent = periodLabelShort(m,y);

  const periodsAsc = dayLookupPeriods().slice().reverse();
  const idx = periodsAsc.indexOf(pk);
  const prevBtn = document.getElementById('daycal-prev-btn');
  const nextBtn = document.getElementById('daycal-next-btn');
  if(prevBtn) prevBtn.disabled = idx<=0;
  if(nextBtn) nextBtn.disabled = idx<0 || idx>=periodsAsc.length-1;

  const gridEl = document.getElementById('daycal-grid');
  if(!gridEl) return;
  const daysInMonth = new Date(y,m,0).getDate();
  const firstDay = new Date(y,m-1,1).getDay();
  const todayKey = _dayLookupTodayKey();
  const selDk = pk===_dayLookupPeriodKey ? _dayLookupSelectedDk : null;

  let html='';
  DAY_LOOKUP_WEEKDAYS.forEach(d=>html+=`<div class="daycal-dow">${d[0]}</div>`);
  const totalCells = firstDay+daysInMonth;
  const numWeeks = Math.ceil(totalCells/7);
  for(let i=0;i<numWeeks*7;i++){
    const dayNum = i-firstDay+1;
    if(dayNum<1 || dayNum>daysInMonth){ html+='<div class="daycal-daycell daycal-empty"></div>'; continue; }
    const cellDk = y+'-'+String(m).padStart(2,'0')+'-'+String(dayNum).padStart(2,'0');
    if(cellDk>todayKey){ html+=`<div class="daycal-daycell daycal-future"><span>${dayNum}</span></div>`; continue; }
    const isSelected = cellDk===selDk;
    const isToday = cellDk===todayKey;
    html+=`<div class="daycal-daycell${isSelected?' daycal-selected':''}${isToday?' daycal-today':''}" data-ph-click="daycalSelect('${cellDk}')"><span>${dayNum}</span></div>`;
  }
  gridEl.innerHTML = html;
}

// ── mini calendar popover for the AHT & Chat Count manual-entry date field ──
// Same bare day-grid look as the Running score (MTD) picker above, but a
// fully independent instance (own state, own DOM ids) so picking a date here
// never touches _dayLookupPeriodKey / the MTD picker's selection.

let ahtCalAnchorEl = null;
let _ahtCalYear = null, _ahtCalMonth = null;

function _ahtCalTodayKey(){
  const d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function openAHTDatePicker(anchorEl){
  closeReelPicker();
  closeValueReelPicker();
  closeDayPickerCal();
  ahtCalAnchorEl = anchorEl;
  const input = document.getElementById('aht-manual-date');
  const cur = (input && input.dataset.value) || _ahtCalTodayKey();
  const [y,m] = cur.split('-').map(Number);
  _ahtCalYear = y; _ahtCalMonth = m;
  document.getElementById('ahtcal-pop').classList.remove('is-hidden');
  renderAHTDatePicker();
  positionAHTDatePicker();
}

function closeAHTDatePicker(){
  const pop = document.getElementById('ahtcal-pop');
  if(pop) pop.classList.add('is-hidden');
  ahtCalAnchorEl = null;
}

function positionAHTDatePicker(){
  positionPopover(document.getElementById('ahtcal-pop'), ahtCalAnchorEl);
}

function ahtcalShiftMonth(dir){
  let m=_ahtCalMonth+dir, y=_ahtCalYear;
  if(m<1){m=12;y--;} else if(m>12){m=1;y++;}
  _ahtCalMonth=m; _ahtCalYear=y;
  renderAHTDatePicker();
  positionAHTDatePicker();
}

function ahtcalSelect(dk){
  setAHTManualDate(dk);
  closeAHTDatePicker();
}

// Sets the manual-entry date field's value (dataset.value holds the raw
// "YYYY-MM-DD" key used for storage; the visible text is a friendly label).
function setAHTManualDate(dk){
  const input = document.getElementById('aht-manual-date');
  if(!input) return;
  input.dataset.value = dk;
  const d = new Date(dk+'T00:00:00');
  input.value = d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  if(typeof renderAHTMemberGrid==='function')renderAHTMemberGrid();
}

function renderAHTDatePicker(){
  const y=_ahtCalYear, m=_ahtCalMonth;
  if(!y||!m) return;
  const labelEl = document.getElementById('ahtcal-period-label');
  if(labelEl) labelEl.textContent = periodLabelShort(m,y);

  const gridEl = document.getElementById('ahtcal-grid');
  if(!gridEl) return;
  const daysInMonth = new Date(y,m,0).getDate();
  const firstDay = new Date(y,m-1,1).getDay();
  const todayKey = _ahtCalTodayKey();
  const dateInput = document.getElementById('aht-manual-date');
  const selDk = dateInput && dateInput.dataset.value;

  let html='';
  DAY_LOOKUP_WEEKDAYS.forEach(d=>html+=`<div class="daycal-dow">${d[0]}</div>`);
  const totalCells = firstDay+daysInMonth;
  const numWeeks = Math.ceil(totalCells/7);
  for(let i=0;i<numWeeks*7;i++){
    const dayNum = i-firstDay+1;
    if(dayNum<1 || dayNum>daysInMonth){ html+='<div class="daycal-daycell daycal-empty"></div>'; continue; }
    const cellDk = y+'-'+String(m).padStart(2,'0')+'-'+String(dayNum).padStart(2,'0');
    if(cellDk>todayKey){ html+=`<div class="daycal-daycell daycal-future"><span>${dayNum}</span></div>`; continue; }
    const isSelected = cellDk===selDk;
    const isToday = cellDk===todayKey;
    html+=`<div class="daycal-daycell${isSelected?' daycal-selected':''}${isToday?' daycal-today':''}" data-ph-click="ahtcalSelect('${cellDk}')"><span>${dayNum}</span></div>`;
  }
  gridEl.innerHTML = html;
}

// ── mini calendar popover for Custom KPI Metric date-entry fields ──────────
// One shared popover instance reused by every custom metric card — which
// card's date field a selection writes to is tracked in _cmCalMetricId,
// set when that card's field is clicked open.
let cmCalAnchorEl = null;
let _cmCalMetricId = null;
let _cmCalYear = null, _cmCalMonth = null;

function openCMDatePicker(anchorEl,metricId){
  closeReelPicker();
  closeValueReelPicker();
  closeDayPickerCal();
  closeAHTDatePicker();
  cmCalAnchorEl = anchorEl;
  _cmCalMetricId = metricId;
  const input = document.getElementById('cm-date-'+metricId);
  const cur = (input && input.dataset.value) || _ahtCalTodayKey();
  const [y,m] = cur.split('-').map(Number);
  _cmCalYear = y; _cmCalMonth = m;
  document.getElementById('cmcal-pop').classList.remove('is-hidden');
  renderCMDatePicker();
  positionCMDatePicker();
}

function closeCMDatePicker(){
  const pop = document.getElementById('cmcal-pop');
  if(pop) pop.classList.add('is-hidden');
  cmCalAnchorEl = null;
  _cmCalMetricId = null;
}

function positionCMDatePicker(){
  positionPopover(document.getElementById('cmcal-pop'), cmCalAnchorEl);
}

function cmcalShiftMonth(dir){
  let m=_cmCalMonth+dir, y=_cmCalYear;
  if(m<1){m=12;y--;} else if(m>12){m=1;y++;}
  _cmCalMonth=m; _cmCalYear=y;
  renderCMDatePicker();
  positionCMDatePicker();
}

function cmcalSelect(dk){
  setCMMetricDate(_cmCalMetricId,dk);
  closeCMDatePicker();
}

// Sets a custom metric card's date field (dataset.value holds the raw
// "YYYY-MM-DD" key used for storage; the visible text is a friendly label) —
// mirrors setAHTManualDate above.
function setCMMetricDate(metricId,dk){
  const input = document.getElementById('cm-date-'+metricId);
  if(!input) return;
  input.dataset.value = dk;
  input.value = fmtCMDateDisplay(dk);
}

function renderCMDatePicker(){
  const y=_cmCalYear, m=_cmCalMonth;
  if(!y||!m) return;
  const labelEl = document.getElementById('cmcal-period-label');
  if(labelEl) labelEl.textContent = periodLabelShort(m,y);

  const gridEl = document.getElementById('cmcal-grid');
  if(!gridEl) return;
  const daysInMonth = new Date(y,m,0).getDate();
  const firstDay = new Date(y,m-1,1).getDay();
  const todayKey = _ahtCalTodayKey();
  const input = document.getElementById('cm-date-'+_cmCalMetricId);
  const selDk = input && input.dataset.value;

  let html='';
  DAY_LOOKUP_WEEKDAYS.forEach(d=>html+=`<div class="daycal-dow">${d[0]}</div>`);
  const totalCells = firstDay+daysInMonth;
  const numWeeks = Math.ceil(totalCells/7);
  for(let i=0;i<numWeeks*7;i++){
    const dayNum = i-firstDay+1;
    if(dayNum<1 || dayNum>daysInMonth){ html+='<div class="daycal-daycell daycal-empty"></div>'; continue; }
    const cellDk = y+'-'+String(m).padStart(2,'0')+'-'+String(dayNum).padStart(2,'0');
    if(cellDk>todayKey){ html+=`<div class="daycal-daycell daycal-future"><span>${dayNum}</span></div>`; continue; }
    const isSelected = cellDk===selDk;
    const isToday = cellDk===todayKey;
    html+=`<div class="daycal-daycell${isSelected?' daycal-selected':''}${isToday?' daycal-today':''}" data-ph-click="cmcalSelect('${cellDk}')"><span>${dayNum}</span></div>`;
  }
  gridEl.innerHTML = html;
}

// ── dismissal (outside click / Esc) for both popovers ───────────────────────

document.addEventListener('pointerdown', (e)=>{
  const reelPop = document.getElementById('reel-picker-pop');
  if(reelPop && !reelPop.classList.contains('is-hidden')){
    if(!reelPop.contains(e.target) && !e.target.closest('[data-ph-click^="openReelPicker"]')) closeReelPicker();
  }
  const valPop = document.getElementById('value-reel-pop');
  if(valPop && !valPop.classList.contains('is-hidden')){
    if(!valPop.contains(e.target) && !e.target.closest('[data-ph-click*="Picker(this)"]')) closeValueReelPicker();
  }
  const daycalPop = document.getElementById('daycal-pop');
  if(daycalPop && !daycalPop.classList.contains('is-hidden')){
    if(!daycalPop.contains(e.target) && !e.target.closest('[data-ph-click^="openDayPickerCal"]')) closeDayPickerCal();
  }
  const ahtcalPop = document.getElementById('ahtcal-pop');
  if(ahtcalPop && !ahtcalPop.classList.contains('is-hidden')){
    if(!ahtcalPop.contains(e.target) && !e.target.closest('[data-ph-click^="openAHTDatePicker"]')) closeAHTDatePicker();
  }
  const cmcalPop = document.getElementById('cmcal-pop');
  if(cmcalPop && !cmcalPop.classList.contains('is-hidden')){
    if(!cmcalPop.contains(e.target) && !e.target.closest('[data-ph-click^="openCMDatePicker"]')) closeCMDatePicker();
  }
});

document.addEventListener('keydown', (e)=>{
  if(e.key !== 'Escape') return;
  const reelPop = document.getElementById('reel-picker-pop');
  if(reelPop && !reelPop.classList.contains('is-hidden')){ e.preventDefault(); closeReelPicker(); return; }
  const valPop = document.getElementById('value-reel-pop');
  if(valPop && !valPop.classList.contains('is-hidden')){ e.preventDefault(); closeValueReelPicker(); return; }
  const daycalPop = document.getElementById('daycal-pop');
  if(daycalPop && !daycalPop.classList.contains('is-hidden')){ e.preventDefault(); closeDayPickerCal(); }
  const ahtcalPop = document.getElementById('ahtcal-pop');
  if(ahtcalPop && !ahtcalPop.classList.contains('is-hidden')){ e.preventDefault(); closeAHTDatePicker(); }
  const cmcalPop = document.getElementById('cmcal-pop');
  if(cmcalPop && !cmcalPop.classList.contains('is-hidden')){ e.preventDefault(); closeCMDatePicker(); }
});

window.addEventListener('resize', ()=>{ positionReelPicker(); positionValueReelPicker(); positionDayPickerCal(); positionAHTDatePicker(); positionCMDatePicker(); });
window.addEventListener('scroll', ()=>{ positionReelPicker(); positionValueReelPicker(); positionDayPickerCal(); positionAHTDatePicker(); positionCMDatePicker(); }, true);
