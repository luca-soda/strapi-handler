import { extractData } from "./StrapiHandler";
import axios from 'axios';
import { FilterOperator, LogicalOperator, Filter, SortDirection, OptionalParams } from "./Interfaces";


class StrapiFindAll {
    private url: string;
    private sortCounter = 0;
    private fieldsCounter = 0;
    private populateCounter = 0;
    private filters = <(Filter)[]>[];
    private logicalOperator = LogicalOperator.NONE;
    private andGroup: number | undefined;
    private orGroup: number | undefined;
    private isIdHidden = false;
    private isAllHidden = false;
    private renamer = <{ field: string, target: string }[]>[];
    private lastFilterPushed: Filter | undefined;

    constructor(strapiUrl: string, entries: string, private readonly apiKey: string) {
        this.url = `${strapiUrl.endsWith('/') ? strapiUrl : strapiUrl + '/'}api/${entries}?`;
    }

    public page(page: number): StrapiFindAll {
        this.url += `&pagination[page]=${page}`;
        return this;
    }

    public populate(field: string): StrapiFindAll {
        if (field === '*') {
            this.url += `&populate=${field}`;
        }
        else {
            this.url += `&populate[${this.populateCounter++}]=${field}`;
        }
        return this;
    }

    public deepPopulate(field: string, subfield: string): StrapiFindAll {
        if (field === '*' || subfield === '*') {
            throw new Error('The fields cannot be *');
        }
        else {
            this.url += `&populate[${this.populateCounter++}]=${field}.${subfield}`;
        }
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

    public filter(field: string, operator: FilterOperator, value: any, optionalParams: OptionalParams = {}) {
        if (optionalParams.secondaryValue == null && operator === FilterOperator.IS_BETWEEN) {
            throw new Error('IS_BETWEEN without secondaryValue');
        } 
        this.filters.push({
            field,
            operator,
            value,
            optionalParams
        });
        if (this.logicalOperator === LogicalOperator.NONE) {
            this.lastFilterPushed = this.filters[this.filters.length-1];
        }
        return this;
    }

    public hideId(): StrapiFindAll {
        this.isIdHidden = true;
        return this
    }

    private splitFields(field: string) {
        return field.split('.').reduce((acc, value) => {
            return `${acc}[${value}]`
        },'')
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

    public and(field: string, operator: FilterOperator, value: any, optionalParams: OptionalParams = {}): StrapiFindAll {
        if (this.logicalOperator === LogicalOperator.OR) {
            throw new Error('Use filter group override to setup chain of .and and .or');
        }
        if (this.logicalOperator === LogicalOperator.NONE && this.lastFilterPushed != null) {
            this.andGroup = 0;
            this.lastFilterPushed.optionalParams.andGroup = this.andGroup;
        }
        this.logicalOperator = LogicalOperator.AND;
        this.andGroup = this.andGroup != null ? this.andGroup + 1 : 0;
        optionalParams.andGroup = this.andGroup;
        return this.filter(field, operator, value, optionalParams);
    }

    public or(field: string, operator: FilterOperator, value: any, optionalParams: OptionalParams = {}): StrapiFindAll {
        if (this.logicalOperator === LogicalOperator.AND) {
            throw new Error('Use filter group override to setup chain of .and and .or');
        }
        if (this.logicalOperator === LogicalOperator.NONE && this.lastFilterPushed != null) {
            this.orGroup = 0;
            this.lastFilterPushed.optionalParams.orGroup = this.orGroup;
        }
        this.logicalOperator = LogicalOperator.OR;
        this.orGroup = this.orGroup != null ? this.orGroup + 1 : 0;
        optionalParams.orGroup = this.orGroup;
        return this.filter(field, operator, value, optionalParams);
    }

    public async show<T>(): Promise<{data: T[], meta: any}> {
        return this.call<T>();
    }

    private async call<T>(): Promise<{ data: T[], meta: any }> {
        this.url += this.filters.reduce((acc: string, currentValue: Filter): string => {
            const { field, operator, value, optionalParams } = currentValue;
            let logicalOperator = ""
            if (optionalParams.orGroup != null) {
                logicalOperator += `[$or][${optionalParams.orGroup}]`;
            }
            if (optionalParams.andGroup != null) {
                logicalOperator += `[$and][${optionalParams.andGroup}]`;
            }
            if (operator === FilterOperator.IS_BETWEEN) {
                const { secondaryValue } = optionalParams
                return acc + `&filters${logicalOperator}${this.splitFields(field)}[${operator}]=${value}&filters${logicalOperator}${this.splitFields(field)}[${operator}]=${secondaryValue}`
            }
            else if (operator === FilterOperator.IS_NOT_NULL) {
                return acc + `&filters${logicalOperator}${this.splitFields(field)}[${operator}]=true`;
            }
            else if (operator === FilterOperator.IS_NULL) {
                return acc + `&filters${logicalOperator}${this.splitFields(field)}[${operator}]=true`;
            }
            else if (operator === FilterOperator.IN || operator === FilterOperator.NOT_IN) {
                let inId = 0;
                let filterStr = '';
                for (let el of value) {
                    filterStr += `&filters${logicalOperator}${this.splitFields(field)}[${operator}][${inId++}]=${el}`;
                }
                return acc + filterStr;
            }
            else {
                return acc + `&filters${logicalOperator}${this.splitFields(field)}[${operator}]=${value}`
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