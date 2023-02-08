import fetch from 'node-fetch';
import fs from 'fs';

interface MetaRating extends Meta {
    title: string
}

interface MetaPriceCategory extends Meta {
    currency_sign: string;
    total_symbols: number;
    highlighted_symbols: number;
}

interface Meta {
    type: "rating" | "price_category"
}

type Place = {
    name: string;
    photo_url: string;
    type: string; // "restaurant"
    logo: [
        {
            theme: "dark" | "light";
            value: [
                {
                    size: "small" | "medium" | "large";
                    logo_url: string;
                }
            ]
        }
    ]
    meta: [
        Meta
    ]
}

fetch("https://eda.yandex.ru/eats/v1/layout-constructor/v1/layout", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "ru",
    "content-type": "application/json;charset=UTF-8",
    "x-device-id": "ldvid03l-fq0dfbm3c0g-uhs8vz3xz1n-xhyqv2o41"
  },
  "body": "{\"region_id\":37,\"filters\":[]}",
  "method": "POST"
}).then(async data=>{
    let { data: {places_lists: [{payload: {places}}, _]} } = await data.json()
    let list: Place[] = places.map((place: any)=>{
        return {
            name: place?.name,
            photo_url: place?.media?.photos?.[0]?.uri,
            type: place?.brand?.business,
            logo: place?.data?.features?.logo,
            meta: place?.meta?.map((meta: any)=>{
                let {type} = meta;
                switch (type) {
                    case "rating":
                        return {
                            type,
                            title: meta.payload.title
                        }
                    case "price_category":
                        return {
                            type,
                            currency_sign: meta.payload.currency_sign,
                            total_symbols: meta.payload.total_symbols,
                            highlighted_symbols: meta.payload.highlighted_symbols
                        }
                }
            })
        }
    })
    fs.writeFileSync("data.json", JSON.stringify(list));
});