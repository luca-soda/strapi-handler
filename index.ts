import { AxiosError } from "axios";
import { testData } from "./test";

(async() => {
    try {
        await testData();
    }
    catch (error) {
        if (error.isAxiosError) {
            const axiosError = error as AxiosError;
            console.log(axiosError.message);
            console.log(axiosError.request);
            console.log(axiosError.response);
        }
        else {
            console.log(error);
        }
    }
})()
