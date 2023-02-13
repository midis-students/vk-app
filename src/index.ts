import fetch from 'node-fetch';
import fs from 'fs';
import { Place } from './types';

fetch("https://eda.yandex.ru/eats/v1/layout-constructor/v1/layout", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "ru",
    "content-type": "application/json;charset=UTF-8",
    "x-device-id": "1"
  },
  "body": "{\"region_id\":37,\"filters\":[]}",
  "method": "POST"
}).then(async data=>{
    let { data: { places_lists } }= await data.json()
    let places=[].concat.apply([], places_lists.filter(({template_name}: {template_name: string})=>template_name="PLACES_LIST_OPEN").map((e:any)=>e.payload.places))
    let list: Place[] = places.map((place: any)=>{
        let out: Place = {
            name: place?.name,
            photo_url: place?.media?.photos?.[0]?.uri
        }

        place?.data?.meta?.forEach((meta: any)=>{
            let {type, payload} = meta;
            switch (type) {
                case "rating":
                    out['rating']=payload.title
                case "price_category":
                    out['price_category']={
                        currency_sign: payload.currency_sign,
                        total_symbols: payload.total_symbols,
                        highlighted_symbols: payload.highlighted_symbols
                    }
            }
        })

        return out
    })
    fs.writeFileSync("data.json", JSON.stringify(list, null, 2));
});



/*


let wid = JSON.parse((await(await fetch("https://www.afisha.ru/chelyabinsk/")).text()).split("React.createElement(__desktopComponents.App,")[1].split('),document.getElementById("content")')[0]).model.Widgets;

[].concat.apply([], Object.keys(wid).filter(e=>e!="ThemeWidgets").map(key=>{
    return wid[key].Items
}).concat(wid.ThemeWidgets.map(e=>e.RcmSeoItems)))


*/