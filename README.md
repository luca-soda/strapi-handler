# Strapi-Handler

# What is Strapi?

> Strapi is a leading open-source headless Content Management System (CMS) that offers a fully customizable, 100% JavaScript-based solution for developers. It revolutionizes the way database calls are managed by utilizing a REST API system, providing a layer of abstraction from the database itself. Strapi makes developers' lives easier by offering a powerful and flexible CMS experience.
> 

# The Challenge

However, composing certain types of queries with Strapi can be cumbersome and time-consuming. The complexity of URLs required for these queries can quickly become a developer's worst nightmare, resulting in a less efficient workflow and increased development time.

# Introducing Strapi-Handler

To address this challenge, Strapi-Handler was developed as a comprehensive solution to streamline REST calls for Collections (excluding single types) in Strapi. By employing simple method chaining, developers can now craft the perfect query within seconds and maintain a clear, readable structure for their code.

## Key Features of Strapi-Handler

1. Simplified REST calls: Strapi-Handler simplifies the process of making REST calls for Collections, allowing developers to focus on creating feature-rich applications without the hassle of managing complex URLs.
2. Method chaining: With Strapi-Handler's intuitive method chaining, developers can easily create queries by chaining together various methods, resulting in clean and organized code.
3. Normalized responses: Strapi-Handler goes the extra mile by normalizing Strapi's responses, ensuring a consistent format and structure for the data received.
4. Enhanced readability: By employing method chaining and normalizing responses, Strapi-Handler significantly improves the readability of your code, making it easier for developers to understand, maintain, and collaborate on projects.

Strapi-Handler is an invaluable tool for developers working with Strapi, as it simplifies and optimizes the process of crafting REST calls for Collections. Its approach to method chaining and response normalization results in clean, readable code, ultimately leading to faster development times and increased productivity. Embrace the power of Strapi-Handler and revolutionize your headless CMS experience today.

# Importing Strapi-Handler

```tsx
import StrapiHandler from '@sahareth/strapi-handler';
```

# Defining a StrapiHandler class

```tsx
const strapiUrl = 'YOUR_STRAPI_URL';
const apiKey = 'YOUR_API_KEY';

const strapi = new StrapiHandler(strapiUrl, apiKey);
```

# StrapiHandler instance

At this point you have four methods exposed in the StrapiHandler instance, which are:

## StrapiHandler.create

```tsx
public async create<T>(collectionName: string, obj: Partial<T>): Promise<T>
```

### It accepts

| Parameter | Meaning |
| --- | --- |
| T | An optional parameter that specify of which type should be the returned object. Highly recommended |
| collectioName | The “plural” name of the collection to create |
| obj | The object to create. It should a partial* of type T. Do NOT se the the id manually. |

*See on the “Types” paragraph why is this a partial.

### It returns

The object created on Strapi. It should be equal beside the id.

## StrapiHandler.createMany

```tsx
public async createMany<T>(collectionName: string, objects: Partial<T>[]): Promise<T[]>
```

### It accepts

| Parameter | Meaning |
| --- | --- |
| T | An optional parameter that specify of which type should be the returned array of objects. Highly recommended |
| collectioName | The “plural” name of the collection to create |
| obj | An array of objects to create. It should a partial* of type T. Do NOT se the the id manually. |

*See on the “Types” paragraph why is this a partial.

### It returns

An array of objects created on Strapi. They should be equivalent beside the id.

### Note

This call N times the Strapi endpoint, since the bulk create is not implemented yet.

## StrapiHandler.findOne

### It accepts

| Parameter | Meaning |
| --- | --- |
| entries | The “plural” name of the collection to create |

### It returns

A class of type StrapiFindOne.

You don’t need to know anything about StrapiFindOne beside its methods, that are the core of the package.

## StrapiFindOne

It has a series all methods, almost all of them* can be chained, here exhaustive list:

 

| Name | Effect | Strapi Equivalent |
| --- | --- | --- |
| offsetStart | Set the pagination start | pagination[start]=value |
| offsetLimit | Set the pagination limit | pagination[limit]=value |
| hideId | Hide the id from the response object | No equivalent, new feature |
| populate | Populate the first level of a relationship. | populate=field |
| deepPopulate | Populate the second level of a relationship. | populate[field][populate][0]=field2 |
| rename | Rename an field with another name. Acts after every other operator | No equivalent, new feature |
| field | Specify which field to select. If there are more than once, chain this method multiple times or use “fields” | field[0]=value |
| fields | Specify which fields to select. | field[0]=value&field[1]=value […] |
| hideId | Hide the id in the response | No equivalent, new feature |
| generateUuid | Generate an Uuid v4. Should be useless for normal functionality of the library | No equivalent. Useless for the end-user |
| filter | Create a filter. Check the apposite chapter | filters[filter]=value |
| and | Chain the previous “and” or “filter” to use the AND logic operator. Works like the filter. Can’t be chained with or | Equivalent of appending [$and][group] in the filter section |
| or | Chain the previous “or” or “filter” to use the OR logic operator. Works like the filter. Can’t be chained with and | Equivalent of appending [$or][group] in the filter section |
| showOnlyId | A chain terminator that returns only the id (or null, if not found). It’s optimised** to return only the id  | Equivalent of making the GET and parsing the object |
| show | A chain terminator that returns the full object (or the filtered and renamed one) | Equivalent of making the GET call and parsing the object |
| update | A chain terminator that update the object found | Equivalent of making the GET call, and a PUT with the id found |
| delete | A chain terminator that delete the object found | Equivalent of making the GET call, and a DELETE with the id found |

*And and Or can’t be chained ****************together**************** at the moment. You must use filters and group of Strapi.

** Since there is not a way to return only an id in Strapi, it search for a random field and remove it from the selected list

### Note

There is not the possibility of passing an id that is already in the application, thus avoiding the GET call. It will implemented soon.

# StrapiHandler.findAll

### It accepts

| Parameter | Meaning |
| --- | --- |
| entries | The “plural” name of the collection to create |

### It returns

A class of type StrapiFindAll.

You don’t need to know anything about StrapiFindAll beside its methods, that are the core of the package.

| Name | Effect | Strapi Equivalent |
| --- | --- | --- |
| offsetStart | Set the pagination start | pagination[start]=value |
| offsetLimit | Set the pagination limit | pagination[limit]=value |
| hideId | Hide the id from the response object | No equivalent, new feature |
| populate | Populate the first level of a relationship. Strapi does support a two-level deep populate, but that’s not implemented yet. | populate=field |
| deepPopulate | Populate the second level of a relationship. | populate[field][populate][0]=field2 |
| sort | Sort the request by a parameter | sort[counter]=field |
| page | Set the page to request for the next request | pagination[page]=value |
| pageSize | Set the pageSize of the next request | pagination[pageSize]=value |
| rename | Rename an field with another name. Acts after every other operator | No equivalent, new feature |
| field | Specify which field to select. If there are more than once, chain this method multiple times or use “fields” | field[0]=value |
| fields | Specify which fields to select. | field[0]=value&field[1]=value […] |
| filter | Create a filter. Check the apposite chapter | filters[filter]=value |
| and | Chain the previous “and” or “filter” to use the AND logic operator. Works like the filter. Can’t be chained with or | Equivalent of appending [$and][group] in the filter section |
| or | Chain the previous “or” or “filter” to use the OR logic operator. Works like the filter. Can’t be chained with and | Equivalent of appending [$or][group] in the filter section |
| showOnlyIds | A chain terminator that returns only the ids. It’s optimised** to return only the id  | Equivalent of making the GET and parsing the object |
| show | A chain terminator that returns the full object (or the filtered and renamed one) | Equivalent of making the GET call and parsing the object |

*And and Or can’t be chained ****************together**************** at the moment. You must use filters and group of Strapi.

** Since there is not a way to return only an id in Strapi, it search for a random field and remove it from the selected list

# Filters

The filter accepts three (or four, in some cases) parameters. The most important one is the filter itself, that list of these filters can be imported from the /lib/Interfaces.ts of the package.

```tsx
export enum FilterOperator {
    IS_EQUAL_TO = '$eq',
    IS_EQUAL_TO_CASE_INSENSITIVE  = '$eqi',
    IS_NOT_EQUAL_TO = '$ne',
    IS_LESS_THAN = '$lt',
    IS_LESS_THAN_OR_EQUAL_TO = '$lte',
    IS_GREATER_THAN = '$gt',
    IS_GREATER_THAN_OR_EQUAL_TO = '$gte',
    IN = '$in',
    NOT_IN = '$notIn',
    CONTAINS = '$contains',
    NOT_CONTAINS = '$notContains',
    CONTAINS_CASE_INSENSITIVE = '$containsi',
    NOT_CONTAINS_CASE_INSENSITIVE = '$notContainsi',
    IS_NULL = '$null',
    IS_NOT_NULL = '$notNull',
    IS_BETWEEN = '$between',
    STARTS_WITH = '$startsWith',
    STARTS_WITH_CASE_INSENSITIVE = '$startsWithi',
}
```

# Complex Filters
The complex filters are... quite complex to be honest and they are not documented yet by Strapi. The strapi group has been implemented 1:1, you can find information on how to do complex query here: https://forum.strapi.io/t/advanced-api-filter-combining-and-and-or/24375
Here is an example of a complex query
```tsx
await strapi.findAll(tests)
                     .filter('Num', IS_EQUAL_TO, 0, { andGroup: 0, orGroup: 0 })
                     .filter('Str2', IS_EQUAL_TO, 'Test', {andGroup: 1, orGroup: 0})
                     .filter('Num', IS_EQUAL_TO, 5, { andGroup: 2, orGroup: 1})
                     .filter('Str', FilterOperator.IS_NOT_EQUAL_TO, uuidv4(), { andGroup: 3, orGroup: 1})
                     .show<Test>();
```

That example means - Search all values that have:
```tsx
(Num === 0 && Str2 === 'Test') || (Num === 5 && Str !== uuidv4())
```

# Types and normalisation

The idea behind the return value of Strapi-Handler methods is to have the cleanest representation of the data or directly what is desired to be used from the database. Imagining a database structure of a Dog with a name that is a string and a weight that is an integer, the Strapi response to a GET with axios to that resource would be:

```jsx
data: {
  data: {
    id: 0,
    attributes: {
      name: "Carlo",
      weight: 5
    }
  }
  metadata: {...}
}
```

That’s a lot different from our resource and you need to extract some data!

With the following line

```tsx
const dog = await strapi.findOne('Dogs').filter('id', IS_EQUAL_TO, 0).show<Dog>(); // Where Strapi is a StrapiHandler up

//WARNING! Dog CAN be null (if not found)
```

the result will be

```jsx
{
  id: 0,
  name: "Carlo",
  weight: 5
}
```

a lot simpler!

Additionally, with the "rename" method and the "hideId" method, the response can be modified in such a way that it fits into one's own TypeScript interface.

Again, the idea is not to necessarily modify the incoming object.

With a findAll, the answer will be similar

```jsx
const { data, metadata } = await strapi.findAll('Dogs').filter('weight', IS_LESS_THAN_OR_EQUAL_TO, 5).show<Dog>();
```

data will be

```jsx
[
  {
    id: 0,
    name: "Carlo",
    weight: 5
  },
  {
    id: 1,
    name: "Oliver",
    weight: 2
  }
]
```

A nice array of our interface instead of (deconstructing axios data)

```typescript
{
  data: [
    {
      id: 0,
        attributes: {
          name: "Carlo",
          weight: 5
        }
    },
    id: {
      id: 1,
      attributes: {
        name: "Oliver",
        weight: 2
      }
    }
  ]
  metadata: {...}
}
```

It’s even nicer with the nested relationship, but the mechanism is the same!

## Tests

The library is fully tested E2E, with a 100% coverage. To test it, clone the repository, change the branch to test-ready, and do a yarn command in the Strapi folder inside the repository.

Then you can execute:

```bash
yarn test:prep
```

```bash
yarn test
```
