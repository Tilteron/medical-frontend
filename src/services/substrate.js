export async function storeRecord(cid, key) {
    console.log("storeRecord", cid, key);

    await new Promise(r => setTimeout(r, 500));

    return Math.floor(Math.random() * 100);
}
import { getApi } from "./polkadot";
import { u8aToString } from "@polkadot/util";

export async function checkAccess(recordId, doctor) {
    console.log("checkAccess start");

    const api = await getApi();

    console.log("api connected");

    const result =
        await api.query.medicalRecords.accessControl(
            recordId,
            doctor
        );

    console.log("result =", result.toHuman());

    return result.isSome;
}

export async function getRecord(recordId) {
    const api = await getApi();

    const result =
        await api.query.medicalRecords.records(
            recordId
        );

    if (result.isNone) {
        return null;
    }

    const data = result.unwrap();

    const owner = data[0].toString();

    // cid хранится как Vec<u8>
    const cid = u8aToString(data[1].toU8a());

    return {
        owner,
        cid,
    };
}
