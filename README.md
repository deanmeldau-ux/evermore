# Evermore

*Plan the day you'll remember forever.* — a wedding planning platform for couples.

Early preview MVP. Static, mobile-first, no build step.

## Pages
- `index.html` — brand landing page
- `create.html` — couple registration + invite builder
- `invite.html` — the couple's shareable wedding invitation (`?w=<id>`)
- `rsvp.html` — guest RSVP form (`?w=<id>`)
- `dashboard.html` — couple's RSVP tracking command center (`?w=<id>`)
- `scan.html` — on-the-day QR check-in + guest photo wall
- `assets/style.css`, `assets/app.js` — shared design system + front-end data layer

## Try the demo
Open `dashboard.html?w=demo` for a populated example, or `create.html` to build a new one.

## Status
This preview stores data in the browser (localStorage) so the full flow is clickable.
**Next step:** a lightweight backend so RSVPs persist centrally across all couples and devices.

Launch vendor: **Cape Premier Audio** (premium sound / speaker hire).
