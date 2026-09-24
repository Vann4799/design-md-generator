# Slop Tells and Dose Caps

Distilled from `miqdadbadjuber/anti-slop` (R-01…R-38) and `Nutlope/hallmark`
(`anti-patterns.md`, 41 named tells). Credit both when quoting rule numbers.
This file exists so DESIGN.md *decides* these things once, instead of every page
re-deciding them the same generic way.

## Why a list of bans is not the deliverable

Removing slop leaves a void, and a model fills a void with its most generic
output. So the tell is only half the job: the other half is adding energy on
purpose. A DESIGN.md that bans twelve things and sets no dials produces
sterile pages, which read as AI-generated just as loudly as a purple gradient.

## The saturated anchor — the tell the bans cannot catch

Every hard gate above can be obeyed perfectly and the page still reads as
generated. That is a **saturated anchor**: a reference so widely imitated by
generative tools that asking for it produces the *average of the imitations*,
not the reference. The generator cannot see Linear; it sees ten thousand AI
attempts at Linear and regresses to their mean.

Saturated right now: **Linear, Vercel, Stripe, Raycast, Notion, Figma, Apple**
— and anything described as "clean modern SaaS dashboard", "premium dark UI",
or "minimalist portfolio". A `## System` genre line that names one of these is
the bug, even when it adds "not a cliché" to the same sentence.

The two skins this produces, both observed in real output:

| Skin | Signature |
|------|-----------|
| **dark console** | near-black blue canvas, one high-chroma mint/cyan/lime accent, mono uppercase micro-labels as fake HUD, a ✓ or • repeated on every chip, four widgets rendering the same number |
| **soft light console** | gray canvas, white cards at 16-24px radius, chartreuse accent, `backdrop-filter` glass, faint radial tint blooms in two corners |

Neither is forbidden. Both need a written answer to *"what will a viewer see in
three seconds that a generated default would not have?"* — because if the
answer is "nothing, it's just clean", the direction was the mean all along.

Two rules follow:

- **Counter-anchor.** Every saturated anchor must be paired with one reference
  from outside the software pool — print, signage, an instrument, a building, a
  book, a product with a physical body. That is what pulls the output off the
  mean; "not Linear" does not.
- **Differentiator line.** `## Design Read` carries it verbatim, and the
  validator fails the file without it. Adjective soup does not count: "clean,
  modern, premium, minimal" restates the anchor instead of escaping it.

## Hard gate — never, no stated purpose redeems it

| Tell | Why it fails |
|------|--------------|
| Blue→purple, blue→cyan, purple→pink as the primary treatment | the model's default palette; the same tell wearing neon or pastel clothes |
| Purple-and-black scheme, blurred radial orbs behind a hero | identity-free decoration standing in for a design |
| Aurora / mesh gradient background as the page's character | no product decision produced it |
| Fabricated content — fake testimonials, invented metrics, ghost links | an empty section beats a invented one; use `[REAL DATA]` |
| Cloning a named product's identity | a reference is a taste coordinate, not a trace |
| Sound-on autoplay, hover-only affordances | hostile to real people and to touch |

## Purpose-gate — allowed when the reason is written down, capped when excessive

Each row needs an answer in DESIGN.md (`## Components`, `## Tokens`,
`## Do's and Don'ts`). No answer means the default applies, and the default is
the conservative column.

| Technique | Allowed when | Dose cap | Default if undecided |
|-----------|--------------|----------|----------------------|
| Gradient | it separates hierarchy or carries the brand | one element class | none |
| Glass / backdrop-blur | a real layering moment (overlay on media) | 1-2 elements | none |
| Cards | each is a repeatable object with its own data | avoid card-in-card | hairline rules + whitespace |
| Big rounded radius + soft shadow | playful genre, stated in `## System` | one radius scale | small radius |
| Eyebrow label above a heading | it names a real category | not on every section | none |
| Mono uppercase micro-label | it marks a real machine state (sync, build, log) | not as section decoration on every panel | sentence case |
| Status glyph (✓, •, a tick per row) | one item genuinely differs from the rest | never repeated on every chip | no glyph |
| Score / metric rendered twice | the second form answers a different question | one widget per metric | the number alone |
| Icon-tile feature row | icons come from one set and carry meaning | no decorative tiles | numbered or plain |
| Emoji as an icon | never as a feature icon | — | none |
| Italic / gradient headline | one deliberate editorial voice | one per page | plain |
| Scroll-reveal | MOTION ≥ 2 | one or two primitives | hover only |
| Parallax, pin, choreography | MOTION 3 and the reason is spatial | one pinned moment | scroll-reveal |
| Pure black on pure white | — | avoid; use tinted ink on tinted paper | always tinted |
| Inter as the whole identity | body only, and the display face carries the voice | — | name a display face |
| Bounce / elastic easing | playful genre | one motion primitive | `--ease-out` |
| `transition-all` | — | never; name properties | — |
| Tabular figures on numbers | any table or stat | `font-variant-numeric` on | off |
| Lazy-loaded LCP image | — | hero loads eagerly | — |

## Liveliness levers (positive requirements)

- **One focal point per screen** — exactly one element is clearly most important.
- **Hierarchy contrast** — size, weight, and colour differ on purpose.
- **Whitespace as structure** — space separates; it is not leftover.
- **One deliberate accent** — zero accents is sterile, all-over is slop.
- **Identity motif** — one repeated, product-specific gesture, pattern, or
  typographic voice, so the page belongs to something.

## Diversification, then inversion

While a system is *not* locked, each new build must differ from the last on at
least one of three axes: **paper band** (light / mid / dark), **display style**
(serif / grotesque / mono / quirky), **accent hue**. Record the axes in
`## System` so the next run can see what it has to differ from, and stamp the
build (`/* macrostructure: X · tone: Y · anchor hue: Z */`) so the choice
survives in the code.

Once `Status: locked`, this **inverts**: pages must share the system. A page that
needs a difference gets a `## Variants` entry, never a local override.

## Keep/drop protocol

When the user's direction asks for something on the hard-gate or dose-cap list:

1. Name the element ("the hero headline is a blue→purple gradient").
2. Name the rule it collides with (hard gate: default palette).
3. Ask keep or drop — one question, in their language.
4. Record the answer in `## Do's and Don'ts` ("gradient headline kept by owner
   decision; it is the identity motif").

Never follow it silently, never override it silently. Only ask about named
patterns — a bold palette or an odd typeface is identity, not slop.
