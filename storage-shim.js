/**
 * storage-shim.js
 * Replaces window.localStorage with a synchronous in-memory cache
 * that is backed by chrome.storage.local. Must be loaded BEFORE
 * newtab.html's own scripts run (injected via <script> tag at top of <head>).
 *
 * Strategy:
 *  1. On page load, ALL keys are loaded from chrome.storage.local into _cache.
 *  2. All localStorage.getItem / setItem / removeItem / clear calls hit _cache instantly.
 *  3. Every write is also pushed to chrome.storage.local asynchronously.
 *  4. We expose a Promise (window.__storageReady) that resolves once the cache
 *     is hydrated — the app's init code waits for it before running.
 */

(function () {
  'use strict';

  // In-memory synchronous cache
  const _cache = {};

  // Build a fake localStorage-compatible object backed by _cache + chrome.storage.local
  const chromeStorage = {
    getItem(key) {
      const v = _cache[key];
      return v === undefined ? null : v;
    },
    setItem(key, value) {
      const str = String(value);
      _cache[key] = str;
      // Fire-and-forget async write to chrome.storage.local
      chrome.storage.local.set({ [key]: str });
    },
    removeItem(key) {
      delete _cache[key];
      chrome.storage.local.remove(key);
    },
    clear() {
      const keys = Object.keys(_cache);
      keys.forEach(k => delete _cache[k]);
      chrome.storage.local.remove(keys);
    },
    key(index) {
      return Object.keys(_cache)[index] ?? null;
    },
    get length() {
      return Object.keys(_cache).length;
    },
    // Make it iterable the way the app uses it
    // (Object.keys(localStorage) — see "wdays-" scan)
    [Symbol.iterator]() {
      return Object.keys(_cache)[Symbol.iterator]();
    }
  };

  // Proxy so that Object.keys(localStorage) works (the app does this for wdays- scan)
  const proxy = new Proxy(chromeStorage, {
    ownKeys() {
      return Object.keys(_cache);
    },
    has(_, key) {
      return key in _cache || key in chromeStorage;
    },
    get(target, key) {
      // Integer index access (localStorage[0])
      if (typeof key === 'string' && /^\d+$/.test(key)) {
        return _cache[target.key(parseInt(key))];
      }
      // Named key access (localStorage['kpi_theme'])
      if (
        typeof key === 'string' &&
        !(key in target) &&
        !['length', 'getItem', 'setItem', 'removeItem', 'clear', 'key'].includes(key)
      ) {
        const v = _cache[key];
        return v === undefined ? undefined : v;
      }
      const val = target[key];
      return typeof val === 'function' ? val.bind(target) : val;
    },
    set(target, key, value) {
      if (['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length'].includes(key)) {
        return false;
      }
      target.setItem(key, value);
      return true;
    },
    getOwnPropertyDescriptor(_, key) {
      if (key in _cache) {
        return { value: _cache[key], writable: true, enumerable: true, configurable: true };
      }
      return undefined;
    }
  });

  // Hydrate the cache from chrome.storage.local, then replace window.localStorage
  window.__storageReady = new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      if (chrome.runtime.lastError) {
        console.warn('[storage-shim] chrome.storage.local.get error:', chrome.runtime.lastError);
        resolve();
        return;
      }
      // Populate cache with everything stored
      Object.assign(_cache, items);
      resolve();
    });
  });

  // Replace localStorage globally BEFORE any app script runs
  try {
    Object.defineProperty(window, 'localStorage', {
      get: () => proxy,
      configurable: true
    });
  } catch (e) {
    // If defineProperty fails (unlikely in extension context), fall back to direct assign
    window.localStorage = proxy;
  }

  console.log('[ProgressHub] chrome.storage.local shim installed');
})();
