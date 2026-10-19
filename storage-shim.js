/* Progress Hub (web build) - localStorage replacement synced to Supabase.
 * Data keys live in table team_data; device-only keys (theme, lock, panel state) stay in this browser.
 * Editors save with a version check (conflicts are detected, never silently overwritten); viewers are read-only. */
(function () {
  'use strict';
  var SB_URL = 'https://gvpkcbriynhwujlxtbja.supabase.co';
  var SB_KEY = 'sb_publishable_6pAbUIWkbJCBCDM1sBuxgw_JwTAlhXE';
  var TABLE = 'team_data', GONE = '__ph_deleted__', DEV = 'ph_dev:';
  var DEVICE_RE = /^kpi_(theme|sec_|lock_attempts|lockout_until|unlocked_session|nudge_snoozed_until|show_|apcollapsed|dlcollapsed|fcwindow|monthsummary_tab_v1|last_backup_ts)/;

  try {
    window.chrome = window.chrome || {};
    if (!window.chrome.runtime) window.chrome.runtime = { getManifest: function () { return { version: '3.15.94.0 web' }; } };
  } catch (e) {}

  var realLS = window.localStorage;
  var cache = {}, versions = {}, serverVals = {}, dirty = {}, inFlight = {}, conflicts = {};
  var sb, myId = null, myName = '', role = 'viewer', names = {};
  var readyAt = 0, timer = null, flushing = false, again = false, retryMs = 0, viewNote = false, curBanner = '';
  var isDev = function (k) { return DEVICE_RE.test(k); };

  try {
    for (var i = 0; i < realLS.length; i++) {
      var rk = realLS.key(i);
      if (rk && rk.indexOf(DEV) === 0) cache[rk.slice(DEV.length)] = realLS.getItem(rk);
    }
  } catch (e) {}

  var store = {
    getItem: function (k) { var v = cache[k]; return v === undefined ? null : v; },
    setItem: function (k, v) {
      v = String(v); cache[k] = v;
      if (isDev(k)) { try { realLS.setItem(DEV + k, v); } catch (e) {} } else changed(k);
    },
    removeItem: function (k) {
      delete cache[k];
      if (isDev(k)) { try { realLS.removeItem(DEV + k); } catch (e) {} } else changed(k);
    },
    clear: function () { Object.keys(cache).forEach(function (k) { store.removeItem(k); }); },
    key: function (n) { var ks = Object.keys(cache); return n < ks.length ? ks[n] : null; },
    get length() { return Object.keys(cache).length; }
  };
  var proxy = new Proxy(store, {
    get: function (t, p) {
      if (typeof p === 'string' && !(p in t)) return cache[p];
      var x = t[p]; return typeof x === 'function' ? x.bind(t) : x;
    },
    set: function (t, p, v) { if (typeof p === 'string' && !(p in t)) t.setItem(p, v); return true; },
    deleteProperty: function (t, p) { if (typeof p === 'string') t.removeItem(p); return true; },
    ownKeys: function () { return Object.keys(cache); },
    has: function (t, p) { return p in cache || p in t; },
    getOwnPropertyDescriptor: function (t, p) {
      return p in cache ? { value: cache[p], writable: true, enumerable: true, configurable: true } : undefined;
    }
  });
  try { Object.defineProperty(window, 'localStorage', { get: function () { return proxy; }, configurable: true }); }
  catch (e) { window.localStorage = proxy; }

  var readyResolve;
  window.__storageReady = new Promise(function (r) { readyResolve = r; });

  /* ---------- saving ---------- */
  function changed(k) {
    if (role !== 'editor') {
      if (readyAt && Date.now() - readyAt > 2000 && !viewNote) {
        viewNote = true; banner('view', 'View-only account: changes you make here are not saved.');
      }
      return;
    }
    dirty[k] = true; clearTimeout(timer); timer = setTimeout(flush, 1200); status();
  }

  async function push(k, val) {
    try {
      var r;
      if (versions[k] === undefined) {
        r = await sb.from(TABLE).insert({ key: k, value: val, updated_by: myId }).select('version');
        if (r.error) return r.error.code === '23505' ? 'conflict' : 'error';
      } else {
        r = await sb.from(TABLE).update({ value: val }).eq('key', k).eq('version', versions[k]).select('version');
        if (r.error) return 'error';
        if (!r.data || !r.data.length) return 'conflict';
      }
      versions[k] = r.data[0].version; serverVals[k] = val; return 'ok';
    } catch (e) { return 'error'; }
  }

  async function flush() {
    if (flushing) { again = true; return; }
    flushing = true;
    var failed = false;
    try {
      var keys = Object.keys(dirty);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var val = Object.prototype.hasOwnProperty.call(cache, k) ? cache[k] : GONE;
        if (serverVals[k] === val || (val === GONE && versions[k] === undefined)) { delete dirty[k]; continue; }
        if (conflicts[k]) continue;
        inFlight[k] = true;
        var res = await push(k, val);
        inFlight[k] = false;
        if (res === 'ok') delete dirty[k]; else if (res === 'conflict') conflicts[k] = true; else failed = true;
      }
    } catch (e) { failed = true; }
    flushing = false;
    if (Object.keys(conflicts).length) banner('conflict', 'Someone else saved changes at the same time as you.');
    if (failed) { retryMs = Math.min((retryMs || 4000) * 2, 60000); timer = setTimeout(flush, retryMs); } else retryMs = 0;
    if (again) { again = false; flush(); }
    status();
  }

  async function keepMine() {
    var ks = Object.keys(conflicts);
    for (var i = 0; i < ks.length; i++) {
      var r = await sb.from(TABLE).select('version').eq('key', ks[i]).maybeSingle();
      versions[ks[i]] = r.data ? r.data.version : undefined;
      serverVals[ks[i]] = undefined;
      delete conflicts[ks[i]];
    }
    hideBanner(); flush();
  }

  function onRemote(p) {
    var r = p.new || {}, k = r.key || (p.old && p.old.key);
    if (!k) return;
    if (r.updated_by === myId && (inFlight[k] || versions[k] === r.version)) return;
    if (r.value !== undefined && r.value === serverVals[k]) return;
    banner('remote', (names[r.updated_by] || 'A teammate') + ' updated the shared data.');
  }

  /* ---------- sign in / hydrate ---------- */
  async function start(session) {
    myId = session.user.id;
    var pr = await sb.from('profiles').select('id,display_name,role');
    if (pr.error) throw new Error('Could not load your profile. Check your connection.');
    (pr.data || []).forEach(function (p) {
      names[p.id] = p.display_name;
      if (p.id === myId) { myName = p.display_name; role = p.role; }
    });
    if (!names[myId]) { await sb.auth.signOut(); throw new Error('Your account has no profile yet. Ask the team lead.'); }
    var from = 0, page;
    do {
      page = await sb.from(TABLE).select('key,value,version').order('key').range(from, from + 499);
      if (page.error) throw new Error('Could not load team data. Check your connection.');
      page.data.forEach(function (r) {
        versions[r.key] = r.version; serverVals[r.key] = r.value;
        if (r.value !== GONE) cache[r.key] = r.value;
      });
      from += 500;
    } while (page.data.length === 500);
    var o = document.getElementById('ph-login'); if (o) o.remove();
    document.documentElement.setAttribute('data-ph-role', role);
    sb.channel('ph-team-data').on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, onRemote).subscribe();
    readyAt = Date.now(); status(); readyResolve();
  }

  async function signOut() {
    clearTimeout(timer); await flush();
    if (Object.keys(dirty).length && !confirm('You have unsaved changes. Sign out anyway?')) return;
    window.__phLeaving = true; await sb.auth.signOut(); location.reload();
  }

  /* ---------- UI ---------- */
  var css = '#ph-login{position:fixed;inset:0;z-index:2147483647;background:#0d0f12;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif}' +
    '#ph-login form{width:320px;max-width:90vw;background:#161a20;border:1px solid #2a2f38;border-radius:14px;padding:28px;color:#e5e7eb}' +
    '#ph-login h1{margin:0 0 4px;font-size:20px}#ph-login p{margin:0 0 18px;color:#94a3b8;font-size:13px}' +
    '#ph-login input{width:100%;box-sizing:border-box;margin-bottom:10px;padding:10px 12px;background:#0d0f12;border:1px solid #2a2f38;border-radius:8px;color:#e5e7eb;font-size:14px}' +
    '#ph-login button{width:100%;padding:10px;border:0;border-radius:8px;background:#3b82f6;color:#fff;font-weight:600;font-size:14px;cursor:pointer}#ph-login button:disabled{opacity:.6}' +
    '#ph-login-msg{margin-top:12px;font-size:13px;color:#94a3b8;min-height:16px}#ph-login-msg.err{color:#f87171}' +
    '#ph-chip{position:fixed;right:10px;bottom:10px;z-index:9990;display:flex;gap:8px;align-items:center;padding:5px 10px;background:rgba(15,17,21,.92);border:1px solid #2a2f38;border-radius:999px;color:#cbd5e1;font:11px Inter,system-ui,sans-serif}' +
    '#ph-chip button{background:none;border:0;color:#60a5fa;cursor:pointer;font:inherit;padding:0}' +
    '#ph-banner{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;gap:10px;align-items:center;padding:10px 14px;border-radius:10px;font:13px Inter,system-ui,sans-serif;color:#fff;box-shadow:0 6px 24px rgba(0,0,0,.4)}' +
    '#ph-banner.conflict{background:#b45309}#ph-banner.remote{background:#1d4ed8}#ph-banner.view{background:#475569}' +
    '#ph-banner button{background:rgba(255,255,255,.2);border:0;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font:inherit}';
  var st = document.createElement('style'); st.textContent = css; document.documentElement.appendChild(st);

  function showLogin(msg) {
    var o = document.getElementById('ph-login');
    if (!o) {
      o = document.createElement('div'); o.id = 'ph-login';
      o.innerHTML = '<form><h1>Progress Hub</h1><p>Sign in to continue</p>' +
        '<input id="ph-email" type="email" placeholder="Email" autocomplete="username" required>' +
        '<input id="ph-pass" type="password" placeholder="Password" autocomplete="current-password" required>' +
        '<button type="submit">Sign in</button><div id="ph-login-msg"></div></form>';
      document.documentElement.appendChild(o);
      var form = o.querySelector('form'), btn = o.querySelector('button');
      form.addEventListener('submit', async function (e) {
        e.preventDefault(); btn.disabled = true; setMsg('Signing in…');
        try {
          var r = await sb.auth.signInWithPassword({ email: document.getElementById('ph-email').value.trim(), password: document.getElementById('ph-pass').value });
          if (r.error) { setMsg('Wrong email or password.', true); btn.disabled = false; return; }
          await start(r.data.session);
        } catch (err) { setMsg(err.message || 'Sign-in failed.', true); btn.disabled = false; }
      });
    }
    if (msg) setMsg(msg, true);
  }
  function setMsg(t, err) { var m = document.getElementById('ph-login-msg'); if (m) { m.textContent = t; m.className = err ? 'err' : ''; } }

  function status() {
    var c = document.getElementById('ph-chip');
    if (!c) {
      c = document.createElement('div'); c.id = 'ph-chip'; document.documentElement.appendChild(c);
      c.addEventListener('click', function (e) { if (e.target.tagName === 'BUTTON') signOut(); });
    }
    var s = Object.keys(conflicts).length ? 'Conflict' : retryMs ? 'Offline, retrying' : Object.keys(dirty).length ? 'Saving…' : role === 'editor' ? 'Saved' : '';
    c.innerHTML = '<span>' + esc(myName) + ' · ' + (role === 'editor' ? 'Editor' : 'View only') + (s ? ' · ' + s : '') + '</span><button>Sign out</button>';
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function banner(type, msg) {
    if (curBanner === 'conflict' && type !== 'conflict') return;
    var b = document.getElementById('ph-banner');
    if (!b) {
      b = document.createElement('div'); b.id = 'ph-banner'; document.documentElement.appendChild(b);
      b.addEventListener('click', function (e) {
        var a = e.target.getAttribute && e.target.getAttribute('data-a');
        if (a === 'reload') { window.__phLeaving = true; location.reload(); }
        else if (a === 'mine') keepMine();
        else if (a === 'close') hideBanner();
      });
    }
    curBanner = type; b.className = type;
    b.innerHTML = '<span>' + esc(msg) + '</span>' +
      (type === 'conflict' ? '<button data-a="reload">Reload latest</button><button data-a="mine">Keep mine</button>' :
        type === 'remote' ? '<button data-a="reload">Reload</button><button data-a="close">Dismiss</button>' :
          '<button data-a="close">OK</button>');
  }
  function hideBanner() { var b = document.getElementById('ph-banner'); if (b) b.remove(); curBanner = ''; }

  window.addEventListener('beforeunload', function (e) {
    if (!window.__phLeaving && Object.keys(dirty).length) { e.preventDefault(); e.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && Object.keys(dirty).length) { clearTimeout(timer); flush(); }
  });

  /* ---------- boot ---------- */
  if (!window.supabase) { showLogin('Could not load the sign-in library.'); return; }
  sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { storage: realLS, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  sb.auth.onAuthStateChange(function (ev) {
    if (ev === 'SIGNED_OUT' && myId && !window.__phLeaving) { window.__phLeaving = true; location.reload(); }
  });
  sb.auth.getSession().then(function (r) {
    if (r.data && r.data.session) return start(r.data.session);
    showLogin();
  }).catch(function (e) { showLogin(e.message); });
})();
