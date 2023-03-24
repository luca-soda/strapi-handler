import StrapiHandler = require('./StrapiHandler');
import uuidLib = require('uuid');
import { FilterOperator } from './Interfaces';

const uuidv4 = uuidLib.v4;

const apiKey = '37a9dca00ffbd809de068adf97ae7b4bcc0b78a3102798fd393d7126da8984fbf563e6ebf6e507e3fc93970b9971ecee6175096e85523169d6feea6f89d2d15ccafcf6ad4e7adcab5c99c6146e959a4106e92c619933a050d558f692afaf2a703ad55c151ebf90485fab1e7a61f035b722177cec37f9037ee3292d8e2c1a160b';
const strapiHandler = new StrapiHandler.default('http://127.0.0.1:1337', apiKey);

const collectionName = 'Tests';
let id: number | null, obj: any, uuid: string | null, n: number | null;

interface Test {
    id: number,
    Str: string,
    Num: number,
    RelationOne: any,
    RelationMany: any[]
}

it('should create a new Test', async () => {
    const uuid = uuidv4();
    const n = Math.floor((Math.random()*100));
    const result = await strapiHandler.create<Test>(collectionName, {
        Str: uuid,
        Num: n
    });
    expect(result.Str).toBe(uuid);
    expect(result.Num).toBe(n);
    id = result.id;
    obj = result;
});

it('should return the previous Test', async() => {
    const result = await strapiHandler.findOne(collectionName).filter('id', FilterOperator.EQUAL_TO, id).chain().show();
    expect(JSON.stringify(result)).toBe(JSON.stringify(obj));
});

it('should delete the Test', async () => {
    let result = await strapiHandler.findOne(collectionName).filter('id', FilterOperator.EQUAL_TO, id).chain().delete();
    expect(JSON.stringify(result)).toBe(JSON.stringify(obj));
    result = await strapiHandler.findOne(collectionName).filter('id', FilterOperator.EQUAL_TO, id).chain().show();
    expect(result).toBeNull();
});

it('should delete all tests', async () => {
    let results = await strapiHandler.findAll(collectionName).call<Test>();
    expect(results.data).toBeDefined();
    for (let i = 0; i < results.data.length; i++) {
        const target = results.data[i]!;
        const result = await strapiHandler.findOne(collectionName).filter('id', FilterOperator.EQUAL_TO, target.id).chain().delete();
        expect(JSON.stringify(target)).toBe(JSON.stringify(result));
    }
    results = await strapiHandler.findAll(collectionName).call<Test>();
    expect(results.data.length).toBe(0);
});


it('should create a new Test', async () => {
    uuid = uuidv4();
    n = Math.floor((Math.random()*100));
    const result = await strapiHandler.create<Test>(collectionName, {
        Str: uuid,
        Num: n
    });
    expect(result.Str).toBe(uuid);
    expect(result.Num).toBe(n);
});

it('should create a new Test', async () => {
    const uuid = uuidv4();
    const result = await strapiHandler.create<Test>(collectionName, {
        Str: uuid,
        Num: n
    });
    expect(result.Str).toBe(uuid);
    expect(result.Num).toBe(n);
});

it('should return only the first the previous created Tests', async () => {
    const results = await strapiHandler.findAll(collectionName).filter('Str', FilterOperator.EQUAL_TO, uuid).call<Test>();
    expect(results.data.length).toBe(1);
    expect(results.data[0]?.Str).toBe(uuid);
});

it('should return only the same test', async () => {
    let results = await strapiHandler.findAll(collectionName).filter('Str', FilterOperator.EQUAL_TO, uuid).call<Test>();
    expect(results.data.length).toBe(1);
    expect(results.data[0]?.Str).toBe(uuid);
    const target = results.data[0]!;
    results = await strapiHandler.findAll(collectionName).filter('Str', FilterOperator.EQUAL_TO, uuid).and('Num', FilterOperator.EQUAL_TO, n).call<Test>();
    expect(results.data.length).toBe(1);
    expect(JSON.stringify(results.data[0])).toBe(JSON.stringify(target));
});

it('should return both the previous Tests', async () => {
    const results = await strapiHandler.findAll(collectionName).filter('Num', FilterOperator.EQUAL_TO, n).call<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data[0]?.Num).toBe(n);
    expect(results.data[1]?.Num).toBe(n);
});

it('should return both the previous Tests', async () => {
    const results = await strapiHandler.findAll(collectionName).filter('Num', FilterOperator.EQUAL_TO, n).or('Str', FilterOperator.EQUAL_TO, uuid).call<Test>();
    expect(results.data.length).toBe(2);
})


