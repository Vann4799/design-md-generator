# Exports

`:root` inside DESIGN.md is the source of truth. The four artifacts are derived
and regenerated — never hand-edited, or the system drifts back into per-page
improvisation.

| Target | File | Shape |
|--------|------|-------|
| Plain CSS | `tokens.css` | the `:root` block verbatim, plus a provenance header |
| Tailwind v4 | `tailwind.theme.css` | `@theme { --color-paper: … }`, colour tokens only |
| DTCG JSON | `tokens.json` | `{ color: { paper: { $value, $type: "color" } }, typography: … } |
| shadcn/ui | `shadcn.vars.css` | `:root { --background: …; --foreground: … }` mapped from paper/ink/accent/radius, with an `html.dark` block when dark mode ships |

```bash
node scripts/export_design.mjs <path-to-DESIGN.md> --format all --out <project>/src/styles/
```

Valid `--format`: `css`, `tailwind`, `dtcg`, `shadcn`, `all`. The exporter
refuses to run on a file the validator rejects. Tailwind v3 needs `tailwind.config.js`
values in `rgb()` channel form rather than `@theme` — say so and offer the
config patch instead of writing `@theme` into a v3 project.

## Wiring it in

Exporting is not integration. After writing the files, propose the smallest
change that makes the system load-bearing:

1. Vite / plain HTML → `@import` `tokens.css` from the global stylesheet.
2. Next.js app router → import it in `app/globals.css`.
3. Tailwind v4 → `@import "tailwindcss"; @import "./theme.css";`
4. shadcn → paste `shadcn.vars.css` over the existing `:root` block in
   `globals.css`, then diff what changed.

Then offer to replace two or three hard-coded values in the components closest
to the root, and stop there. Sweeping the whole codebase in the same pass as
locking the system makes the diff unreadable and the system unreviewable.

## Record it

Refresh `## Exports` in DESIGN.md with what exists and where it is wired, so the
next run knows whether to regenerate, extend, or leave it alone.
