import { ApiPromise, WsProvider } from "@polkadot/api";

let api;

export async function getApi() {
    console.log("connecting websocket");

    const provider =
        new WsProvider("ws://127.0.0.1:9944");

    const api =
        await ApiPromise.create({ provider });

    console.log("connected websocket");

    return api;
}