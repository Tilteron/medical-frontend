import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";

let keyring;
let alice;

export async function getAlice() {
    await cryptoWaitReady();

    if (!keyring) {
        keyring = new Keyring({ type: "sr25519", ss58Format: 42 });
        alice = keyring.addFromUri("//Alice");
    }

    return alice;
}