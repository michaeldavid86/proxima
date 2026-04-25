# PROXIMA — RPO Trainer (v1.2 Spiral Edition)

Browser-based orbital rendezvous and proximity operations trainer.

- **Orbital Primer** (Mission 0) plus four playable missions spanning LEO
  rendezvous, GEO quiet inspection, contested approach, and a two-asset
  handoff.
- Every mission is launchable in **Play** (free-play sandbox) or **Watch**
  (scripted, narrated guided vignette with teaching pauses and inline
  diagrams).
- **Historical Ops Library** (v1.2): five 2-3 minute classroom drop-ins
  covering Gemini VII/VI-A (1965), Orbital Express (2007), Luch / Olymp
  pattern-of-life, SJ-21 and the Beidou tow (2022), and the March 2026
  GSSAP bracketed observation of Shijian-29. Each vignette ships with
  narration, citations, and three instructor discussion prompts.
- **Mission 4 "Handoff"** (v1.2): command two friendly inspectors in GEO
  and coordinate continuous 85% observation coverage of a target over four
  hours sim time.
- **Operational Life** gauge translates delta-V into months / years of
  spacecraft life so cadets feel the real cost of every burn.
- **Recommended Actions** highlight on the tactical panel nudges players
  toward mission-appropriate choices without disabling anything.
- **AI Coach** (v1.2, disabled by default): a Vercel Serverless Function
  at `/api/coach` runs a Claude Haiku 4.5 debrief against the mission log
  and returns a doctrinally-grounded after-action review. The infrastructure
  is fully wired but gated behind a feature flag; see "Enabling the AI
  Coach" below to turn it on.

All scenarios are drawn from public sources. No classified material, no
external API calls at runtime except the optional Coach endpoint.

## Quick start

```sh
npm install      # once
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run test     # physics engine test suite (Vitest)
```

Supported browsers: modern Chrome, Firefox, Safari. No mobile layout.

## Deploy to Vercel

From this directory:

```sh
npm install -g vercel    # if not already installed
vercel login
vercel                   # first time: confirm defaults
vercel --prod            # promote to production
```

Vercel auto-detects the Vite build (`npm run build` → `dist`). A `vercel.json`
in this project declares the `/api/coach` function and its timeout.

### Enabling the AI Coach

The Coach ships disabled. All the code is in place; two environment
variables turn it on:

1. **Get an Anthropic API key** at https://console.anthropic.com (this is
   a developer-API billing account, separate from your Claude.ai
   subscription; free-tier credit is usually sufficient for a semester of
   classroom use).
2. **In your Vercel project → Settings → Environment Variables**, add both:
   - `ANTHROPIC_API_KEY` = your key from step 1
   - `VITE_COACH_ENABLED` = `true`
   Apply both to Production, Preview, and Development.
3. **Redeploy.** The "Debrief with Coach" button will now appear on every
   mission debrief (except Mission 0 and Historical vignettes).

To disable again, remove `VITE_COACH_ENABLED` (or set it to anything other
than `true`) and redeploy. The serverless function at `/api/coach` remains
deployed but is unreachable from the UI.

If `ANTHROPIC_API_KEY` is not set when the flag is on, clicking Coach
returns a clear "Coach unavailable" message to the cadet and does not
expose any server error detail.

### Cost expectations

At `claude-haiku-4-5` pricing, each coach request costs well under $0.01.
Typical classroom demo volume (20 cadets, 4 missions each) is pennies.
The payload is trimmed to the 20 most significant maneuvers and actions
and the 40 most recent link-status samples, so it stays under 4 KB.

### Model swap

To step up model quality for a formal demo, open `api/coach.ts` and change
the `CLAUDE_MODEL` constant to `claude-sonnet-4-6`. Redeploy.

## Historical Ops Library (v1.2)

Five short vignettes for classroom drop-in use. Each is schematic (no physics
propagation) with hand-authored keyframes, narration, inline citations, and
three discussion prompts suitable for a 50-minute block.

- **H1 Gemini VII / VI-A** — the first rendezvous (December 1965)
- **H2 Orbital Express** — autonomous capture (2007)
- **H3 Luch / Olymp** — pattern of life in GEO
- **H4 SJ-21 and the Beidou Tow** — grapple and reposition (2022)
- **H5 GSSAP / Shijian-29** — reciprocal bracketed observation (March 2026)

Each vignette has an "Instructor view" toggle on the discussion prompt card
that reveals suggested answer notes, hidden by default in student view.

## Mission 4 — Handoff (v1.2)

Two friendly assets in GEO, one target, 85% coverage over four hours.
Cadets use **A** and **B** to switch active asset. Each burns from its
own propellant tank. Observation coverage is tracked live in the Telemetry
panel with a required threshold line and a hard-floor line.

Failure modes: coverage dropping below 50% at any point, either asset
exhausting propellant, or attribution crossing 100 on either asset.

## Watch mode

- From the main menu, click **Watch** on any mission tile (including the
  **Orbital Primer** — that one is Watch-only).
- The scenario runs on rails. Narration updates in the right panel as
  the script advances. At each teaching beat, the sim auto-pauses and a
  full-screen modal explains what just happened with an inline diagram.
- **WatchControls** (right sidebar) offer 0.5x / 1x / 2x / 4x speeds, a
  scrub bar, and a "Skip to next teaching pause" button.
- Player input surfaces (maneuver planner, RIC impulse panel, tactical
  action clicks) are disabled in Watch mode so the cadet cannot accidentally
  take control.
- v1.1 forward-scrubs only to already-fired waypoints; backward-scrub
  resets the sim and replays forward deterministically.

## Controls (in-mission)

- **Space** &nbsp; pause / run
- **1 / 2 / 3 / 4** &nbsp; time warp 1x / 10x / 100x / 1000x (Play mode)
- **M / P** &nbsp; switch Map / Proximity view
- **Esc / Enter / →** &nbsp; dismiss teaching modal (Watch mode)
- **Mouse wheel** &nbsp; zoom (Map view)
- **Drag** &nbsp; pan (Map view)
- **Click an orbit** &nbsp; snap a planned maneuver to that point (Map view)

The auto-switch to Proximity view kicks in inside 50 km.

## Architecture

```
src/
├── physics/          SI-unit physics engine. No React dependencies.
│   ├── constants.ts
│   ├── vec.ts        3-vector helpers
│   ├── orbital-elements.ts  COE <-> state vector
│   ├── kepler.ts     two-body Keplerian propagator
│   ├── maneuver.ts   impulsive burn helpers (incl. Tsiolkovsky)
│   ├── hohmann.ts    closed-form Hohmann transfer
│   ├── cw.ts         Clohessy–Wiltshire state transition
│   ├── frames.ts     ECI <-> RIC (Radial, In-track, Cross-track)
│   ├── link-budget.ts Friis equation + antenna pattern model
│   └── physics.test.ts (17 tests)
├── game/             simulation loop, turn resolution, scoring
│   ├── state.ts      Zustand store + types
│   ├── turn.ts       sim step, maneuver application, link resolution
│   ├── actions.ts    tactical action catalog (data-driven)
│   ├── actionRunner.ts   applies an action's state patch
│   ├── scoring.ts    pure success/failure evaluation
│   └── events.ts     seeded RNG + clock formatter
├── missions/         mission data files
│   ├── types.ts
│   ├── m1_first_light.ts
│   ├── m2_quiet_inspector.ts
│   ├── m3_contested_approach.ts
│   └── index.ts
├── ui/
│   ├── App.tsx       screen router
│   ├── MainMenu.tsx / Brief.tsx / Loadout.tsx / Debrief.tsx
│   ├── GameScreen.tsx (top bar + canvas + aside + log strip)
│   ├── MapView.tsx   global orbital map (canvas 2D)
│   ├── ProxView.tsx  target-centered RIC view with CW propagation
│   ├── Telemetry.tsx / ActionPanel.tsx / TurnControls.tsx / LogStrip.tsx
│   ├── useSimLoop.ts requestAnimationFrame driver
│   └── components/   reusable atoms (Button, Panel, Gauge, Chip)
└── theme/colors.ts   mission-control palette
```

### Physics

- Keplerian propagation via Newton-Raphson on Kepler's equation.
- State vector ↔ classical orbital elements round-trip.
- Hohmann transfer closed-form delta-v (with a numerical delivery test).
- Clohessy-Wiltshire state transition matrix validated against the
  analytical along-track initial-velocity case.
- Friis link budget: FSPL at 10 GHz / 36,000 km tested to within 0.3 dB of
  the closed-form 203.6 dB reference.

### Game loop

A single `requestAnimationFrame` ticker advances sim time by
`realDt × timeWarp`. The step loops in sub-steps capped at 60 s, clamping
on scheduled maneuver times so impulses fire at the right instant. Adversary
script actions (Mission 3) fire inside the step at their scheduled times;
scoring runs every substep, and a Debrief is assembled when the mission
concludes.

### EW model (Mission 3)

The uplink-jam resolution pairs the Friis-based jammer path with a fixed
nominal ground-signal anchor (rather than computing ground-to-player FSPL
from real geometry — Earth-rotating horizon is out of scope for v1). The
defender's playbook applies discrete dB penalties to the jammer chain:

- `emcon` → forces denied (own transmitter muted)
- `point_away` → −15 dB on the jammer's contribution, −6 dB own signal
- `frequency_agility` → −10 dB on jammer for one turn, −3 dB own signal
- `hardening` → −3 dB on jammer

## Adding a mission

Create a new `src/missions/mN_*.ts` exporting a `Mission` conforming to
`src/missions/types.ts`, then add it to `src/missions/index.ts`. Missions
are pure data; no UI code is needed.

## Out of scope for v1

3D rendering, TLE import, multiplayer, audio, persistent accounts,
J2 / n-body perturbations, cislunar, mission editor, localization.

## Public sources

- Vallado, *Fundamentals of Astrodynamics and Applications* (4th ed.)
- Curtis, *Orbital Mechanics for Engineering Students* (3rd ed.)
- Clohessy & Wiltshire, *J. Aerospace Sciences*, 1960
- U.S. Space Force, *Space Warfighting: A Framework for Planners*, April 2025
- Secure World Foundation, CSIS Space Threat Assessment, SpaceNews reporting
  on GSSAP / Luch-Olymp / SJ-21 / Meadowlands
