import { useState } from "react";
import { uploadToIpfs } from "../services/ipfs";
import { storeRecord } from "../services/substrate";

export default function UploadForm() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setResult(null);

        const key = "demo-aes-key-123";

        const { cid } = await uploadToIpfs(file);
        const recordId = await storeRecord(cid, key);

        setResult({ cid, recordId, key });

        setLoading(false);
    };

    return (
        <div>
            <h2>Upload X-Ray</h2>

            <input
                type="file"
                onChange={(e) =>
                    setFile(e.target.files[0])
                }
            />

            <button
                onClick={handleUpload}
                disabled={!file || loading}
            >
                {loading ? "Uploading..." : "Upload"}
            </button>

            {result && (
                <div>
                    <p>CID: {result.cid}</p>
                    <p>Record: {result.recordId}</p>
                    <p>Key: {result.key}</p>
                </div>
            )}
        </div>
    );
}