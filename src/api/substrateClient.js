import { ApiPromise, WsProvider } from "@polkadot/api";

let api;

export async function getApi() {
    if (api) return api;

    const provider = new WsProvider("ws://127.0.0.1:9944");
    api = await ApiPromise.create({ provider });

    await api.isReady;
    return api;
}