#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { readDesign, validate, report } from './lib.mjs'

const file = process.argv[2]

if (file === '--help' || file === '-h') {
  console.log('usage: node validate_design.mjs <DESIGN.md>\nexit 0 when the file has no FAIL lines')
  process.exit(0)
}
if (!file) {
  console.log('usage: node validate_design.mjs <DESIGN.md>')
  process.exit(1)
}
if (!existsSync(file)) {
  console.log(`FAIL  file not found: ${file}`)
  process.exit(1)
}

const design = readDesign(file)
const res = validate(design)
console.log(report(design, res))
process.exit(res.fails.length ? 1 : 0)
