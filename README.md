# FitCut

A 16-week recomp tracker: diet, morning weight, progressive overload, and a cut engine
that only tightens the deficit when the scale says it has to.

Live at **[naityik.in](https://naityik.in)**.

Built as a multi-user application from the first commit — every row is scoped to a user
and protected by row-level security, even though there is one user today.

---

## Getting it running

```bash
npm install
cp .env.example .env      # fill in your Supabase URL + anon key
npm run dev
```

### Supabase setup

1. Create a project at supabase.com.
2. SQL Editor → paste all of `supabase/schema.sql` → run. It is idempotent, so re-running
   after a change is safe.
3. Authentication → Providers → enable **Email**. Google is wired up on the auth context
   but its button is not rendered; re-enabling it is a UI-only change in `AuthPage`.
4. Authentication → URL Configuration → add every origin the app is served from —
   `http://localhost:5173` and your deployed URL. Sign-in fails silently against an
   origin that is not listed.
5. Copy the Project URL and the public key into `.env`. Either the legacy `anon` JWT or a
   newer `sb_publishable_…` key works.

Once your own account exists, turn **Allow new users to sign up** off. Otherwise anyone
who finds the deployed URL can create rows in your database.

The `progress-photos` storage bucket and its policies are created by the same script.

### The food estimator (optional)

Custom foods can have their macros estimated. The API key lives on the server, never in
the browser:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy estimate-food
```

If the function is not deployed, the dialog says so and falls back to manual entry.
Logging food never depends on it.

### Deploying

Any static host works. `vercel.json` carries a catch-all rewrite to `index.html`, without
which a refresh on `/food` or `/weight` 404s — the app routes client-side.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment, scoped to
production. **Vite inlines `VITE_*` at build time**, so the values are frozen into the
bundle when it is built: adding them to a host after a deploy changes nothing until a new
build runs, and saving them does not itself trigger one.

If the deployed site shows the setup screen, it names which of the two variables was
missing when the bundle was built. That is a build-time fact, not a runtime one — no
amount of reloading will change it.

---

## First run

On first sign-in the app seeds, idempotently:

- a 16-week phase starting **5 Aug 2026**
- the five fixed meals and their items
- a starter push / pull / legs exercise library
- the baseline rung of the ladder (2,400 kcal, no cardio)

Everything seeded is editable afterwards. `src/constants/` is only read once.

---

## How the cut engine works

Written as pure functions in `src/lib/cutLogic.ts` so the rules can be tested and later
reused by an edge function.

| Weekly average delta | Status | Action |
|---|---|---|
| ≥ 0.30 kg | Strong | Hold |
| 0.15 – 0.29 kg | Progress | Hold |
| < 0.15 kg | Plateau | Take the next rung |

Guards, in the order they are checked: weeks 1–2 are ignored (water and glycogen); a week
with fewer than 4 weigh-ins is never judged; every rung holds for 14 days.

The ladder alternates diet and cardio and stops at 2,100 kcal + 300 kcal of running:

```
0  2400              4  2200  +200 cardio
1  2300              5  2100  +200 cardio
2  2300  +100        6  2100  +300 cardio   ← ceiling
3  2200  +100
```

Every recommendation carries its reasoning. `Recommendation.because` is a list of plain
sentences, and the UI renders all of them — the coach can always say why.

---

## Structure

```
src/
  components/     ui/ primitives · layout/ shell + date bar · charts/ rings + sparkline
  constants/      seed plan, seed exercises, ladder definition
  features/       auth · plan · food · weight · workout · dashboard · settings
  hooks/          cross-feature hooks
  lib/            supabase client, date maths, nutrition maths, cut engine
  types/          database row types, domain types
supabase/
  schema.sql      tables, RLS, triggers, storage bucket
  functions/      edge functions
```

A feature folder owns its data hook, its components and its page. Nothing outside a
feature imports its internals except its page and its hook.

### Conventions worth knowing

- **Dates** are `yyyy-MM-dd` strings in local time. Never `toISOString()` — that shifts the
  day for a 5:30 am weigh-in.
- **The viewed day lives in the URL** (`?d=2026-08-14`). That is the entire "edit the past"
  feature: no day is locked, and the same date carries between tabs.
- **There is no save button.** Text fields commit on blur and Enter; checkboxes commit
  immediately and optimistically.
- **Exercise units never convert.** `unit` is a property of the exercise, so a lift entered
  in lb is stored and displayed in lb forever.

### Adding a module later

Anything day-shaped (water, sleep, steps, supplements) goes in `daily_metrics` — one row
per user/day/key — with no migration. Add a feature folder, a hook that reads that key,
and a card. Nothing in Phase 1 has to change.

---

## Build phases

- **Phase 1 — done.** Auth, Supabase, navigation, dashboard, food, workout logging, weight
  logging, the cut engine, persistence, responsive UI.
- **Phase 2 — next.** Exercise analytics, 1RM and volume charts, PRs, progress photos.
- **Phase 3.** AI coach: pattern and plateau detection across food, weight and lifts.
