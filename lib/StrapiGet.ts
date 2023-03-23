import { extractData } from "./StrapiHandler";
import axios from 'axios';

enum SortDirection {
    ASC,
    DESC
}

enum FilterOperator {
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
    // OR = '$or',
    // AND = '$and',
    // NOT = '$not'
}

enum LogicalOperator {
    AND = 'and',
    OR = 'or',
    BOTH = 'both',
    NONE = 'none'
}

interface Filter {
    field: string,
    value: any,
    secondaryValue: any
    operator: FilterOperator,
    andGroup?: number,
    orGroup?: number
}

class StrapiGet {
    private url: string;
    private sortCounter = 0;
    private fieldsCounter = 0;
    private filters = <(Filter)[]>[];
    private isBracketOpen = false;
    private logicalOperator = LogicalOperator.NONE;
    private group = 0;
    private isIdHidden = false;
    private renamer = <{field: string, target: string}[]>[]

    constructor(strapiUrl: string, entries: string, private readonly apiKey: string) {
        this.url = `${strapiUrl.endsWith('/') ? strapiUrl : strapiUrl + '/'}api/${entries}?`;
    }

    public page(page: number): StrapiGet {
        this.url += `&pagination[page]=${page}`;
        return this;
    }

    public populate(field: string): StrapiGet {
        this.url += `&populate=${field}`;
        return this;
    }

    public sort(field: string, sortDirection?: SortDirection): StrapiGet {
        this.url += `&sort[${this.sortCounter++}]=${field}`;
        if (sortDirection != null) {
            this.url += sortDirection === SortDirection.ASC ? ':asc' : 'desc';
        }
        return this;
    }

    public field(field: string): StrapiGet {
        this.url += `&fields[${this.fieldsCounter++}]=${field}`;
        return this;
    }

    public pageSize(pageSize: number): StrapiGet {
        this.url += `&pagination[pageSize]=${pageSize}`
        return this;
    }

    public offsetStart(start: number): StrapiGet {
        this.url += `&pagination[start]=${start}`;
        return this;
    }

    public offsetLimit(limit: number): StrapiGet {
        this.url += `&pagination[limit]=${limit}`;
        return this;
    }

    public withCount(shouldCount: boolean): StrapiGet {
        this.url += `&pagination[withCount]=${shouldCount}`;
        return this;
    }

    public filter(field: string, operator: FilterOperator, value: any, secondaryValue?: any) {
        this.filters.push({
            field,
            operator,
            value,
            secondaryValue,
            andGroup: this.logicalOperator === LogicalOperator.AND ? this.group : 0,
            orGroup: this.logicalOperator === LogicalOperator.OR ? this.group : 0,
        });
        return this;
    }

    public hideId() {
        this.isIdHidden = true;
        return this
    }

    public rename(field: string, target: string) {
        this.renamer.push({field, target});
        return this;
    }

    public and(field: string, operator: FilterOperator, value: any, secondaryValue?: any): StrapiGet {
        if (this.logicalOperator === LogicalOperator.OR) {
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = LogicalOperator.AND;
        this.group = this.group+1;
        return this.filter(field, operator, value, secondaryValue);
    }

    public or(field: string, operator: FilterOperator, value: any, secondaryValue?: any): StrapiGet {
        if (this.logicalOperator === LogicalOperator.AND) {
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = LogicalOperator.OR;
        this.group = this.group+1;
        return this.filter(field, operator, value, secondaryValue);
    }

    public async call<T>(): Promise<{ data: T[], meta: any }> {
        if (this.isBracketOpen) {
            throw new Error('Bracket opened and never closed');
        }
        let isSetAnd = false;
        this.filters.forEach((el) => {
            if (el.andGroup !== 0)
                isSetAnd = true;
        });
        if (!isSetAnd) {
            this.filters = this.filters.map((el) => {
                const obj = {...el};
                delete obj.andGroup;
                return obj;
            });
        }
        let isSetOr = false;
        this.filters.forEach((el) => {
            if (el.orGroup !== 0)
                isSetOr = true;
        });
        if (!isSetOr) {
            this.filters = this.filters.map((el) => {
                const obj = {...el};
                delete obj.orGroup;
                return obj;
            })
        }
        this.url += this.filters.reduce((acc: string, currentValue: Filter): string => {
            const {field, operator, value, orGroup, andGroup, secondaryValue} = currentValue;
            let logicalOperator = ""
            if (orGroup != null) {
                logicalOperator = `[$or][${orGroup}]`;
            }
            if (andGroup != null) {
                logicalOperator = `[$and][${andGroup}]`;
            }
            if (operator === FilterOperator.IS_BETWEEN) {
                return acc+`&filters${logicalOperator}[${field}][${operator}]=${value}&filters${logicalOperator}[${field}][${operator}]=${secondaryValue}`
            }
            else {
                return acc+`&filters${logicalOperator}[${field}][${operator}]=${value}`
            }
        }, '');
        let { data: { data, meta } } = await axios.get(this.url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        const result = extractData(data).map((el: any) => {
            const obj = {...el};
            if (this.isIdHidden) {
                delete obj.id;
            }
            this.renamer.forEach((rename) => {
                obj[rename.target] = obj[rename.field];
                delete obj[rename.field];
            })
            return obj;
        })
        return {
            data: result,
            meta
        };
    }
}



export default StrapiGet;
export {FilterOperator}