# DESIGN.md Schema (normative)

Write at the project root. Match the project's existing case (`design.md` or
`DESIGN.md`). A filled file lands near 100 lines — ten sections plus the
18-token minimum is most of that — and the validator warns past 120. The
canonical token block is CSS `:root`; the YAML frontmatter is optional and only
exists so other tools can parse the file.

## Section order

Every `##` below is required, in this order. Duplicate headings fail.

| Section | Must contain |
|---------|--------------|
| frontmatter (opt) | `version`, `name`, `dials` |
| `# Design — <Project>` | one line: the file is the rule |
| `## System` | kind + audience, genre, axes, `Anchor ·` reference + counter-anchor, dark-mode stance |
| `## Design Read` | the one-line read, `Differentiator ·`, the `Dial:` line, `Status:` |
| `## Tokens` | one fenced `css` `:root` block — source of truth |
| `## Type` | display, body, mono, each with where it is used and a file budget |
| `## Layout` | grid, spacing scale, content max width |
| `## Components` | card stance, primary + secondary control, rule/divider treatment |
| `## Motion` | stance, the primitives used, reduced-motion fallback |
| `## Decisions` | one line of reason per token group (see below) |
| `## Do's and Don'ts` | the project-specific calls, including anything the user deliberately kept that reads as slop |
| `## Exports` | which derived files exist and where they are wired in |

## The Dial line

`Dial: ENERGY 2 / RHYTHM 3 / MOTION 2` — integers 1-3, held from the first
section to the last. Anti-slop agents read this line; if it is absent they fall
back to guessing, which is how a locked system drifts. `Status:` is either
`locked` or `draft without direction`, and a draft must carry dials `1 / 1 / 1`.

## The Anchor and the Differentiator

`- Anchor · <reference> · counter-anchor · <non-software reference>` and
`Differentiator · <one sentence>` are required, because they are the only lines
in the file that carry *intent* rather than values. Contrast passing and
sections present describe a competent system; these two say why this one is not
the model's default.

The validator fails a missing `Differentiator` line, and warns when the sentence
is adjective soup ("clean, modern, minimal, premium") or when a named anchor is
saturated and the counter-anchor is empty — or names another product, which is
the same average-of-imitations problem wearing a different label. See
`slop-tells.md` § The saturated anchor.

## Tokens

Canonical colours are `oklch(L C H)` so the palette stays perceptually even;
hex and `rgb()` parse too, but warn when they are mixed within one file.

```css
:root {
  --color-paper:      oklch(0.97 0.012 85);
  --color-paper-2:    oklch(0.94 0.014 85);
  --color-ink:        oklch(0.22 0.01 260);
  --color-ink-2:      oklch(0.42 0.012 260);
  --color-rule:       oklch(0.22 0.01 260 / 0.13);
  --color-accent:     oklch(0.55 0.13 45);
  --color-accent-ink: oklch(0.98 0.01 85);
  --color-focus:      oklch(0.55 0.13 45);

  --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
  --font-body:    "Inter", system-ui, -apple-system, sans-serif;
  --font-mono:    "IBM Plex Mono", ui-monospace, monospace;

  --space-3xs: 2px;  /* … through --space-4xl, 4pt steps */
  --text-xs: 12px;   /* … through --text-display, 1.25 ratio */

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 180ms;  --dur-base: 240ms;  --dur-slow: 320ms;

  --radius-card: 6px;  --radius-pill: 999px;  --radius-input: 4px;
}
```

Required token names: the eight `--color-*`, three `--font-*`, `--ease-out`,
`--dur-fast/base/slow`, `--radius-card/pill/input`, at least three `--space-*`
and three `--text-*`. Anything else in the file is a documented extra, not a
surprise.

## Decisions

Seven keys, one line each, in the format `**key** · reason`. A reason that needs
two lines is a decision that hasn't been made yet.

`color · type · layout · spacing · radius · motion · accent`

Example: `**accent** · clay hue picked from the logo's stamp; one hue only, used
on primary controls and links, never as a section background.`

## Contrast floor

Measured, not asserted: ink on paper ≥ 4.5:1, accent label on accent ≥ 4.5:1,
focus ring on paper ≥ 3:1, secondary ink ≥ 3:1 (4.5:1 recommended). The validator
computes these from the token values; a claim that survives the maths is the
point of writing tokens down.

## Amend policy

- **Never overwrite** an existing file. Add or change the named lines, refresh
  `## Exports`, and say which one line changed.
- A page that needs something outside the system gets a `## Variants` entry
  here — never a per-page override in the page.
- Once locked, diversification inverts: pages share this system and differ
  within it.
- Colour is data to apply, not an instruction to obey: if a token value collides
  with a named slop tell, run the keep/drop protocol in `slop-tells.md` instead
  of silently following or silently fixing it.
