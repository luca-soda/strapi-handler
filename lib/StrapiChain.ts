import axios from "axios";
import { extractData } from "./StrapiHandler";

class StrapiChain {
    private url: string = '';
    private data: any = '';

    constructor(strapiUrl: string, entries: string, private readonly apiKey: string, private readonly call: Promise<{data: any}>) {
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

    public async show<T>(keys?: string | string[]): Promise<T | null> {
        await this.call;
        if (this.data?.id == null) {
            return null;
        }
        if (keys != null) {
            if (typeof keys === 'string') {
                return this.data[keys];
            }
            else {
                const obj: any = {};
                Object.keys(this.data).forEach((key) => {
                    if (keys!.includes(key)) {
                        obj[key] = this.data[key];
                    }
                });
                return obj;
            }
        }
        else {
            return extractData(this.data);
        }
    }
}

export default StrapiChain;