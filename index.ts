import { Filter, FilterOperator, OptionalParams, SortDirection } from "./lib/Interfaces";
import StrapiHandler from "./lib/StrapiHandler";


const strapiUrl = 'http://127.0.0.1:7125'
const apiKey = '37a9dca00ffbd809de068adf97ae7b4bcc0b78a3102798fd393d7126da8984fbf563e6ebf6e507e3fc93970b9971ecee6175096e85523169d6feea6f89d2d15ccafcf6ad4e7adcab5c99c6146e959a4106e92c619933a050d558f692afaf2a703ad55c151ebf90485fab1e7a61f035b722177cec37f9037ee3292d8e2c1a160b';

export default StrapiHandler;
export { FilterOperator, OptionalParams, SortDirection, Filter }