export async function generateDoctorKeyPair() {
    return await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Экспорт ключей в base64 для хранения
export async function exportKeyPair(keyPair) {
    const pub = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const priv = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    return {
        publicKey: btoa(String.fromCharCode(...new Uint8Array(pub))),
        privateKey: btoa(String.fromCharCode(...new Uint8Array(priv))),
    };
}

// Импорт ключей из base64
export async function importKeyPair(b64Pub, b64Priv) {
    const pubBytes = Uint8Array.from(atob(b64Pub), (c) => c.charCodeAt(0));
    const privBytes = Uint8Array.from(atob(b64Priv), (c) => c.charCodeAt(0));

    const publicKey = await crypto.subtle.importKey(
        "spki", pubBytes, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]
    );
    const privateKey = await crypto.subtle.importKey(
        "pkcs8", privBytes, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]
    );

    return { publicKey, privateKey };
}

export async function encryptAESKeyWithDoctorPublicKey(aesKey, publicKey) {
    const cryptoKey = typeof publicKey === "string"
        ? await importKeyPair(publicKey, "").publicKey // если передаётся строка, импортируем
        : publicKey;

    const aesBuffer = aesKey instanceof Uint8Array
        ? aesKey.buffer.slice(aesKey.byteOffset, aesKey.byteOffset + aesKey.byteLength)
        : aesKey;

    const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, cryptoKey, aesBuffer);
    return new Uint8Array(encrypted);
}

export async function decryptAESKey(encryptedKey, privateKey) {
    const buffer = encryptedKey instanceof Uint8Array
        ? encryptedKey.buffer.slice(encryptedKey.byteOffset, encryptedKey.byteOffset + encryptedKey.byteLength)
        : encryptedKey;

    const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, buffer);
    return new Uint8Array(decrypted);
}