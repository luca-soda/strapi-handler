import axios from "axios";
import StrapiFindAll from "./StrapiFindAll";
import StrapiFindOne from "./StrapiFindOne";

class StrapiHandler {
    constructor(protected readonly strapiUrl: string, protected readonly apiKey: string) { }

    public findAll(entries: string) {
        return new StrapiFindAll(this.strapiUrl, entries, this.apiKey);
    }

    public findOne(entries: string) {
        return new StrapiFindOne(this.strapiUrl, entries, this.apiKey)
    }

    public async create<T>(collectionName: string, obj: Partial<T>): Promise<T> {
        const url = `${this.strapiUrl.endsWith('/') ? this.strapiUrl : this.strapiUrl + '/'}api/${collectionName}`;
        let _obj = {
            data: obj
        };
        let { data: { data } } = await axios.post(url, _obj, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        return extractData(data)[0];
    }

    public async createMany<T>(collectionName: string, objects: Partial<T>[]): Promise<T[]> {
        const results: T[] = [];
        for (let obj of objects) {
            results.push(await this.create(collectionName, obj))
        }
        return results;
    }
}

const isStrapiResponse = (data: any) => {
    return (data[0]?.id && data[0]?.attributes) || (data.id && data.attributes);
}

const extractData = (data: any) => {
    if (isStrapiResponse(data)) {
        if (data.length == null) {
            data = [data];
        }
        let result = data.map((d: any) => ({
            id: d.id,
            ...d.attributes
        }));
        for (let i = 0; i < result.length; i++) {
            const r = result[i];
            const keys = Object.keys(r);
            for (let key of keys) {
                if (r[key]?.data) {
                    r[key] = extractData(r[key].data);
                }
            }
        }
        return result;
    }
    else {
        return data;
    }
}

export default StrapiHandler;
export { isStrapiResponse, extractData };