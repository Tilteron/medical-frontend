// keys.js
export function toU8a(data) {
    return data instanceof Uint8Array
        ? data
        : new TextEncoder().encode(data);
}

// ✅ Добавьте для удобства:
export function hexToU8a(hex) {
    if (!hex || hex === '0x') return new Uint8Array();
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    return new Uint8Array(clean.match(/.{1,2}/g).map(b => parseInt(b, 16)));
}

export function u8aToHex(u8a) {
    return '0x' + Array.from(u8a).map(b => b.toString(16).padStart(2, '0')).join('');
}