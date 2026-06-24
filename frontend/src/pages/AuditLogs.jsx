import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { api, getApiMessage } from "../api/client.js";
import DataTable from "../components/DataTable.jsx";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/v1/audit-logs");
      setLogs(data);
    } catch (err) {
      setError(getApiMessage(err, "Unable to load audit logs"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Audit</span>
          <h2>Audit Logs</h2>
        </div>
        <button className="secondary-button" type="button" onClick={loadLogs}>
          <RefreshCcw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <div className="screen-message inline">Loading audit logs...</div>
      ) : (
        <DataTable rows={logs} />
      )}
    </div>
  );
}
