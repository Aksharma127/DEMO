# Corridor Seven reorders: a working demo

A clickable concept for Corridor Seven Coffee Roasters. A customer gets a WhatsApp message a few days before their bag runs out, timed so the reorder makes the next Wednesday roast. Every reply flows into the roast plan.

All customers, cafes, orders and payments here are sample data. Coffee names and prices come from corridorseven.coffee.

Built by Akshit Sharma (asharma53858@gmail.com).

## Pages

| Path | What it shows |
| --- | --- |
| `/` | The live demo. Riya's week after a 250 g bag of Ratnagiri Peaberry arrives. You reply as her in a WhatsApp chat, move the days forward and watch the roastery view update. A second chat shows a cafe confirming its weekly order. |
| `/dashboard` | The roastery dashboard: the roast plan for each Wednesday (confirmed and expected kilos per coffee), batch tickets for the 12 kg drum, a run-out timeline for customers and cafe order status. It follows whatever you did in the demo. |
| `/dev` | For developers: the system map, an event log with sample webhook payloads, the three WhatsApp templates, the timing rules and what stays in Corridor Seven's own tools. |

## How the demo decides dates

The demo runs these rules on every render. The real service would apply the same ones:

```
grams_a_day = 15 g × cups a day            (V60; other brew methods have their own grams)
run_out     = delivered + floor(bag ÷ grams_a_day) days
roast       = latest Wednesday where roast + 3 days ≤ run_out − 1
remind_at   = roast − 2 days, 09:00 IST
cutoff      = 6 pm the day before the roast
```

Roast loss is taken as 16% for espresso roasts and 14% for filter roasts. Batches are 12 kg of green coffee.

If no roast can reach the customer in time (3 cups a day from a 250 g bag), the reminder goes for the first possible roast and suggests a 500 g bag.

## Project layout

```
index.html            live demo
dashboard.html        roastery dashboard
dev.html              under the hood
404.html              not-found page
assets/
  css/base.css        shared tokens, header, menu, section markers, footer, motion
  css/demo.css        demo page
  css/dashboard.css   dashboard page
  css/dev.css         dev page
  js/site.js          site menu, section markers, in-page nav, reveal on scroll, copy buttons
  js/demo.js          the simulation: Riya's chat, the cafe chat, days, roastery view
  js/dashboard.js     roast plan, batches, customers, cafes
  js/dev.js           system map packets and the event inspector
  fonts/              Archivo variable font (SIL Open Font License, see OFL.txt)
  img/                favicon, touch icon, link preview image
vercel.json           clean URLs and response headers
```

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies. The demo saves its state in `localStorage` under `c7-demo` so the dashboard can follow it.

## Run it locally

```
npx serve .
```

Then open http://localhost:3000. `serve` handles the clean URLs (`/dashboard`, `/dev`) the same way Vercel does.

## Deploy on Vercel

1. On vercel.com, choose **Add New → Project** and import this repository.
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy.

Once the site has its final domain, change the `og:image` tag in the three HTML files to the full URL (for example `https://your-domain.vercel.app/assets/img/og.png`). WhatsApp and LinkedIn previews need the full URL to show the image.

## Keyboard

On the demo page: `→` or `N` moves to the next day, `1` `2` `3` tap the quick replies in the open chat. On the dashboard, left and right arrows move between tabs once a tab has focus.

## Accessibility and motion

Every control works with a keyboard and has a visible focus ring. Animations are turned off for anyone with reduced motion set in their system settings.
