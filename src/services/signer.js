import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";

let keyring;
let alicePair;

export async function createSigner(api) {
    await cryptoWaitReady();

    // Fallback на 42, если сеть не вернула SS58 формат
    const ss58 = api.registry.chainSS58 ?? 42;

    if (!keyring || keyring.ss58Format !== ss58) {
        keyring = new Keyring({
            type: "sr25519",
            ss58Format: ss58
        });
        // Создаём пару ОДИН раз и кешируем
        alicePair = keyring.addFromUri("//Alice");
    }

    return alicePair;
}