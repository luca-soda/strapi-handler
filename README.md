# Strapi-Handler

## What is Strapi?
> Strapi is the leading open-source headless CMS. It’s 100% JavaScript and fully customizable.

Strapi provides a convenient way to manage database calls through a REST API system, abstracting from the database itself. This is a dream come true for every developer, but...

## The problem
The URLs required to compose certain types of queries can quickly become a nightmare for a developer. Strapi-Handler was created for this very reason.

## The solution
Strapi-Handler can handle every REST call for Collections (not single types though) you will ever need! With simple method chaining, you can create your perfect query in just a few seconds and in a clearly readable manner!

Strapi-Handler even __normalize Strapi answers__

## How do I use it?

1. Install the library using 

```bash
npm i @sahareth/strapi-handler
```

2. Import Strapi-Handler in your code
```typescript
import StrapiHandler from '@sahareth/strapi-handler';
```

3. Create the StrapiHandler class
```typescript
const strapi = new StrapiHandler(strapiUrl, apiKey);
```

4. Start using it! 

## Example Query

To retrieve every dog of the collection 'Dogs' with a weight greater or equal to 10

```typescript
const strapi = new StrapiHandler(strapiUrl, apiKey);
const dogs = await strapi.findAll('Dogs').filter('Weight', FilterOperator.IS_GREATER_THAN_OR_EQUAL_TO, 10).show<Dog>();
```

All operator are chainable but .and() and .or(). The library does not support complex query yet (group of and, or).

## Exposed Methods

Once you have the StrapiHandler class, you will have four methods exposed:
* create
* createMany → Warning: it does N query, where N is the number of the array length passed
* findAll
* findOne

If you need to delete or update a record, first find it with "findOne" then chain apposite method.
For example, to delete the __first__ record of a dog called Carlo you can:
```typescript
const strapi = new StrapiHandler(strapiUrl, apiKey);
const dog = await strapi.findOne('Dogs').filter('Name', FilterOperator.IS_EQUAL_TO, 'Carlo').delete<Dog>();
```

## Normalizing Strapi Answer
Strapi has an unconventional way of returning objects; in Strapi-Handler, this has been normalized for a more consistent experience.
Specifically:
* findAll always returns an array, even when the element is one
* findOne returns or the element found on null
* attributes field has been removed and the attributes are now spread near the id

If you logically expect a single object (update, create, findOne), you will have one.
If you logically expect an array (findAll, createMany), you will have one.
The single object can be null in some cases, the array won't be null in any case, at most empty

## Tests

The library is fully tested E2E, with a 100% coverage. To test it, clone the repository, change the branch to test-ready, and do a yarn command in the Strapi folder inside the repository.

Then you can execute:
```bash
yarn test:prep
```
and
```bash
yarn test
```
