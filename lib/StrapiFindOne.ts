import { extractData } from "./StrapiHandler";
import axios from 'axios';
import { FilterOperator, LogicalOperator, Filter, OptionalParams } from "./Interfaces";
import StrapiChain from "./StrapiChain";
import {v4 as uuidv4} from 'uuid';

class StrapiFindOne {
    private url: string;
    private fieldsCounter = 0;
    private populateCounter = 0;
    private filters = <(Filter)[]>[];
    private logicalOperator = LogicalOperator.NONE;
    private andGroup: number | undefined;
    private orGroup: number | undefined;
    private shouldHideId = false;
    private shouldHideEverything = false;
    private renamer = <{field: string, target: string}[]>[];
    private lastFilterPushed: Filter | undefined;

    constructor(private readonly strapiUrl: string, private readonly entries: string, private readonly apiKey: string) {
        this.url = `${strapiUrl.endsWith('/') ? strapiUrl : strapiUrl + '/'}api/${entries}?`;
    }

    private offsetStart(start: number): StrapiFindOne {
        this.url += `&pagination[start]=${start}`;
        return this;
    }

    private offsetLimit(limit: number): StrapiFindOne {
        this.url += `&pagination[limit]=${limit}`;
        return this;
    }

    private splitFields(field: string) {
        return field.split('.').reduce((acc, value) => {
            return `${acc}[${value}]`
        },'')
    }

    private chain(): StrapiChain {
        const call = this.call();
        return new StrapiChain(this.strapiUrl, this.entries, this.apiKey, call, this.shouldHideId, this.shouldHideEverything);
    }

    public hideId() {
        this.shouldHideId = true;
        return this
    }
  
    public filter(field: string, operator: FilterOperator, value: any, optionalParams: OptionalParams = {}): StrapiFindOne {
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

    public populate(field: string): StrapiFindOne {
        if (field === '*') {
            this.url += `&populate=${field}`;
        }
        else {
            this.url += `&populate[${this.populateCounter++}]=${field}`;
        }
        return this;
    }

    public deepPopulate(field: string, subfield: string): StrapiFindOne {
        if (field === '*' || subfield === '*') {
            throw new Error('The fields cannot be *');
        }
        else {
            this.url += `&populate[${this.populateCounter++}]=${field}.${subfield}`;
        }
        return this;
    }

    public rename(field: string, target: string) {
        this.renamer.push({field, target});
        return this;
    }

    public field(field: string): StrapiFindOne {
        this.url += `&fields[${this.fieldsCounter++}]=${field}`;
        return this;
    }

    public fields(fields: string[]): StrapiFindOne {
        fields.forEach(field => this.field(field));
        return this;
    }

    public generateUuid(): string {
        return uuidv4();
    }

    public showOnlyId(): Promise<number | null> {
        this.shouldHideEverything = true;
        return this.chain().show<number>();
    }

    public async show<T>(): Promise<T | null> {
        return await this.chain().show<T>();
    }

    public async update<T>(obj: Partial<T>): Promise<T | null> {
        return await this.chain().put(obj);
    }

    public async delete<T>(): Promise<T | null> {
        return await this.chain().delete<T>();
    }

    public and(field: string, operator: FilterOperator, value: any, optionalParams: OptionalParams = {}): StrapiFindOne {
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

    public or(field: string, operator: FilterOperator, value: any, optionalParams: OptionalParams = {}): StrapiFindOne {
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

    private async call<T>(): Promise<{ data: T[], meta: any }> {
        let uuid: string;

        this.offsetStart(0);
        this.offsetLimit(1);

        if (this.shouldHideEverything) {
            uuid = this.generateUuid();
            this.field(uuid);
        }

        this.url += this.filters.reduce((acc: string, currentValue: Filter): string => {
            const {field, operator, value, optionalParams} = currentValue;
            let logicalOperator = ""
            if (optionalParams.orGroup != null) {
                logicalOperator += `[$or][${optionalParams.orGroup}]`;
            }
            if (optionalParams.andGroup != null) {
                logicalOperator += `[$and][${optionalParams.andGroup}]`;
            }
            if (operator === FilterOperator.IS_BETWEEN) {
                const { secondaryValue } = optionalParams;
                return acc+`&filters${logicalOperator}${this.splitFields(field)}[${operator}]=${value}&filters${logicalOperator}${this.splitFields(field)}[${operator}]=${secondaryValue}`
            }
            else if (operator === FilterOperator.IS_NOT_NULL) {
                return acc + `&filters${logicalOperator}${this.splitFields(field)}[${operator}]=true`
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
                return acc+`&filters${logicalOperator}${this.splitFields(field)}[${operator}]=${value}`
            }
        }, '');
        let { data: { data } } = await axios.get(this.url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        const result = extractData(data).map((el: any) => {
            const obj = {...el};
            if (this.shouldHideEverything && obj[uuid] != null) {
                delete obj[uuid];
            }
            this.renamer.forEach((rename) => {
                obj[rename.target] = obj[rename.field];
                delete obj[rename.field];
            })
            return obj;
        })
        return result[0];
    }
}


export default StrapiFindOne;