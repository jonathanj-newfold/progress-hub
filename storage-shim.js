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
        r = await sb.from(TABLE).insert({ user_id: myId, key: k, value: val, updated_by: myId }).select('version');
        if (r.error) return r.error.code === '23505' ? 'conflict' : 'error';
      } else {
        r = await sb.from(TABLE).update({ value: val }).eq('user_id', myId).eq('key', k).eq('version', versions[k]).select('version');
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
    if (Object.keys(conflicts).length) banner('conflict', 'Your data was changed from another device or tab at the same time.');
    if (failed) { retryMs = Math.min((retryMs || 4000) * 2, 60000); timer = setTimeout(flush, retryMs); } else retryMs = 0;
    if (again) { again = false; flush(); }
    status();
  }

  async function keepMine() {
    var ks = Object.keys(conflicts);
    for (var i = 0; i < ks.length; i++) {
      var r = await sb.from(TABLE).select('version').eq('user_id', myId).eq('key', ks[i]).maybeSingle();
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
    banner('remote', 'Your data was updated from another device or tab.');
  }

  /* ---------- sign in / hydrate ---------- */
  async function start(session) {
    myId = session.user.id;
    var pr = await sb.from('profiles').select('id,display_name').eq('id', myId);
    if (pr.error) throw new Error('Could not load your profile. Check your connection.');
    (pr.data || []).forEach(function (p) {
      names[p.id] = p.display_name;
      if (p.id === myId) { myName = p.display_name; role = 'editor'; }
    });
    if (!names[myId]) { await sb.auth.signOut(); throw new Error('Your account has no profile yet. Ask the team lead.'); }
    var from = 0, page;
    do {
      page = await sb.from(TABLE).select('key,value,version').eq('user_id', myId).order('key').range(from, from + 499);
      if (page.error) throw new Error('Could not load team data. Check your connection.');
      page.data.forEach(function (r) {
        versions[r.key] = r.version; serverVals[r.key] = r.value;
        if (r.value !== GONE) cache[r.key] = r.value;
      });
      from += 500;
    } while (page.data.length === 500);
    var o = document.getElementById('ph-login'); if (o) o.remove();
    document.documentElement.setAttribute('data-ph-role', role);
    sb.channel('ph-team-data').on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: 'user_id=eq.' + myId }, onRemote).subscribe();
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
    '#ph-banner button{background:rgba(255,255,255,.2);border:0;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font:inherit}' +
    '#ph-toggle{display:block;margin-top:14px;color:#60a5fa;font-size:13px;text-align:center;text-decoration:none}' +
    '#ph-pw{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif}' +
    '#ph-pw form{width:320px;max-width:90vw;background:#161a20;border:1px solid #2a2f38;border-radius:14px;padding:24px;color:#e5e7eb}#ph-pw h2{margin:0 0 14px;font-size:18px}' +
    '#ph-pw input{width:100%;box-sizing:border-box;margin-bottom:10px;padding:10px 12px;background:#0d0f12;border:1px solid #2a2f38;border-radius:8px;color:#e5e7eb;font-size:14px}' +
    '#ph-pw .row{display:flex;gap:8px}#ph-pw .row button{flex:1;padding:10px;border:0;border-radius:8px;background:#2a2f38;color:#e5e7eb;font-weight:600;cursor:pointer}#ph-pw .row button[type=submit]{background:#3b82f6;color:#fff}' +
    '#ph-pw-msg{margin-top:12px;font-size:13px;color:#94a3b8;min-height:16px}#ph-pw-msg.err{color:#f87171}';
  var st = document.createElement('style'); st.textContent = css; document.documentElement.appendChild(st);

  function showLogin(msg) {
    var o = document.getElementById('ph-login');
    if (!o) {
      o = document.createElement('div'); o.id = 'ph-login';
      o.innerHTML = '<form><h1>Progress Hub</h1><p id="ph-sub">Sign in to continue</p>' +
        '<input id="ph-name" type="text" placeholder="Your name" autocomplete="name" style="display:none">' +
        '<input id="ph-email" type="email" placeholder="Email" autocomplete="username" required>' +
        '<input id="ph-pass" type="password" placeholder="Password" autocomplete="current-password" minlength="8" required>' +
        '<button type="submit">Sign in</button><div id="ph-login-msg"></div>' +
        '<a href="#" id="ph-toggle">New here? Create an account</a></form>';
      document.documentElement.appendChild(o);
      var form = o.querySelector('form'), btn = o.querySelector('button[type=submit]'), signup = false;
      var $ = function (id) { return document.getElementById(id); };
      $('ph-toggle').addEventListener('click', function (e) {
        e.preventDefault(); signup = !signup; setMsg('');
        $('ph-name').style.display = signup ? '' : 'none'; $('ph-name').required = signup;
        $('ph-pass').autocomplete = signup ? 'new-password' : 'current-password';
        $('ph-sub').textContent = signup ? 'Create your account' : 'Sign in to continue';
        btn.textContent = signup ? 'Create account' : 'Sign in';
        e.target.textContent = signup ? 'Already have an account? Sign in' : 'New here? Create an account';
      });
      form.addEventListener('submit', async function (e) {
        e.preventDefault(); btn.disabled = true; setMsg(signup ? 'Creating account…' : 'Signing in…');
        var email = $('ph-email').value.trim(), pass = $('ph-pass').value;
        try {
          var r;
          if (signup) {
            var nm = $('ph-name').value.trim();
            if (!nm) { setMsg('Enter your name.', true); btn.disabled = false; return; }
            r = await sb.auth.signUp({ email: email, password: pass, options: { data: { display_name: nm } } });
            if (r.error) {
              setMsg(/database error/i.test(r.error.message) ? 'This email address is not allowed to sign up.' : r.error.message, true);
              btn.disabled = false; return;
            }
            if (!r.data.session) { setMsg('Account created. Check your email to confirm it, then sign in.'); btn.disabled = false; return; }
          } else {
            r = await sb.auth.signInWithPassword({ email: email, password: pass });
            if (r.error) { setMsg('Wrong email or password.', true); btn.disabled = false; return; }
          }
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
      c.addEventListener('click', function (e) { var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (a === 'out') signOut(); else if (a === 'pw') pwDialog(); });
    }
    var s = Object.keys(conflicts).length ? 'Conflict' : retryMs ? 'Offline, retrying' : Object.keys(dirty).length ? 'Saving…' : role === 'editor' ? 'Saved' : '';
    c.innerHTML = '<span>' + esc(myName) + (s ? ' · ' + s : '') + '</span><button data-a="pw">Change password</button><button data-a="out">Sign out</button>';
  }
  function pwDialog() {
    if (document.getElementById('ph-pw')) return;
    var o = document.createElement('div'); o.id = 'ph-pw';
    o.innerHTML = '<form><h2>Change password</h2>' +
      '<input id="ph-pw1" type="password" placeholder="New password (min 8 characters)" autocomplete="new-password" minlength="8" required>' +
      '<input id="ph-pw2" type="password" placeholder="Confirm new password" autocomplete="new-password" minlength="8" required>' +
      '<div class="row"><button type="button" data-a="x">Cancel</button><button type="submit">Update</button></div><div id="ph-pw-msg"></div></form>';
    document.documentElement.appendChild(o);
    var msg = function (t, err) { var m = document.getElementById('ph-pw-msg'); m.textContent = t; m.className = err ? 'err' : ''; };
    o.addEventListener('click', function (e) { if (e.target === o || e.target.getAttribute('data-a') === 'x') o.remove(); });
    o.querySelector('form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var p1 = document.getElementById('ph-pw1').value, p2 = document.getElementById('ph-pw2').value;
      if (p1 !== p2) { msg('The two passwords do not match.', true); return; }
      msg('Updating…');
      try {
        var r = await sb.auth.updateUser({ password: p1 });
        if (r.error) { msg(r.error.message, true); return; }
        msg('Password updated.'); setTimeout(function () { o.remove(); }, 1500);
      } catch (err) { msg(err.message || 'Could not update the password.', true); }
    });
    document.getElementById('ph-pw1').focus();
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
