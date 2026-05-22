import { useState } from "react";
import { uploadToIpfs } from "../services/ipfs";
import { Keyring } from "@polkadot/keyring";
import { checkAccess, getRecord } from "../services/substrate";

export default function DoctorView() {
    const [recordId, setRecordId] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    //врачи
    const doctors=
        {
            Bob: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
            Charlie: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
        }
    const [selectedDoctor, setSelectedDoctor] =
        useState("Bob");

    const handleOpen = async () => {
        console.log("CLICK OPEN");

        if (!recordId) {
            console.log("EMPTY ID");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            console.log("recordId:", recordId);
            console.log("doctor:", selectedDoctor);

            const doctorAddress = doctors[selectedDoctor];

            console.log("doctorAddress:", doctorAddress);

            const record = await getRecord(Number(recordId));

            console.log("record:", record);

            if (!record) {
                setResult({ status: "notfound" });
                setLoading(false);
                return;
            }

            const hasAccess = await checkAccess(
                Number(recordId),
                doctorAddress
            );

            console.log("hasAccess:", hasAccess);

            if (!hasAccess) {
                setResult({ status: "denied" });
                setLoading(false);
                return;
            }

            setResult({
                status: "ok",
                cid: record.cid,
                owner: record.owner,
            });

        } catch (e) {
            console.error("ERROR:", e);
        }

        setLoading(false);
    };

    return (
        <div style={{ marginTop: 40 }}>
            <h2>Doctor View</h2>

            <div style={{ marginBottom: 20 }}>
                <label>Doctor: </label>

                <select
                    value={selectedDoctor}
                    onChange={(e) =>
                        setSelectedDoctor(
                            e.target.value
                        )
                    }
                >
                    <option value="Bob">
                        Bob
                    </option>

                    <option value="Charlie">
                        Charlie
                    </option>
                </select>
            </div>

            <input
                placeholder="Record ID"
                value={recordId}
                onChange={(e) =>
                    setRecordId(e.target.value)
                }
            />

            <button
                onClick={handleOpen}
                disabled={loading}
                style={{ marginLeft: 10 }}
            >
                {loading ? "Checking..." : "Open record"}
            </button>

            {result?.status === "notfound" && (
                <p style={{ color: "gray" }}>
                    Record not found
                </p>
            )}

            {result?.status === "denied" && (
                <div style={{ color: "red", marginTop: 20 }}>
                    ❌ Access Denied
                </div>
            )}

            {result?.status === "ok" && (
                <div>
                    <p>✅ Access Granted</p>

                    <p>Owner: {result.owner}</p>

                    <p>CID: {result.cid}</p>

                    <div style={{ marginTop: 20 }}>
                        <img
                            width={300}
                            src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Chest_Xray_PA_3-8-2010.png"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}