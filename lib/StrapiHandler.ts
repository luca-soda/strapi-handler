import axios from "axios";
import StrapiGet from "./StrapiGet";

class StrapiHandler {
    constructor(protected readonly strapiUrl: string, protected readonly apiKey: string) { }

    public findAll(entries: string) {
        return new StrapiGet(this.strapiUrl, entries, this.apiKey);
    }

    public async create(collectionName: string, obj: any) {
        const url = `${this.strapiUrl.endsWith('/') ? this.strapiUrl : this.strapiUrl + '/'}api/${collectionName}`;
        obj = {
            data: obj
        };
        let { data: { data, meta } } = await axios.post(url, obj, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        return {
            data: extractData(data),
            meta   
        }
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
                if (r[key].data) {
                    r[key] = extractData(r[key].data);
                }
                if (r[key].data === null) {
                    r[key] = []
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