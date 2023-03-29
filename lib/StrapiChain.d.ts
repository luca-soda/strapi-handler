declare class StrapiChain {
    private readonly apiKey;
    private readonly call;
    private readonly shouldHideId;
    private readonly shouldHideEverything;
    private url;
    private data;
    constructor(strapiUrl: string, entries: string, apiKey: string, call: Promise<{
        data: any;
    }>, shouldHideId: boolean, shouldHideEverything: boolean);
    delete<T>(): Promise<T | null>;
    put<T>(obj: any): Promise<T | null>;
    show<T>(): Promise<T | null>;
}
export default StrapiChain;
