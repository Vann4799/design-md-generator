---
name: design-md-generator
description: >-
  Write or amend a project's DESIGN.md — the locked visual system (dials,
  tokens, type, motion, decisions-with-reasons) that every later UI build has
  to obey. Use when a project has no design direction and an agent is about to
  build UI (without it the output is a "draft without direction", not a
  deliverable); when the user says "buat DESIGN.md", "kunci design system-nya",
  "biar UI-nya nggak AI slop / nggak monoton", "masih keliatan AI-generated /
  generik", "extract the design tokens", or hands over a brand guide, logo,
  screenshot, or reference site to turn into a system; when design tokens need
  exporting to tokens.css, Tailwind v4 @theme, DTCG tokens.json, or shadcn/ui
  variables. Complements a PRD: the PRD fixes what to build, DESIGN.md fixes
  how it looks.
version: 0.3.0
author: Vann4799
license: MIT
platforms: [linux, macos, windows]
argument-hint: <project path, brand guide, reference site, or "from scratch">
metadata:
  hermes:
    tags: [design, design-system, design-tokens, ui, anti-slop]
---

# DESIGN.md Generator

Produce the one file that stops an agent from re-deciding the visual system on
every page: `DESIGN.md`. It is direction made durable, and it is what anti-slop
rules are applied *on top of* — a filter can remove slop but cannot add
identity, so this skill adds it deliberately.

## Tone

Same contract as `prd-generator`: warm, brief, no AI-isms, match the user's
language (natural Indonesian by default). Say the picks out loud before writing
the file — "Paper: warm off-white oklch(0.97 0.01 85). Ink: near-black. Accent:
one clay hue. Dials ENERGY 2 / RHYTHM 3 / MOTION 2. Locking this."

## Ask-User Tool Mapping

Qoder CLI / Claude Code use `AskUserQuestion` (max 4 questions per call, hence
rounds). Codex, OpenCode, and terminal hosts ask in chat, one round per message.
Always leave free-text open for mood and reference answers — multiple choice
cannot express taste.

## Progress Tracking

Register the six phases in the host tracker (`TaskCreate`/`TaskUpdate`,
`TodoWrite`, or a chat checklist) before starting. Exit conditions: 0 existing
direction known · 1 every dial and token chosen by the user or by a source they
approved, and a written differentiator exists · 2 file written · 3
`validate_design.mjs` PASS · 4 exports wired or declined · 5 user confirmed the
system is settled.

## Procedure

Load the reference file for the phase you are in. Do not improvise the format
from memory — `references/schema.md` is normative.

### 0. Detect what already exists

Check before asking anything:

- `DESIGN.md` / `design.md` at the project root → **do not overwrite.**
  Load `references/schema.md` § Amend, and run the targeted change instead.
- Existing UI: read `tokens.css`, `tailwind.config.*` / `@theme`,
  `globals.css`, font links, and the actual root markup. Pre-fill every token
  the project already uses — the point is to *describe the real system*, not to
  invent a nicer one.
- A `PRD.md` or `docs/PRD-*.md` → read it for product kind, audience, and tone,
  which set the dials.
- An antislop or hallmark install in the workspace → note it; this file is the
  input they expect, and the `Dial:` line is how they read it.

### 1. Direction

Load `references/interview.md`. Three paths, user picks one:

1. **They answer** — 4 rounds, at most 4 questions each.
2. **They point** — brand guide, logo, screenshot, or a site they admire →
   extract palette, type, spacing rhythm, and motion from it and show the
   extraction for confirmation. Never present estimated values as measured.
3. **You propose** — only after 1 and 2 are unavailable, and state plainly that
   agent-chosen taste is the default the anti-slop rules exist to filter.

Then run the **anchor check**, which is what this phase is actually for. A
reference the user admires may be *saturated* — imitated so many times by
generative tools that asking for it returns the average of the imitations, not
the reference (Linear, Vercel, Stripe, Raycast; also "dark console with one
neon accent" and "gray canvas, white rounded cards, lime accent", the two
current default skins). Say the mechanism out loud in one sentence, ask for one
counter-anchor from outside software, and write the answer as
`- Anchor · … · counter-anchor · …` plus
`Differentiator · …` before anything gets locked. Obeying every ban perfectly
is still slop if the direction is the mean — this is the failure the rest of
the file cannot catch.

Refusing to produce a locked system without direction is correct behaviour. If
the user genuinely skips it, write the file anyway but mark it
`Status: draft without direction` with dials `ENERGY 1 / RHYTHM 1 / MOTION 1`,
and say the resulting UI is not shippable.

### 2. Write

Copy `assets/design-template.md` to the project root, fill every placeholder,
and delete its HTML writer-notes; a filled file lands near 100 lines (a system,
not a wiki). Include the `Dial:` line, the `Anchor` and `Differentiator` lines,
the canonical `:root` token block in `oklch()`, and a `## Decisions` reason for
every token group. Section order and required keys are in `references/schema.md`.

### 3. Validate

```bash
node scripts/validate_design.mjs <path-to-DESIGN.md>
```

Deterministic gates: dials set to 1-3, required sections present and non-empty,
no duplicate headings, no leftover placeholders, every decision reason present,
token syntax parseable, and **ink/paper, accent/label, and focus pairs measured
against WCAG 2.1 contrast** — computed, not eyeballed. Plus the direction
gates: a `Differentiator` line must exist and carry a real sentence, a
saturated anchor warns unless its counter-anchor names something from outside
software, and a palette that resolves to
one of the default generated skins warns. Clear every `FAIL`; answer the
warnings or record why not.

### 4. Export and wire

On request, and only from the validated file:

```bash
node scripts/export_design.mjs <path-to-DESIGN.md> --format all --out <project>/
```

Writes `tokens.css`, `tailwind.theme.css`, `tokens.json` (DTCG), and
`shadcn.vars.css`. `:root` in `DESIGN.md` is the source of truth; exports are
derived, never hand-edited. Then propose the smallest real integration: import
`tokens.css` (or paste `@theme`) into the project and replace two or three
hard-coded values with tokens, so the file has teeth on day one.

### 5. Lock it in

Tell the user in one line what changes now: every future page must **share**
this system, and a page that genuinely needs something different gets a
`## Variants` entry in this file rather than a local override. Re-run the skill
as `amend` when the system evolves.

Say what the file does *not* do: it constrains a builder that reads it. A
mockup generator (Stitch, v0, Lovable's design pass) treats the same file as
inspiration — it has no token contract to violate, so it renders its own prior
and the mockup quietly becomes the source of truth when someone re-implements
it. Use those tools for exploration, never as the executor of a locked system,
and never feed one the whole file expecting obedience: send `tokens.css` plus
the `Do's and Don'ts` lines.

## Anti-Slop Hand-off

Load `references/slop-tells.md` before writing. Three rules that outlive the file:

- A user choice that collides with a named slop tell is neither followed
  silently nor overridden silently — name the element, name the tell, ask
  keep or drop, record the answer in one line. A bold palette is identity, not
  slop; only ask about named patterns.
- Once `DESIGN.md` exists, the diversification rule inverts: pages differ from
  each other *within* the system, not in the system itself.
- A locked system with a mean direction is still a mean direction. The
  `Differentiator` line is where the owner commits to what makes it not the
  default; if it cannot be written, the direction is not finished.

## Pitfalls

- Don't invent brand facts, fonts, or metrics to fill a section.
- Don't dump 40 tokens; a system with no opinions is still slop.
- Don't hand-edit exports, and don't hand a user a file the validator rejects.
- Don't treat bans as the deliverable — liveliness is added on purpose via
  dials and levers, not by removing things.
- Don't accept "clean, modern, minimal" as a direction; it names nothing and
  every generator reads it as its own default.

## Resources

- `references/interview.md` — 3 direction paths, 4 rounds, anchor check, pre-fill sources
- `references/schema.md` — normative DESIGN.md format, section order, amend policy
- `references/slop-tells.md` — tells to decide on, the saturated anchor, dose caps, keep/drop protocol
- `references/export.md` — export targets and the source-of-truth rule
- `assets/design-template.md` — the fill-in file
- `scripts/lib.mjs` — parser + WCAG contrast math (oklch, hex, rgb) + direction gates
- `scripts/validate_design.mjs` — deterministic gates
- `scripts/export_design.mjs` — DESIGN.md → 4 token formats
