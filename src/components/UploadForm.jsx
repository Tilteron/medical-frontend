import { useState, useEffect } from "react";
import { uploadToIpfs } from "../ipfs/ipfs.js";
import { grantAccess, storeRecord } from "../services/substrate.js";
import { generateAESKey, encryptFile } from "../crypto/aes";
import { encryptAESKeyWithDoctorPublicKey, importKeyPair } from "../crypto/rsa";

function uint8ArrayToHex(bytes) {
    return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function UploadForm() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState("bob");
    const [doctors, setDoctors] = useState({ bob: null, charlie: null });

    // Загрузка ключей из localStorage при старте
    useEffect(() => {
        (async () => {
            const loadOrGenerate = async (keyName) => {
                const stored = localStorage.getItem(keyName);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    return await importKeyPair(parsed.publicKey, parsed.privateKey);
                }
                const { generateDoctorKeyPair, exportKeyPair } = await import("../crypto/rsa");
                const pair = await generateDoctorKeyPair();
                const exported = await exportKeyPair(pair);
                localStorage.setItem(keyName, JSON.stringify(exported));
                return pair;
            };

            const bob = await loadOrGenerate("doctor_bob_keys");
            const charlie = await loadOrGenerate("doctor_charlie_keys");

            setDoctors({
                bob: { address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", publicKey: bob.publicKey },
                charlie: { address: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y", publicKey: charlie.publicKey },
            });
        })();
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const aesKey = generateAESKey();

            // encryptFile теперь возвращает единый Uint8Array (IV + ciphertext)
            const combinedData = await encryptFile(file, aesKey);

            const { cid } = await uploadToIpfs(combinedData);

            const doctor = doctors[selectedDoctor];
            if (!doctor) throw new Error("Doctor not ready");

            const encryptedKey = await encryptAESKeyWithDoctorPublicKey(aesKey, doctor.publicKey);
            if (encryptedKey.length !== 256) throw new Error(`Invalid RSA key length: ${encryptedKey.length}`);

            const cidHex = uint8ArrayToHex(new TextEncoder().encode(cid));
            const keyHex = uint8ArrayToHex(encryptedKey);

            const txResult = await storeRecord(cidHex, keyHex);
            if (!Array.isArray(txResult) || txResult.length < 2) throw new Error("No recordId in tx");

            const recordId = txResult[1];
            await grantAccess(recordId.toString(), doctor.address, keyHex);

            setResult({ cid, recordId: recordId.toString() });
        } catch (e) {
            console.error("❌ Upload failed:", e);
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Upload X-Ray</h2>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
                <option value="bob">Bob</option><option value="charlie">Charlie</option>
            </select>
            <button onClick={handleUpload} disabled={!file || loading}>{loading ? "Uploading..." : "Upload"}</button>
            {result && <div style={{ marginTop: 10 }}><p>CID: {result.cid}</p><p>Record ID: {result.recordId}</p></div>}
        </div>
    );
}