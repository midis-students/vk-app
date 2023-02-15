import fetch from 'node-fetch';
import fs from 'fs';
import { Place } from './types';
import Fastify from 'fastify';
import App from './app';

async function start() {
  const fastify = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname,reqId,res",
        },
      },
    },
    disableRequestLogging: true,
  });
  
  await fastify.register(App);

  const port = Number(process.env.PORT) || 10000;
  const host = "0.0.0.0";

  fastify.listen({ port, host }, (err) => {
    if (err) throw err;
  });
}
  
start().catch((err) => {
    console.error(err);
    process.exit(1);
});

/*


let wid = JSON.parse((await(await fetch("https://www.afisha.ru/chelyabinsk/")).text()).split("React.createElement(__desktopComponents.App,")[1].split('),document.getElementById("content")')[0]).model.Widgets;

[].concat.apply([], Object.keys(wid).filter(e=>e!="ThemeWidgets").map(key=>{
    return wid[key].Items
}).concat(wid.ThemeWidgets.map(e=>e.RcmSeoItems)))


*/