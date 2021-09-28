#!/usr/bin/env node

import axios from 'axios'
import { unlinkSync } from 'fs'
import yargs from 'yargs/yargs'

import { generateTypes } from './typesParser'
import { Schemas } from './types'


const main = async () => {
  const { output, removeExisting, typesOnly, url, withoutDocumentation } = yargs(process.argv.slice(2)).usage('Swagger model generator for TypeScript. Usage:').options({
    url: { type: 'string', alias: ['u'], demandOption: true },
    output: { type: 'string', alias: ['o'], default: 'output.ts' },
    typesOnly: { type: 'boolean', alias: ['t'], default: false },
    withoutDocumentation: { type: 'boolean', alias: ['d'], default: false },
    removeExisting: { type: 'boolean', alias: ['r'], default: true }
  }).argv as { output: string, removeExisting: boolean, typesOnly: boolean, url: string, withoutDocumentation: boolean }
  

  if (removeExisting) {
    try {
      unlinkSync(output)
    } catch {

    }
  }

  const res = (await axios.get(url)).data
  const schemas: Schemas = res.components.schemas
  
  generateTypes(schemas, output, withoutDocumentation)
  if (typesOnly) {
    return
  }
}


main()