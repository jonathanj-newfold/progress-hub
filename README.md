# Progress Hub (web)
Personal KPI tracker hosted on GitHub Pages. Sign-in and data run on Supabase; each person only sees their own data.
Device settings (theme, lock screen) stay per browser.

## Install as a desktop app
Open the hosted site in Chrome or Edge, then click the install icon in the address bar (or About → Install). It opens in its own window with its own taskbar/Start menu icon. Needs HTTPS (GitHub Pages is fine). After deploying, files update automatically on next launch.

## Guided tour
New users (a device with no data yet) see a welcome card: "Start the tour" or "Explore on my own". The tour can be replayed anytime from the sidebar ("Take a tour") or Settings → About. Whether it was offered is remembered per device (`kpi_tour_done`).

## Survey paste format note
In pasted surveys, `PASS` in the "other comments" position means the customer had no other comments or suggestions. It is not a pass/fail result.
