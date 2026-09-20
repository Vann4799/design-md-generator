# Direction Interview

Goal: leave with every dial, token, and stance either chosen by the user, or
extracted from a source they approved. Nothing in the file may come from the
agent's default taste without the user knowing it.

## Pick a path first

| Path | When | What the agent does |
|------|------|---------------------|
| **A. User answers** | no assets, no reference | 3 rounds below |
| **B. User points** | brand guide, logo, screenshot, live site, an existing app | extract, show the extraction, confirm |
| **C. Agent proposes** | A and B both unavailable | propose minimal brief first (product, audience, mood), state the honest warning |

Path B rules: sample colours from the actual file or DOM, not from a vibe.
Measure the type scale from computed styles when a live site is available.
Label every estimate — "paper ≈ oklch(0.97 0.01 85), read from a JPEG, so hue
may be ±5". Never present an estimate as a measured value.

Path C warning, verbatim in the user's language: agent-chosen style is the
default that anti-slop filtering exists to remove, so a system produced this way
is likely monotonous and must be reviewed by a human before locking.

## Phase 0 — Pre-fill from what exists

Read before asking; each hit removes a question:

| Source | Pre-fills |
|--------|-----------|
| `PRD.md` / `docs/PRD-*.md` | product kind, audience, tone → dials |
| `tokens.css`, `globals.css`, `tailwind.config.*`, `@theme` | the whole token block, radius, spacing, type scale |
| `<link>` font tags, `font-family` in CSS | display + body + mono stacks |
| Root markup, component files | layout rhythm, grid, card usage, motion already built |
| `package.json` (Tailwind v4? shadcn? a UI kit?) | which export actually matters |
| Brand assets (`logo.svg`, OG image) | accent hue, paper/ink temperature |
| `AGENTS.md` / `CLAUDE.md` mention of antislop or hallmark | keep the `Dial:` line, match their section names |

Show the draft and ask only about gaps.

## Round 1 — Identity and level

1. **What is this, for whom** — "Ini web app, landing page, documentation,
   atau portfolio? Siapa yang buka?" Sets the page kind and audience.
2. **Feel, in words** (free text) — "Kalau desainnya orang, dia kayak apa?
   Kalem dan presisi, hangat dan santai, atau berani dan nyaris berisik?"
   Maps to ENERGY.
3. **Reference** (free text) — "Ada contoh yang bikin lu bilang 'gitu'?"
   A name is allowed ("Linear", "Stripe"); anchors are taste coordinates, not
   things to copy. R-30 forbids cloning a product's identity.
4. **Forbidden** — "Apa yang bikin lu langsung ilfeel sama tampilan?"
   A negative is as informative as a positive, and it feeds Do's and Don'ts.

## Round 2 — Dials

Ask each with its three levels spelled out; the answer must be 1, 2, or 3.

5. **ENERGY** — how hard does it say hello?
   1 calm and linear (GOV.UK) · 2 balanced (Stripe, Vercel) · 3 bold
   (Awwwards, agency portfolio)
6. **RHYTHM** — how much do sections differ from each other?
   1 uniform grid · 2 consistent with a few breaks · 3 asymmetric, mixed
   compositions
7. **MOTION** — how much movement, and why?
   1 hover states only · 2 scroll-reveal and transitions · 3 parallax, pin,
   choreography
8. **Dark mode** — ship both, ship one, or skip?

If the project already has motion built (a GSAP scrub, a Lenis scroll), do not
ask MOTION cold — read it and confirm the number it implies.

## Round 3 — Material

9. **Palette origin** — brand colour exists? If yes, take it and derive paper and
   ink around it. If not: "terang atau gelap dulu, dan accent-nya hue apa?"
   One accent, not a rainbow.
10. **Display face** — a serif, a grotesque, a mono, something quirky? Budget:
    how many font files may load (a real constraint on slow connections).
11. **Body face** — readable at small size; if the answer is "Inter", ask what
    makes the page belong to this product instead of every other page.
12. **Density** — compact professional (tight spacing, small radii, hairline
    rules) or generous editorial (large spacing, few dividers)?

## Round 4 — Stances

13. **Components** — which of these exist, and how: card? pill/chip? outline
    button? hairline table? Answering "no cards" is a valid and useful system.
14. **Radius** — one number for everything, or a small scale?
15. **Motion stance** — silent, 1-2 reveal primitives, or full choreography?
    Always ask the reduced-motion fallback (≤150 ms opacity crossfade is the
    default).
16. **CTA voice** — filled button, text link, or bordered pill? Primary and
    secondary must differ by more than hue.

Round 5 is optional and conditional: **imagery** (photo, illustration, or none —
never AI-illustration-by-default), **elevation** (shadow, hairline rule, or
border), and **accessibility floor** (AA body text is the default; ask if a
higher bar is needed).

## Completion Criteria

- All three dials are numbers, not adjectives.
- Paper, ink, and one accent exist as `oklch()` values.
- Display and body faces are named, with a load budget.
- Every token group has a one-line reason for the user to react to.
- The user has seen and confirmed the picks, then load `schema.md`.
