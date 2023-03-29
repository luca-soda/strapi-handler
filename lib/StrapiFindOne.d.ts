import { FilterOperator, OptionalParams } from "./Interfaces";
declare class StrapiFindOne {
    private readonly strapiUrl;
    private readonly entries;
    private readonly apiKey;
    private url;
    private fieldsCounter;
    private populateCounter;
    private filters;
    private logicalOperator;
    private andGroup;
    private orGroup;
    private shouldHideId;
    private shouldHideEverything;
    private renamer;
    private lastFilterPushed;
    constructor(strapiUrl: string, entries: string, apiKey: string);
    private offsetStart;
    private offsetLimit;
    private splitFields;
    private chain;
    hideId(): this;
    filter(field: string, operator: FilterOperator, value: any, optionalParams?: OptionalParams): StrapiFindOne;
    populate(field: string): StrapiFindOne;
    deepPopulate(field: string, subfield: string): StrapiFindOne;
    rename(field: string, target: string): this;
    field(field: string): StrapiFindOne;
    fields(fields: string[]): StrapiFindOne;
    generateUuid(): string;
    showOnlyId(): Promise<number | null>;
    show<T>(): Promise<T | null>;
    update<T>(obj: Partial<T>): Promise<T | null>;
    delete<T>(): Promise<T | null>;
    and(field: string, operator: FilterOperator, value: any, optionalParams?: OptionalParams): StrapiFindOne;
    or(field: string, operator: FilterOperator, value: any, optionalParams?: OptionalParams): StrapiFindOne;
    private call;
}
export default StrapiFindOne;
