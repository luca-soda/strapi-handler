export enum FilterOperator {
    IS_EQUAL_TO = '$eq',
    IS_EQUAL_TO_CASE_INSENSITIVE  = '$eqi',
    IS_NOT_EQUAL_TO = '$ne',
    IS_LESS_THAN = '$lt',
    IS_LESS_THAN_OR_EQUAL_TO = '$lte',
    IS_GREATER_THAN = '$gt',
    IS_GREATER_THAN_OR_EQUAL_TO = '$gte',
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
    optionalParams: any
    operator: FilterOperator,
    andGroup?: number,
    orGroup?: number
}

export interface OptionalParams {
    secondaryValue?: any;
}