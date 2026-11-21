/**
 * events.js
 * MV3-compliant event delegation for Progress Hub.
 * Replaces all inline onclick/onchange/etc. handlers (now stored as data-ph-* attributes)
 * with a single document-level event listener that dispatches to named functions.
 *
 * Safe: no eval(), no Function() — pure function-name lookup via window[name].
 */

(function () {
  'use strict';

  // ── Argument parser ─────────────────────────────────────────────────────────
  // Parses "fnName(arg1, arg2)" → { fn: 'fnName', args: ['arg1', 'arg2'] }
  // Handles: string literals, booleans, integers, `this` ref, bare identifiers.
  function parseCall(expr) {
    if (!expr) return null;
    expr = expr.trim();

    const m = expr.match(/^([\w.]+)\((.*)\)$/s);
    if (!m) return null;

    const fn = m[1];
    const rawArgs = m[2].trim();
    const args = rawArgs === '' ? [] : splitArgs(rawArgs);
    return { fn, args };
  }

  function splitArgs(raw) {
    // Split on top-level commas (not inside quotes or parens)
    const parts = [];
    let depth = 0, inStr = false, strChar = '', cur = '';
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (inStr) {
        cur += ch;
        if (ch === strChar && raw[i - 1] !== '\\') inStr = false;
      } else if (ch === '"' || ch === "'") {
        inStr = true; strChar = ch; cur += ch;
      } else if (ch === '(' || ch === '[' || ch === '{') {
        depth++; cur += ch;
      } else if (ch === ')' || ch === ']' || ch === '}') {
        depth--; cur += ch;
      } else if (ch === ',' && depth === 0) {
        parts.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts.map(coerceArg);
  }

  function coerceArg(s) {
    // String literal
    if ((s.startsWith("'") && s.endsWith("'")) ||
        (s.startsWith('"') && s.endsWith('"'))) {
      return s.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
    }
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s === 'null') return null;
    if (s === 'undefined') return undefined;
    // Number
    const n = Number(s);
    if (!isNaN(n) && s !== '') return n;
    // Otherwise return raw string (e.g. bare identifier — caller handles 'this')
    return s;
  }

  // ── Function dispatcher ──────────────────────────────────────────────────────
  // Handles semi-colon chained expressions like "event.stopPropagation();fn()"
  function dispatch(expr, el, event) {
    if (!expr) return;

    // Handle chained statements
    const stmts = splitStatements(expr);
    for (const stmt of stmts) {
      dispatchOne(stmt.trim(), el, event);
    }
  }

  function splitStatements(expr) {
    // Split on ; not inside parens/quotes
    const stmts = [];
    let depth = 0, inStr = false, strChar = '', cur = '';
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (inStr) {
        cur += ch;
        if (ch === strChar && expr[i - 1] !== '\\') inStr = false;
      } else if (ch === '"' || ch === "'") {
        inStr = true; strChar = ch; cur += ch;
      } else if (ch === '(' || ch === '[') {
        depth++; cur += ch;
      } else if (ch === ')' || ch === ']') {
        depth--; cur += ch;
      } else if (ch === ';' && depth === 0) {
        if (cur.trim()) stmts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) stmts.push(cur.trim());
    return stmts;
  }

  function dispatchOne(stmt, el, event) {
    if (!stmt) return;

    // ── Special cases ─────────────────────────────────────────────────────────

    // event.stopPropagation()
    if (stmt === 'event.stopPropagation()' || stmt === 'event.stopPropagation') {
      event.stopPropagation(); return;
    }
    // event.preventDefault()
    if (stmt === 'event.preventDefault()') { event.preventDefault(); return; }

    // window.print()
    if (stmt === 'window.print()') { window.print(); return; }

    // this.focus()
    if (stmt === 'this.focus()') { el.focus(); return; }

    // Style assignments: this.style.background='val'
    const styleM = stmt.match(/^this\.style\.(\w+)=(['"])(.*?)\2$/);
    if (styleM) { el.style[styleM[1]] = styleM[3]; return; }

    // Variable assignments: ytdStripHovered=true / ytdStripHovered=false
    const assignM = stmt.match(/^(\w+)=(true|false|null|undefined|-?\d+(?:\.\d+)?|'[^']*'|"[^"]*")$/);
    if (assignM) {
      window[assignM[1]] = coerceArg(assignM[2]);
      return;
    }

    // if(event.target===this)closeFn()
    const ifTargetM = stmt.match(/^if\(event\.target===this\)(\w+)\(\)$/);
    if (ifTargetM) {
      if (event.target === el && typeof window[ifTargetM[1]] === 'function') {
        window[ifTargetM[1]]();
      }
      return;
    }

    // if(event.key==='Enter')fn() OR if(event.key==='Enter'){stmt1;stmt2;}
    const ifKeyM = stmt.match(/^if\(event\.key===(['"])(.*?)\1\)(.+)$/s);
    if (ifKeyM) {
      if (event.key === ifKeyM[2]) {
        let body = ifKeyM[3].trim();
        if (body.startsWith('{') && body.endsWith('}')) body = body.slice(1, -1);
        splitStatements(body).forEach(s => dispatchOne(s, el, event));
      }
      return;
    }

    // if(event.key!=='Enter') ...
    const ifKeyNotM = stmt.match(/^if\(event\.key!==(['"])(.*?)\1\)(.+)$/s);
    if (ifKeyNotM) {
      if (event.key !== ifKeyNotM[2]) {
        let body = ifKeyNotM[3].trim();
        if (body.startsWith('{') && body.endsWith('}')) body = body.slice(1, -1);
        splitStatements(body).forEach(s => dispatchOne(s, el, event));
      }
      return;
    }

    // document.getElementById('id').classList.remove('cls')
    const clsRemM = stmt.match(/^document\.getElementById\(['"]([^'"]+)['"]\)\.classList\.remove\(['"]([^'"]+)['"]\)$/);
    if (clsRemM) {
      const el2 = document.getElementById(clsRemM[1]);
      if (el2) el2.classList.remove(clsRemM[2]);
      return;
    }

    // document.getElementById('id').classList.add('cls')
    const clsAddM = stmt.match(/^document\.getElementById\(['"]([^'"]+)['"]\)\.classList\.add\(['"]([^'"]+)['"]\)$/);
    if (clsAddM) {
      const el2 = document.getElementById(clsAddM[1]);
      if (el2) el2.classList.add(clsAddM[2]);
      return;
    }

    // document.getElementById('id').click()
    const idClickM = stmt.match(/^document\.getElementById\(['"]([^'"]+)['"]\)\.click\(\)$/);
    if (idClickM) {
      const el2 = document.getElementById(idClickM[1]);
      if (el2) el2.click();
      return;
    }

    // document.getElementById('id').focus()
    const idFocusM = stmt.match(/^document\.getElementById\(['"]([^'"]+)['"]\)\.focus\(\)$/);
    if (idFocusM) {
      const el2 = document.getElementById(idFocusM[1]);
      if (el2) el2.focus();
      return;
    }

    // document.getElementById('id').property = 'value'  (textContent, value, innerHTML, className, etc.)
    const idPropM = stmt.match(/^document\.getElementById\(['"]([^'"]+)['"]\)\.(\w+)=(['"])(.*?)\3$/s);
    if (idPropM) {
      const el2 = document.getElementById(idPropM[1]);
      if (el2) el2[idPropM[2]] = idPropM[4];
      return;
    }

    // document.getElementById('id').property = false/true/number
    const idPropBoolM = stmt.match(/^document\.getElementById\(['"]([^'"]+)['"]\)\.(\w+)=(true|false|null|-?\d+(?:\.\d+)?)$/);
    if (idPropBoolM) {
      const el2 = document.getElementById(idPropBoolM[1]);
      if (el2) el2[idPropBoolM[2]] = coerceArg(idPropBoolM[3]);
      return;
    }

    // ── Standard function call ─────────────────────────────────────────────────
    const parsed = parseCall(stmt);
    if (!parsed) {
      console.warn('[events] Cannot dispatch:', stmt);
      return;
    }

    // Resolve dotted names like "window.fn" (rare)
    let fn;
    if (parsed.fn.includes('.')) {
      const parts = parsed.fn.split('.');
      fn = window;
      for (const p of parts) fn = fn?.[p];
    } else {
      fn = window[parsed.fn];
    }

    if (typeof fn !== 'function') {
      console.warn('[events] Not a function:', parsed.fn, '— expr:', stmt);
      return;
    }

    // Resolve special arg tokens
    const resolvedArgs = parsed.args.map(a => {
      if (a === 'this') return el;
      if (a === 'event') return event;
      if (a === 'this.value') return el.value;
      if (a === 'this.checked') return el.checked;
      if (typeof a === 'string') {
        // this.closest('tr') — resolve to the nearest matching ancestor element
        const cm = a.match(/^this\.closest\((['"])(.+)\1\)$/);
        if (cm) return el.closest(cm[2]);
      }
      if (a === 'this.dataset.key') return el.dataset.key;
      if (typeof a === 'string' && a.startsWith('this.dataset.')) return el.dataset[a.slice(13)];
      if (typeof a === 'string' && a.startsWith('parseInt(') && a.endsWith(')')) {
        const inner = a.slice(9, -1);
        const src = inner === 'this.value' ? el.value : inner;
        return parseInt(src, 10);
      }
      return a;
    });

    fn(...resolvedArgs);
  }

  // ── Attach delegated listeners ───────────────────────────────────────────────

  // Map from event name → list of data attributes to check (in priority order)
  const EVENT_MAP = {
    'click':       ['data-ph-click',      'data-action'],
    'change':      ['data-ph-change',     'data-change'],
    'input':       ['data-ph-input',      'data-input'],
    'keydown':     ['data-ph-keydown',    'data-keydown'],
    'keyup':       ['data-ph-keyup',      'data-keyup'],
    'mouseenter':  ['data-ph-mouseenter', 'data-mouseenter'],
    'mouseleave':  ['data-ph-mouseleave', 'data-mouseleave'],
    'focus':       ['data-ph-focus',      'data-focus'],
    'blur':        ['data-ph-blur',       'data-blur'],
  };

  function handleEvent(evtName, event) {
    const attrs = EVENT_MAP[evtName] || [];
    // Walk up the DOM from the event target to find a handler
    let el = event.target;
    while (el && el !== document) {
      for (const attr of attrs) {
        const expr = el.getAttribute(attr);
        if (expr) {
          dispatch(expr, el, event);
          return;
        }
      }
      el = el.parentElement;
    }
  }

  // Use capture:false for click/change/input; capture:true for mouseenter/leave
  document.addEventListener('click',      e => handleEvent('click', e),      false);
  document.addEventListener('change',     e => handleEvent('change', e),     false);
  document.addEventListener('input',      e => handleEvent('input', e),      false);
  document.addEventListener('keydown',    e => handleEvent('keydown', e),    false);
  document.addEventListener('keyup',      e => handleEvent('keyup', e),      false);
  document.addEventListener('focus',      e => handleEvent('focus', e),      true);
  document.addEventListener('blur',       e => handleEvent('blur', e),       true);
  document.addEventListener('mouseenter', e => handleEvent('mouseenter', e), true);
  document.addEventListener('mouseleave', e => handleEvent('mouseleave', e), true);

  console.log('[ProgressHub] Event delegation dispatcher active');
})();
