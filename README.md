# Principles Master — Teacher–Student Recall App

A premium, mobile-first web app for memorizing your 10 principles using **active recall**,
**spaced repetition**, and a friendly **Teacher–Student** quiz system. React + TypeScript +
Tailwind CSS, 100% client-side (no backend, no accounts) — all progress is saved to
`localStorage` on the device.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`). On Termux, the same
commands work — just make sure `node` and `npm` are installed (`pkg install nodejs`).

To access the dev server from your phone's browser when running elsewhere on the same
network, use the "Network" URL Vite prints instead of `localhost`.

### Build for production

```bash
npm run build
npm run preview
```

## What's inside

- **Home** — hero, the 3 memory groups (Who I Am / How I Work / My Work Principles), quick
  links to Practice, the 120-Second Challenge, and Review.
- **Practice** — 6 quiz modes (Keyword→English, English→Bangla, Fill in the Blank, Multiple
  Choice, Full Sentence Recall, Mixed), a 3-level hint system, optional speech recognition
  ("Speak Answer") and text-to-speech ("Listen"), and Teacher-style feedback bubbles.
- **Review** — automatically pulls in whatever is due or weak, so it's never empty.
- **120-Second Challenge** — free-recall sprint against the clock.
- **Full Test** — exam mode: recall all 10 in order, no hints, no visible list.
- **Dashboard / Progress** — mastery %, streaks, XP, badges, weakest/strongest principles,
  and a full per-principle spaced-repetition breakdown.
- **Settings** — dark mode, pronunciation, auto-next, sound effects, strict matching, and a
  guarded "Reset Progress" action.
- **Installable (PWA)** — the app ships a web manifest and service worker (via
  `vite-plugin-pwa`), so Chrome and other browsers offer an "Install app" option that adds it
  to the home screen with its own icon and a standalone (no browser chrome) window. It also
  works offline after the first visit.
- **Competition Mode** — a separate, server-backed real-time quiz competition (registration,
  scheduled start, countdown, server-authoritative scoring and ranking, admin dashboard) built
  on Supabase. Requires its own one-time setup — see **[COMPETITION_SETUP.md](./COMPETITION_SETUP.md)**.
  Practice Mode works with zero configuration either way; Competition Mode simply shows a
  "not configured yet" message until you complete that setup.

## Spaced repetition

Each principle tracks `correctCount`, `incorrectCount`, `lastReviewed`, `nextReview`,
`difficulty`, and a computed `masteryScore`. Review intervals grow with consecutive correct
answers (same session → 1 day → 3 days → 7 days → 15 days) and reset to "review again now"
on a miss. See `src/lib/srs.ts`.

## Answer matching

Answers are normalized (case, punctuation, spacing) and compared with a Levenshtein-distance
tolerance plus a word-overlap check for sentences, so small typos are marked **🟡 Almost
correct** instead of flat-out wrong. Turn on "Strict Answer Matching" in Settings to require
exact wording. See `src/lib/answerMatching.ts`.

## Editing the principles

All content lives in one place: `src/data/principles.ts` (the 10 principles, Bangla text,
pronunciation, and memory tips) and the `PRINCIPLE_GROUPS` array right below it.
