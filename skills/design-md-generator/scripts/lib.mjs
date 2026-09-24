import { readFileSync } from 'node:fs'

export const REQUIRED_SECTIONS = [
  'System',
  'Design Read',
  'Tokens',
  'Type',
  'Layout',
  'Components',
  'Motion',
  'Decisions',
  "Do's and Don'ts",
  'Exports',
]

const REQUIRED_TOKENS = [
  'color-paper',
  'color-paper-2',
  'color-ink',
  'color-ink-2',
  'color-rule',
  'color-accent',
  'color-accent-ink',
  'color-focus',
  'font-display',
  'font-body',
  'font-mono',
  'ease-out',
  'dur-fast',
  'dur-base',
  'dur-slow',
  'radius-card',
  'radius-pill',
  'radius-input',
]

const DECISION_KEYS = ['color', 'type', 'layout', 'spacing', 'radius', 'motion', 'accent']

/**
 * References so widely imitated by generative tools that naming one produces
 * the average of the imitations, not the reference. A warning, never a ban:
 * the fix is a counter-anchor, not a different taste.
 */
const SATURATED = [
  'linear', 'vercel', 'stripe', 'raycast', 'notion', 'figma', 'apple',
  'shadcn', 'tailwind ui', 'dribbble', 'behance', 'awwwards',
]

/** L/C/H read back out of an oklch() string; null for hex or rgb(). */
function oklchParts(value) {
  if (typeof value !== 'string') return null
  const m = value.trim().match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/i)
  if (!m) return null
  return { L: Number(m[1]) * (m[2] ? 0.01 : 1), C: Number(m[3]), H: Number(m[4]) }
}

const firstFamily = (stack) => (stack.match(/["']([^"']+)["']/) ?? [, stack.split(',')[0]])?.[1]?.trim() ?? ''

export function readDesign(file) {
  const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const lines = raw.split('\n')

  const front = {}
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)
  if (fm)
    for (const m of fm[1].matchAll(/^(\w[\w-]*):\s*(.+)$/gm)) front[m[1]] = m[2].trim()

  const sections = new Map()
  let current = null
  let fence = false
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    if (fence) return
    const h1 = line.match(/^#\s+(.+)$/)
    if (h1 && !current) sections.set('#', { heading: h1[1].trim(), line: i + 1, body: [] })
    const h2 = line.match(/^##\s+(.+)$/)
    if (h2) {
      current = { heading: h2[1].trim(), line: i + 1, body: [] }
      const key = current.heading.replace(/^(?:\d+\.\s*)/, '')
      sections.set(key, current)
    }
    if (current && !h2) current.body.push(line)
  })

  const css = raw.match(/```css([\s\S]*?)```/)?.[1] ?? ''
  const tokens = {}
  for (const m of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g))
    tokens[m[1]] = m[2].trim().replace(/\s*\/\*[\s\S]*?\*\//g, '')

  const dial = raw.match(/^\s*Dial:\s*ENERGY\s*(\d)\s*\/\s*RHYTHM\s*(\d)\s*\/\s*MOTION\s*(\d)/im)
  const status = raw.match(/^\s*Status:\s*(.+)$/im)?.[1]?.trim() ?? ''

  return { file, raw, lines, front, sections, tokens, css, dial, status }
}

/* ---------- colour: parse → linear light → WCAG contrast ---------- */

const to255 = (lin) => {
  const g = lin <= 0.0031308 ? lin * 12.92 : 1.055 * lin ** (1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(g * 255)))
}
const toLin = (byte) => {
  const x = byte / 255
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}
const mk = (space, r, g, b, a) => ({
  space,
  r,
  g,
  b,
  a,
  lin: { r: toLin(r), g: toLin(g), b: toLin(b) },
})

export function parseColor(value) {
  if (typeof value !== 'string') return null
  const v = value.trim()

  let m = v.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/i,
  )
  if (m) {
    const L = Number(m[1]) * (m[2] ? 0.01 : 1)
    const alpha = m[5] === undefined ? 1 : Number(m[5]) * (m[6] ? 0.01 : 1)
    const { r, g, b } = oklchToLinear(L, Number(m[3]), Number(m[4]))
    return {
      space: 'oklch',
      r: to255(r),
      g: to255(g),
      b: to255(b),
      a: alpha,
      lin: { r, g, b },
    }
  }

  m = v.match(/^#([0-9a-f]{3,8})$/i)
  if (m) {
    const h = m[1]
    if (h.length === 3 || h.length === 4)
      return mk(
        'hex',
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
        h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1,
      )
    if (h.length === 6 || h.length === 8)
      return mk(
        'hex',
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
        h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
      )
    return null
  }

  m = v.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+)\s*)?\)$/i)
  if (m) return mk('rgb', Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4]))

  return null
}

/** Ottosson OKLab → linear-light sRGB. */
function oklchToLinear(L, C, H) {
  const h = (H * Math.PI) / 180
  const A = C * Math.cos(h)
  const B = C * Math.sin(h)
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B
  const s_ = L - 0.0894841775 * A - 1.291485548 * B
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const clamp01 = (x) => Math.max(0, Math.min(1, x))
  return {
    r: clamp01(4.0767416624 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: clamp01(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: clamp01(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  }
}

const lum = ({ r, g, b }) => 0.2126 * r + 0.7152 * g + 0.0722 * b

/** Alpha composites in linear light, the way a browser paints it. */
export function contrast(fg, bg) {
  fg = typeof fg === 'string' ? parseColor(fg) : fg
  bg = typeof bg === 'string' ? parseColor(bg) : bg
  if (!fg || !bg) return null
  if (bg.a !== undefined && bg.a < 1) return null
  const a = fg.a ?? 1
  const mix = (f, b) => b * (1 - a) + f * a
  const flat =
    a >= 1
      ? fg.lin
      : { r: mix(fg.lin.r, bg.lin.r), g: mix(fg.lin.g, bg.lin.g), b: mix(fg.lin.b, bg.lin.b) }
  const l1 = lum(flat)
  const l2 = lum(bg.lin)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

/* ---------- checks ---------- */

export function validate(d) {
  const fails = []
  const warns = []
  const measured = []

  if (!d.sections.has('#')) fails.push('no H1 title found')

  for (const name of REQUIRED_SECTIONS) {
    const sec = d.sections.get(name) ?? d.sections.get(name.toLowerCase())
    if (!sec) fails.push(`missing section: ## ${name}`)
    else if (!sec.body.join('').trim()) fails.push(`section is empty: ## ${name}`)
  }

  const headings = [...d.sections.keys()].filter((k) => k !== '#')
  const seen = new Set()
  for (const h of headings) {
    if (seen.has(h.toLowerCase())) fails.push(`duplicate section heading: ${h}`)
    seen.add(h.toLowerCase())
  }

  if (!d.dial) fails.push('no `Dial: ENERGY n / RHYTHM n / MOTION n` line in ## Design Read')
  else {
    const [e, r, m] = [+d.dial[1], +d.dial[2], +d.dial[3]]
    for (const [k, v] of [['ENERGY', e], ['RHYTHM', r], ['MOTION', m]])
      if (v < 1 || v > 3) fails.push(`${k} must be 1, 2, or 3 (got ${v})`)
    if (/draft without direction/i.test(d.status) && !(e === 1 && r === 1 && m === 1))
      fails.push('a draft without direction must declare ENERGY 1 / RHYTHM 1 / MOTION 1')
  }
  if (!d.status) fails.push('no `Status:` line — locked or draft without direction')
  else if (!/^(locked|draft without direction)\b/i.test(d.status))
    warns.push(`unrecognised Status "${d.status}" — start the line with "locked" or "draft without direction", notes after that are fine`)

  if (d.front.dials && d.dial) {
    const norm = (s) => s.replace(/\s+/g, ' ').toUpperCase()
    if (norm(d.front.dials) !== norm(`ENERGY ${d.dial[1]} / RHYTHM ${d.dial[2]} / MOTION ${d.dial[3]}`))
      fails.push('frontmatter `dials:` disagrees with the Dial line in the body')
  }

  if (!d.css.includes(':root')) fails.push('no :root block in ## Tokens — the file has no source of truth')
  const missing = REQUIRED_TOKENS.filter((t) => !(t in d.tokens))
  if (missing.length) fails.push(`missing tokens: ${missing.map((t) => `--${t}`).join(', ')}`)
  const spaces = Object.keys(d.tokens).filter((t) => t.startsWith('space-'))
  const scales = Object.keys(d.tokens).filter((t) => t.startsWith('text-'))
  if (spaces.length < 3) fails.push(`spacing scale too thin: ${spaces.length} --space-* tokens, need 3+`)
  if (scales.length < 3) fails.push(`type scale too thin: ${scales.length} --text-* tokens, need 3+`)

  const colors = Object.entries(d.tokens).filter(([k]) => k.startsWith('color-'))
  const spaces2 = new Set(colors.map(([, v]) => parseColor(v)?.space).filter(Boolean))
  if (spaces2.size > 1) warns.push(`colour formats mixed: ${[...spaces2].join(', ')} — pick one`)

  const placeholders = d.lines
    .map((l, i) => (/<[a-z0-9 -]{2,40}>|\[[A-Z ]{3,40}\]|TODO:/.test(stripComments(l)) ? i + 1 : 0))
    .filter(Boolean)
  if (placeholders.length)
    fails.push(`${placeholders.length} unfilled placeholder(s), first on line ${placeholders[0]}`)

  const dec = d.sections.get('Decisions')
  if (dec) {
    const text = dec.body.join('\n').toLowerCase()
    for (const k of DECISION_KEYS)
      if (!new RegExp(`\\*\\*${k}\\*\\*|^[-*]\\s*${k}\\b`, 'm').test(text))
        fails.push(`no written reason for "${k}" in ## Decisions`)
  }

  const tok = (n) => (typeof d.tokens[n] === 'string' ? parseColor(d.tokens[n]) : null)
  const unparseable = (n) => typeof d.tokens[n] === 'string' && !parseColor(d.tokens[n])
  const paper = tok('color-paper')
  const pairs = [
    ['color-ink', paper, 4.5, 'body text'],
    ['color-ink-2', paper, 3, 'secondary text'],
    ['color-accent-ink', tok('color-accent'), 4.5, 'primary control label'],
    ['color-focus', paper, 3, 'focus ring'],
  ]
  for (const [name, bg, floor, use] of pairs) {
    if (unparseable(name))
      fails.push(`${name} is not a parseable colour (got "${d.tokens[name]}") — contrast cannot be verified`)
    const fg = tok(name)
    if (!fg || !bg) continue
    const ratio = contrast(fg, bg)
    const at = `${ratio.toFixed(2)}:1`
    measured.push(`${ratio >= floor ? 'ok   ' : 'FAIL '} ${name} on ${name === 'color-accent-ink' ? 'accent' : 'paper'} ${at} (needs ${floor}:1 for ${use})`)
    if (ratio < floor) fails.push(`${name} on its background is ${at}, below ${floor}:1 required for ${use}`)
    else if (name === 'color-ink-2' && ratio < 4.5)
      warns.push(`color-ink-2 is ${at} — passes for large text only; body copy needs 4.5:1`)
  }

  if (d.tokens['color-ink'] && /#0{3,6}/i.test(d.tokens['color-ink']))
    warns.push('pure black ink — tint it (oklch L ≤ 0.25 with a hue) to cut harshness')
  if (paper && paper.r === 255 && paper.g === 255 && paper.b === 255)
    warns.push('pure white paper — a tinted off-white reads as chosen, not defaulted')

  const disp = firstFamily(d.tokens['font-display'] ?? '')
  const body = firstFamily(d.tokens['font-body'] ?? '')
  if (disp && body && disp.toLowerCase() === body.toLowerCase())
    warns.push(`display and body resolve to "${disp}" — the "Inter-everywhere" tell; name what carries the voice`)

  if (d.lines.length > 120) warns.push(`${d.lines.length} lines — a filled template lands near 100; past 120 this is a wiki, not a system`)

  /* ---- direction gates: what the contrast maths cannot catch ---- */

  const secText = (name) => (d.sections.get(name)?.body ?? []).join('\n')
  const dirText = `${secText('System')}\n${secText('Design Read')}`

  const diff = dirText.match(/^\s*(?:[-*]\s*)?Differentiator\s*[·:—-]\s*(.+)$/im)
  if (!diff)
    fails.push(
      'no `Differentiator ·` line in ## Design Read — the file locks values but never states what makes it not the model default',
    )
  else {
    const said = diff[1].trim()
    if (said.length < 24)
      fails.push(`Differentiator is too thin to steer anything ("${said}") — one concrete sentence about what a viewer sees`)
    else {
      const soup = [...new Set((said.match(/\b(clean|modern|minimal|premium|sleek|elegant|beautiful|professional)\b/gi) ?? []).map((w) => w.toLowerCase()))]
      if (soup.length >= 2)
        warns.push(`Differentiator is adjective soup (${soup.join(', ')}) — it restates the anchor instead of escaping it`)
    }
  }

  const hits = SATURATED.filter((n) =>
    new RegExp(`\\b${n.replace(/[^\w]/g, '\\W')}\\b`, 'i').test(dirText),
  )
  if (hits.length) {
    const counter = dirText.match(/counter-anchor\s*[·:—-]\s*(\S.*)$/im)?.[1]?.trim()
    if (!counter)
      warns.push(
        `anchor names ${hits.join(', ')} — saturated, so a generator returns the average imitation of it; add \`counter-anchor ·\` with one reference from outside software`,
      )
  }

  const pk = oklchParts(d.tokens['color-paper'])
  const ak = oklchParts(d.tokens['color-accent'])
  if (pk && ak && ak.C >= 0.1) {
    if (pk.L <= 0.3)
      warns.push('dark canvas + high-chroma accent — the generated "console" skin; keep it only if the Differentiator says what else is there')
    else if (pk.L >= 0.9 && ak.H >= 85 && ak.H <= 145)
      warns.push('light gray canvas + chartreuse/lime accent — the current twin of that skin; same condition')
    if (ak.H >= 265 && ak.H <= 330)
      warns.push('violet/purple accent — the most generated hue in the corpus, and a hard gate in slop-tells.md when it rides a gradient')
  }

  if (d.dial && +d.dial[1] <= 1 && +d.dial[2] <= 1 && !/draft without direction/i.test(d.status))
    warns.push('ENERGY 1 with RHYTHM 1 on a locked file — the quietest setting on both axes is what "monoton" means; raise one unless the calm is the point')

  return { fails, warns, measured }
}

const stripComments = (l) => l.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')

export function report(d, res) {
  const out = [`DESIGN: ${d.file}`]
  out.push(
    `system: ${d.sections.get('#')?.heading ?? '(untitled)'} · ${
      d.dial ? `ENERGY ${d.dial[1]} / RHYTHM ${d.dial[2]} / MOTION ${d.dial[3]}` : 'no dials'
    } · ${d.status || 'no status'}`,
  )
  for (const m of res.measured) out.push(m)
  for (const f of res.fails) out.push(`FAIL  ${f}`)
  for (const w of res.warns) out.push(`WARN  ${w}`)
  out.push(
    res.fails.length
      ? `${res.fails.length} failed, ${res.warns.length} warning(s) — fix before locking`
      : `PASS  ${Object.keys(d.tokens).length} tokens, ${res.warns.length} warning(s)`,
  )
  return out.join('\n')
}
