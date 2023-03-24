export enum FilterOperator {
    EQUAL_TO = '$eq',
    EQUAL_TO_CASE_INSENSITIVE  = '$eqi',
    NOT_EQUAL_TO = '$ne',
    LESS_THAN = '$lt',
    LESS_THAN_OR_EQUAL_TO = '$lte',
    GREATER_THAN = '$gt',
    GREATER_THAN_OR_EQUAL_TO = '$gte',
    IN = '$in',
    NOT_IN = '$notIn',
    CONTAINS = '$contains',
    NOT_CONTAINS = '$notContains',
    CONTAINS_CASE_INSENSITIVE = '$containsi',
    NOT_CONTAINS_CASE_INSENSITIVE = '$notContainsi',
    IS_NULL = '$null',
    IS_NOT_NULL = '$notNull',
    IS_BETWEEN = '$between',
    STARTS_WITH = '$startsWith',
    STARTS_WITH_CASE_INSENSITIVE = '$startsWithi',
}

export enum LogicalOperator {
    AND = 'and',
    OR = 'or',
    BOTH = 'both',
    NONE = 'none'
}

export enum SortDirection {
    ASC,
    DESC
}

export interface Filter {
    field: string,
    value: any,
    secondaryValue: any
    operator: FilterOperator,
    andGroup?: number,
    orGroup?: number
}