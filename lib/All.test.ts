import StrapiHandler = require('./StrapiHandler');
import uuidLib = require('uuid');
import axios from 'axios';
import { FilterOperator, SortDirection } from './Interfaces';

const uuidv4 = uuidLib.v4;
const { IS_EQUAL_TO } = FilterOperator;

const strapiUrl = 'http://127.0.0.1:7125'
const apiKey = '37a9dca00ffbd809de068adf97ae7b4bcc0b78a3102798fd393d7126da8984fbf563e6ebf6e507e3fc93970b9971ecee6175096e85523169d6feea6f89d2d15ccafcf6ad4e7adcab5c99c6146e959a4106e92c619933a050d558f692afaf2a703ad55c151ebf90485fab1e7a61f035b722177cec37f9037ee3292d8e2c1a160b';
const tests = 'Tests';
const relationOne = 'Relation-ones';
const relationMany = 'Relation-manies';

interface Test {
    id: number,
    Str: string,
    Str2: string,
    Num: number,
    RelationOne: any,
    RelationMany: any[] | null
}

interface Relation {
    id: number,
    Str: string
}

interface RelationOne {
    id: number,
    Str: string,
    DeepRelation: number
}

it('should create valids StrapiHandler', async () => {
    let createHandler: any;
    createHandler = () => { new StrapiHandler.default(strapiUrl, apiKey); }
    expect(createHandler).not.toThrow();
    createHandler = () => { new StrapiHandler.default(strapiUrl + '/', apiKey); }
    expect(createHandler).not.toThrow();
    createHandler = () => { new StrapiHandler.default(strapiUrl, apiKey).findAll(tests); }
    expect(createHandler).not.toThrow();
    createHandler = () => { new StrapiHandler.default(strapiUrl, apiKey).findOne(tests); }
    expect(createHandler).not.toThrow();
    createHandler = async () => { await new StrapiHandler.default(strapiUrl + '/', apiKey).findOne(tests).show<Test>() };
    expect(createHandler).not.toThrow();
    createHandler = async () => { await new StrapiHandler.default(strapiUrl + '/', apiKey).findAll(tests).show<Test>() };
    expect(createHandler).not.toThrow();
});

const strapi = new StrapiHandler.default(strapiUrl, apiKey);

//Testing basic function to create a usable envinroment (tests are executed synchronously)

it('Strapi.create with hardcoded checking', async () => {
    const uuid = uuidv4();

    let result = await strapi.create<Test>(tests, <Test>{
        Str: uuid
    });
    expect(result.Str).toBe(uuid);
    const result2 = await axios.get(`${strapiUrl}/api/${tests}?filters[Str][$eq]=${uuid}`, {
        headers: {
            'Authorization': 'Bearer ' + apiKey
        }
    });
    expect(result2.data.data.length).toBe(1);
    expect(result2.data.data[0].attributes.Str).toBe(uuid);
});

const createRandomItems = async (itemNumber: number) => {
    const createRandomItem = async (): Promise<Test> => {
        const uuids = [uuidv4(), uuidv4()];
        const n = Math.floor(Math.random() * 100);
        return await strapi.create<Test>(tests, <Test>{
            Num: n,
            Str: uuids[0],
            Str2: uuids[1],
        })
    }

    const items: Test[] = [];

    for (let i = 0; i < itemNumber; i++) {
        items.push(await createRandomItem());
    }

    return items;
}

const createRandomItem = async (): Promise<Test> => {
    return (await createRandomItems(1))[0]!;
}

test('createRandomItems', async () => {
    const items = await createRandomItems(5);
    expect(items.length).toBe(5);
    for (let item of items) {
        expect(typeof item.Str).toBe('string');
        expect(typeof item.Str2).toBe('string');
        expect(typeof item.Num).toBe('number');
    }
});

test('createRandomItem', async () => {
    const item = await createRandomItem();
    expect(item).toBeTruthy();
});

test('StrapiFindOne.show basic usage', async () => {
    await createRandomItem();

    const result = await strapi.findOne(tests).show<Test>();
    expect(result).toBeTruthy();
});

test('StrapiFindOne.filter IS_EQUAL', async () => {
    const item = await createRandomItem();

    let result = await strapi.findOne(tests).filter('Str', IS_EQUAL_TO, item.Str).show<Test>();
    expect(result).toBeTruthy();
    expect(result!.Str).toBe(item.Str);
});

test('StrapiFindOne.showOnlyId', async () => {
    const uuid = uuidv4()
    const result = await strapi.create<Test>(tests, <Test>{
        Str: uuid
    });

    const idToCheck = result!.id;

    const id = await strapi.findOne(tests).filter('Str', IS_EQUAL_TO, uuid).showOnlyId();
    expect(id).toBe(idToCheck);
});

test('StrapiFindOne.delete', async () => {
    const uuid = uuidv4()
    await strapi.create<Test>(tests, <Test>{
        Str: uuid
    });

    const resultToCheck = await strapi.findOne(tests).filter('Str', IS_EQUAL_TO, uuid).show<Test>();
    const result = await strapi.findOne(tests).filter('Str', IS_EQUAL_TO, uuid).delete();
    expect(result).toEqual(resultToCheck);
    const exists = (await strapi.findOne(tests).filter('Str', IS_EQUAL_TO, uuid).showOnlyId()) ?? false;
    expect(exists).toBe(false);
});

test('StrapiFindAll.show basic usage', async () => {
    await createRandomItems(20);

    const { data } = await strapi.findAll(tests).show();
    expect(data.length).toBeGreaterThanOrEqual(20);
});

test('StrapiFindAll.showOnlyId basic usage', async () => {
    await createRandomItems(5);

    const { ids } = await strapi.findAll(tests).showOnlyIds();
    expect(ids.length).toBeGreaterThanOrEqual(5);
});

const deleteCollection = async (collectionName: string) => {
    let remaning = true;
    while (remaning) {
        const { ids } = await strapi.findAll(collectionName).showOnlyIds();
        for (let id of ids) {
            await strapi.findOne(collectionName).filter('id', IS_EQUAL_TO, id).delete();
        }
        remaning = (await strapi.findOne(collectionName).showOnlyId()) !== null;
    }
}

const deleteAll = async () => {
    const collections = [tests, relationOne, relationMany];

    for (let collection of collections) {
        await deleteCollection(collection);
    }
}

it('should delete everything', async () => {
    await createRandomItems(50);
    await strapi.create(relationOne, {
        Str: uuidv4()
    });
    await strapi.create(relationOne, {
        Str: uuidv4()
    });
    await strapi.create(relationMany, {
        Str: uuidv4()
    });
    await strapi.create(relationMany, {
        Str: uuidv4()
    });

    const collections = [tests, relationOne, relationMany];

    await deleteAll();

    for (let collection of collections) {
        const id = await strapi.findOne(collection).showOnlyId();
        expect(id).toBeNull();
    }
});

// Basic setup done

//StrapiChain Testing

test('StrapiChain.delete when the id lookup failed', async () => {
    await deleteAll();

    const result = await strapi.findOne(tests).delete();
    expect(result).toBeNull();
});

test('StrapiChain.put', async () => {
    await deleteAll();
    const item = await createRandomItem();

    const nextUuid = uuidv4();
    let result = await strapi.findOne(tests).filter('id', IS_EQUAL_TO, item.id).update<Test>({
        Str: nextUuid
    });
    expect(result).toBeTruthy();
    expect(result!.Str).toBe(nextUuid);
    expect(result!.Str2).toBe(item.Str2);
    expect(result!.id).toBe(item.id);
    expect(result!.Num).toBe(item.Num);
    result = await strapi.findOne(tests).filter('id', IS_EQUAL_TO, item.id).show<Test>();
    expect(result).toBeTruthy();
    expect(result!.Str).toBe(nextUuid);
    expect(result!.Str2).toBe(item.Str2);
    expect(result!.id).toBe(item.id);
    expect(result!.Num).toBe(item.Num);
});

test('StrapiChain.put when the id lookup failed', async () => {
    await deleteAll();

    const result = await strapi.findOne(tests).update({});
    expect(result).toBeNull();
});

test('StrapiChain.show when hiding id', async () => {
    await deleteAll();
    await createRandomItem();

    const result = await strapi.findOne(tests).hideId().show<Test>();
    expect(result!.id).toBeUndefined();
});

test('StrapiHandling.createMany', async () => {
    await deleteAll();

    const toCreate = 5;
    const items: Partial<Test>[] = [];
    for (let i = 0; i < toCreate; i++) {
        items.push({
            Str: uuidv4(),
        })
    }

    const results = await strapi.createMany(tests, items);
    results.forEach((result) => {
        expect(items.find(item => item.Str === result.Str)).not.toBeUndefined();
    });
});

test('StrapiFindOne.populate', async () => {
    await deleteAll();
    await createRandomItem();
    const itemRelationOne = await strapi.create<Relation>(relationOne, {
        Str: uuidv4()
    });
    const itemRelationManies = await strapi.createMany<Relation>(relationMany, [
        {
            Str: uuidv4(),
        },
        {
            Str: uuidv4()
        }
    ]);
    await strapi.findOne(tests).update<Test>({
        RelationOne: itemRelationOne.id,
        RelationMany: itemRelationManies.map(el => el.id)
    });

    const resultWithRelationOne = await strapi.findOne(tests).populate('RelationOne').show<Test>();
    const resultWithRelationMany = await strapi.findOne(tests).populate('RelationMany').show<Test>();
    const resultWithBothRelations = await strapi.findOne(tests).populate('*').show<Test>();

    expect(resultWithRelationOne).not.toBeNull();
    expect(resultWithRelationOne!.RelationOne?.length).toBe(1);
    expect(resultWithRelationOne!.RelationOne[0]!.id).toEqual(itemRelationOne.id);
    expect(resultWithRelationOne!.RelationMany).toBeUndefined();

    expect(resultWithRelationMany).not.toBeNull();
    expect(resultWithRelationMany!.RelationMany?.length).toBe(2);
    resultWithRelationMany!.RelationMany!.forEach((relation: Relation) => {
        expect(itemRelationManies.find(r => r.id === relation.id)).not.toBeUndefined();
    });
    expect(resultWithRelationMany?.RelationOne).toBeUndefined();

    expect(resultWithBothRelations).not.toBeNull();
    expect(resultWithBothRelations!.RelationOne?.length).toBe(1);
    expect(resultWithBothRelations!.RelationMany?.length).toBe(2);
    expect(resultWithBothRelations!.RelationOne[0]!.id).toEqual(itemRelationOne.id);
    resultWithBothRelations!.RelationMany!.forEach((relation: Relation) => {
        expect(itemRelationManies.find(r => r.id === relation.id)).not.toBeUndefined();
    });
});

test('StrapiFindOne.deepPopulate', async () => {
    await deleteAll();
    await createRandomItem();
    const itemRelationMany = await strapi.create<Relation>(relationMany, {
        Str: uuidv4()
    });
    const itemRelationOne = await strapi.create<RelationOne>(relationOne, {
        Str: uuidv4(),
        DeepRelation: itemRelationMany.id
    });
    await strapi.findOne(tests).update<Test>({
        RelationOne: itemRelationOne.id,
    });

    const result = await strapi.findOne(tests).populate('RelationOne').deepPopulate('RelationOne','DeepRelation').show<Test>();
    expect(result).not.toBeNull();
    expect(result!.RelationOne.length).toBe(1);
    expect(result!.RelationOne[0]!.DeepRelation.length).toBe(1);
    expect(result!.RelationOne[0]!.DeepRelation[0]!.Str).toBe(itemRelationMany.Str);
});

test('StrapiFindOne.deepPopulate with *', async () => {
    await deleteAll();

    const unsupportedOperation = () => strapi.findOne(tests).deepPopulate('RelationOne','*');

    expect(unsupportedOperation).toThrow();
});

test('StrapiFindAll.deepPopulate', async () => {
    await deleteAll();
    await createRandomItem();
    const itemRelationMany = await strapi.create<Relation>(relationMany, {
        Str: uuidv4()
    });
    const itemRelationOne = await strapi.create<RelationOne>(relationOne, {
        Str: uuidv4(),
        DeepRelation: itemRelationMany.id
    });
    await strapi.findOne(tests).update<Test>({
        RelationOne: itemRelationOne.id,
    });

    const results = await strapi.findAll(tests).deepPopulate('RelationOne','DeepRelation').show<Test>();
    expect(results.data.length).toBe(1);
    const result = results.data[0];
    expect(result!.RelationOne.length).toBe(1);
    expect(result!.RelationOne[0]!.DeepRelation.length).toBe(1);
    expect(result!.RelationOne[0]!.DeepRelation[0]!.Str).toBe(itemRelationMany.Str);
});

test('StrapiFindAll.deepPopulate with *', async () => {
    await deleteAll();
    const unsupportedOperation = () => strapi.findAll(tests).deepPopulate('RelationOne','*');
    expect(unsupportedOperation).toThrow();
});

it('should throw an error', async () => {
    expect(() => strapi.findAll(tests).deepPopulate('*','DeepRelation')).toThrow();
    expect(() => strapi.findOne(tests).deepPopulate('*','DeepRelation')).toThrow();
});

test('StrapiFindAll.populate', async () => {
    await deleteAll();
    const items = await createRandomItems(2);

    const itemRelationOne = await strapi.create<Relation>(relationOne, {
        Str: uuidv4()
    });
    const itemRelationManies = await strapi.createMany<Relation>(relationMany, [
        {
            Str: uuidv4(),
        },
        {
            Str: uuidv4()
        }
    ]);

    for (let item of items) {
        await strapi.findOne(tests).filter('id', IS_EQUAL_TO, item.id).update<Test>({
            RelationOne: itemRelationOne.id,
            RelationMany: itemRelationManies.map(el => el.id)
        });
    }

    const resultsWithRelationOne = (await strapi.findAll(tests).populate('RelationOne').show<Test>()).data;
    const resultsWithRelationMany = (await strapi.findAll(tests).populate('RelationMany').show<Test>()).data;
    const resultsWithBothRelations = (await strapi.findAll(tests).populate('*').show<Test>()).data;

    for (let result of resultsWithRelationOne) {
        const toCheck = await strapi.findOne(tests).filter('id', IS_EQUAL_TO, result.id).populate('RelationOne').show<Test>();
        expect(result!.RelationOne?.length).toBe(1);
        expect((toCheck!.RelationOne as Relation[])[0]!.id).toBe((result!.RelationOne as Relation[])[0]?.id);
        expect(result.RelationMany).toBeUndefined();
    }

    for (let result of resultsWithRelationMany) {
        const toCheck = await strapi.findOne(tests).filter('id', IS_EQUAL_TO, result.id).populate('RelationMany').show<Test>();
        expect(result!.RelationMany?.length).toBe(2);
        for (let relation of toCheck?.RelationMany as Relation[]) {
            expect(result.RelationMany?.find(r => r.id === relation.id)).not.toBeUndefined();
            expect(result.RelationOne).toBeUndefined();
        }
    }

    for (let result of resultsWithBothRelations) {
        const toCheck = await strapi.findOne(tests).filter('id', IS_EQUAL_TO, result.id).populate('*').show<Test>();
        expect(result!.RelationOne?.length).toBe(1);
        expect(result!.RelationMany?.length).toBe(2);
        expect((toCheck!.RelationOne as Relation[])[0]!.id).toBe((result!.RelationOne as Relation[])[0]?.id);
        for (let relation of toCheck?.RelationMany as Relation[]) {
            expect(result.RelationMany?.find(r => r.id === relation.id)).not.toBeUndefined();
        }
    }
});

test('StrapiFindOne.rename', async () => {
    await deleteAll();
    const item = await createRandomItem();

    const result = await strapi.findOne(tests).rename('Str', 'uuid').show<{ uuid: string }>();
    expect(result).not.toBeNull();
    expect(result!.uuid).toBe(item.Str);
});

test('StrapiFindOne.and', async () => {
    await deleteAll();
    const item = await createRandomItem();

    const result = await strapi.findOne(tests).filter('Str', IS_EQUAL_TO, item.Str).and('Str2', IS_EQUAL_TO, item.Str2).show<Test>();
    expect(result).not.toBeNull();
    expect(result!.id).toBe(item.id);
});

test('StrapiFindOne.and.or || StrapiFindOne.or.and', async () => {
    await deleteAll();

    const andOr = () => strapi.findOne(tests).and('Str', IS_EQUAL_TO, uuidv4()).or('Str', IS_EQUAL_TO, uuidv4());
    const orAnd = () => strapi.findOne(tests).or('Str', IS_EQUAL_TO, uuidv4()).and('Str', IS_EQUAL_TO, uuidv4());
    expect(andOr).toThrow();
    expect(orAnd).toThrow();
});

test('StrapiFindOne.showOnlyId', async () => {
    await deleteAll();
    const findOne = strapi.findOne(tests);
    jest.spyOn(findOne, 'generateUuid').mockReturnValueOnce('Str');
    const item = await createRandomItem();

    const result = await findOne.showOnlyId();
    expect(result).toBe(item.id);
});

test('StrapiFindOne.fields', async () => {
    await deleteAll();
    await createRandomItem();

    const result = await strapi.findOne(tests).fields(['Str', 'Str2']).show<Test>();
    expect(result).not.toBeNull();
    expect(typeof result!.Str).toBe('string');
    expect(typeof result!.Str2).toBe('string');
    expect(result!.Num).toBeUndefined();
})

// StrapiFindAl

test('StrapiFindAll.page', async () => {
    await deleteAll();
    await createRandomItems(25 + 4);

    const results = await strapi.findAll(tests).page(2).show();
    expect(results.data.length).toBe(4);
});

test('StrapiFindAll.sort', async () => {
    await deleteAll();
    const items: Partial<Test>[] = [
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
    await strapi.createMany(tests, items);
    items.sort((a, b) => b.Num! - a.Num!);

    let results = await strapi.findAll(tests).sort('Num', SortDirection.DESC).show<Test>();
    expect(results.data.length).toBe(items.length);
    for (let i = 0; i < items.length; i++) {
        expect(items[i]!.Num!).toBe(results.data[i]!.Num);
    }

    items.sort((a, b) => a.Num! - b.Num!);
    results = await strapi.findAll(tests).sort('Num', SortDirection.ASC).show<Test>();
    expect(results.data.length).toBe(items.length);
    for (let i = 0; i < items.length; i++) {
        expect(items[i]!.Num!).toBe(results.data[i]!.Num);
    }
});

test('StrapiFindAll.fields', async () => {
    await deleteAll();
    await createRandomItems(5);

    const results = await strapi.findAll(tests).fields(['Str', 'Str2']).show<Test>();
    results.data.forEach((result) => {
        expect(typeof result.Str).toBe('string');
        expect(typeof result.Str2).toBe('string');
        expect(result.Num).toBeUndefined();
    })
});

test('StrapiFindAll.pageSize', async () => {
    await deleteAll();
    await createRandomItems(51);

    let results = await strapi.findAll(tests).pageSize(50).showOnlyIds();
    expect(results.ids.length).toBe(50);

    results = await strapi.findAll(tests).pageSize(50).page(2).showOnlyIds();
    expect(results.ids.length).toBe(1);
});

test('StrapiFindAll.offsetStart && Strapi.offsetLimit', async () => {
    await deleteAll();
    const items: Partial<Test>[] = [
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
    await strapi.createMany<Test>(tests, items);

    let results = await strapi.findAll(tests).sort('Num', SortDirection.ASC).offsetStart(1).show<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data[0]!.Num).toBe(items[1]!.Num);
    expect(results.data[1]!.Num).toBe(items[2]!.Num);

    results = await strapi.findAll(tests).sort('Num', SortDirection.ASC).offsetStart(1).offsetLimit(1).show<Test>();
    expect(results.data.length).toBe(1);
    expect(results.data[0]!.Num).toBe(items[1]!.Num);
});

const prepareDataForFilter = async () => {
    await deleteAll();
    const items: Partial<Test>[] = [
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
    await strapi.createMany(tests, items);
    return items;
}

const checkWorkingOperator = async ({ expectedResults, elementToCheck, valueToCheck, filterOperator, value, value2 }:
    { expectedResults: number, elementToCheck: 'Str' | 'Str2' | 'Num', valueToCheck: any, filterOperator: FilterOperator, value: any, value2?: any }) => {
    const results = await strapi.findAll(tests).filter(elementToCheck, filterOperator, value, value2).show<Test>();
    const result = await strapi.findOne(tests).filter(elementToCheck, filterOperator, value, value2).show<Test>();
    expect(results.data.length).toBe(expectedResults);
    for (let i = 0; i < expectedResults; i++) {
        expect((valueToCheck as []).find((el) => el === results.data[i]![elementToCheck])).not.toBeUndefined();
    }
    if (expectedResults > 0) {
        expect(result).not.toBeNull();
        expect((valueToCheck as []).find((el) => el === result![elementToCheck])).not.toBeUndefined();
    }
    else {
        expect(result).toBeNull();
    }
}

test('Complex Query', async () => {
    const items = await prepareDataForFilter();
    const results = await strapi.findAll(tests)
                                    .filter('Num', IS_EQUAL_TO, 0, { andGroup: 0, orGroup: 0 })
                                    .filter('Str2', IS_EQUAL_TO, 'Test', {andGroup: 1, orGroup: 0})
                                    .filter('Num', IS_EQUAL_TO, 5, { andGroup: 2, orGroup: 1})
                                    .filter('Str', FilterOperator.IS_NOT_EQUAL_TO, uuidv4(), { andGroup: 3, orGroup: 1})
                                    .show<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data[0]!.Num).toBe(0);
    expect(results.data[0]!.Str2).toBe('Test');
    expect(results.data[1]!.Num).toBe(5);
    expect(results.data[1]!.Str).toBe(items[4]!.Str);
});

test('Basic filter', async () => {
    await prepareDataForFilter();
    const results = await strapi.findAll(tests).filter('Num', IS_EQUAL_TO, 0).show<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data[0]!.Num).toBe(0);
    expect(results.data[1]!.Num).toBe(0);
});

test('AND filter', async () => {
    const items = await prepareDataForFilter();
    const results = await strapi.findAll(tests).filter('Num', IS_EQUAL_TO, 0).and('Str', IS_EQUAL_TO, items[0]!.Str).show<Test>();
    const result = await strapi.findOne(tests).filter('Num', IS_EQUAL_TO, 0).and('Str', IS_EQUAL_TO, items[0]!.Str).show<Test>();
    expect(results.data.length).toBe(1);
    expect(results.data[0]!.Num).toBe(0);
    expect(results.data[0]!.Str).toBe(items[0]!.Str);
    expect(result).not.toBeNull();
    expect(result!.Num).toBe(0);
    expect(result!.Str).toBe(items[0]!.Str);
});

test('chained AND since the start', async () => {
    const items = await prepareDataForFilter();
    const results = await strapi.findAll(tests).and('Num', IS_EQUAL_TO, 0).and('Str', IS_EQUAL_TO, items[0]!.Str).show<Test>();
    const result = await strapi.findOne(tests).and('Num', IS_EQUAL_TO, 0).and('Str', IS_EQUAL_TO, items[0]!.Str).show<Test>();
    expect(results.data.length).toBe(1);
    expect(results.data[0]!.Num).toBe(0);
    expect(results.data[0]!.Str).toBe(items[0]!.Str);
    expect(result).not.toBeNull();
    expect(result!.Num).toBe(0);
    expect(result!.Str).toBe(items[0]!.Str);
});

test('OR filter', async () => {
    await prepareDataForFilter();
    const results = await strapi.findAll(tests).filter('Num', IS_EQUAL_TO, 0).or('Str', IS_EQUAL_TO, uuidv4()).show<Test>();
    const result = await strapi.findOne(tests).filter('Num', IS_EQUAL_TO, 0).or('Str', IS_EQUAL_TO, uuidv4()).show<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data[0]!.Num).toBe(0);
    expect(results.data[1]!.Num).toBe(0);
    expect(result).not.toBeNull();
    expect(result!.Num).toBe(0);
})

test('Chained OR since the start', async () => {
    await prepareDataForFilter();
    const results = await strapi.findAll(tests).or('Num', IS_EQUAL_TO, 0).or('Str', IS_EQUAL_TO, uuidv4()).show<Test>();
    const result = await strapi.findOne(tests).or('Num', IS_EQUAL_TO, 0).or('Str', IS_EQUAL_TO, uuidv4()).show<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data[0]!.Num).toBe(0);
    expect(results.data[1]!.Num).toBe(0);
    expect(result).not.toBeNull();
    expect(result!.Num).toBe(0);
});

test('CONTAINS filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.CONTAINS,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'est',
        valueToCheck: ['Test', 'Jest']
    });
});

test('CONTAINS_CASE_INSENSITIVE filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.CONTAINS_CASE_INSENSITIVE,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'eSt',
        valueToCheck: ['Test', 'Jest']
    });
});

test('IS_BETWEEN filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IS_BETWEEN,
        elementToCheck: 'Num',
        expectedResults: 4,
        value: 0,
        value2: { secondaryValue: 2 },
        valueToCheck: [0, 1, 2]
    });
});

test('IN filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IN,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: ['DoubleData', uuidv4()],
        valueToCheck: ['DoubleData']
    });
});

test('IS_EQUAL_CASE_INSENSITIVE filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IS_EQUAL_TO_CASE_INSENSITIVE,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'doubledata',
        valueToCheck: ['DoubleData']
    });
});

test('IS_GREATER_THAN filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IS_GREATER_THAN,
        elementToCheck: 'Num',
        expectedResults: 2,
        value: 1,
        valueToCheck: [2, 5]
    });
});

test('IS_GREATER_THAN_OR_EQUAL filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IS_GREATER_THAN_OR_EQUAL_TO,
        elementToCheck: 'Num',
        expectedResults: 2,
        value: 2,
        valueToCheck: [2, 5]
    });
});

test('IS_LESS_THAN filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IS_LESS_THAN,
        elementToCheck: 'Num',
        expectedResults: 3,
        value: 2,
        valueToCheck: [0, 1]
    });
});

test('IS_LESS_THAN_OR_EQUAL_TO filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IS_LESS_THAN_OR_EQUAL_TO,
        elementToCheck: 'Num',
        expectedResults: 4,
        value: 2,
        valueToCheck: [0, 1, 2]
    });
});

test('IS_NOT_EQUAL_TO filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IS_NOT_EQUAL_TO,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'DoubleData',
        valueToCheck: ['Test', 'Jest']
    });
});

test('IS_NOT_NULL filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IS_NOT_NULL,
        elementToCheck: 'Str2',
        expectedResults: 4,
        value: null,
        valueToCheck: ['Test', 'Jest', 'DoubleData']
    });
});

test('IS_NULL filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.IS_NULL,
        elementToCheck: 'Str2',
        expectedResults: 3,
        value: null,
        valueToCheck: [null]
    });
});

test('NOT_CONTAINS filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.NOT_CONTAINS,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'est',
        valueToCheck: ['DoubleData']
    });
});

test('NOT_CONTAINS_CASE_INSENSITIVE filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.NOT_CONTAINS_CASE_INSENSITIVE,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'eSt',
        valueToCheck: ['DoubleData']
    });
});

test('NOT_IN filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.NOT_IN,
        elementToCheck: 'Num',
        expectedResults: 2,
        value: [1, 2, 5],
        valueToCheck: [0]
    });
});

test('STARTS_WITH filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.STARTS_WITH,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'Doubl',
        valueToCheck: ['DoubleData']
    });
});

test('STARTS_WITH_CASE_INSENSITIVE filter', async () => {
    await prepareDataForFilter();
    await checkWorkingOperator({
        filterOperator: FilterOperator.STARTS_WITH_CASE_INSENSITIVE,
        elementToCheck: 'Str2',
        expectedResults: 2,
        value: 'doubl',
        valueToCheck: ['DoubleData']
    });
});


it('should throw IS_BETWEEN errors', async () => {
    await deleteAll();
    expect(() => strapi.findOne(tests).filter('id', FilterOperator.IS_BETWEEN, 5)).toThrow();
    expect(() => strapi.findAll(tests).filter('id', FilterOperator.IS_BETWEEN, 5)).toThrow();
});

test('StrapiFindAll.hideId', async () => {
    await deleteAll();
    await createRandomItems(2);

    const results = await strapi.findAll(tests).hideId().show<Test>();
    expect(results.data.length).toBe(2);
    results.data.forEach(el => {
        expect(el.id).toBeUndefined();
    });

});

test('StrapiFindAll.rename', async () => {
    await deleteAll();
    await createRandomItems(2);

    const results = await strapi.findAll(tests).rename('id', 'strapiId').show<{ strapiId: number, id?: number }>();
    expect(results.data.length).toBe(2);
    results.data.forEach(el => {
        expect(el.strapiId).not.toBeUndefined();
        expect(el.id).toBeUndefined();
    });
});


test('StrapiFindAll.and.or || StrapiFindAll.or.and', async () => {
    await deleteAll();

    const andOr = () => strapi.findAll(tests).and('Str', IS_EQUAL_TO, uuidv4()).or('Str', IS_EQUAL_TO, uuidv4());
    const orAnd = () => strapi.findAll(tests).or('Str', IS_EQUAL_TO, uuidv4()).and('Str', IS_EQUAL_TO, uuidv4());
    expect(andOr).toThrow();
    expect(orAnd).toThrow();
});

// Coverage tests
test('Strapi.create when / is appended', async () => {
    await deleteAll();

    const shouldNotThrow = () => {
        new StrapiHandler.default(strapiUrl + '/', apiKey).create(tests, {
            Num: 0
        })
    };

    expect(shouldNotThrow).not.toThrow();
});