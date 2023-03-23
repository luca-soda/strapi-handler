import { extractData } from "./StrapiHandler";
import axios from 'axios';

interface GetSortDirection {
    asc: () => StrapiGet,
    desc: () => StrapiGet
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
    OR = '$or',
    AND = '$and',
    NOT = '$not'
}

class StrapiGet {
    private url: string;
    private sortCounter = 0;
    private fieldsCounter = 0;
    private filtersCounter = 0;
    private sorting = false;

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

    public sort(field: string): GetSortDirection {
        this.url += `&sort[${this.sortCounter++}]=${field}`;
        this.sorting = true;
        return this as GetSortDirection;
    }

    public asc(): StrapiGet {
        if (!this.sorting) {
            console.error('You are setting ASC without SORT, there is probably an error in your query')
        }
        else {
            this.sorting = false;
            this.url += ':asc';
        }
        return this;
    }

    public desc(): StrapiGet {
        if (!this.sorting) {
            console.error('You are setting DESC without SORT, there is probably an error in your query')
        }
        else {
            this.sorting = false;
            this.url += ':desc';
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

    public filter(field: string, operator: FilterOperator, value: string) {
        this.url += `&filters[${field}][${operator}][${this.filtersCounter++}]=${value}`
        return this;
    }

    public async call<T>(): Promise<{ data: T[], meta: any }> {
        console.log(this.url);
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
}



export default StrapiGet;
export {FilterOperator}