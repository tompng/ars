type RecordType = { _meta?: { query: any } }
type Values<T> = T extends { [K in keyof T]: infer U } ? U : never
type DataTypeExtractField<BaseType, Key extends keyof BaseType> = BaseType[Key] extends RecordType
  ? (null extends BaseType[Key] ? {} | null : {})
  : BaseType[Key] extends RecordType[]
  ? {}[]
  : BaseType[Key]

type DataTypeExtractFieldsFromQuery<BaseType, Fields> = '*' extends Fields
  ? { [key in Exclude<keyof BaseType, '_meta'>]: DataTypeExtractField<BaseType, key> }
  : { [key in Fields & keyof (BaseType)]: DataTypeExtractField<BaseType, key> }

interface ExtraFieldErrorType {
  extraFieldError: any
}

type DataTypeExtractFromQueryHash<BaseType, QueryType> = '*' extends keyof QueryType
  ? {
      [key in Exclude<(keyof BaseType) | (keyof QueryType), '_meta' | '_params' | '*'>]: (key extends keyof BaseType
        ? (key extends keyof QueryType
            ? (QueryType[key] extends true
                ? DataTypeExtractField<BaseType, key>
                : DataTypeFromQuery<BaseType[key] & {}, QueryType[key]>)
            : DataTypeExtractField<BaseType, key>)
        : ExtraFieldErrorType)
    }
  : {
      [key in keyof QueryType]: (key extends keyof BaseType
        ? (QueryType[key] extends true
            ? DataTypeExtractField<BaseType, key>
            : DataTypeFromQuery<BaseType[key] & {}, QueryType[key]>)
        : ExtraFieldErrorType)
    }

type _DataTypeFromQuery<BaseType, QueryType> = QueryType extends keyof BaseType | '*'
  ? DataTypeExtractFieldsFromQuery<BaseType, QueryType>
  : QueryType extends Readonly<(keyof BaseType | '*')[]>
  ? DataTypeExtractFieldsFromQuery<BaseType, Values<QueryType>>
  : QueryType extends { as: string }
  ? { error: 'type for alias field is not supported' } | undefined
  : DataTypeExtractFromQueryHash<BaseType, QueryType>

export type DataTypeFromQuery<BaseType, QueryType> = BaseType extends any[]
  ? CheckAttributesField<BaseType[0], QueryType>[]
  : null extends BaseType
  ? CheckAttributesField<BaseType & {}, QueryType> | null
  : CheckAttributesField<BaseType & {}, QueryType>

type CheckAttributesField<P, Q> = Q extends { attributes: infer R }
  ? _DataTypeFromQuery<P, R>
  : _DataTypeFromQuery<P, Q>

type IsAnyCompareLeftType = { __any: never }

type CollectExtraFields<Type, Path> = ExtraFieldErrorType extends Type
  ? (IsAnyCompareLeftType extends Type ? null : Path)
  : _CollectExtraFields<Type extends (infer R)[] ? R : (Type extends object ? Type : null)>

type _CollectExtraFields<Type> = keyof (Type) extends never
  ? null
  : Values<{ [key in keyof Type]: CollectExtraFields<Type[key], [key]> }>

type SelectString<T> = T extends string ? T : never
type _ValidateDataTypeExtraFileds<Extra, Type> = SelectString<Values<Extra>> extends never
  ? Type
  : { error: { extraFields: SelectString<Values<Extra>> } }
type ValidateDataTypeExtraFileds<Type> = _ValidateDataTypeExtraFileds<CollectExtraFields<Type, []>, Type>

type RequestBase = { api: string; query: any; params?: any; _meta?: { data: any } }
type DataTypeBaseFromRequestType<R> = R extends { _meta?: { data: infer DataType } } ? DataType : never
export type DataTypeFromRequest<Req extends RequestBase, R extends RequestBase> = ValidateDataTypeExtraFileds<
  DataTypeFromQuery<DataTypeBaseFromRequestType<Req>, R['query']>
>