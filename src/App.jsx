import UploadForm from "./components/UploadForm";
import DoctorView from "./components/DoctorView";

export default function App() {
  return (
      <div style={{ padding: 20 }}>
        <h1>Medical Storage Demo</h1>

        <UploadForm />

        <DoctorView />
      </div>
  );
}