import { Place, PlaceLocation } from "../types";
import fs from "fs";
import { FastifyPluginAsync } from "fastify";

export const autoPrefix = "/eda";

const EdaRoutes: FastifyPluginAsync = async (fastify) => {
  const {} = fastify;

  fastify.get("/update", async (req, reply) => {
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
        .slice(0, 10);

      let list: Place[] = await Promise.all(
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

          let location: PlaceLocation = {
              geo: { latitude: 0, longitude: 0 },
              short: "Неизвестно",
            },
            rate = "Новый";

          if (infoResponse.ok) {
            infoResponse = await infoResponse.json();
            const infoAddress = infoResponse?.payload?.foundPlace?.place;
            if (infoAddress) {
              let {
                address: {
                  location: { longitude, latitude },
                  short,
                },
                rating,
              } = infoAddress;
              if (rating) rate = `${rating}`;
              location = {
                geo: {
                  latitude,
                  longitude,
                },
                short,
              };
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

          let out: Place = {
            id: place?.slug,
            brand: place?.brand?.slug,
            name: place?.name,
            photo_url: "https://eda.yandex.ru" + place?.media?.photos?.[0]?.uri,
            location,
            rating: rate,
            price,
          };

          return out;
        })
      );

      await fs.writeFileSync("./cache/eda.json", JSON.stringify(list, null, 2));

      return list;
    } else {
      throw fastify.httpErrors.badRequest(`Eda: ${edaResponse.status}`);
    }
  });

  fastify.get("/", async (req, reply) => {
    return JSON.parse(fs.readFileSync("./cache/eda.json", "utf-8"));
  });
};

export default EdaRoutes;
