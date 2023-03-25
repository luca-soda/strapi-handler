import StrapiHandler = require('./StrapiHandler');
import uuidLib = require('uuid');
import axios from 'axios';
import { FilterOperator, SortDirection } from './Interfaces';
// import { FilterOperator, SortDirection } from './Interfaces';

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

test('StrapiFindOne.or', async () => {
    await deleteAll();
    const item = await createRandomItem();

    const result = await strapi.findOne(tests).filter('Str', IS_EQUAL_TO, uuidv4()).or('Str2', IS_EQUAL_TO, item.Str2).show<Test>();
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
    jest.spyOn(findOne,'generateUuid').mockReturnValueOnce('Str');
    const item = await createRandomItem();

    const result = await findOne.showOnlyId();
    expect(result).toBe(item.id);
});

test('StrapiFindOne.fields', async () => {
    await deleteAll();
    await createRandomItem();
    
    const result = await strapi.findOne(tests).fields(['Str','Str2']).show<Test>();
    expect(result).not.toBeNull();
    expect(typeof result!.Str).toBe('string');
    expect(typeof result!.Str2).toBe('string');
    expect(result!.Num).toBeUndefined();
})

// StrapiFindAl

test('StrapiFindAll.page', async () => {
    await deleteAll();
    await createRandomItems(25+4);

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
    items.sort((a,b) => b.Num! - a.Num!);

    let results = await strapi.findAll(tests).sort('Num',SortDirection.DESC).show<Test>();
    expect(results.data.length).toBe(items.length);
    for (let i = 0; i < items.length; i++) {
        expect(items[i]!.Num!).toBe(results.data[i]!.Num);
    }

    items.sort((a,b) => a.Num! - b.Num!);
    results = await strapi.findAll(tests).sort('Num',SortDirection.ASC).show<Test>();
    expect(results.data.length).toBe(items.length);
    for (let i = 0; i < items.length; i++) {
        expect(items[i]!.Num!).toBe(results.data[i]!.Num);
    }
});

test('StrapiFindAll.fields', async () => {
    await deleteAll();
    await createRandomItems(5);

    const results = await strapi.findAll(tests).fields(['Str','Str2']).show<Test>();
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

    let results = await strapi.findAll(tests).sort('Num',SortDirection.ASC).offsetStart(1).show<Test>();
    expect(results.data.length).toBe(2);
    expect(results.data[0]!.Num).toBe(items[1]!.Num);
    expect(results.data[1]!.Num).toBe(items[2]!.Num);

    results = await strapi.findAll(tests).sort('Num',SortDirection.ASC).offsetStart(1).offsetLimit(1).show<Test>();
    expect(results.data.length).toBe(1);
    expect(results.data[0]!.Num).toBe(items[1]!.Num);
});

//Mega test
test('Filter tested for everything', async () => {
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
            Str2: uuidv4(),
            Num: 2
        },
        {
            Str: uuidv4(),
            Num: 0
        },
        {
            Str: uuidv4(),
            Num: 5
        }
    ];
    await strapi.createMany(tests, items);

    let result2: Test | null;
    // Basic filter
    let result = await strapi.findAll(tests).filter('Num', IS_EQUAL_TO, 0).show<Test>();
    expect(result.data.length).toBe(2);
    expect(result.data[0]!.Num).toBe(0);
    expect(result.data[1]!.Num).toBe(0);

    // AND filter
    result = await strapi.findAll(tests).filter('Num', IS_EQUAL_TO, 0).and('Str', IS_EQUAL_TO, items[0]!.Str).show<Test>();
    expect(result.data.length).toBe(1);
    expect(result.data[0]!.Num).toBe(0);
    expect(result.data[0]!.Str).toBe(items[0]!.Str);

    // OR filter
    result = await strapi.findAll(tests).filter('Num', IS_EQUAL_TO, 0).or('Str', IS_EQUAL_TO, uuidv4()).show<Test>();
    expect(result.data.length).toBe(2);
    expect(result.data[0]!.Num).toBe(0);
    expect(result.data[1]!.Num).toBe(0);

    // All Filter Operator
    result = await strapi.findAll(tests).filter('Str2', FilterOperator.CONTAINS, 'est').show<Test>();
    result2 = await strapi.findOne(tests).filter('Str2', FilterOperator.CONTAINS, 'est').show<Test>();
    expect(result.data.length).toBe(2);
    expect(result.data[0]!.Str2).toBe('Test');
    expect(result.data[1]!.Str2).toBe('Jest');
    expect(result2).not.toBe(null);
    expect(result2!.Str2).toBe('Test');

    result = await strapi.findAll(tests).filter('Str2', FilterOperator.CONTAINS_CASE_INSENSITIVE, 'EST').show<Test>();
    result2 = await strapi.findOne(tests).filter('Str2', FilterOperator.CONTAINS_CASE_INSENSITIVE, 'EST').show<Test>();
    expect(result.data.length).toBe(2);
    expect(result.data[0]!.Str2).toBe('Test');
    expect(result.data[1]!.Str2).toBe('Jest');
    expect(result2).not.toBe(null);
    expect(result2!.Str2).toBe('Test');

    result = await strapi.findAll(tests).filter('Str2', FilterOperator.IN, ['Test','Jest',uuidv4()]).show<Test>();
    result2 = await strapi.findOne(tests).filter('Str2', FilterOperator.IN, ['Test','Jest',uuidv4()]).show<Test>();
    expect(result.data.length).toBe(2);
    expect(result.data[0]!.Str2).toBe('Test');
    expect(result.data[1]!.Str2).toBe('Jest');
    expect(result2).not.toBe(null);
    expect(result2!.Str2).toBe('Test');
});