import StrapiHandler = require('./StrapiHandler');
import uuidLib = require('uuid');
import { FilterOperator, SortDirection } from './Interfaces';

const uuidv4 = uuidLib.v4;

const strapiUrl = 'http://127.0.0.1:1337'
const apiKey = '37a9dca00ffbd809de068adf97ae7b4bcc0b78a3102798fd393d7126da8984fbf563e6ebf6e507e3fc93970b9971ecee6175096e85523169d6feea6f89d2d15ccafcf6ad4e7adcab5c99c6146e959a4106e92c619933a050d558f692afaf2a703ad55c151ebf90485fab1e7a61f035b722177cec37f9037ee3292d8e2c1a160b';
const collectionName = 'Tests';
const relationOne = 'Relation-ones';
// const relationMany = 'Relation-manies';

it('should create a valid StrapiHandlers', async () => {
    let handler: any = new StrapiHandler.default(strapiUrl, apiKey);
    expect(handler).toBeDefined();
    handler = new StrapiHandler.default(strapiUrl+'/', apiKey)
    expect(handler).toBeDefined();
    handler = new StrapiHandler.default(strapiUrl, apiKey).findAll(collectionName);
    expect(handler).toBeDefined();
    handler = new StrapiHandler.default(strapiUrl+'/', apiKey).findAll(collectionName);
    expect(handler).toBeDefined();
    handler = new StrapiHandler.default(strapiUrl, apiKey).findOne(collectionName).chain();
    expect(handler).toBeDefined();
    handler = new StrapiHandler.default(strapiUrl+'/', apiKey).findOne(collectionName).chain();
    expect(handler).toBeDefined();
});

let strapiHandler = new StrapiHandler.default(strapiUrl, apiKey);
let id: number | null, obj: any, uuid: string | null, n: number | null;

interface Test {
    id: number,
    Str: string,
    Str2: string,
    Num: number,
    RelationOne: any,
    RelationMany: any[] | null
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
    let elements;
    do {
        for (let i = 0; i < results.data.length; i++) {
            const target = results.data[i]!;
            const result = await strapiHandler.findOne(collectionName).filter('id', FilterOperator.EQUAL_TO, target.id).chain().delete();
            expect(JSON.stringify(target)).toBe(JSON.stringify(result));
        }
        results = await strapiHandler.findAll(collectionName).call<Test>();
        elements = results.data.length;
    } while (elements > 0);
    results = await strapiHandler.findAll(collectionName).call<Test>();
    expect(results.data.length).toBe(0);
});


const clearStrapi = async () => {
    let results = await strapiHandler.findAll(collectionName).call<Test>();
    let elements;
    do {
        for (let i = 0; i < results.data.length; i++) {
            const target = results.data[i]!;
            await strapiHandler.findOne(collectionName).filter('id', FilterOperator.EQUAL_TO, target.id).chain().delete();
        }
        results = await strapiHandler.findAll(collectionName).call<Test>();
        elements = results.data.length;
    } while (elements > 0);
    results = await strapiHandler.findAll(collectionName).call<Test>();
}

const createRandom = async (total: number) => {
    for (let i = 0; i < total; i++) {
        await strapiHandler.create(collectionName, <Test>{
            Str: uuidv4(),
            Str2: uuidv4(),
            Num: Math.floor(Math.random()*100),
        });
    }
}

const createRandomRelationOne = async (total: number) => {
    for (let i = 0; i < total; i++) {
        await strapiHandler.create(relationOne, {
            Str: uuidv4()
        });
    }
}

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

it('should not delete anything', async () => {
    const uuid = uuidv4();
    const result = await strapiHandler.findOne(collectionName).filter('Str', FilterOperator.EQUAL_TO, uuid).chain().delete();
    expect(result).toBeNull();
})

it('should update uuid to a new one', async () => {
    const _uuid = uuidv4();
    const result = await strapiHandler.findOne(collectionName).filter('Str', FilterOperator.EQUAL_TO, uuid).chain().put<Test>({
        Str: _uuid
    });
    expect(result?.Str).toBe(_uuid);
});

it('should not exists', async () => {
    const result = await strapiHandler.findOne(collectionName).filter('Str', FilterOperator.EQUAL_TO, uuid).chain().show('Str');
    expect(result).toBeNull();
});

it('should not update anything', async () => {
    const result = await strapiHandler.findOne(collectionName).filter('Str', FilterOperator.EQUAL_TO, uuid).chain().put<Test>({
        Str: uuidv4()
    });
    expect(result).toBeNull();
});

it('should return only the uuid', async () => {
    let result = await strapiHandler.findOne(collectionName).chain().show<Test>();
    expect(result).not.toBeNull();
    const uuid = result!.Str;
    result = await strapiHandler.findOne(collectionName).chain().show('Str');
    expect(result).toBe(uuid);
});

it('should return both the uuid and the n', async () => {
    let result = await strapiHandler.findOne(collectionName).chain().show<Test>();
    expect(result).not.toBeNull();
    const uuid = result!.Str;
    const n = result!.Num;
    const results = await strapiHandler.findOne(collectionName).chain().show<Partial<Test> | null>(['Str','Num']);
    expect(results).not.toBeNull();
    expect(results!['Str']).toBe(uuid)
    expect(results!['Num']).toBe(n)
});

it('should return the Str as uuid', async () => {
    const result = await strapiHandler.findOne(collectionName).rename('Str','uuid').chain().show<{uuid: string}>();
    expect(result?.uuid).toBeDefined();
});

it('should return only the Str and the id', async () => {
    const result = await strapiHandler.findOne(collectionName).field('Str').chain().show<Partial<Test>>();
    expect(result?.Num).toBeUndefined();
    expect(result?.RelationMany).toBeUndefined();
    expect(result?.RelationMany).toBeUndefined();
    expect(result?.Str).toBeDefined();
    expect(result?.id).toBeDefined();
});

it('should return both the results', async () => {
    let results = await strapiHandler.findAll(collectionName).call<Test>();
    expect(results.data.length).toBeGreaterThan(1);
    results.data = results.data.slice(0,2);
    expect(results.data.length).toBe(2);
    const uuid1 = results.data[0]!.Str;
    const uuid2 = results.data[1]!.Str;
    results = await strapiHandler.findAll(collectionName).or('Str', FilterOperator.EQUAL_TO, uuid1).or('Str', FilterOperator.EQUAL_TO, uuid2).call<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data.find(el => el.Str === uuid1)).toBeDefined();
    expect(results.data.find(el => el.Str === uuid2)).toBeDefined();
});

it('should return the same element', async () => {
    let result = await strapiHandler.findOne(collectionName).chain().show<Test>();
    expect(result).toBeDefined();
    const uuid = result!.Str;
    const n = result!.Num;
    result = await strapiHandler.findOne(collectionName).and('Str', FilterOperator.EQUAL_TO, uuid).and('Num', FilterOperator.EQUAL_TO, n).chain().show<Test>();
    expect(result).toBeDefined();
    expect(result?.Num).toBe(n);
    expect(result?.Str).toBe(uuid);
});

it('should return an element', async () => {
    await clearStrapi();
    await strapiHandler.create(collectionName, <Test>{
        Num: 0,
        Str: uuidv4()
    });
    await strapiHandler.create(collectionName, <Test>{
        Num: 1,
        Str: uuidv4()
    });
    await strapiHandler.create(collectionName, <Test>{
        Num: 2,
        Str: uuidv4()
    });
    let result = await strapiHandler.findOne(collectionName).chain().show<Test>();
    expect(result).toBeDefined();
    const uuid = uuidv4();
    const id = result!.id;
    const n = result!.Num;
    result = await strapiHandler.findOne(collectionName).or('Str', FilterOperator.EQUAL_TO, uuid).or('Num', FilterOperator.EQUAL_TO, n).chain().show<Test>();
    expect(result?.id).toBe(id);
});

it('should throw (not yet supported) (chaining "and" and "or")', async () => {
    let unsupportedOperation = () => strapiHandler.findOne(collectionName).and('Str', FilterOperator.EQUAL_TO, uuid).or('Num', FilterOperator.EQUAL_TO, n);
    expect(unsupportedOperation).toThrow();
    unsupportedOperation = () => strapiHandler.findOne(collectionName).or('Str', FilterOperator.EQUAL_TO, uuid).and('Num', FilterOperator.EQUAL_TO, n);
    expect(unsupportedOperation).toThrow();
});

it('should return two elements', async () => {
    await clearStrapi();
    await strapiHandler.create(collectionName, {
        Str: uuidv4(),
        Num: 0
    });
    await strapiHandler.create(collectionName, {
        Str: uuidv4(),
        Num: 1
    });
    await strapiHandler.create(collectionName, {
        Str: uuidv4(),
        Num: 2
    });
    const results = await strapiHandler.findAll(collectionName).filter('Num', FilterOperator.IS_BETWEEN, 0,1).call<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data.find(el => el.Num === 0)).toBeDefined();
    expect(results.data.find(el => el.Num === 1)).toBeDefined();
});

it('should return one elements', async () => {
    await clearStrapi();
    await strapiHandler.create(collectionName, <Test>{
        Str: uuidv4(),
        Num: 0,
    });
    await strapiHandler.create(collectionName, {
        Str: uuidv4(),
        Num: 5
    });
    await strapiHandler.create(collectionName, {
        Str: uuidv4(),
        Num: 6
    });
    const result = await strapiHandler.findOne(collectionName).filter('Num', FilterOperator.IS_BETWEEN, 0,1).chain().show<Test>();
    expect(result).toBeDefined()
    expect(result?.Num).toBe(0);
});

it('should hide id', async () => {
    const result = await strapiHandler.findOne(collectionName).hideId().chain().show<Partial<Test>>();
    expect(result).toBeDefined();
    expect(result?.id).toBeUndefined();
});

it('should hide all (but id)', async () => {
    const result = await strapiHandler.findOne(collectionName).getId();
    expect(Number(result)).not.toBeNaN();
});

it('should return page two of one element', async () => {
    await clearStrapi();
    await createRandom(26);
    const results = await strapiHandler.findAll(collectionName).page(2).call<Test>();
    expect(results).toBeDefined();
    expect(results.data.length).toBe(1);
});

it('should return populated page (relationOne)', async () => {
    await clearStrapi();
    const uuid = uuidv4();
    await strapiHandler.create(relationOne, {
        Str: uuid
    });
    const id = await strapiHandler.findOne(relationOne).filter('Str', FilterOperator.EQUAL_TO, uuid).getId();
    await strapiHandler.create(collectionName, <Test>{
        Str: uuidv4(),
        RelationOne: id
    });
    let result1 = await strapiHandler.findOne(collectionName).populate('RelationOne').chain().show<any[]>('RelationOne');
    let result2Id = await strapiHandler.findOne(relationOne).filter('Str', FilterOperator.EQUAL_TO, uuid).getId();
    let results3 = await strapiHandler.findAll(collectionName).populate('RelationOne').call<Test>();
    expect(result1![0].id).toBe(result2Id);
    expect(results3.data[0]?.RelationOne.length).toBe(1);
    expect(result2Id).toBe(results3.data[0]?.RelationOne[0].id);
});

it('should sort desc', async () => {
    await clearStrapi();
    await strapiHandler.create(collectionName, {
        Num: 0,
    });
    await strapiHandler.create(collectionName, {
        Num: 1,
    });
    await strapiHandler.create(collectionName, {
        Num: 5,
    })
    await strapiHandler.create(collectionName, {
        Num: 2,
    });

    const results = await strapiHandler.findAll(collectionName).sort('Num', SortDirection.DESC).call<Test>();
    const sortedData = [...results.data];
    expect(JSON.stringify(results.data)).toBe(JSON.stringify(sortedData));
});

it('should select only Str and RelationOne', async () => {
    await clearStrapi();
    await createRandomRelationOne(1);
    const id = await strapiHandler.findOne(relationOne).getId();
    await strapiHandler.create(collectionName, <Test>{
        Num: 1,
        Str: uuidv4(),
        RelationOne: id
    });

    const results = await strapiHandler.findAll(collectionName).fields(['Str', 'Str2']).call<Test>();
    expect(results.data.length).toBe(1);
    expect(results.data[0]?.Num).toBeUndefined();
    expect(results.data[0]?.Str2).toBeDefined();
    expect(results.data[0]?.Str).toBeDefined();
})

it('should return 50 elements', async () => {
    await clearStrapi();
    await createRandom(51);

    const results = await strapiHandler.findAll(collectionName).pageSize(50).call<Test>();
    expect(results.data.length).toBe(50);
});

it('should return specific element with 1 and 2 Num', async () => {
    await clearStrapi();
    await strapiHandler.create(collectionName, <Test>{
        Num: 0
    });
    await strapiHandler.create(collectionName, <Test>{
        Num: 1
    });
    await strapiHandler.create(collectionName, <Test>{
        Num: 2
    });
    await strapiHandler.create(collectionName, <Test>{
        Num: 3
    });

    const results = await strapiHandler.findAll(collectionName).sort('Num', SortDirection.ASC).offsetStart(1).offsetLimit(2).call<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data[0]?.Num).toBe(1);
    expect(results.data[1]?.Num).toBe(2);
});

it('should hide id', async () => {
    await clearStrapi();
    createRandom(1);

    const results = await strapiHandler.findAll(collectionName).hideId().call<Test>();
    expect(results.data.length).toBe(1);
    expect(results.data[0]?.id).toBeUndefined();
});

it('should hide id', async () => {
    await clearStrapi();
    createRandom(1);

    const results = await strapiHandler.findAll(collectionName).showOnlyId().call<Test>();
    expect(results.data.length).toBe(1);
    expect(results.data[0]?.id).toBeDefined();
    expect(Object.keys(results.data[0]!).length).toBe(1);
});

it('should rename Str in uuid', async () => {
    await clearStrapi();
    const uuid = uuidv4();
    const uuid2 = uuidv4();
    await strapiHandler.create(collectionName, {
        Str: uuid
    });
    await strapiHandler.create(collectionName, {
        Str: uuid2
    });

    const results = await strapiHandler.findAll(collectionName).rename('Str','uuid').call<{uuid: string}>();
    expect(results.data.length).toBe(2);
    expect(results.data[0]?.uuid).toBe(uuid);
    expect(results.data[1]?.uuid).toBe(uuid2);
});

it('should throw (complex combination not supported yet)', async () => {
    await clearStrapi();
    let unsupportedOperation = () => strapiHandler.findAll(collectionName).and('Str',FilterOperator.EQUAL_TO, 'Never').or('Str',FilterOperator.EQUAL_TO, 'Never');
    expect(unsupportedOperation).toThrow();
    unsupportedOperation = () => strapiHandler.findAll(collectionName).or('Str',FilterOperator.EQUAL_TO, 'Never').and('Str',FilterOperator.EQUAL_TO, 'Never');
    expect(unsupportedOperation).toThrow();
});