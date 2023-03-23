import { AxiosError } from "axios";
import * as utl from 'node:util';
import {getStrapiData, postStrapiData} from "./getStrapiData";

(async() => {
    try {
        await postStrapiData();
        const nfts = await getStrapiData();
        console.log(utl.inspect(nfts, {colors:true, depth: 10}));
    }
    catch (error) {
        if (error.isAxiosError) {
            const axiosError = error as AxiosError;
            console.log(axiosError.message)
        }
        else {
            console.log(error);
        }
    }
})()
