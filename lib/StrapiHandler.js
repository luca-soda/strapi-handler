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
exports.extractData = exports.isStrapiResponse = void 0;
const axios_1 = __importDefault(require("axios"));
const StrapiFindAll_1 = __importDefault(require("./StrapiFindAll"));
const StrapiFindOne_1 = __importDefault(require("./StrapiFindOne"));
class StrapiHandler {
    constructor(strapiUrl, apiKey) {
        this.strapiUrl = strapiUrl;
        this.apiKey = apiKey;
    }
    findAll(entries) {
        return new StrapiFindAll_1.default(this.strapiUrl, entries, this.apiKey);
    }
    findOne(entries) {
        return new StrapiFindOne_1.default(this.strapiUrl, entries, this.apiKey);
    }
    create(collectionName, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.strapiUrl.endsWith('/') ? this.strapiUrl : this.strapiUrl + '/'}api/${collectionName}`;
            let _obj = {
                data: obj
            };
            let { data: { data } } = yield axios_1.default.post(url, _obj, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return extractData(data)[0];
        });
    }
    createMany(collectionName, objects) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (let obj of objects) {
                results.push(yield this.create(collectionName, obj));
            }
            return results;
        });
    }
}
const isStrapiResponse = (data) => {
    if (typeof data === 'object' && data.length) {
        return data[0].id && data[0].attributes;
    }
    else {
        return data.id && data.attributes;
    }
};
exports.isStrapiResponse = isStrapiResponse;
const extractData = (data) => {
    var _a;
    if (isStrapiResponse(data)) {
        if (data.length == null) {
            data = [data];
        }
        let result = data.map((d) => (Object.assign({ id: d.id }, d.attributes)));
        for (let i = 0; i < result.length; i++) {
            const r = result[i];
            const keys = Object.keys(r);
            for (let key of keys) {
                if ((_a = r[key]) === null || _a === void 0 ? void 0 : _a.data) {
                    r[key] = extractData(r[key].data);
                }
            }
        }
        return result;
    }
    else {
        return data;
    }
};
exports.extractData = extractData;
exports.default = StrapiHandler;
