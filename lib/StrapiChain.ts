import axios from "axios";
import { extractData } from "./StrapiHandler";

class StrapiChain {
    private url: string = '';
    private data: any = '';

    constructor(strapiUrl: string, entries: string, private readonly apiKey: string, private readonly call: Promise<{data: any}>, private readonly shouldHideId: boolean, private readonly shouldHideEverything: boolean) {
        call.then((obj: any) => {
            this.data = obj;
            this.url = `${strapiUrl.endsWith('/') ? strapiUrl : strapiUrl + '/'}api/${entries}/${obj?.id}`;
        })
    }

    public async delete<T>(): Promise<T | null> {
        await this.call;
        if (this.data?.id == null) {
            return null;
        }
        const { data } = await axios.delete(this.url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        })
        return extractData(data.data)[0];
    }

    public async put<T>(obj: any): Promise<T | null> {
        await this.call;
        if (this.data?.id == null) {
            return null;     
        }
        const { data } = await axios.put(this.url, {
            data: {
                ...obj
            }
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        return extractData(data.data)[0];
    }

    public async show<T>(): Promise<T | null> {
        await this.call;
        if (this.data?.id == null) {
            return null;
        }
        if (this.shouldHideId) {
            delete this.data.id;
        }
        if (this.shouldHideEverything) {
            return this.data.id;
        }
        return this.data;
    }
}

export default StrapiChain;