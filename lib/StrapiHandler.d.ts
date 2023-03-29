import StrapiFindAll from "./StrapiFindAll";
import StrapiFindOne from "./StrapiFindOne";
declare class StrapiHandler {
    protected readonly strapiUrl: string;
    protected readonly apiKey: string;
    constructor(strapiUrl: string, apiKey: string);
    findAll(entries: string): StrapiFindAll;
    findOne(entries: string): StrapiFindOne;
    create<T>(collectionName: string, obj: Partial<T>): Promise<T>;
    createMany<T>(collectionName: string, objects: Partial<T>[]): Promise<T[]>;
}
declare const isStrapiResponse: (data: any) => any;
declare const extractData: (data: any) => any;
export default StrapiHandler;
export { isStrapiResponse, extractData };
