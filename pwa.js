/* Progress Hub: install as desktop app (PWA). */
(function () {
  'use strict';
  var deferred = null;
  var standalone = function () {
    return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: window-controls-overlay)').matches || window.navigator.standalone === true;
  };
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  function refresh() {
    var btn = document.getElementById('pwa-install-btn'), note = document.getElementById('pwa-install-note');
    if (!btn) return;
    if (standalone()) { btn.style.display = 'none'; if (note) note.textContent = 'Running as an installed app.'; return; }
    btn.style.display = deferred ? '' : 'none';
    if (note) note.textContent = deferred ? 'Install Progress Hub as a desktop app with its own window.' :
      'To install: use the install icon in the address bar, or the browser menu → Install Progress Hub / Add to desktop.';
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; refresh(); });
  window.addEventListener('appinstalled', function () { deferred = null; refresh(); });
  window.phInstallApp = function () {
    if (!deferred) { refresh(); return; }
    deferred.prompt();
    deferred.userChoice.then(function () { deferred = null; refresh(); });
  };
  document.addEventListener('DOMContentLoaded', refresh);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-ph-click*="openAbout"]')) setTimeout(refresh, 50); });
})();
