#!/usr/bin/env node
// Repo test suite: the validator and exporter must behave as documented, and
// the skill folder must keep the shape its own conventions demand.
// Dependency-free; run with `node tests/run.mjs`. Exit 0 = everything passed.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SKILL = join(ROOT, 'skills', 'design-md-generator')
const VALIDATE = join(SKILL, 'scripts', 'validate_design.mjs')
const EXPORT = join(SKILL, 'scripts', 'export_design.mjs')
const GOOD = join(ROOT, 'tests', 'fixtures', 'good', 'DESIGN.md')
const BAD = join(ROOT, 'tests', 'fixtures', 'bad', 'DESIGN.md')

let failed = 0
let ran = 0
const check = (name, ok, detail = '') => {
  ran++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail && !ok ? ` — ${detail}` : ''}`)
  if (!ok) failed++
}
const run = (script, args) => {
  try {
    return { code: 0, out: execFileSync(process.execPath, [script, ...args], { encoding: 'utf8' }) }
  } catch (e) {
    return { code: e.status ?? -1, out: (e.stdout ?? '') + (e.stderr ?? '') }
  }
}

/* ---- validator ---- */

const good = run(VALIDATE, [GOOD])
check('a clean DESIGN.md passes', good.code === 0 && /\bPASS\b/.test(good.out), good.out)
check('and reports zero warnings', /0 warning\(s\)/.test(good.out), good.out)

const bad = run(VALIDATE, [BAD])
check('a broken DESIGN.md exits non-zero', bad.code === 1, `exit ${bad.code}`)
for (const [label, needle] of [
  ['missing Differentiator is a FAIL', /FAIL.*Differentiator/s],
  ['unfilled placeholder is a FAIL', /FAIL.*placeholder/s],
  ['a missing decision reason is a FAIL', /FAIL.*written reason for "accent"/s],
  ['failed contrast is a FAIL', /FAIL.*below 4\.5:1/s],
  ['mixed colour formats is a WARN', /WARN.*colour formats mixed/s],
  ['Inter-everywhere is a WARN', /WARN.*Inter-everywhere/s],
  ['a saturated anchor with no real counter-anchor is a WARN', /WARN.*anchor names linear, vercel/s],
])
  check(label, needle.test(bad.out), 'not reported')

/* ---- exporter ---- */

const out = mkdtempSync(join(tmpdir(), 'dmd-export-'))
const exp = run(EXPORT, [GOOD, '--format', 'all', '--out', out])
const written = ['tokens.css', 'tailwind.theme.css', 'tokens.json', 'shadcn.vars.css']
check('the exporter exits 0 on a valid file', exp.code === 0, exp.out)
check('and writes all four targets', written.every((f) => existsSync(join(out, f))), written.filter((f) => !existsSync(join(out, f))).join(', '))
check('tokens.css carries the source-of-truth values', readFileSync(join(out, 'tokens.css'), 'utf8').includes('--color-paper:'))
check('tokens.json is valid DTCG', JSON.parse(readFileSync(join(out, 'tokens.json'), 'utf8')).color?.paper?.$value !== undefined)
check('the exporter refuses a file that fails validation', run(EXPORT, [BAD, '--out', out]).code === 1)
rmSync(out, { recursive: true, force: true })

/* ---- skill shape (the conventions this repo was built to) ---- */

const skillMd = readFileSync(join(SKILL, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n')
const fm = skillMd.match(/^---\n([\s\S]*?)\n---/)
check('SKILL.md has frontmatter', !!fm)
check('frontmatter names the skill', /^name: design-md-generator$/m.test(fm?.[1] ?? ''))
const desc = (fm?.[1] ?? '').match(/^description: >-\n([\s\S]*?)^\w/m)?.[1] ?? ''
check('description is a single trigger paragraph under 1024 chars', desc.length > 80 && desc.length <= 1024, `${desc.length} chars`)
check('body stays under 500 lines', skillMd.split('\n').length < 500)
check('no README or CHANGELOG inside the skill folder',
  !readdirSync(SKILL).some((f) => /^(README|CHANGELOG|CONTRIBUTING)\.md$/i.test(f)))

const mentioned = new Set([...skillMd.matchAll(/(?:references|assets|scripts)\/[\w.-]+/g)].map((m) => m[0]))
for (const dir of ['references', 'assets', 'scripts'])
  for (const f of readdirSync(join(SKILL, dir)))
    check(`${dir}/${f} is referenced from SKILL.md`, mentioned.has(`${dir}/${f}`))

/* ---- repo shape ---- */

for (const f of ['README.md', 'LICENSE', 'package.json', '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'cli/index.mjs'])
  check(`${f} exists`, existsSync(join(ROOT, f)))
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
check('the npm package declares the installer as its bin', pkg.bin?.['design-md-generator'] === 'cli/index.mjs')
check('and ships the skill folder it installs', (pkg.files ?? []).includes('skills'))
const plugin = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'))
check('the plugin manifest points at the skill folder', plugin.skills?.includes('./skills/'))
const version = skillMd.match(/^version:\s*([\d.]+)$/m)?.[1]
check(`SKILL.md, package.json and plugin.json agree on version (${version})`,
  version === plugin.version && version === pkg.version)

/* ---- installer ---- */

const CLI = join(ROOT, 'cli', 'index.mjs')
const listed = run(CLI, ['--list'])
check('the installer lists every host',
  listed.code === 0 && ['Claude Code', 'Codex / OpenCode', 'Qoder CLI', 'Hermes Agent'].every((l) => listed.out.includes(l)), listed.out)
check('and names the Hermes command instead of copying it', /hermes skills add/.test(listed.out))

const sandbox = mkdtempSync(join(tmpdir(), 'dmd-host-'))
const first = run(CLI, ['--dir', sandbox])
check('the installer copies the skill into a host directory',
  first.code === 0 && existsSync(join(sandbox, 'design-md-generator', 'SKILL.md')), first.out)
check('including the reference files', existsSync(join(sandbox, 'design-md-generator', 'references', 'slop-tells.md')))
const second = run(CLI, ['--dir', sandbox])
check('a second run refuses to clobber without --force', /already installed/.test(second.out), second.out)
check('--force overwrites', run(CLI, ['--dir', sandbox, '--force']).code === 0)
check('the installed copy still validates its own fixture',
  run(join(sandbox, 'design-md-generator', 'scripts', 'validate_design.mjs'), [GOOD]).code === 0)
rmSync(sandbox, { recursive: true, force: true })

console.log(failed ? `\n${failed} of ${ran} check(s) failed` : `\n${ran} checks passed`)
process.exit(failed ? 1 : 0)
