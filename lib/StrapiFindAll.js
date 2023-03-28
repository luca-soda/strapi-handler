"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StrapiHandler_1 = require("./StrapiHandler");
const axios_1 = __importDefault(require("axios"));
const Interfaces_1 = require("./Interfaces");
class StrapiFindAll {
    constructor(strapiUrl, entries, apiKey) {
        this.apiKey = apiKey;
        this.sortCounter = 0;
        this.fieldsCounter = 0;
        this.populateCounter = 0;
        this.filters = [];
        this.logicalOperator = Interfaces_1.LogicalOperator.NONE;
        this.isIdHidden = false;
        this.isAllHidden = false;
        this.renamer = [];
        this.url = `${strapiUrl.endsWith('/') ? strapiUrl : strapiUrl + '/'}api/${entries}?`;
    }
    page(page) {
        this.url += `&pagination[page]=${page}`;
        return this;
    }
    populate(field) {
        if (field === '*') {
            this.url += `&populate=${field}`;
        }
        else {
            this.url += `&populate[${this.populateCounter++}]=${field}`;
        }
        return this;
    }
    deepPopulate(field, subfield) {
        if (field === '*') {
            throw new Error('The first field cannot be *');
        }
        else {
            if (subfield === '*') {
                this.url += `&populate[${field}][populate]=${subfield}`;
            }
            else {
                this.url += `&populate[${field}][populate][${this.populateCounter++}]=${subfield}`;
            }
        }
        return this;
    }
    sort(field, sortDirection) {
        this.url += `&sort[${this.sortCounter++}]=${field}`;
        if (sortDirection != null) {
            this.url += sortDirection === Interfaces_1.SortDirection.ASC ? ':asc' : ':desc';
        }
        return this;
    }
    field(field) {
        this.url += `&fields[${this.fieldsCounter++}]=${field}`;
        return this;
    }
    fields(fields) {
        fields.forEach(field => this.field(field));
        return this;
    }
    pageSize(pageSize) {
        this.url += `&pagination[pageSize]=${pageSize}`;
        return this;
    }
    offsetStart(start) {
        this.url += `&pagination[start]=${start}`;
        return this;
    }
    offsetLimit(limit) {
        this.url += `&pagination[limit]=${limit}`;
        return this;
    }
    filter(field, operator, value, optionalParams = {}) {
        if (optionalParams.secondaryValue == null && operator === Interfaces_1.FilterOperator.IS_BETWEEN) {
            throw new Error('IS_BETWEEN without secondaryValue');
        }
        this.filters.push({
            field,
            operator,
            value,
            optionalParams
        });
        if (this.logicalOperator === Interfaces_1.LogicalOperator.NONE) {
            this.lastFilterPushed = this.filters[this.filters.length - 1];
        }
        return this;
    }
    hideId() {
        this.isIdHidden = true;
        return this;
    }
    splitFields(field) {
        return field.split('.').reduce((acc, value) => {
            return `${acc}[${value}]`;
        }, '');
    }
    showOnlyIds() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isAllHidden = true;
            const result = yield this.call();
            return {
                ids: result.data.map(el => el.id),
                meta: result.meta
            };
        });
    }
    rename(field, target) {
        this.renamer.push({ field, target });
        return this;
    }
    and(field, operator, value, optionalParams = {}) {
        if (this.logicalOperator === Interfaces_1.LogicalOperator.OR) {
            throw new Error('Use filter group override to setup chain of .and and .or');
        }
        if (this.logicalOperator === Interfaces_1.LogicalOperator.NONE && this.lastFilterPushed != null) {
            this.andGroup = 0;
            this.lastFilterPushed.optionalParams.andGroup = this.andGroup;
        }
        this.logicalOperator = Interfaces_1.LogicalOperator.AND;
        this.andGroup = this.andGroup != null ? this.andGroup + 1 : 0;
        optionalParams.andGroup = this.andGroup;
        return this.filter(field, operator, value, optionalParams);
    }
    or(field, operator, value, optionalParams = {}) {
        if (this.logicalOperator === Interfaces_1.LogicalOperator.AND) {
            throw new Error('Use filter group override to setup chain of .and and .or');
        }
        if (this.logicalOperator === Interfaces_1.LogicalOperator.NONE && this.lastFilterPushed != null) {
            this.orGroup = 0;
            this.lastFilterPushed.optionalParams.orGroup = this.orGroup;
        }
        this.logicalOperator = Interfaces_1.LogicalOperator.OR;
        this.orGroup = this.orGroup != null ? this.orGroup + 1 : 0;
        optionalParams.orGroup = this.orGroup;
        return this.filter(field, operator, value, optionalParams);
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.call();
        });
    }
    call() {
        return __awaiter(this, void 0, void 0, function* () {
            this.url += this.filters.reduce((acc, currentValue) => {
                const { field, operator, value, optionalParams } = currentValue;
                let logicalOperator = "";
                if (optionalParams.orGroup != null) {
                    logicalOperator += `[$or][${optionalParams.orGroup}]`;
                }
                if (optionalParams.andGroup != null) {
                    logicalOperator += `[$and][${optionalParams.andGroup}]`;
                }
                if (operator === Interfaces_1.FilterOperator.IS_BETWEEN) {
                    const { secondaryValue } = optionalParams;
                    return acc + `&filters${logicalOperator}${this.splitFields(field)}[${operator}]=${value}&filters${logicalOperator}${this.splitFields(field)}[${operator}]=${secondaryValue}`;
                }
                else if (operator === Interfaces_1.FilterOperator.IS_NOT_NULL) {
                    return acc + `&filters${logicalOperator}${this.splitFields(field)}[${operator}]=true`;
                }
                else if (operator === Interfaces_1.FilterOperator.IS_NULL) {
                    return acc + `&filters${logicalOperator}${this.splitFields(field)}[${operator}]=true`;
                }
                else if (operator === Interfaces_1.FilterOperator.IN || operator === Interfaces_1.FilterOperator.NOT_IN) {
                    let inId = 0;
                    let filterStr = '';
                    for (let el of value) {
                        filterStr += `&filters${logicalOperator}${this.splitFields(field)}[${operator}][${inId++}]=${el}`;
                    }
                    return acc + filterStr;
                }
                else {
                    return acc + `&filters${logicalOperator}${this.splitFields(field)}[${operator}]=${value}`;
                }
            }, '');
            let { data: { data, meta } } = yield axios_1.default.get(this.url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            const result = (0, StrapiHandler_1.extractData)(data).map((el) => {
                const obj = Object.assign({}, el);
                if (this.isIdHidden) {
                    delete obj.id;
                }
                if (this.isAllHidden) {
                    Object.keys(el).forEach((key) => {
                        if (key !== 'id') {
                            delete obj[key];
                        }
                    });
                }
                this.renamer.forEach((rename) => {
                    obj[rename.target] = obj[rename.field];
                    delete obj[rename.field];
                });
                return obj;
            });
            return {
                data: result,
                meta
            };
        });
    }
}
exports.default = StrapiFindAll;
