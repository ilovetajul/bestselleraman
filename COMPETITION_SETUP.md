# Competition Mode — Setup & Deployment Guide

This covers everything needed to take Competition Mode from code to a live,
working competition: creating the Supabase project, running the database
migration, deploying the Edge Functions, connecting the frontend, deploying
to Netlify, creating your first admin, and running your first contest.

Practice Mode (the original app) needs none of this — it keeps working with
zero configuration, exactly as before. Competition Mode is additive and
shows a clear "not configured yet" message anywhere it's used until you
complete the steps below.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick any name/region/password (save the database password somewhere safe).
3. Wait for provisioning to finish (~2 minutes).
4. In **Project Settings → API**, copy:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon / public** key → this is `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → you will need this once, in step 3 below. Never
     put it in Netlify or in the frontend.

## 2. Run the database migration

1. In the Supabase dashboard, open **SQL Editor**.
2. Open `supabase/migrations/0001_competition_schema.sql` from this project,
   copy its full contents, paste into a new query, and run it.
3. Confirm it succeeded: **Table Editor** should now show `contests`,
   `contest_questions`, `participants`, `submissions`, `admin_users`, plus
   the `contest_prompts`, `public_results`, and `admin_leaderboard` views.

This creates every table, index, view, and Row Level Security policy in one
pass. It's written to run once against a fresh project — if you need to
re-run it, drop the created objects first.

## 3. Deploy the Edge Functions

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you
don't have it, then from the project root:

```bash
supabase login
supabase link --project-ref your-project-ref   # found in your project URL
supabase functions deploy contest-status
supabase functions deploy register-participant
supabase functions deploy submit-answers
supabase functions deploy get-my-result
supabase functions deploy admin-create-contest
supabase functions deploy admin-set-status
supabase functions deploy admin-publish-results
supabase functions deploy admin-reset-contest
supabase functions deploy admin-set-integrity
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically
inside every Edge Function's runtime — you don't need to set these
yourself. You do not need to pass `--no-verify-jwt`; the functions handle
their own authorization (admin functions check the caller's JWT against
`admin_users` internally; participant-facing functions are intentionally
public but verify contest/participant state server-side).

## 4. Create your first admin user

There's no self-serve "become admin" flow, on purpose.

1. Supabase dashboard → **Authentication → Users → Add user**. Create a user
   with your admin email + a password (use "Auto Confirm User").
2. Copy that user's **UID**.
3. Back in **SQL Editor**, run:
   ```sql
   insert into admin_users (user_id, email)
   values ('paste-the-uid-here', 'admin@example.com');
   ```
4. That's it — this account can now sign in at `/admin`.

Repeat step 3 (with a different UID) for any additional admins.

## 5. Configure the frontend

Copy `.env.example` to `.env` and fill in the URL/anon key from step 1:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Run locally to verify:

```bash
npm install
npm run dev
```

Visit `/` for the normal app (Competition now appears in the nav), and
`/admin` for the admin dashboard.

## 6. Deploy to Netlify

1. Push this project to a Git repo and connect it in Netlify (or drag-and-drop
   a `npm run build` output — Git-based deploys are recommended so `/admin`
   works correctly, since it relies on the `public/_redirects` file being
   included in the build).
2. Build command: `npm run build`. Publish directory: `dist`.
3. **Site settings → Environment variables** — add the same two variables
   from step 5 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Never add the
   service role key here.
4. Deploy. Visit `https://your-site.netlify.app/admin` and sign in with the
   admin account from step 4.

If `/admin` 404s on a direct visit or refresh, confirm `public/_redirects`
made it into the deploy (it should — Vite copies everything in `public/` to
the build output automatically).

## 7. Create your first competition

1. Sign in at `/admin`.
2. **New Competition** → fill in name, start/end date & time (entered and
   displayed in **Asia/Dhaka**, converted to UTC automatically for storage),
   and duration in minutes.
3. **Save Draft** to keep it hidden while you finish setting it up, or
   **Schedule Competition** to make it visible to participants immediately
   (they'll see the waiting/countdown screen until the start time).
4. The 10 official questions are seeded automatically from the fixed
   BESTSELLER answer key — there's nothing to configure there.
5. On the day: the contest goes live automatically at `start_at` **only if**
   you've clicked into the contest and its status is `scheduled`— the
   `status` field itself doesn't flip on a timer by itself; either click
   **Start Now** right at the scheduled time, or see the note on cron below.
6. When time's up: click **End Competition**, then **Publish Results** once
   you're satisfied (results stay admin-only until published).

### Optional: fully automatic start/end

The functions enforce timing strictly (`submit-answers` rejects anything
outside `start_at`–`end_at` regardless of the `status` field), but the
`status` column itself is admin-controlled, not cron-driven, in this
implementation. For a fully hands-off schedule, set up a scheduled job
(e.g. a [Supabase Cron](https://supabase.com/docs/guides/functions/schedule-functions)
job calling `admin-set-status` at the right times, or an external cron
hitting it) so you don't have to click Start Now / End Competition manually.
This wasn't built in by default since it adds moving parts (a cron secret,
a scheduling UI) beyond what was asked for — happy to add it if you want it.

## 8. How the ranking algorithm works

Every ranking query (the admin leaderboard, the public results view, and
`get-my-result`) uses the same ordering:

```sql
order by correct_count desc, submitted_at asc, submission_seq asc
```

- **`correct_count desc`** — more correct answers always wins, first.
- **`submitted_at asc`** — the server's own timestamp (never the device's),
  set by the database default `now()` at the moment `submit-answers`
  inserts the row. The client-supplied `startedAt` is stored separately and
  only used for the informational "completion time" stat.
- **`submission_seq asc`** — a gapless, auto-incrementing tiebreaker
  (`generated always as identity`) for the vanishingly rare case where two
  submissions land in the same timestamp at whatever precision Postgres
  stores. This guarantees deterministic ordering — never a random pick.

## 9. Testing against your checklist

Once deployed, here's how to exercise each scenario from the original spec:

| # | Scenario | How to trigger it |
|---|---|---|
| 1–3 | Correct / partial / wrong answers | Register, submit a mix of right/wrong answers, check the score |
| 4–5 | Case/spacing tolerance | Submit `"we are honest "` (lowercase, trailing space) — should score as correct |
| 6 | Paste blocked + logged | Try pasting into an answer field during Live — should be blocked; open the participant's detail modal in `/admin` afterward to see the paste count |
| 7 | Double submission blocked | Submit once, then try again with the same browser — server returns 409 |
| 8 | Late submission rejected | Manually call `submit-answers` after `end_at` (e.g. via curl) — expect a 409 |
| 9 | Device clock changed | Change your phone's clock during the contest — timing is unaffected since the server, not the device, decides |
| 10 | Tie-break by earlier submission | Have two test accounts both score 10/10, seconds apart — the earlier `submitted_at` ranks first |
| 11 | Refresh recovery | Register, then refresh the page mid-competition — you should land back where you were, not see a blank form |
| 12 | Pre-start waiting screen | Register before `start_at` — see the countdown, not the answer form |
| 13 | Admin URL protected | Visit `/admin` while signed out, or signed in as a non-admin account — see the login screen / access-denied screen respectively |
| 14 | Official answers not queryable | Try `supabase.from('contest_questions').select('*')` from the browser console — RLS returns nothing (no policy grants it) |
| 15 | Load — many submissions | The unique constraint on `submissions.participant_id` plus Postgres's own transaction handling prevents duplicate valid submissions even under concurrent load; I have not load-tested 250+ concurrent submissions myself, since that requires a live environment I don't have access to — recommend a dry run with a handful of real devices before a large live event |

## 10. What I could not verify myself

I built and carefully reviewed every file in this system (and caught/fixed
two real bugs along the way — a view permission bug that would have broken
the public results page, and a stale-closure bug in the countdown timer
that could have corrupted auto-submitted answers). But I have no network
access in the environment I built this in, and provisioning a live Supabase
project requires your account regardless — so nothing here has been
exercised against a real, running database. Please run through section 9's
table on your own Supabase project (a scheduled test contest is a good
first run) before relying on this for a real competition with real
participants.
