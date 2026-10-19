// background.js
// Opens Progress Hub as its own popup window instead of a browser tab —
// same approach as Case Notes Helper. There's only ever one Progress Hub
// window globally: whichever browser window you trigger Alt+T (or the
// toolbar icon) from, that one window gets moved over and focused, rather
// than each browser window growing its own tab. Both the toolbar click and
// the Alt+T shortcut ("_execute_action", with no default_popup set) land
// here as an action click.

const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 860;
const STORAGE_KEY = "progressHubWindowId";

// A plain JS variable would get wiped every time this service worker goes
// idle and unloads (MV3 workers don't stay alive), so the window id is kept
// in chrome.storage.session instead — that survives worker restarts and
// only clears when the browser itself closes.

let opening = false; // in-memory lock is fine here: only matters within one active worker lifetime, to stop a double-fire (e.g. rapid double shortcut press) from racing

async function getStoredWindowId() {
  const data = await chrome.storage.session.get(STORAGE_KEY);
  return typeof data[STORAGE_KEY] === "number" ? data[STORAGE_KEY] : null;
}

async function setStoredWindowId(id) {
  if (id === null) {
    await chrome.storage.session.remove(STORAGE_KEY);
  } else {
    await chrome.storage.session.set({ [STORAGE_KEY]: id });
  }
}

async function openOrFocusProgressHubWindow(sourceWindowId) {
  if (opening) return;
  opening = true;
  try {
    // Figure out where the window that triggered this lives, so Progress
    // Hub can be centered over it. Without this, "focus" only reorders
    // stacking on Progress Hub's own monitor — it never crosses over to
    // whichever screen (or window) you're actually working on.
    let targetLeft = null;
    let targetTop = null;
    if (typeof sourceWindowId === "number") {
      try {
        const sourceWin = await chrome.windows.get(sourceWindowId);
        if (sourceWin && typeof sourceWin.left === "number") {
          targetLeft = Math.round(sourceWin.left + (sourceWin.width - WINDOW_WIDTH) / 2);
          targetTop = Math.round(sourceWin.top + (sourceWin.height - WINDOW_HEIGHT) / 2);
        }
      } catch (e) {
        // source window info unavailable — just skip repositioning
      }
    }

    const existingId = await getStoredWindowId();
    if (existingId !== null) {
      try {
        const win = await chrome.windows.get(existingId);
        if (win) {
          // Restore to whatever state it was actually in (e.g. maximized)
          // rather than always forcing "normal", so a maximized window
          // doesn't get shrunk back down every time you switch to it.
          const restoreState = win.state === "minimized" ? "normal" : win.state;

          if (targetLeft !== null) {
            if (restoreState === "normal") {
              await chrome.windows.update(existingId, { left: targetLeft, top: targetTop });
            } else {
              // Chrome ignores left/top while a window is maximized or
              // fullscreen, and a maximized window stays maximized on
              // whichever monitor it's already on — so without this, a
              // maximized Progress Hub window never actually moves to a
              // different monitor/window, it just re-maximizes in place.
              // Drop it to normal, move it onto the target monitor, then
              // put it back into its original state so it re-maximizes
              // (or re-fullscreens) over there instead.
              await chrome.windows.update(existingId, {
                state: "normal",
                left: targetLeft,
                top: targetTop,
                width: WINDOW_WIDTH,
                height: WINDOW_HEIGHT
              });
              await chrome.windows.update(existingId, { state: restoreState });
            }
          }

          // A plain { focused: true } update is often ignored by Windows'
          // focus-stealing prevention when the request comes from a
          // background script rather than a direct user click on that
          // window — the taskbar icon flashes but the window doesn't
          // actually raise above whatever's active. Minimizing then
          // immediately restoring forces the OS to actually bring it to
          // the front (it keeps the position/state just set above).
          await chrome.windows.update(existingId, { state: "minimized" });
          await chrome.windows.update(existingId, { state: restoreState, focused: true });
          return;
        }
      } catch (e) {
        // window no longer exists — fall through and open a new one
        await setStoredWindowId(null);
      }
    }

    const created = await chrome.windows.create({
      url: chrome.runtime.getURL("newtab.html"),
      type: "popup",
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      left: targetLeft !== null ? targetLeft : undefined,
      top: targetTop !== null ? targetTop : undefined,
      focused: true
    });
    await setStoredWindowId(created.id);
  } finally {
    opening = false;
  }
}

chrome.action.onClicked.addListener((tab) => {
  openOrFocusProgressHubWindow(tab && tab.windowId);
});

chrome.windows.onRemoved.addListener(async (closedId) => {
  const existingId = await getStoredWindowId();
  if (closedId === existingId) {
    await setStoredWindowId(null);
  }
});
