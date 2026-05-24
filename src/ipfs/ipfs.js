// ipfs.js
const IPFS_API_URL = "http://127.0.0.1:5001/api/v0/add";

export async function uploadToIpfs(encryptedData) {
    console.log("📦 IPFS upload start...");

    // encryptedData обычно приходит как Uint8Array или ArrayBuffer
    const blob = encryptedData instanceof Blob
        ? encryptedData
        : new Blob([encryptedData]);

    const formData = new FormData();
    formData.append("file", blob, "encrypted_data.bin");

    const response = await fetch(IPFS_API_URL, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`IPFS upload failed (${response.status}): ${errText}`);
    }

    // Kubo возвращает JSON: { "Name": "...", "Hash": "Qm.../bafy...", "Size": "..." }
    const result = await response.json();
    console.log("✅ IPFS uploaded. CID:", result.Hash);

    return { cid: result.Hash };
}