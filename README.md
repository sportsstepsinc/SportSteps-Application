# SportsSteps

A prep companion for student athletes — hydration, food timing, weather, and gear checklists, with built-in support for autism, ADHD, mobility, visual, hearing, and chronic-condition needs.

## Run it locally

```
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

## Build for production / GitHub Pages

```
npm run build
```

This outputs a static site to `dist/`. Deploy that folder to GitHub Pages, Netlify, Vercel, or any static host.

## What's actually functional

- **Persistence** — your name, sport, theme, checklist, and events save to `localStorage` and reload automatically next visit.
- **Themes** — Vivid, Calm, Dark, and High Contrast. Onboarding suggests one based on the support needs you pick, and you can change it any time in Profile.
- **Live weather** — tap the refresh icon on Home to fetch real temperature and UV index for your location via the free [Open-Meteo](https://open-meteo.com) API (no API key needed). Requires the browser's location permission and a live internet connection.
- **Real browser notifications** — "Enable" in the Home reminders card requests actual OS-level notification permission; "Send test" fires a real notification with today's prep summary.
- **Dynamic calendar** — "Add event" on the Calendar tab appends a real event to state (and to your saved data).

## What still needs a backend if you take this further

- Actually sending **text or email** reminders (the toggles in Profile are saved preferences, not wired to a sending service — you'd add something like Twilio for SMS or SendGrid for email on a server).
- A real account system / login, if you want profiles to sync across devices instead of living in one browser.
- A real events database for the Nearby tab (currently a static example list).

## Tech

React 18 + Vite, Tailwind (via CDN in `index.html`, no build config needed), [lucide-react](https://lucide.dev) icons.
