import { FilterOperator, SortDirection, OptionalParams } from "./Interfaces";
declare class StrapiFindAll {
    private readonly apiKey;
    private url;
    private sortCounter;
    private fieldsCounter;
    private populateCounter;
    private filters;
    private logicalOperator;
    private andGroup;
    private orGroup;
    private isIdHidden;
    private isAllHidden;
    private renamer;
    private lastFilterPushed;
    constructor(strapiUrl: string, entries: string, apiKey: string);
    page(page: number): StrapiFindAll;
    populate(field: string): StrapiFindAll;
    deepPopulate(field: string, subfield: string): StrapiFindAll;
    sort(field: string, sortDirection?: SortDirection): StrapiFindAll;
    field(field: string): StrapiFindAll;
    fields(fields: string[]): StrapiFindAll;
    pageSize(pageSize: number): StrapiFindAll;
    offsetStart(start: number): StrapiFindAll;
    offsetLimit(limit: number): StrapiFindAll;
    filter(field: string, operator: FilterOperator, value: any, optionalParams?: OptionalParams): this;
    hideId(): StrapiFindAll;
    private splitFields;
    showOnlyIds(): Promise<{
        ids: number[];
        meta: any;
    }>;
    rename(field: string, target: string): StrapiFindAll;
    and(field: string, operator: FilterOperator, value: any, optionalParams?: OptionalParams): StrapiFindAll;
    or(field: string, operator: FilterOperator, value: any, optionalParams?: OptionalParams): StrapiFindAll;
    show<T>(): Promise<{
        data: T[];
        meta: any;
    }>;
    private call;
}
export default StrapiFindAll;
