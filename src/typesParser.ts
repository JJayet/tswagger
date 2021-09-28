import { appendFileSync } from 'fs'

import { hasOwnProperty } from './helper'
import { AnyOfProperty, Property, RefProperty, Schema, Schemas, TypedProperties } from './types'

let fileNameToAppendTo = ''

const getRef = (ref: string) => ref.split('/').reverse()[0]

const emptyLine = () => write('')
const write = (data: string) => appendFileSync(fileNameToAppendTo, `${data}\r\n`, { encoding: 'utf8' })

const generateDocumentation = (property: Property, withIdentation = true) => {
  if ("$ref" in property || !hasOwnProperty(property, 'type')) {
    return
  }

  const documentation = [`${withIdentation ? '  ' : ''}/**`]
  if ('example' in property) {
    documentation.push(`${withIdentation ? '  ' : ''}* ${property.example}`)
  }
  switch (property.type) {
    case 'string':
      if ('format' in property) {
        documentation.push(`${withIdentation ? '  ' : ''}* Format: ${property.format}`)
      }
      if ('pattern' in property) {
        documentation.push(`${withIdentation ? '  ' : ''}* Pattern: ${property.pattern}`)
      }
      break;
    case 'integer':
      if ('format' in property) {
        documentation.push(`${withIdentation ? '  ' : ''}* Format: ${property.format}`)
      }
      if ('minimum' in property) {
        documentation.push(`${withIdentation ? '  ' : ''}* Minimum: ${property.minimum}`)
      }
      break;
  }

  if (documentation.length > 1) {
    documentation.push(`${withIdentation ? '  ' : ''}**/`)
    emptyLine()
    documentation.forEach(_ => write(_))
  }
}

const isTypedProperty = (property: unknown): property is TypedProperties => typeof property === 'object' && property !== null && 'type' in property

const generatePropertyValue = (property: Property): string => {
  if ("$ref" in property) {
    return getRef(property.$ref)
  } else if (!hasOwnProperty(property, 'type')) {
    return 'unknown'
  } else {
    switch (property.type) {
      case 'array':
        if (hasOwnProperty(property.items, '$ref')) {
          return `${getRef(property.items.$ref)}[]`
        } else if (isTypedProperty(property.items)) {
          return `${generatePropertyValue(property.items as Property)}[]`
        } else {
          return property.items
        }
      case 'string':
        return property.enum ? `'${property.enum.join('\'|\'')}'` : property.type
      case 'integer':
        return 'number'
      case 'email':
        return 'string'
      case 'object':
        return '{}'
      default:
        return property.type
    }
  }
}

const cleanedType = (property: Property): Property => {
  if ('type' in property) {
    return {
      ...property,
      type: property.type.trim() as typeof property.type
    }
  }
  return property
}

const generateComplexeModel = (schemaName: string, schema: Schema, withoutDocumentation: boolean) => {
  write(`export type ${schemaName} = {`)
  for (const key of Object.keys(schema.properties)) {
    const property = cleanedType(schema.properties[key])
    if (!withoutDocumentation) {
      generateDocumentation(property)
    }
    write(`  ${key}${schema.required?.includes(key) ? '' : '?'}: ${generatePropertyValue(property)}`)
  }
  write("}")
}

const generateAnyOf = (schemaName: string, property: AnyOfProperty) => {
  write(`export type ${schemaName} = ` + property.anyOf.map(_ => `${getRef(_.$ref)}`).join(' | '))
}


const generateTypeProperty = (schemaName: string, property: Property | RefProperty, withoutDocumentation: boolean) => {
  if ('$ref' in property) {
    write(`export type ${schemaName} = ${getRef(property.$ref)}`)
  } else {
    if (!withoutDocumentation) {
      generateDocumentation(property, false)
    }
    write(`export type ${schemaName} = ${generatePropertyValue(property)}`)
  }
}

export const generateTypes = (schemas: Schemas, fileName: string, withoutDocumentation: boolean) => {
  fileNameToAppendTo = fileName
  const schemasNames = Object.keys(schemas)
  schemasNames.map((schemaName, index) => {
    if (index > 0) {
      emptyLine()
    }
    const obj = schemas[schemaName]
    if ('properties' in obj) {
      generateComplexeModel(schemaName, obj, withoutDocumentation)
    }
    else if ('anyOf' in obj) {
      generateAnyOf(schemaName, obj)
    }
    else {
      generateTypeProperty(schemaName, obj, withoutDocumentation)
    }
  })
}