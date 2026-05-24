import { useState, useEffect } from "react";
import { checkAccess, getRecord } from "../services/substrate.js";
import { decryptAESKey, importKeyPair } from "../crypto/rsa";
import { decryptFile } from "../crypto/aes.js";

function hexToUtf8String(hex) {
    if (!hex || hex === '0x') return '';
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    return new TextDecoder().decode(new Uint8Array(clean.match(/.{1,2}/g).map(b => parseInt(b, 16))));
}

export default function DoctorView() {
    const [recordId, setRecordId] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [doctorKeys, setDoctorKeys] = useState({});

    const doctors = {
        Bob: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        Charlie: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
    };
    const [selectedDoctor, setSelectedDoctor] = useState("Bob");

    // Загрузка тех же ключей из localStorage
    useEffect(() => {
        (async () => {
            const loadKeys = async (keyName) => {
                const stored = localStorage.getItem(keyName);
                if (!stored) throw new Error(`Keys not found. Upload a file first.`);
                const parsed = JSON.parse(stored);
                return await importKeyPair(parsed.publicKey, parsed.privateKey);
            };
            try {
                setDoctorKeys({
                    Bob: await loadKeys("doctor_bob_keys"),
                    Charlie: await loadKeys("doctor_charlie_keys"),
                });
            } catch (e) { console.error(e.message); }
        })();
    }, []);

    const handleOpen = async () => {
        if (!recordId) return;
        setLoading(true);
        setResult(null);
        setImageUrl(null);

        try {
            const doctorAddress = doctors[selectedDoctor];
            const doctorKeyPair = doctorKeys[selectedDoctor];
            if (!doctorKeyPair) throw new Error("Doctor keys not loaded");

            const record = await getRecord(Number(recordId), doctorAddress);
            if (!record) return setResult({ status: "notfound" });

            if (!(await checkAccess(Number(recordId), doctorAddress))) {
                return setResult({ status: "denied" });
            }

            // 1. Скачиваем файл (теперь он содержит IV + ciphertext)
            const cidStr = hexToUtf8String(record.cid);
            const res = await fetch(`http://127.0.0.1:8080/ipfs/${cidStr}`, { signal: AbortSignal.timeout(15000) });
            if (!res.ok) throw new Error(`IPFS ${res.status}`);
            const combinedBuffer = new Uint8Array(await res.arrayBuffer());

            // 2. Расшифровываем AES-ключ
            const encryptedKey = record.encryptedKey;
            if (!encryptedKey || encryptedKey.length !== 256) throw new Error(`Invalid key length: ${encryptedKey?.length || 0}`);

            const aesKeyBytes = await decryptAESKey(encryptedKey, doctorKeyPair.privateKey);

            // 3. Расшифровываем файл (IV автоматически извлекается внутри decryptFile)
            const decrypted = await decryptFile(combinedBuffer, aesKeyBytes);

            setImageUrl(URL.createObjectURL(new Blob([decrypted], { type: "image/jpeg" })));
            setResult({ status: "ok", cid: cidStr, owner: record.owner });
        } catch (e) {
            console.error("❌ ERROR:", e);
            setResult({ status: "error", message: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: 40 }}>
            <h2>Doctor View</h2>
            <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
                <option value="Bob">Bob</option><option value="Charlie">Charlie</option>
            </select>
            <input placeholder="Record ID" value={recordId} onChange={e => setRecordId(e.target.value)} />
            <button onClick={handleOpen} disabled={loading} style={{ marginLeft: 10 }}>
                {loading ? "Checking..." : "Open record"}
            </button>
            {result?.status === "ok" && imageUrl && <img src={imageUrl} width={300} style={{ marginTop: 20 }} />}
            {result?.status === "error" && <p style={{ color: "red" }}>❌ {result.message}</p>}
            {result?.status === "denied" && <p style={{ color: "red" }}>❌ Access Denied</p>}
            {result?.status === "notfound" && <p style={{ color: "gray" }}>Record not found</p>}
        </div>
    );
}