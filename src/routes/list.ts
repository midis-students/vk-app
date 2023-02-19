import { APIPlace, UpdateQuery } from "../types";
import fs from "fs";
import { FastifyPluginAsync } from "fastify";

export const autoPrefix = "/list";

async function getPlaceListItems(url: string): Promise<any> {
  return JSON.parse(
    (await (await fetch(url)).text())
      .split("React.createElement(__desktopComponents.App,")[1]
      .split('),document.getElementById("content")')[0]
  ).model.PlaceListWidget.Items.slice(0,5);
}

const knownTypes = ['Cinema', 'ConcertHall', 'Theatre', 'Museum', 'Gallery', 'ShowRoom', "Restaurant"]

const ListRoutes: FastifyPluginAsync = async (fastify) => {
  const {} = fastify;

  fastify.get<UpdateQuery>("/update", async (req, reply) => {
    if (req.query.t != process.env.UPDATE_TOKEN)
      throw fastify.httpErrors.forbidden("access denied");
    const edaResponse = await fetch(
      "https://eda.yandex.ru/eats/v1/layout-constructor/v1/layout",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "ru",
          "content-type": "application/json;charset=UTF-8",
          "x-device-id": `github/midis-students/vk-app/${req.headers["x-forwarded-for"]}`,
        },
        body: '{"region_id":37,"filters":[]}',
        method: "POST",
      }
    );

    let list: APIPlace[] = [].concat.apply(
      [],
      await Promise.all([
        getPlaceListItems(
          "https://www.afisha.ru/chelyabinsk/cinema/cinema_list/"
        ), // Кинотеатры
        getPlaceListItems("https://www.afisha.ru/chelyabinsk/concerthall/"), // Концертные залы
        getPlaceListItems(
          "https://www.afisha.ru/chelyabinsk/theatre/theatre_list/"
        ), // Театры
        getPlaceListItems("https://www.afisha.ru/chelyabinsk/museum/"), // Музеи
      ])
    ).filter(({Address, GeoPoint}: any)=>Address&&GeoPoint).map((data: any)=>{
      const {Logo1x1, Image16x9, Phones, Address, GeoPoint, Name, Type} = data;

      return {
        logo: Logo1x1?.Url ?? Image16x9?.Url ?? "https://s5.afisha.ru/mediastorage/27/bc/b31ac7676e324eeebd888e77bc27.jpg",
        phones: Phones ? Phones.map(({Number}: any)=>Number) : [],
        address: Address,
        geoPoint: GeoPoint ? [GeoPoint.Latitude, GeoPoint.Longitude] : [0,0],
        type: knownTypes.includes(Type) ? Type.toLowerCase() : "other",
        name: Name,
        price: Math.floor(Math.random() * 1000)
      }
      
    });



    if (edaResponse.ok) {
      let {
        data: { places_lists },
      } = await edaResponse.json();
      let places = [].concat
        .apply(
          [],
          places_lists
            .filter(
              ({ template_name }: { template_name: string }) =>
                (template_name = "PLACES_LIST_OPEN")
            )
            .map((e: any) => e.payload.places)
        )
        .slice(0, 5);

      let edaList: APIPlace[] = await Promise.all(
        places.map(async (place: any) => {
          let infoResponse: any = await fetch(
            `https://eda.yandex.ru/eats/v1/eats-catalog/v1/brand/${place.brand.slug}?regionId=37`,
            {
              headers: {
                accept: "application/json, text/plain, */*",
                "accept-language": "ru",
                "x-device-id": `github/midis-students/vk-app/${req.headers["x-forwarded-for"]}`,
              },
            }
          );

          let geoPoint: [number, number] = [0,0],
            address="";

          if (infoResponse.ok) {
            infoResponse = await infoResponse.json();
            const infoAddress = infoResponse?.payload?.foundPlace?.place;
            if (infoAddress) {
              let {
                address: {
                  location: { longitude, latitude },
                  short,
                },
              } = infoAddress;
              geoPoint = [
                latitude,
                longitude,
              ];
              address=short
            }
          }

          let menuResponse: any = await fetch(
            `https://eda.yandex.ru/api/v2/menu/retrieve/${place.slug}?regionId=37`,
            {
              headers: {
                accept: "application/json, text/plain, */*",
                "accept-language": "ru",
                "x-device-id": `github/midis-students/vk-app/${req.headers["x-forwarded-for"]}`,
              },
            }
          );

          let price = 0,
            menuData;

          if (menuResponse.ok) {
            menuData = await menuResponse.json();
            let menuPrices = menuData?.payload?.categories?.map(
              ({ items }: { items: any }) =>
                items.map(({ price }: { price: number }) => price)
            );
            if (menuPrices) {
              menuPrices = [].concat.apply([], menuPrices);
              if (menuPrices.length) {
                price = Math.floor(
                  menuPrices.reduce((a: number, b: number) => a + b) /
                    menuPrices.length
                );
              }
            }
          }

          let out: APIPlace = {
            logo: place?.media?.photos?.[0]?.uri ? "https://eda.yandex.ru" + place?.media?.photos?.[0]?.uri : "https://s5.afisha.ru/mediastorage/27/bc/b31ac7676e324eeebd888e77bc27.jpg",
            phones: [],
            address,
            geoPoint,
            type: "restaurant",
            name: place?.name??"Какой то ресторан",
            price,
          };

          return out;
        })
      )

      list=list.concat(edaList.filter(({geoPoint, address})=>address!=""&&geoPoint[0]!=0&&geoPoint[1]!=0));

      await fs.writeFileSync("./cache/list.json", JSON.stringify(list, null, 2));

      return {ok:true}
    } else {
      throw fastify.httpErrors.badRequest(`Eda: ${edaResponse.status}`);
    }
  });

  fastify.get("/", async (req, reply) => {
    return JSON.parse(fs.readFileSync("./cache/list.json", "utf-8"));
  });
};

export default ListRoutes;
