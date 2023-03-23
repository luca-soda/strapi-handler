import { extractData } from "./StrapiHandler";
import axios from 'axios';
import chalk from 'chalk';

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
    AND,
    OR,
    BOTH,
    NONE
}

enum Bracket {
    OPEN,
    CLOSE
}

interface Filter {
    field: string,
    value: any,
    secondaryValue: any
    operator: FilterOperator,
    andGroup: number | undefined,
    orGroup: number | undefined
}

class StrapiGet {
    private url: string;
    private sortCounter = 0;
    private fieldsCounter = 0;
    private orGroup: number | undefined;
    private andGroup: number | undefined;
    private filters = <(Filter | Bracket)[]>[];
    private acceptedLogicalOperator = LogicalOperator.BOTH;

    constructor(baseUrl: string, entries: string, private readonly apiKey: string) {
        this.url = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}api/${entries}?`;
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
            andGroup: this.andGroup,
            orGroup: this.orGroup,
        });
        return this;
    }

    public openBracket(): StrapiGet {
        if (this.isBracketOpen())
            throw new Error('Opening a bracket within a bracket. That\'s not supported by Strapi');
        this.filters.push(Bracket.OPEN);
        return this;
    }

    public closeBracket(): StrapiGet {
        if (!this.isBracketOpen()) {
            console.log(chalk.yellow('Warning: Unmatched bracket'))
        }
        this.filters.push(Bracket.CLOSE);
        this.acceptedLogicalOperator = LogicalOperator.BOTH;
        return this;
    }

    public isBracketOpen() {
        let bracket = false;
        for (let i = 0; i < this.filters.length; i++) {
            if (Number(this.filters[i]) === Bracket.OPEN) {
                bracket = true;
            }
            else if (Number(this.filters[i]) === Bracket.CLOSE) {
                bracket = false;
            }
        }
        return bracket;
    }

    and(field: string, operator: FilterOperator, value: any, secondaryValue?: any): StrapiGet;
    and(): StrapiGet;

    public and(field?: string, operator?: FilterOperator, value?: any, secondaryValue?: any): StrapiGet {
        if (field) {
            return this.logicalOperator(field, operator!, value, LogicalOperator.AND, secondaryValue);
        }
        else {
            this.andGroup ??= 0;
            if (this.filters[this.filters.length-1] as Bracket === Bracket.CLOSE) {
                let i = this.filters.length - 2;
                while (this.filters[i] as Bracket !== Bracket.OPEN) {
                    (this.filters[i] as Filter).andGroup = this.andGroup;
                    i--;
                }
                return this;
            }
            else {
                throw new Error('Empty "and" and "or" should be used only after a bracket');
            }
        }
    }

    or(field: string, operator: FilterOperator, value: any, secondaryValue?: any): StrapiGet;
    or(): StrapiGet;

    public or(field?: string, operator?: FilterOperator, value?: any, secondaryValue?: any): StrapiGet {
        if (field) {
            return this.logicalOperator(field, operator!, value, LogicalOperator.OR, secondaryValue);
        }
        else {
            this.orGroup ??= 0;
            if (this.filters[this.filters.length-1] as Bracket === Bracket.CLOSE) {
                let i = this.filters.length - 2;
                while (this.filters[i] as Bracket !== Bracket.OPEN) {
                    (this.filters[i] as Filter).orGroup = this.orGroup;
                    i--;
                }
                return this;
            }
            else {
                throw new Error('Empty "and" and "or" should be used only after a bracket');
            }
        }
    }

    private logicalOperator(field: string, operator: FilterOperator, value: any, logicalOperator: LogicalOperator, secondaryValue?: any) {
        if (logicalOperator !== LogicalOperator.AND && logicalOperator !== LogicalOperator.OR) {
            throw new Error('Pass only AND or OR to LogicalOperator Function');
        }
        this.filter(field, operator, value, secondaryValue);
        const logicalString = logicalOperator === LogicalOperator.AND ? 'and' : 'or';
        if (this.acceptedLogicalOperator !== logicalOperator && this.acceptedLogicalOperator !== LogicalOperator.BOTH) {
            throw new Error('Ambiguous logical operator: use brackets');
        }
        if (this.filters.length) {
            if (this.filters[this.filters.length-1] as Bracket === Bracket.OPEN) {
                throw new Error(`Cannot "${logicalString}" after a open bracket, use filter instead`);
            }
            else {
                if ((this.filters[this.filters.length-2] as Filter)[`${logicalString}Group`] === undefined) {
                    this[`${logicalString}Group`] = 0;
                    (this.filters[this.filters.length-2] as Filter)[`${logicalString}Group`] = 0;
                }
                this[`${logicalString}Group`] = this[`${logicalString}Group`]!+1;
                (this.filters[this.filters.length-1] as Filter)[`${logicalString}Group`] = this[`${logicalString}Group`];
                this.acceptedLogicalOperator = logicalOperator;
                return this;
            }
        }
        else {
            throw new Error(`Using "${logicalString}" without filters to operate with`);
        }
    }

    public async call<T>(): Promise<{ data: T[], meta: any }> {
        if (this.isBracketOpen()) {
            throw new Error('Bracket opened and never closed');
        }
        console.log(this.filters.filter((e) => Number(e) !== e));
        let { data: { data, meta } } = await axios.get(this.url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        const result = extractData(data);
        return {
            data: result,
            meta
        };
    }

    // private filtersToQuery() {
        
    // }
}



export default StrapiGet;
export {FilterOperator}