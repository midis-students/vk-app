import fs from "fs";
import { FastifyPluginAsync } from "fastify";
import { UpdateQuery } from "../types";

export const autoPrefix = "/afisha";

async function getPlaceListItems(url: string): Promise<any> {
  return JSON.parse(
    (await (await fetch(url)).text())
      .split("React.createElement(__desktopComponents.App,")[1]
      .split('),document.getElementById("content")')[0]
  ).model.PlaceListWidget.Items;
}

const AfishaRoutes: FastifyPluginAsync = async (fastify) => {
  const {} = fastify;

  fastify.get<UpdateQuery>("/update", async (req, reply) => {
    if (req.query.t != process.env.UPDATE_TOKEN)
      throw fastify.httpErrors.forbidden("access denied");
    let out: any = [].concat.apply(
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
    );

    fs.writeFileSync(
      "cache/kino.json",
      JSON.stringify([].concat.apply([], out))
    );
  });

  fastify.get("/", async (req, reply) => {
    return JSON.parse(fs.readFileSync("./cache/kino.json", "utf-8"));
  });
};

export default AfishaRoutes;
