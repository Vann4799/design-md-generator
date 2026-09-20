#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { readDesign, validate, report } from './lib.mjs'

const FORMATS = ['css', 'tailwind', 'dtcg', 'shadcn', 'all']

function args(argv) {
  const out = { file: null, format: 'all', out: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--format' || a === '-f') out.format = argv[++i]
    else if (a === '--out' || a === '-o') out.out = argv[++i]
    else if (a === '--help' || a === '-h') out.help = true
    else if (!out.file) out.file = a
  }
  return out
}

const group = (tokens, prefix) =>
  Object.entries(tokens)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, v]) => [`--${k}`, v])

const pxToRem = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? `${(n / 16).toFixed(3).replace(/\.?0+$/, '')}rem` : v
}

function header(d, target) {
  const dial = d.dial ? `ENERGY ${d.dial[1]} / RHYTHM ${d.dial[2]} / MOTION ${d.dial[3]}` : 'no dials'
  return [
    `/* ${target} — generated from ${d.file}`,
    `    system: ${d.sections.get('#')?.heading ?? '(untitled)'} · ${dial} · ${d.status || 'no status'}`,
    '    Do not hand-edit: DESIGN.md :root is the source of truth.  */',
  ].join('\n')
}

function cssDoc(d) {
  const t = d.tokens
  const lines = [header(d, 'tokens.css'), ':root {']
  for (const p of ['color-', 'font-', 'space-', 'text-', 'ease-', 'dur-', 'radius-'])
    for (const [k, v] of group(t, p)) lines.push(`  ${k}: ${v};`)
  lines.push('}', '')
  return lines.join('\n')
}

function tailwindDoc(d) {
  const t = d.tokens
  const lines = [
    header(d, 'tailwind.theme.css — Tailwind v4 @theme'),
    '@theme {',
  ]
  for (const p of ['color-', 'font-', 'text-', 'radius-', 'ease-'])
    for (const [k, v] of group(t, p)) lines.push(`  ${k}: ${v};`)
  lines.push(
    '}',
    '',
    '/* v4 derives the spacing scale from --spacing; --space-* tokens stay in',
    '   tokens.css and are used via var(). For Tailwind v3, patch',
    '   tailwind.config.js theme.extend with rgb() channel values instead. */',
    '',
  )
  return lines.join('\n')
}

function dtcgDoc(d, source) {
  const t = d.tokens
  const names = (prefix) => Object.keys(t).filter((k) => k.startsWith(prefix))
  const wrap = (group, type, keys) => {
    const out = { $type: type }
    for (const n of keys) out[n.replace(`${group}-`, '')] = { $value: t[n] }
    return out
  }
  return (
    JSON.stringify(
      {
        $schema: 'https://design-tokens.github.io/community-group/format/',
        name: d.sections.get('#')?.heading ?? null,
        dials: d.dial ? `ENERGY ${d.dial[1]} / RHYTHM ${d.dial[2]} / MOTION ${d.dial[3]}` : null,
        source,
        color: wrap('color', 'color', names('color-')),
        font: wrap('font', 'fontFamily', names('font-')),
        space: wrap('space', 'dimension', names('space-')),
        text: wrap('text', 'dimension', names('text-')),
        radius: wrap('radius', 'dimension', names('radius-')),
        duration: wrap('dur', 'duration', names('dur-')),
      },
      null,
      2,
    ) + '\n'
  )
}

function shadcnDoc(d) {
  const t = d.tokens
  const filled = []
  const v = (val, fallback, token, src) => {
    if (val !== undefined) return val
    if (fallback === undefined) return undefined
    filled.push(`${token}: ${src}`)
    return fallback
  }
  const radius = t['radius-md'] ?? t['radius-card'] ?? t['radius-input']
  const map = {
    '--background': t['color-paper'],
    '--foreground': t['color-ink'],
    '--card': t['color-paper-2'],
    '--card-foreground': t['color-ink'],
    '--popover': t['color-paper'],
    '--popover-foreground': t['color-ink'],
    '--primary': t['color-accent'],
    '--primary-foreground': t['color-accent-ink'],
    '--secondary': t['color-paper-2'],
    '--secondary-foreground': t['color-ink'],
    '--muted': t['color-paper-2'],
    '--muted-foreground': t['color-ink-2'],
    '--accent': t['color-accent'],
    '--accent-foreground': t['color-accent-ink'],
    '--destructive': v(t['color-danger'], 'oklch(0.55 0.19 25)', 'color-danger', 'oklch(0.55 0.19 25) — exporter default, no --color-danger token'),
    '--destructive-foreground': v(
      t['color-danger-ink'],
      t['color-paper'],
      'color-danger-ink',
      'reused from --color-paper',
    ),
    '--border': t['color-rule'],
    '--input': t['color-rule'],
    '--ring': t['color-focus'],
    '--radius': radius ? pxToRem(radius) : v(undefined, '0.5rem', 'radius', '0.5rem — no --radius-* token'),
  }
  const lines = [header(d, 'shadcn.vars.css'), ':root {']
  for (const [k, val] of Object.entries(map)) if (val) lines.push(`  ${k}: ${val};`)
  lines.push('}', '')
  if (radius) lines.push(`/* --radius from --${t['radius-md'] ? 'radius-md' : t['radius-card'] ? 'radius-card' : 'radius-input'}. */`)
  for (const f of filled) lines.push(`/* ${f} */`)
  if (filled.length) lines.push('')
  lines.push(
    '/* No html.dark block: a dark palette is a separate decision, not an',
    '   inversion. Add --color-*-dark tokens to DESIGN.md, then re-export. */',
    '',
  )
  const total = Object.values(map).filter(Boolean).length
  return { text: lines.join('\n'), filled, note: `${total - filled.length}/${total} from tokens, ${filled.length} filled by exporter` }
}

const a = args(process.argv.slice(2))
const usage = `usage: node export_design.mjs <DESIGN.md> [--format ${FORMATS.join('|')}] [--out <dir>]`

if (a.help) {
  console.log(usage)
  process.exit(0)
}
if (!a.file) {
  console.log(usage)
  process.exit(1)
}
if (!FORMATS.includes(a.format)) {
  console.log(`FAIL  unknown --format "${a.format}" (want ${FORMATS.join('|')})`)
  process.exit(1)
}
if (!existsSync(a.file)) {
  console.log(`FAIL  file not found: ${a.file}`)
  process.exit(1)
}

const design = readDesign(a.file)
const res = validate(design)
if (res.fails.length) {
  console.log(report(design, res))
  console.log('cannot export a DESIGN.md that fails validation — fix the file first')
  process.exit(1)
}

const dir = a.out ?? dirname(a.file)
if (a.out && !existsSync(dir)) mkdirSync(dir, { recursive: true })

const wanted = a.format === 'all' ? ['css', 'tailwind', 'dtcg', 'shadcn'] : [a.format]
const n = (d) => Object.keys(d.tokens).length
const targets = {
  css: ['tokens.css', (d) => ({ text: cssDoc(d), note: `${n(d)} tokens` })],
  tailwind: ['tailwind.theme.css', (d) => ({ text: tailwindDoc(d), note: `${group(d.tokens, 'color-').length} colors` })],
  dtcg: ['tokens.json', (d) => ({ text: dtcgDoc(d, a.file), note: `${n(d)} values` })],
  shadcn: ['shadcn.vars.css', shadcnDoc],
}

for (const fmt of wanted) {
  const [name, build] = targets[fmt]
  const path = join(dir, name)
  const { text, note } = build(design)
  writeFileSync(path, text)
  console.log(`wrote ${path} (${note})`)
}
