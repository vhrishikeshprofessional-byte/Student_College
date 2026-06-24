import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, getApiMessage } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import DataTable from "../components/DataTable.jsx";

export default function StudentsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStudents() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/v1/student");
      if (user.role === "student" && data.length === 1 && data[0].id) {
        navigate(`/students/${data[0].id}`, { replace: true });
        return;
      }
      setStudents(data);
    } catch (err) {
      const message = getApiMessage(err, "Unable to load students");
      if (err.response?.status === 403) {
        navigate("/unauthorized", { state: { message }, replace: true });
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">{user.role}</span>
          <h2>Students</h2>
        </div>
        <button className="secondary-button" type="button" onClick={loadStudents}>
          <RefreshCcw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <div className="screen-message inline">Loading students...</div>
      ) : (
        <DataTable rows={students} detailsBasePath="/students" />
      )}
    </div>
  );
}
