# Progress Hub — Chrome Extension

KPI tracker. Tracks CSAT, Agent Resolution, AHT, and more. Opens as its own window from the toolbar icon or the **Alt+T** shortcut — not tied to the new-tab page.

## Installation (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked**
4. Select the `progress-hub-extension` folder
5. Click the toolbar icon (or press **Alt+T**) — Progress Hub opens in its own window. Triggering it again from any browser window brings that same window to you instead of opening a duplicate.

## Data Storage

All your data is stored in **`chrome.storage.local`** (not localStorage), so it:
- Persists across browser restarts
- Is scoped to this extension only
- Can be backed up via the app's built-in JSON export

## Migration from the HTML file version

If you have data in the standalone HTML file:
1. Open your old HTML file
2. Go to **Import/Export → Export JSON**
3. In the extension, go to **Survey Data → Import JSON**
4. Paste the exported JSON and import

## Notes

- The lock screen password is the same as in the original HTML file
- Google Fonts (Inter + JetBrains Mono) are loaded from the web; works offline with system fallback fonts
- All themes and settings persist via chrome.storage.local

## Project structure

```
progress-hub-extension/
├── manifest.json
├── newtab.html
├── background.js
├── storage-shim.js
├── events.js                        (event delegation — click/change handlers)
├── css/
│   ├── themes.css                   (:root tokens + all color/photo themes)
│   └── components.css               (layout, cards, tables, forms, modals, animations)
└── js/
    ├── app-01-core-dashboard.js     (state, thresholds, AHT import, heatmap, personal bests, YTD)
    ├── app-02-survey-analytics.js   (month-over-month, tile snippets, survey import/detection)
    ├── app-03-modals-badges.js      (detail modals, theme system, forecast, sparklines)
    ├── app-04-interactions-init.js  (reflections, keyboard shortcuts, filters, lock screen, init)
    ├── app-05-reel-picker.js        (scrollable reel/picker UI component)
    ├── app-06-unsaved-guard.js      (Save / Discard / Keep editing prompt on Esc or click-outside)
    ├── app-07-simulator.js          (what-if simulator)
    ├── app-08-insights.js           (Insights page + dashboard "Insight of the day" — rule-based, no network)
    └── app-09-nav-history.js        (Back / Forward: right-click menu, Alt+←/→, mouse side buttons)
```

`js/app-*.js` are loaded as plain scripts (not ES modules) in the order above, so they share one
global scope exactly like the original single `app.js` file did — splitting them was a pure
cut-and-paste with no logic changes. Keep that load order if you ever edit `newtab.html`.
