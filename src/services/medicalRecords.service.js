import { getApi } from "../api/substrateClient";
import { getAlice } from "../api/keyring";
import { toU8a } from "../crypto/keys";

export async function storeRecord(cid, encryptedKey) {
    const api = await getApi();
    const signer = await getAlice();

    const cidBytes = toU8a(cid);
    const keyBytes = toU8a(encryptedKey);

    const tx = api.tx.medicalRecords.storeRecord(
        cidBytes,
        keyBytes
    );

    return new Promise((resolve, reject) => {
        tx.signAndSend(signer, ({ status, events }) => {
            if (!status.isInBlock && !status.isFinalized) return;

            for (const { event } of events) {
                if (
                    event.section === "medicalRecords" &&
                    event.method === "RecordStored"
                ) {
                    resolve(event.data.toJSON());
                    return;
                }
            }
        }).catch(reject);
    });
}