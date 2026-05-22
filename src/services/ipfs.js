export async function uploadToIpfs(file) {
    console.log("upload:", file.name);

    await new Promise(r => setTimeout(r, 800));

    return {
        cid: "Qm" + Math.random().toString(36).slice(2, 10)
    };
}