import { FilterOperator } from "./lib/Interfaces";
import StrapiHandler from "./lib/StrapiHandler";

interface Nft {
    id: number;
    metadata: string;
}

const apiKey = '37a9dca00ffbd809de068adf97ae7b4bcc0b78a3102798fd393d7126da8984fbf563e6ebf6e507e3fc93970b9971ecee6175096e85523169d6feea6f89d2d15ccafcf6ad4e7adcab5c99c6146e959a4106e92c619933a050d558f692afaf2a703ad55c151ebf90485fab1e7a61f035b722177cec37f9037ee3292d8e2c1a160b';
const strapiHandler = new StrapiHandler('http://127.0.0.1:1337', apiKey);

const testData = async () => {
    console.log(await strapiHandler.create('nfts', {
        metadata: 'ToBeChangedToProva'
    }));
    const id = await strapiHandler.findOne('nfts').filter('metadata', FilterOperator.EQUAL_TO, 'ToBeChangedToProva').chain().show<number>('id');
    console.log(id);
    console.log(await strapiHandler.findOne('nfts').filter('id',FilterOperator.EQUAL_TO, id).chain().put<Nft>({
        metadata: 'Prova'
    }));
    console.log(await strapiHandler.findOne('nfts').filter('id',FilterOperator.EQUAL_TO, id).chain().show());
    console.log(await strapiHandler.findOne('nfts').filter('id', FilterOperator.EQUAL_TO, id).chain().delete());
    console.log(await strapiHandler.findOne('nfts').filter('id',FilterOperator.EQUAL_TO, id).chain().show('id'));
    // return strapiHandler
    //                 .findAll('nfts')
    //                 .filter('id', FilterOperator.EQUAL_TO, 14)
    //                 // .or('metadata', FilterOperator.CONTAINS_CASE_INSENSITIVE, 'a')
    //                 // .or('metadata', FilterOperator.CONTAINS_CASE_INSENSITIVE, 'd')
    //                 // .or('metadata', FilterOperator.CONTAINS, 'm')
    //                 .call<Nft>()
    
}

export { testData };