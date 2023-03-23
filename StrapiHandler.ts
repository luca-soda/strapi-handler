import axios from "axios";

class StrapiHandler {
    constructor(private readonly strapiUrl: string, private readonly apiKey: string) { }

    public get(entries: string) {
        return new StrapiGet(this.strapiUrl, entries, this.apiKey);
    }


}

interface GetSortDirection {
    asc: () => StrapiGet,
    desc: () => StrapiGet
}

class StrapiGet {
    private url: string;
    private sortCounter = 0;
    private fieldsCounter = 0;
    private sorting = false;

    constructor(baseUrl: string, entries: string, private readonly apiKey: string) {
        this.url = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}api/${entries}?`;
    }

    public page(page: number): StrapiGet {
        this.url += `&pagination[page]=${page}`;
        return this;
    }

    public populate(field: string): StrapiGet {
        this.url += `&populate=${field}`;
        return this;
    }

    public sort(field: string): GetSortDirection {
        this.url += `&sort[${this.sortCounter++}]=${field}`;
        this.sorting = true;
        return this as GetSortDirection;
    }

    public asc(): StrapiGet {
        if (!this.sorting) {
            console.error('You are setting ASC without SORT, there is probably an error in your query')
        }
        else {
            this.sorting = false;
            this.url += ':asc';
        }
        return this;
    }

    public desc(): StrapiGet {
        if (!this.sorting) {
            console.error('You are setting DESC without SORT, there is probably an error in your query')
        }
        else {
            this.sorting = false;
            this.url += ':desc';
        }
        return this;
    }

    public field(field: string): StrapiGet {
        this.url += `&fields[${this.fieldsCounter++}]=${field}`;
        return this;
    }

    public pageSize(pageSize: number): StrapiGet {
        this.url += `&pagination[pageSize]=${pageSize}`
        return this;
    }

    public offsetStart(start: number): StrapiGet {
        this.url += `&pagination[start]=${start}`;
        return this;
    }

    public offsetLimit(limit: number): StrapiGet {
        this.url += `&pagination[limit]=${limit}`;
        return this;
    }

    public withCount(shouldCount: boolean): StrapiGet {
        this.url += `&pagination[withCount]=${shouldCount}`;
        return this;
    }

    public async call<T>(): Promise<{ data: T[], meta: any }> {
        console.log(this.url);
        let { data: { data, meta } } = await axios.get(this.url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        const result = extractData(data);
        return {
            data: result,
            meta
        };
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