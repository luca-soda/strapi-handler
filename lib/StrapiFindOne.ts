import { extractData } from "./StrapiHandler";
import axios from 'axios';
import { FilterOperator, LogicalOperator, Filter, OptionalParams } from "./Interfaces";
import StrapiChain from "./StrapiChain";
import {v4 as uuidv4} from 'uuid';

class StrapiFindOne {
    private url: string;
    private fieldsCounter = 0;
    private filters = <(Filter)[]>[];
    private logicalOperator = LogicalOperator.NONE;
    private group = 0;
    private shouldHideId = false;
    private shouldHideEverything = false;
    private renamer = <{field: string, target: string}[]>[];

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

    private chain(): StrapiChain {
        const call = this.call();
        return new StrapiChain(this.strapiUrl, this.entries, this.apiKey, call, this.shouldHideId, this.shouldHideEverything);
    }

    public hideId() {
        this.shouldHideId = true;
        return this
    }
  
    public filter(field: string, operator: FilterOperator, value: any, optionalParams: OptionalParams = {}): StrapiFindOne {
        this.filters.push({
            field,
            operator,
            value,
            optionalParams,
            andGroup: this.logicalOperator === LogicalOperator.AND ? this.group : 0,
            orGroup: this.logicalOperator === LogicalOperator.OR ? this.group : 0,
        });
        return this;
    }

    public populate(field: string): StrapiFindOne {
        this.url += `&populate=${field}`;
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
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = LogicalOperator.AND;
        this.group = this.group+1;
        return this.filter(field, operator, value, optionalParams);
    }

    public or(field: string, operator: FilterOperator, value: any, optionalParams: OptionalParams = {}): StrapiFindOne {
        if (this.logicalOperator === LogicalOperator.AND) {
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = LogicalOperator.OR;
        this.group = this.group+1;
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
            const {field, operator, value, orGroup, andGroup, optionalParams} = currentValue;
            let logicalOperator = ""
            if (orGroup != null) {
                logicalOperator = `[$or][${orGroup}]`;
            }
            if (andGroup != null) {
                logicalOperator = `[$and][${andGroup}]`;
            }
            if (operator === FilterOperator.IS_BETWEEN) {
                if (optionalParams.secondaryValue == null) {
                    throw new Error('IS_BETWEEN without secondary value');
                }
                const { secondaryValue } = optionalParams;
                return acc+`&filters${logicalOperator}[${field}][${operator}]=${value}&filters${logicalOperator}[${field}][${operator}]=${secondaryValue}`
            }
            else if (operator === FilterOperator.IS_NOT_NULL) {
                return acc + `&filters${logicalOperator}[${field}][${operator}]=true`
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
                return acc+`&filters${logicalOperator}[${field}][${operator}]=${value}`
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