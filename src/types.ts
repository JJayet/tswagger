export type Schemas = { [key: string]: Schema | Property | AnyOfProperty }

export type Schema = {
  properties: { [key: string]: Property },
  required?: string[],
  type: 'object',
  additionalProperties: boolean
}

export type RefProperty = { $ref: string }
export type BaseProperty = { example: unknown, default?: unknown }
export type AnyOfProperty = { anyOf: RefProperty[] }
export type ArrayProperty = { type: 'array', items: 'string' | 'integer' | 'boolean' | RefProperty | TypedProperties, minItems?: number }
export type StringProperty = { type: 'string', enum?: string[], format?: 'date-time', pattern?: string }
export type NumberProperty = { type: 'integer', format?: 'int32' | 'double', minimum?: number }
export type BooleanProperty = { type: 'boolean' }
export type ObjectType = { type: 'object' }
export type EmailProperty = { type: 'email' }
export type UnknownProperty = {}

export type TypedProperties = ArrayProperty | BooleanProperty | EmailProperty | NumberProperty | ObjectType | StringProperty
export type Property = (RefProperty | TypedProperties | UnknownProperty) & BaseProperty