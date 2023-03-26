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
const axios_1 = __importDefault(require("axios"));
const StrapiHandler_1 = require("./StrapiHandler");
class StrapiChain {
    constructor(strapiUrl, entries, apiKey, call, shouldHideId, shouldHideEverything) {
        this.apiKey = apiKey;
        this.call = call;
        this.shouldHideId = shouldHideId;
        this.shouldHideEverything = shouldHideEverything;
        this.url = '';
        this.data = '';
        call.then((obj) => {
            this.data = obj;
            this.url = `${strapiUrl.endsWith('/') ? strapiUrl : strapiUrl + '/'}api/${entries}/${obj === null || obj === void 0 ? void 0 : obj.id}`;
        });
    }
    delete() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call;
            if (((_a = this.data) === null || _a === void 0 ? void 0 : _a.id) == null) {
                return null;
            }
            const { data } = yield axios_1.default.delete(this.url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return (0, StrapiHandler_1.extractData)(data.data)[0];
        });
    }
    put(obj) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call;
            if (((_a = this.data) === null || _a === void 0 ? void 0 : _a.id) == null) {
                return null;
            }
            const { data } = yield axios_1.default.put(this.url, {
                data: Object.assign({}, obj)
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return (0, StrapiHandler_1.extractData)(data.data)[0];
        });
    }
    show() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call;
            if (((_a = this.data) === null || _a === void 0 ? void 0 : _a.id) == null) {
                return null;
            }
            if (this.shouldHideId) {
                delete this.data.id;
            }
            if (this.shouldHideEverything) {
                return this.data.id;
            }
            return this.data;
        });
    }
}
exports.default = StrapiChain;
