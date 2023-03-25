import { extractData } from "./StrapiHandler";
import axios from 'axios';
import { FilterOperator, LogicalOperator, Filter, SortDirection } from "./Interfaces";


class StrapiFindAll {
    private url: string;
    private sortCounter = 0;
    private fieldsCounter = 0;
    private filters = <(Filter)[]>[];
    private logicalOperator = LogicalOperator.NONE;
    private group = 0;
    private isIdHidden = false;
    private isAllHidden = false;
    private renamer = <{ field: string, target: string }[]>[];

    constructor(strapiUrl: string, entries: string, private readonly apiKey: string) {
        this.url = `${strapiUrl.endsWith('/') ? strapiUrl : strapiUrl + '/'}api/${entries}?`;
    }

    public page(page: number): StrapiFindAll {
        this.url += `&pagination[page]=${page}`;
        return this;
    }

    public populate(field: string): StrapiFindAll {
        this.url += `&populate=${field}`;
        return this;
    }

    public sort(field: string, sortDirection?: SortDirection): StrapiFindAll {
        this.url += `&sort[${this.sortCounter++}]=${field}`;
        if (sortDirection != null) {
            this.url += sortDirection === SortDirection.ASC ? ':asc' : ':desc';
        }
        return this;
    }

    public field(field: string): StrapiFindAll {
        this.url += `&fields[${this.fieldsCounter++}]=${field}`;
        return this;
    }

    public fields(fields: string[]): StrapiFindAll {
        fields.forEach(field => this.field(field));
        return this;
    }

    public pageSize(pageSize: number): StrapiFindAll {
        this.url += `&pagination[pageSize]=${pageSize}`
        return this;
    }

    public offsetStart(start: number): StrapiFindAll {
        this.url += `&pagination[start]=${start}`;
        return this;
    }

    public offsetLimit(limit: number): StrapiFindAll {
        this.url += `&pagination[limit]=${limit}`;
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

    public hideId(): StrapiFindAll {
        this.isIdHidden = true;
        return this
    }

    public async showOnlyIds(): Promise<{ids: number[], meta: any}> {
        this.isAllHidden = true;
        const result = await this.call<any>();
        return {
            ids: result.data.map(el => el.id),
            meta: result.meta
        }
    }

    public rename(field: string, target: string): StrapiFindAll {
        this.renamer.push({ field, target });
        return this;
    }

    public and(field: string, operator: FilterOperator, value: any, secondaryValue?: any): StrapiFindAll {
        if (this.logicalOperator === LogicalOperator.OR) {
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = LogicalOperator.AND;
        this.group = this.group + 1;
        return this.filter(field, operator, value, secondaryValue);
    }

    public or(field: string, operator: FilterOperator, value: any, secondaryValue?: any): StrapiFindAll {
        if (this.logicalOperator === LogicalOperator.AND) {
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = LogicalOperator.OR;
        this.group = this.group + 1;
        return this.filter(field, operator, value, secondaryValue);
    }

    public async show<T>(): Promise<{data: T[], meta: any}> {
        return this.call<T>();
    }

    private async call<T>(): Promise<{ data: T[], meta: any }> {
        let isSetAnd = false;
        this.filters.forEach((el) => {
            if (el.andGroup !== 0)
                isSetAnd = true;
        });
        if (!isSetAnd) {
            this.filters = this.filters.map((el) => {
                const obj = { ...el };
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
                const obj = { ...el };
                delete obj.orGroup;
                return obj;
            })
        }
        this.url += this.filters.reduce((acc: string, currentValue: Filter): string => {
            const { field, operator, value, orGroup, andGroup, secondaryValue } = currentValue;
            let logicalOperator = ""
            if (orGroup != null) {
                logicalOperator = `[$or][${orGroup}]`;
            }
            if (andGroup != null) {
                logicalOperator = `[$and][${andGroup}]`;
            }
            if (operator === FilterOperator.IS_BETWEEN) {
                return acc + `&filters${logicalOperator}[${field}][${operator}]=${value}&filters${logicalOperator}[${field}][${operator}]=${secondaryValue}`
            }
            else if (operator === FilterOperator.IS_NOT_NULL) {
                return acc + `&filters${logicalOperator}[${field}][${operator}]=true`;
            }
            else if (operator === FilterOperator.IS_NULL) {
                return acc + `&filters${logicalOperator}[${field}][${operator}]=true`;
            }
            else if (operator === FilterOperator.IN || operator === FilterOperator.NOT_IN) {
                let inId = 0;
                let filterStr = '';
                for (let el of value) {
                    filterStr += `&filters${logicalOperator}[${field}][${operator}][${inId++}]=${el}`;
                }
                return acc + filterStr;
            }
            else {
                return acc + `&filters${logicalOperator}[${field}][${operator}]=${value}`
            }
        }, '');
        let { data: { data, meta } } = await axios.get(this.url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        const result = extractData(data).map((el: any) => {
            const obj = { ...el };
            if (this.isIdHidden) {
                delete obj.id;
            }
            if (this.isAllHidden) {
                Object.keys(el).forEach((key) => {
                    if (key !== 'id') {
                        delete obj[key];
                    }
                })
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
        }
    }
}


export default StrapiFindAll;