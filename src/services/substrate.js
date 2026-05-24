import { getApi } from "../api/substrateClient.js";
import { createSigner } from "./signer.js";

export async function storeRecord(cidHex, keyHex) {
    const api = await getApi();
    const alice = await createSigner(api);
    const tx = api.tx.medicalRecords.storeRecord(cidHex, keyHex);

    return new Promise((resolve, reject) => {
        tx.signAndSend(alice, ({ status, events, dispatchError }) => {
            if (status.isInBlock || status.isFinalized) {
                if (dispatchError) {
                    const err = dispatchError.isModule
                        ? api.registry.findMetaError(dispatchError.asModule)
                        : dispatchError.toString();
                    return reject(new Error(`Tx failed: ${JSON.stringify(err)}`));
                }
                for (const { event } of events) {
                    if (event.section === "medicalRecords" && event.method === "RecordStored") {
                        return resolve(event.data.toJSON());
                    }
                }
                resolve(null);
            }
        }).catch(reject);
    });
}

export async function checkAccess(recordId, doctor) {
    const api = await getApi();
    const result = await api.query.medicalRecords.accessControl(recordId, doctor);
    return result.isSome;
}

export async function getRecord(recordId, doctorAddress) {
    const api = await getApi();
    const record = await api.query.medicalRecords.records(recordId);
    if (record.isNone) return null;

    const [owner, cid] = record.unwrap();
    const optKey = await api.query.medicalRecords.encryptedKeys(recordId, doctorAddress);

    // 🔥 БЕЗОПАСНОЕ ИЗВЛЕЧЕНИЕ: обрабатываем hex-строку от toJSON()
    let rawKeyBytes = null;
    if (optKey.isSome) {
        const val = optKey.unwrap();
        const json = val.toJSON();

        if (typeof json === 'string') {
            // Если toJSON() вернул hex-строку "0x..."
            const clean = json.startsWith('0x') ? json.slice(2) : json;
            if (clean.length > 0) {
                const bytes = clean.match(/.{1,2}/g);
                if (bytes) {
                    rawKeyBytes = new Uint8Array(bytes.map(b => parseInt(b, 16)));
                }
            }
        } else if (Array.isArray(json)) {
            // Если toJSON() вернул массив чисел [0-255]
            rawKeyBytes = new Uint8Array(json);
        }
    }

    return {
        owner: owner.toString(),
        cid: cid.toString(),
        encryptedKey: rawKeyBytes, // Теперь это Uint8Array(256)
    };
}

export async function grantAccess(recordId, user, encryptedKeyHex) {
    const api = await getApi();
    const alice = await createSigner(api);
    const tx = api.tx.medicalRecords.grantAccess(recordId, user, encryptedKeyHex);

    return new Promise((resolve, reject) => {
        tx.signAndSend(alice, ({ status, dispatchError }) => {
            if (status.isInBlock || status.isFinalized) {
                if (dispatchError) {
                    const err = dispatchError.isModule
                        ? api.registry.findMetaError(dispatchError.asModule)
                        : dispatchError.toString();
                    return reject(new Error(`Grant failed: ${JSON.stringify(err)}`));
                }
                resolve(true);
            }
        }).catch(reject);
    });
}