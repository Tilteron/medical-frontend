import { cryptoWaitReady } from "@polkadot/util-crypto";

let readyPromise;

export function initCrypto() {
    if (!readyPromise) {
        readyPromise = cryptoWaitReady();
    }
    return readyPromise;
}