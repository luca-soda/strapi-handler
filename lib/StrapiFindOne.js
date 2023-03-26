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
const StrapiChain_1 = __importDefault(require("./StrapiChain"));
const uuid_1 = require("uuid");
class StrapiFindOne {
    constructor(strapiUrl, entries, apiKey) {
        this.strapiUrl = strapiUrl;
        this.entries = entries;
        this.apiKey = apiKey;
        this.fieldsCounter = 0;
        this.filters = [];
        this.logicalOperator = Interfaces_1.LogicalOperator.NONE;
        this.group = 0;
        this.shouldHideId = false;
        this.shouldHideEverything = false;
        this.renamer = [];
        this.url = `${strapiUrl.endsWith('/') ? strapiUrl : strapiUrl + '/'}api/${entries}?`;
    }
    offsetStart(start) {
        this.url += `&pagination[start]=${start}`;
        return this;
    }
    offsetLimit(limit) {
        this.url += `&pagination[limit]=${limit}`;
        return this;
    }
    chain() {
        const call = this.call();
        return new StrapiChain_1.default(this.strapiUrl, this.entries, this.apiKey, call, this.shouldHideId, this.shouldHideEverything);
    }
    hideId() {
        this.shouldHideId = true;
        return this;
    }
    filter(field, operator, value, secondaryValue) {
        this.filters.push({
            field,
            operator,
            value,
            secondaryValue,
            andGroup: this.logicalOperator === Interfaces_1.LogicalOperator.AND ? this.group : 0,
            orGroup: this.logicalOperator === Interfaces_1.LogicalOperator.OR ? this.group : 0,
        });
        return this;
    }
    populate(field) {
        this.url += `&populate=${field}`;
        return this;
    }
    rename(field, target) {
        this.renamer.push({ field, target });
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
    generateUuid() {
        return (0, uuid_1.v4)();
    }
    showOnlyId() {
        this.shouldHideEverything = true;
        return this.chain().show();
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.chain().show();
        });
    }
    update(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.chain().put(obj);
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.chain().delete();
        });
    }
    and(field, operator, value, secondaryValue) {
        if (this.logicalOperator === Interfaces_1.LogicalOperator.OR) {
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = Interfaces_1.LogicalOperator.AND;
        this.group = this.group + 1;
        return this.filter(field, operator, value, secondaryValue);
    }
    or(field, operator, value, secondaryValue) {
        if (this.logicalOperator === Interfaces_1.LogicalOperator.AND) {
            throw new Error('Currently complex and or or combination are not supported');
        }
        this.logicalOperator = Interfaces_1.LogicalOperator.OR;
        this.group = this.group + 1;
        return this.filter(field, operator, value, secondaryValue);
    }
    call() {
        return __awaiter(this, void 0, void 0, function* () {
            let uuid;
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
                    const obj = Object.assign({}, el);
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
                    const obj = Object.assign({}, el);
                    delete obj.orGroup;
                    return obj;
                });
            }
            this.url += this.filters.reduce((acc, currentValue) => {
                const { field, operator, value, orGroup, andGroup, secondaryValue } = currentValue;
                let logicalOperator = "";
                if (orGroup != null) {
                    logicalOperator = `[$or][${orGroup}]`;
                }
                if (andGroup != null) {
                    logicalOperator = `[$and][${andGroup}]`;
                }
                if (operator === Interfaces_1.FilterOperator.IS_BETWEEN) {
                    return acc + `&filters${logicalOperator}[${field}][${operator}]=${value}&filters${logicalOperator}[${field}][${operator}]=${secondaryValue}`;
                }
                else if (operator === Interfaces_1.FilterOperator.IS_NOT_NULL) {
                    return acc + `&filters${logicalOperator}[${field}][${operator}]=true`;
                }
                else if (operator === Interfaces_1.FilterOperator.IS_NULL) {
                    return acc + `&filters${logicalOperator}[${field}][${operator}]=true`;
                }
                else if (operator === Interfaces_1.FilterOperator.IN || operator === Interfaces_1.FilterOperator.NOT_IN) {
                    let inId = 0;
                    let filterStr = '';
                    for (let el of value) {
                        filterStr += `&filters${logicalOperator}[${field}][${operator}][${inId++}]=${el}`;
                    }
                    return acc + filterStr;
                }
                else {
                    return acc + `&filters${logicalOperator}[${field}][${operator}]=${value}`;
                }
            }, '');
            let { data: { data } } = yield axios_1.default.get(this.url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            const result = (0, StrapiHandler_1.extractData)(data).map((el) => {
                const obj = Object.assign({}, el);
                if (this.shouldHideEverything && obj[uuid] != null) {
                    delete obj[uuid];
                }
                this.renamer.forEach((rename) => {
                    obj[rename.target] = obj[rename.field];
                    delete obj[rename.field];
                });
                return obj;
            });
            return result[0];
        });
    }
}
exports.default = StrapiFindOne;
