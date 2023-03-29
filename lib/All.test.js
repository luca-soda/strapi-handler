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
const StrapiHandler = require("./StrapiHandler");
const uuidLib = require("uuid");
const axios_1 = __importDefault(require("axios"));
const Interfaces_1 = require("./Interfaces");
const uuidv4 = uuidLib.v4;
const { IS_EQUAL_TO } = Interfaces_1.FilterOperator;
const strapiUrl = 'http://127.0.0.1:7125';
const apiKey = '37a9dca00ffbd809de068adf97ae7b4bcc0b78a3102798fd393d7126da8984fbf563e6ebf6e507e3fc93970b9971ecee6175096e85523169d6feea6f89d2d15ccafcf6ad4e7adcab5c99c6146e959a4106e92c619933a050d558f692afaf2a703ad55c151ebf90485fab1e7a61f035b722177cec37f9037ee3292d8e2c1a160b';
const tests = 'Tests';
const relationOne = 'Relation-ones';
const relationMany = 'Relation-manies';
it('should create valids StrapiHandler', () => __awaiter(void 0, void 0, void 0, function* () {
    let createHandler;
    createHandler = () => { new StrapiHandler.default(strapiUrl, apiKey); };
    expect(createHandler).not.toThrow();
    createHandler = () => { new StrapiHandler.default(strapiUrl + '/', apiKey); };
    expect(createHandler).not.toThrow();
    createHandler = () => { new StrapiHandler.default(strapiUrl, apiKey).findAll(tests); };
    expect(createHandler).not.toThrow();
    createHandler = () => { new StrapiHandler.default(strapiUrl, apiKey).findOne(tests); };
    expect(createHandler).not.toThrow();
    createHandler = () => __awaiter(void 0, void 0, void 0, function* () { yield new StrapiHandler.default(strapiUrl + '/', apiKey).findOne(tests).show(); });
    expect(createHandler).not.toThrow();
    createHandler = () => __awaiter(void 0, void 0, void 0, function* () { yield new StrapiHandler.default(strapiUrl + '/', apiKey).findAll(tests).show(); });
    expect(createHandler).not.toThrow();
}));
const strapi = new StrapiHandler.default(strapiUrl, apiKey);
//Testing basic function to create a usable envinroment (tests are executed synchronously)
it('Strapi.create with hardcoded checking', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuidv4();
    let result = yield strapi.create(tests, {
        Str: uuid
    });
    expect(result.Str).toBe(uuid);
    const result2 = yield axios_1.default.get(`${strapiUrl}/api/${tests}?filters[Str][$eq]=${uuid}`, {
        headers: {
            'Authorization': 'Bearer ' + apiKey
        }
    });
    expect(result2.data.data.length).toBe(1);
    expect(result2.data.data[0].attributes.Str).toBe(uuid);
}));
const createRandomItems = (itemNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const createRandomItem = () => __awaiter(void 0, void 0, void 0, function* () {
        const uuids = [uuidv4(), uuidv4()];
        const n = Math.floor(Math.random() * 100);
        return yield strapi.create(tests, {
            Num: n,
            Str: uuids[0],
            Str2: uuids[1],
        });
    });
    const items = [];
    for (let i = 0; i < itemNumber; i++) {
        items.push(yield createRandomItem());
    }
    return items;
});
const createRandomItem = () => __awaiter(void 0, void 0, void 0, function* () {
    return (yield createRandomItems(1))[0];
});
test('createRandomItems', () => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield createRandomItems(5);
    expect(items.length).toBe(5);
    for (let item of items) {
        expect(typeof item.Str).toBe('string');
        expect(typeof item.Str2).toBe('string');
        expect(typeof item.Num).toBe('number');
    }
}));
test('createRandomItem', () => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield createRandomItem();
    expect(item).toBeTruthy();
}));
test('StrapiFindOne.show basic usage', () => __awaiter(void 0, void 0, void 0, function* () {
    yield createRandomItem();
    const result = yield strapi.findOne(tests).show();
    expect(result).toBeTruthy();
}));
test('StrapiFindOne.filter IS_EQUAL', () => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield createRandomItem();
    let result = yield strapi.findOne(tests).filter('Str', IS_EQUAL_TO, item.Str).show();
    expect(result).toBeTruthy();
    expect(result.Str).toBe(item.Str);
}));
test('StrapiFindOne.showOnlyId', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuidv4();
    const result = yield strapi.create(tests, {
        Str: uuid
    });
    const idToCheck = result.id;
    const id = yield strapi.findOne(tests).filter('Str', IS_EQUAL_TO, uuid).showOnlyId();
    expect(id).toBe(idToCheck);
}));
test('StrapiFindOne.delete', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const uuid = uuidv4();
    yield strapi.create(tests, {
        Str: uuid
    });
    const resultToCheck = yield strapi.findOne(tests).filter('Str', IS_EQUAL_TO, uuid).show();
    const result = yield strapi.findOne(tests).filter('Str', IS_EQUAL_TO, uuid).delete();
    expect(result).toEqual(resultToCheck);
    const exists = (_a = (yield strapi.findOne(tests).filter('Str', IS_EQUAL_TO, uuid).showOnlyId())) !== null && _a !== void 0 ? _a : false;
    expect(exists).toBe(false);
}));
test('StrapiFindAll.show basic usage', () => __awaiter(void 0, void 0, void 0, function* () {
    yield createRandomItems(20);
    const { data } = yield strapi.findAll(tests).show();
    expect(data.length).toBeGreaterThanOrEqual(20);
}));
test('StrapiFindAll.showOnlyId basic usage', () => __awaiter(void 0, void 0, void 0, function* () {
    yield createRandomItems(5);
    const { ids } = yield strapi.findAll(tests).showOnlyIds();
    expect(ids.length).toBeGreaterThanOrEqual(5);
}));
const deleteCollection = (collectionName) => __awaiter(void 0, void 0, void 0, function* () {
    let remaning = true;
    while (remaning) {
        const { ids } = yield strapi.findAll(collectionName).showOnlyIds();
        for (let id of ids) {
            yield strapi.findOne(collectionName).filter('id', IS_EQUAL_TO, id).delete();
        }
        remaning = (yield strapi.findOne(collectionName).showOnlyId()) !== null;
    }
});
const deleteAll = () => __awaiter(void 0, void 0, void 0, function* () {
    const collections = [tests, relationOne, relationMany];
    for (let collection of collections) {
        yield deleteCollection(collection);
    }
});
it('should delete everything', () => __awaiter(void 0, void 0, void 0, function* () {
    yield createRandomItems(50);
    yield strapi.create(relationOne, {
        Str: uuidv4()
    });
    yield strapi.create(relationOne, {
        Str: uuidv4()
    });
    yield strapi.create(relationMany, {
        Str: uuidv4()
    });
    yield strapi.create(relationMany, {
        Str: uuidv4()
    });
    const collections = [tests, relationOne, relationMany];
    yield deleteAll();
    for (let collection of collections) {
        const id = yield strapi.findOne(collection).showOnlyId();
        expect(id).toBeNull();
    }
}));
// Basic setup done
//StrapiChain Testing
test('StrapiChain.delete when the id lookup failed', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const result = yield strapi.findOne(tests).delete();
    expect(result).toBeNull();
}));
test('StrapiChain.put', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const item = yield createRandomItem();
    const nextUuid = uuidv4();
    let result = yield strapi.findOne(tests).filter('id', IS_EQUAL_TO, item.id).update({
        Str: nextUuid
    });
    expect(result).toBeTruthy();
    expect(result.Str).toBe(nextUuid);
    expect(result.Str2).toBe(item.Str2);
    expect(result.id).toBe(item.id);
    expect(result.Num).toBe(item.Num);
    result = yield strapi.findOne(tests).filter('id', IS_EQUAL_TO, item.id).show();
    expect(result).toBeTruthy();
    expect(result.Str).toBe(nextUuid);
    expect(result.Str2).toBe(item.Str2);
    expect(result.id).toBe(item.id);
    expect(result.Num).toBe(item.Num);
}));
test('StrapiChain.put when the id lookup failed', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const result = yield strapi.findOne(tests).update({});
    expect(result).toBeNull();
}));
test('StrapiChain.show when hiding id', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    yield createRandomItem();
    const result = yield strapi.findOne(tests).hideId().show();
    expect(result.id).toBeUndefined();
}));
test('StrapiHandling.createMany', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const toCreate = 5;
    const items = [];
    for (let i = 0; i < toCreate; i++) {
        items.push({
            Str: uuidv4(),
        });
    }
    const results = yield strapi.createMany(tests, items);
    results.forEach((result) => {
        expect(items.find(item => item.Str === result.Str)).not.toBeUndefined();
    });
}));
test('StrapiFindOne.populate', () => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e;
    yield deleteAll();
    yield createRandomItem();
    const itemRelationOne = yield strapi.create(relationOne, {
        Str: uuidv4()
    });
    const itemRelationManies = yield strapi.createMany(relationMany, [
        {
            Str: uuidv4(),
        },
        {
            Str: uuidv4()
        }
    ]);
    yield strapi.findOne(tests).update({
        RelationOne: itemRelationOne.id,
        RelationMany: itemRelationManies.map(el => el.id)
    });
    const resultWithRelationOne = yield strapi.findOne(tests).populate('RelationOne').show();
    const resultWithRelationMany = yield strapi.findOne(tests).populate('RelationMany').show();
    const resultWithBothRelations = yield strapi.findOne(tests).populate('*').show();
    expect(resultWithRelationOne).not.toBeNull();
    expect((_b = resultWithRelationOne.RelationOne) === null || _b === void 0 ? void 0 : _b.length).toBe(1);
    expect(resultWithRelationOne.RelationOne[0].id).toEqual(itemRelationOne.id);
    expect(resultWithRelationOne.RelationMany).toBeUndefined();
    expect(resultWithRelationMany).not.toBeNull();
    expect((_c = resultWithRelationMany.RelationMany) === null || _c === void 0 ? void 0 : _c.length).toBe(2);
    resultWithRelationMany.RelationMany.forEach((relation) => {
        expect(itemRelationManies.find(r => r.id === relation.id)).not.toBeUndefined();
    });
    expect(resultWithRelationMany === null || resultWithRelationMany === void 0 ? void 0 : resultWithRelationMany.RelationOne).toBeUndefined();
    expect(resultWithBothRelations).not.toBeNull();
    expect((_d = resultWithBothRelations.RelationOne) === null || _d === void 0 ? void 0 : _d.length).toBe(1);
    expect((_e = resultWithBothRelations.RelationMany) === null || _e === void 0 ? void 0 : _e.length).toBe(2);
    expect(resultWithBothRelations.RelationOne[0].id).toEqual(itemRelationOne.id);
    resultWithBothRelations.RelationMany.forEach((relation) => {
        expect(itemRelationManies.find(r => r.id === relation.id)).not.toBeUndefined();
    });
}));
test('StrapiFindOne.deepPopulate', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    yield createRandomItem();
    const itemRelationMany = yield strapi.create(relationMany, {
        Str: uuidv4()
    });
    const itemRelationOne = yield strapi.create(relationOne, {
        Str: uuidv4(),
        DeepRelation: itemRelationMany.id
    });
    yield strapi.findOne(tests).update({
        RelationOne: itemRelationOne.id,
    });
    const result = yield strapi.findOne(tests).populate('RelationOne').deepPopulate('RelationOne', 'DeepRelation').show();
    expect(result).not.toBeNull();
    expect(result.RelationOne.length).toBe(1);
    expect(result.RelationOne[0].DeepRelation.length).toBe(1);
    expect(result.RelationOne[0].DeepRelation[0].Str).toBe(itemRelationMany.Str);
}));
test('StrapiFindOne.deepPopulate with *', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const unsupportedOperation = () => strapi.findOne(tests).deepPopulate('RelationOne', '*');
    expect(unsupportedOperation).toThrow();
}));
test('StrapiFindAll.deepPopulate', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    yield createRandomItem();
    const itemRelationMany = yield strapi.create(relationMany, {
        Str: uuidv4()
    });
    const itemRelationOne = yield strapi.create(relationOne, {
        Str: uuidv4(),
        DeepRelation: itemRelationMany.id
    });
    yield strapi.findOne(tests).update({
        RelationOne: itemRelationOne.id,
    });
    const results = yield strapi.findAll(tests).deepPopulate('RelationOne', 'DeepRelation').show();
    expect(results.data.length).toBe(1);
    const result = results.data[0];
    expect(result.RelationOne.length).toBe(1);
    expect(result.RelationOne[0].DeepRelation.length).toBe(1);
    expect(result.RelationOne[0].DeepRelation[0].Str).toBe(itemRelationMany.Str);
}));
test('StrapiFindAll.deepPopulate with *', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const unsupportedOperation = () => strapi.findAll(tests).deepPopulate('RelationOne', '*');
    expect(unsupportedOperation).toThrow();
}));
it('should throw an error', () => __awaiter(void 0, void 0, void 0, function* () {
    expect(() => strapi.findAll(tests).deepPopulate('*', 'DeepRelation')).toThrow();
    expect(() => strapi.findOne(tests).deepPopulate('*', 'DeepRelation')).toThrow();
}));
test('StrapiFindAll.populate', () => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h, _j, _k, _l, _m, _o;
    yield deleteAll();
    const items = yield createRandomItems(2);
    const itemRelationOne = yield strapi.create(relationOne, {
        Str: uuidv4()
    });
    const itemRelationManies = yield strapi.createMany(relationMany, [
        {
            Str: uuidv4(),
        },
        {
            Str: uuidv4()
        }
    ]);
    for (let item of items) {
        yield strapi.findOne(tests).filter('id', IS_EQUAL_TO, item.id).update({
            RelationOne: itemRelationOne.id,
            RelationMany: itemRelationManies.map(el => el.id)
        });
    }
    const resultsWithRelationOne = (yield strapi.findAll(tests).populate('RelationOne').show()).data;
    const resultsWithRelationMany = (yield strapi.findAll(tests).populate('RelationMany').show()).data;
    const resultsWithBothRelations = (yield strapi.findAll(tests).populate('*').show()).data;
    for (let result of resultsWithRelationOne) {
        const toCheck = yield strapi.findOne(tests).filter('id', IS_EQUAL_TO, result.id).populate('RelationOne').show();
        expect((_f = result.RelationOne) === null || _f === void 0 ? void 0 : _f.length).toBe(1);
        expect(toCheck.RelationOne[0].id).toBe((_g = result.RelationOne[0]) === null || _g === void 0 ? void 0 : _g.id);
        expect(result.RelationMany).toBeUndefined();
    }
    for (let result of resultsWithRelationMany) {
        const toCheck = yield strapi.findOne(tests).filter('id', IS_EQUAL_TO, result.id).populate('RelationMany').show();
        expect((_h = result.RelationMany) === null || _h === void 0 ? void 0 : _h.length).toBe(2);
        for (let relation of toCheck === null || toCheck === void 0 ? void 0 : toCheck.RelationMany) {
            expect((_j = result.RelationMany) === null || _j === void 0 ? void 0 : _j.find(r => r.id === relation.id)).not.toBeUndefined();
            expect(result.RelationOne).toBeUndefined();
        }
    }
    for (let result of resultsWithBothRelations) {
        const toCheck = yield strapi.findOne(tests).filter('id', IS_EQUAL_TO, result.id).populate('*').show();
        expect((_k = result.RelationOne) === null || _k === void 0 ? void 0 : _k.length).toBe(1);
        expect((_l = result.RelationMany) === null || _l === void 0 ? void 0 : _l.length).toBe(2);
        expect(toCheck.RelationOne[0].id).toBe((_m = result.RelationOne[0]) === null || _m === void 0 ? void 0 : _m.id);
        for (let relation of toCheck === null || toCheck === void 0 ? void 0 : toCheck.RelationMany) {
            expect((_o = result.RelationMany) === null || _o === void 0 ? void 0 : _o.find(r => r.id === relation.id)).not.toBeUndefined();
        }
    }
}));
test('StrapiFindOne.rename', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const item = yield createRandomItem();
    const result = yield strapi.findOne(tests).rename('Str', 'uuid').show();
    expect(result).not.toBeNull();
    expect(result.uuid).toBe(item.Str);
}));
test('StrapiFindOne.and', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const item = yield createRandomItem();
    const result = yield strapi.findOne(tests).filter('Str', IS_EQUAL_TO, item.Str).and('Str2', IS_EQUAL_TO, item.Str2).show();
    expect(result).not.toBeNull();
    expect(result.id).toBe(item.id);
}));
test('StrapiFindOne.and.or || StrapiFindOne.or.and', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const andOr = () => strapi.findOne(tests).and('Str', IS_EQUAL_TO, uuidv4()).or('Str', IS_EQUAL_TO, uuidv4());
    const orAnd = () => strapi.findOne(tests).or('Str', IS_EQUAL_TO, uuidv4()).and('Str', IS_EQUAL_TO, uuidv4());
    expect(andOr).toThrow();
    expect(orAnd).toThrow();
}));
test('StrapiFindOne.showOnlyId', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const findOne = strapi.findOne(tests);
    jest.spyOn(findOne, 'generateUuid').mockReturnValueOnce('Str');
    const item = yield createRandomItem();
    const result = yield findOne.showOnlyId();
    expect(result).toBe(item.id);
}));
test('StrapiFindOne.fields', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    yield createRandomItem();
    const result = yield strapi.findOne(tests).fields(['Str', 'Str2']).show();
    expect(result).not.toBeNull();
    expect(typeof result.Str).toBe('string');
    expect(typeof result.Str2).toBe('string');
    expect(result.Num).toBeUndefined();
}));
// StrapiFindAl
test('StrapiFindAll.page', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    yield createRandomItems(25 + 4);
    const results = yield strapi.findAll(tests).page(2).show();
    expect(results.data.length).toBe(4);
}));
test('StrapiFindAll.sort', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const items = [
        {
            Num: 1
        },
        {
            Num: 5,
        },
        {
            Num: 3
        }
    ];
    yield strapi.createMany(tests, items);
    items.sort((a, b) => b.Num - a.Num);
    let results = yield strapi.findAll(tests).sort('Num', Interfaces_1.SortDirection.DESC).show();
    expect(results.data.length).toBe(items.length);
    for (let i = 0; i < items.length; i++) {
        expect(items[i].Num).toBe(results.data[i].Num);
    }
    items.sort((a, b) => a.Num - b.Num);
    results = yield strapi.findAll(tests).sort('Num', Interfaces_1.SortDirection.ASC).show();
    expect(results.data.length).toBe(items.length);
    for (let i = 0; i < items.length; i++) {
        expect(items[i].Num).toBe(results.data[i].Num);
    }
}));
test('StrapiFindAll.fields', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    yield createRandomItems(5);
    const results = yield strapi.findAll(tests).fields(['Str', 'Str2']).show();
    results.data.forEach((result) => {
        expect(typeof result.Str).toBe('string');
        expect(typeof result.Str2).toBe('string');
        expect(result.Num).toBeUndefined();
    });
}));
test('StrapiFindAll.pageSize', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    yield createRandomItems(51);
    let results = yield strapi.findAll(tests).pageSize(50).showOnlyIds();
    expect(results.ids.length).toBe(50);
    results = yield strapi.findAll(tests).pageSize(50).page(2).showOnlyIds();
    expect(results.ids.length).toBe(1);
}));
test('StrapiFindAll.offsetStart && Strapi.offsetLimit', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const items = [
        {
            Num: 0
        },
        {
            Num: 1
        },
        {
            Num: 2
        }
    ];
    yield strapi.createMany(tests, items);
    let results = yield strapi.findAll(tests).sort('Num', Interfaces_1.SortDirection.ASC).offsetStart(1).show();
    expect(results.data.length).toBe(2);
    expect(results.data[0].Num).toBe(items[1].Num);
    expect(results.data[1].Num).toBe(items[2].Num);
    results = yield strapi.findAll(tests).sort('Num', Interfaces_1.SortDirection.ASC).offsetStart(1).offsetLimit(1).show();
    expect(results.data.length).toBe(1);
    expect(results.data[0].Num).toBe(items[1].Num);
}));
const prepareDataForFilter = () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const items = [
        {
            Str: uuidv4(),
            Str2: 'Test',
            Num: 0
        },
        {
            Str: uuidv4(),
            Str2: "Jest",
            Num: 1
        },
        {
            Str: uuidv4(),
            Num: 2
        },
        {
            Str: uuidv4(),
            Num: 0
        },
        {
            Str: uuidv4(),
            Num: 5
        },
        {
            Str2: 'DoubleData'
        },
        {
            Str2: 'DoubleData'
        },
    ];
    yield strapi.createMany(tests, items);
    return items;
});
const checkWorkingOperator = ({ expectedResults, elementToCheck, valueToCheck, filterOperator, value, value2 }) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield strapi.findAll(tests).filter(elementToCheck, filterOperator, value, value2).show();
    const result = yield strapi.findOne(tests).filter(elementToCheck, filterOperator, value, value2).show();
    expect(results.data.length).toBe(expectedResults);
    for (let i = 0; i < expectedResults; i++) {
        expect(valueToCheck.find((el) => el === results.data[i][elementToCheck])).not.toBeUndefined();
    }
    if (expectedResults > 0) {
        expect(result).not.toBeNull();
        expect(valueToCheck.find((el) => el === result[elementToCheck])).not.toBeUndefined();
    }
    else {
        expect(result).toBeNull();
    }
});
test('Complex Query', () => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield prepareDataForFilter();
    const results = yield strapi.findAll(tests)
        .filter('Num', IS_EQUAL_TO, 0, { andGroup: 0, orGroup: 0 })
        .filter('Str2', IS_EQUAL_TO, 'Test', { andGroup: 1, orGroup: 0 })
        .filter('Num', IS_EQUAL_TO, 5, { andGroup: 2, orGroup: 1 })
        .filter('Str', Interfaces_1.FilterOperator.IS_NOT_EQUAL_TO, uuidv4(), { andGroup: 3, orGroup: 1 })
        .show();
    expect(results.data.length).toBe(2);
    expect(results.data[0].Num).toBe(0);
    expect(results.data[0].Str2).toBe('Test');
    expect(results.data[1].Num).toBe(5);
    expect(results.data[1].Str).toBe(items[4].Str);
}));
test('Basic filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    const results = yield strapi.findAll(tests).filter('Num', IS_EQUAL_TO, 0).show();
    expect(results.data.length).toBe(2);
    expect(results.data[0].Num).toBe(0);
    expect(results.data[1].Num).toBe(0);
}));
test('AND filter', () => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield prepareDataForFilter();
    const results = yield strapi.findAll(tests).filter('Num', IS_EQUAL_TO, 0).and('Str', IS_EQUAL_TO, items[0].Str).show();
    const result = yield strapi.findOne(tests).filter('Num', IS_EQUAL_TO, 0).and('Str', IS_EQUAL_TO, items[0].Str).show();
    expect(results.data.length).toBe(1);
    expect(results.data[0].Num).toBe(0);
    expect(results.data[0].Str).toBe(items[0].Str);
    expect(result).not.toBeNull();
    expect(result.Num).toBe(0);
    expect(result.Str).toBe(items[0].Str);
}));
test('chained AND since the start', () => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield prepareDataForFilter();
    const results = yield strapi.findAll(tests).and('Num', IS_EQUAL_TO, 0).and('Str', IS_EQUAL_TO, items[0].Str).show();
    const result = yield strapi.findOne(tests).and('Num', IS_EQUAL_TO, 0).and('Str', IS_EQUAL_TO, items[0].Str).show();
    expect(results.data.length).toBe(1);
    expect(results.data[0].Num).toBe(0);
    expect(results.data[0].Str).toBe(items[0].Str);
    expect(result).not.toBeNull();
    expect(result.Num).toBe(0);
    expect(result.Str).toBe(items[0].Str);
}));
test('OR filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    const results = yield strapi.findAll(tests).filter('Num', IS_EQUAL_TO, 0).or('Str', IS_EQUAL_TO, uuidv4()).show();
    const result = yield strapi.findOne(tests).filter('Num', IS_EQUAL_TO, 0).or('Str', IS_EQUAL_TO, uuidv4()).show();
    expect(results.data.length).toBe(2);
    expect(results.data[0].Num).toBe(0);
    expect(results.data[1].Num).toBe(0);
    expect(result).not.toBeNull();
    expect(result.Num).toBe(0);
}));
test('Chained OR since the start', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    const results = yield strapi.findAll(tests).or('Num', IS_EQUAL_TO, 0).or('Str', IS_EQUAL_TO, uuidv4()).show();
    const result = yield strapi.findOne(tests).or('Num', IS_EQUAL_TO, 0).or('Str', IS_EQUAL_TO, uuidv4()).show();
    expect(results.data.length).toBe(2);
    expect(results.data[0].Num).toBe(0);
    expect(results.data[1].Num).toBe(0);
    expect(result).not.toBeNull();
    expect(result.Num).toBe(0);
}));
test('CONTAINS filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.CONTAINS,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'est',
        valueToCheck: ['Test', 'Jest']
    });
}));
test('CONTAINS_CASE_INSENSITIVE filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.CONTAINS_CASE_INSENSITIVE,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'eSt',
        valueToCheck: ['Test', 'Jest']
    });
}));
test('IS_BETWEEN filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IS_BETWEEN,
        elementToCheck: 'Num',
        expectedResults: 4,
        value: 0,
        value2: { secondaryValue: 2 },
        valueToCheck: [0, 1, 2]
    });
}));
test('IN filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IN,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: ['DoubleData', uuidv4()],
        valueToCheck: ['DoubleData']
    });
}));
test('IS_EQUAL_CASE_INSENSITIVE filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IS_EQUAL_TO_CASE_INSENSITIVE,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'doubledata',
        valueToCheck: ['DoubleData']
    });
}));
test('IS_GREATER_THAN filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IS_GREATER_THAN,
        elementToCheck: 'Num',
        expectedResults: 2,
        value: 1,
        valueToCheck: [2, 5]
    });
}));
test('IS_GREATER_THAN_OR_EQUAL filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IS_GREATER_THAN_OR_EQUAL_TO,
        elementToCheck: 'Num',
        expectedResults: 2,
        value: 2,
        valueToCheck: [2, 5]
    });
}));
test('IS_LESS_THAN filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IS_LESS_THAN,
        elementToCheck: 'Num',
        expectedResults: 3,
        value: 2,
        valueToCheck: [0, 1]
    });
}));
test('IS_LESS_THAN_OR_EQUAL_TO filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IS_LESS_THAN_OR_EQUAL_TO,
        elementToCheck: 'Num',
        expectedResults: 4,
        value: 2,
        valueToCheck: [0, 1, 2]
    });
}));
test('IS_NOT_EQUAL_TO filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IS_NOT_EQUAL_TO,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'DoubleData',
        valueToCheck: ['Test', 'Jest']
    });
}));
test('IS_NOT_NULL filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IS_NOT_NULL,
        elementToCheck: 'Str2',
        expectedResults: 4,
        value: null,
        valueToCheck: ['Test', 'Jest', 'DoubleData']
    });
}));
test('IS_NULL filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.IS_NULL,
        elementToCheck: 'Str2',
        expectedResults: 3,
        value: null,
        valueToCheck: [null]
    });
}));
test('NOT_CONTAINS filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.NOT_CONTAINS,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'est',
        valueToCheck: ['DoubleData']
    });
}));
test('NOT_CONTAINS_CASE_INSENSITIVE filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.NOT_CONTAINS_CASE_INSENSITIVE,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'eSt',
        valueToCheck: ['DoubleData']
    });
}));
test('NOT_IN filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.NOT_IN,
        elementToCheck: 'Num',
        expectedResults: 2,
        value: [1, 2, 5],
        valueToCheck: [0]
    });
}));
test('STARTS_WITH filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.STARTS_WITH,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'Doubl',
        valueToCheck: ['DoubleData']
    });
}));
test('STARTS_WITH_CASE_INSENSITIVE filter', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prepareDataForFilter();
    yield checkWorkingOperator({
        filterOperator: Interfaces_1.FilterOperator.STARTS_WITH_CASE_INSENSITIVE,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'doubl',
        valueToCheck: ['DoubleData']
    });
}));
it('should throw IS_BETWEEN errors', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    expect(() => strapi.findOne(tests).filter('id', Interfaces_1.FilterOperator.IS_BETWEEN, 5)).toThrow();
    expect(() => strapi.findAll(tests).filter('id', Interfaces_1.FilterOperator.IS_BETWEEN, 5)).toThrow();
}));
test('StrapiFindAll.hideId', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    yield createRandomItems(2);
    const results = yield strapi.findAll(tests).hideId().show();
    expect(results.data.length).toBe(2);
    results.data.forEach(el => {
        expect(el.id).toBeUndefined();
    });
}));
test('StrapiFindAll.rename', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    yield createRandomItems(2);
    const results = yield strapi.findAll(tests).rename('id', 'strapiId').show();
    expect(results.data.length).toBe(2);
    results.data.forEach(el => {
        expect(el.strapiId).not.toBeUndefined();
        expect(el.id).toBeUndefined();
    });
}));
test('StrapiFindAll.and.or || StrapiFindAll.or.and', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const andOr = () => strapi.findAll(tests).and('Str', IS_EQUAL_TO, uuidv4()).or('Str', IS_EQUAL_TO, uuidv4());
    const orAnd = () => strapi.findAll(tests).or('Str', IS_EQUAL_TO, uuidv4()).and('Str', IS_EQUAL_TO, uuidv4());
    expect(andOr).toThrow();
    expect(orAnd).toThrow();
}));
// Coverage tests
test('Strapi.create when / is appended', () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteAll();
    const shouldNotThrow = () => {
        new StrapiHandler.default(strapiUrl + '/', apiKey).create(tests, {
            Num: 0
        });
    };
    expect(shouldNotThrow).not.toThrow();
}));
