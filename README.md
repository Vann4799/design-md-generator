# DESIGN.md Generator Skill

Write the file that stops an agent from re-deciding the visual system on every
page. Works with Claude Code, Codex, OpenCode, Hermes Agent, and Qoder CLI.

The skill extracts a design direction through a short interview (or from a brand
guide or a reference site you point at), writes a locked `DESIGN.md` — dials,
`:root` tokens, type, layout, components, motion, and a written reason for every
decision — then validates it and exports it to real token formats. It is the
counterpart to a PRD: the PRD fixes what to build, `DESIGN.md` fixes how it looks.

Why it exists: a filter can remove AI slop but it cannot add identity. Bare
anti-slop rules leave you with a beige, card-less, gradient-free page that looks
like every other safe output. This skill picks a direction on purpose, then
keeps it.

## Install

The skill lives in `skills/design-md-generator/`. Clone the repo once:

```bash
git clone https://github.com/Vann4799/design-md-generator.git /tmp/dmdgen
```

Then copy that folder into whichever skills directory your agent reads. `~` is
`%USERPROFILE%` on Windows.

### Claude Code

```bash
cp -r /tmp/dmdgen/skills/design-md-generator ~/.claude/skills/
```

### Codex / OpenCode

```bash
cp -r /tmp/dmdgen/skills/design-md-generator ~/.codex/skills/
```

### Hermes Agent

```bash
hermes skills add /tmp/dmdgen/skills/design-md-generator
```

### Qoder CLI

```bash
cp -r /tmp/dmdgen/skills/design-md-generator ~/.agents/skills/
```

Restart the session (or reload skills) so the new skill is discovered.

## Use

```
Buat DESIGN.md buat project ini
Kunci design system-nya biar UI-nya nggak AI slop
Ini screenshot website yang gw suka, ambil system-nya
Export the design tokens to Tailwind v4
```

The agent then:

1. Registers the six phases as tracked tasks, so progress is visible and no step
   gets dropped halfway through.
2. Checks what already exists — a `DESIGN.md` it must never overwrite, a
   `tokens.css` or `tailwind.config.*` whose values it should keep, a PRD whose
   audience sets the dials.
3. Gets direction one of three ways: you answer four rounds of at most four
   questions, you hand it a brand guide or a reference site to extract from, or —
   only if you refuse both — it proposes and says so plainly. Then it runs the
   anchor check: a reference that is already everywhere (Linear, Vercel, "dark
   console with one neon accent") gets named as such and paired with a
   counter-anchor from outside software, because that is what pulls the output
   off the model's mean.
4. Writes `DESIGN.md` from the template and runs the validator until every `FAIL`
   is gone.
5. Exports tokens and proposes the smallest real integration, so the file has
   teeth on day one instead of sitting next to hard-coded hex values.

Refusing to call an undesigned system "locked" is part of the behaviour. If
direction is skipped, the file is written with `Status: draft without direction`
at dials `1 / 1 / 1`, and the agent tells you the result is not shippable.

## Layout

```
skills/design-md-generator/
├── SKILL.md                       workflow, tone, ask-user tool mapping
├── references/
│   ├── interview.md               three direction paths, question rounds, pre-fill table
│   ├── schema.md                  normative DESIGN.md format, section order, amend policy
│   ├── slop-tells.md              named tells to decide on, dose caps, keep/drop protocol
│   └── export.md                  export targets and the source-of-truth rule
├── assets/
│   └── design-template.md         copy-and-fill DESIGN.md skeleton
└── scripts/
    ├── lib.mjs                    parser + WCAG contrast math (oklch, hex, rgb)
    ├── validate_design.mjs        deterministic gates, exit 1 on any FAIL
    └── export_design.mjs          DESIGN.md → tokens.css / @theme / DTCG / shadcn
```

`references/` is loaded only for the phase that needs it, so the full anti-slop
table does not sit in the context window the entire session.

## The format

`DESIGN.md` is a short markdown file with a CSS `:root` block as its source of
truth and ten fixed sections:

~~~~markdown
## Design Read
Differentiator · rules and a hanging number column instead of cards, so a page
of prose still scans like a manual
Dial: ENERGY 2 / RHYTHM 3 / MOTION 2
Status: locked

## Tokens
```css
:root {
  --color-paper: oklch(0.97 0.012 85);
  --color-ink:   oklch(0.24 0.01 260);
  --space-m:     24px;
}
```
~~~~

The `Dial:` line is the whole steering mechanism — `ENERGY` how loud, `RHYTHM`
how varied the layout, `MOTION` how much moves. Same file, three numbers,
different output. Optional YAML frontmatter mirrors it so other tooling can read
the file without parsing prose.

## The anchor problem

Every gate in this skill can pass and the page can still read as generated,
because slop is not only a list of banned techniques — it is also a *direction*
that too many people asked for. **Linear, Vercel, Stripe and Raycast are
imitated so heavily that a generator returns the average of the imitations, not
the reference**, and the two skins that average produced are now the default
output: near-black canvas with one neon accent and mono HUD labels, or a grey
canvas with white rounded cards, a lime accent and glass.

So the file requires two lines that carry intent rather than values:
`- Anchor · … · counter-anchor · …` and `Differentiator · …`. The validator fails
a missing or empty differentiator and warns when the anchor is saturated with no
counter-anchor, when the palette resolves to one of the two default skins, or
when `ENERGY 1` and `RHYTHM 1` together describe a system nobody asked to be
quiet.

Related, and the reason this exists at all: `DESIGN.md` constrains a builder that
reads it. A mockup generator treats the same file as inspiration — it has no
token contract to violate — so send it `tokens.css` plus the Do/Don't lines and
keep the mockup out of the source-of-truth chain.

## Scripts

Both are dependency-free Node (≥18) and run on any DESIGN.md file.

```bash
node scripts/validate_design.mjs DESIGN.md
node scripts/export_design.mjs DESIGN.md --format all --out src/styles/
```

The validator checks the ten required sections and their order, the dials against
the frontmatter, leftover placeholders and writer notes, a written reason for
each of the seven decision groups, the differentiator and anchor lines, and
**measures ink/paper, secondary text, accent label, and focus contrast against
WCAG 2.1** — converting OKLCH through OKLab to linear-light sRGB, compositing
alpha the way a browser paints it. It exits non-zero on any `FAIL`, so it drops
into CI or a pre-commit hook.

The exporter writes `tokens.css`, a Tailwind v4 `@theme` block, DTCG
`tokens.json`, and shadcn/ui CSS variables. It refuses to run on a file that
fails validation, states which variables it had to fill in itself, and never
invents a dark palette — a dark mode is a separate decision, not an inversion.

## Customising

Edit the files rather than the workflow:

- `references/interview.md` — change the questions; keep each round at four or fewer
- `references/schema.md` + `scripts/lib.mjs` — sections and tokens; add a name to
  `REQUIRED_SECTIONS` or `REQUIRED_TOKENS` if you want it enforced
- `references/slop-tells.md` — the tells your team actually cares about, and the
  dose caps you will tolerate
- `scripts/export_design.mjs` — new export targets

## Credit where it is due

The format follows [google-labs-code/design.md](https://github.com/google-labs-code/design.md).
The dials, the Design Read line, and the keep/drop protocol come from
[Nutlope/hallmark](https://github.com/nutlope/hallmark) and
[miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop), which
supplied the hard-gate versus dose-cap distinction and the rule that a locked
system stops diversifying and starts being obeyed. The contrast math is WCAG 2.1
plus Björn Ottosson's OKLab transform.

## License

MIT
