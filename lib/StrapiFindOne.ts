import { extractData } from "./StrapiHandler";
import axios from 'axios';
import { FilterOperator, LogicalOperator, Filter } from "./Interfaces";
import StrapiChain from "./StrapiChain";

class StrapiFindOne {
    private url: string;
    private fieldsCounter = 0;
    private filters = <(Filter)[]>[];
    private logicalOperator = LogicalOperator.NONE;
    private group = 0;
    private isIdHidden = false;
    private isAllHidden = false;
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

    public chain(): StrapiChain {
        const call = this.call();
        return new StrapiChain(this.strapiUrl, this.entries, this.apiKey, call, this.isAllHidden ? 'id' : undefined);
    }

    public hideId() {
        this.isIdHidden = true;
        return this
    }
  
    public filter(field: string, operator: FilterOperator, value: any, secondaryValue?: any): StrapiFindOne {
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

    public getId(): Promise<number | null> {
        this.isAllHidden = true;
        return this.chain().show<number>();
    }

    public and(field: string, operator: FilterOperator, value: any, secondaryValue?: any): StrapiFindOne {
        if (this.logicalOperator === LogicalOperator.OR) {
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = LogicalOperator.AND;
        this.group = this.group+1;
        return this.filter(field, operator, value, secondaryValue);
    }

    public or(field: string, operator: FilterOperator, value: any, secondaryValue?: any): StrapiFindOne {
        if (this.logicalOperator === LogicalOperator.AND) {
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = LogicalOperator.OR;
        this.group = this.group+1;
        return this.filter(field, operator, value, secondaryValue);
    }

    private async call<T>(): Promise<{ data: T[], meta: any }> {
        this.offsetStart(0);
        this.offsetLimit(1);
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
        let { data: { data } } = await axios.get(this.url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        const result = extractData(data).map((el: any) => {
            const obj = {...el};
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
        return result[0];
    }
}


export default StrapiFindOne;