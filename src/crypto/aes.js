export function generateAESKey() {
    return crypto.getRandomValues(new Uint8Array(32));
}

export async function encryptFile(file, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const raw = await file.arrayBuffer();
    const cryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"]);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, raw);

    // 🔥 Встраиваем IV в начало зашифрованных данных (12 байт IV + ciphertext)
    const encBytes = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encBytes.length);
    combined.set(iv);
    combined.set(encBytes, iv.length);

    return combined; // Возвращаем один Uint8Array
}

export async function decryptFile(combinedData, key) {
    // 🔥 Извлекаем IV из первых 12 байт
    const iv = combinedData.slice(0, 12);
    const encrypted = combinedData.slice(12);

    const cryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["decrypt"]);
    return await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, encrypted);
}