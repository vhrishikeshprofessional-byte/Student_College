import { Activity, GraduationCap, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [studentCount, setStudentCount] = useState(null);

  useEffect(() => {
    api
      .get("/v1/student")
      .then(({ data }) => setStudentCount(data.length))
      .catch(() => setStudentCount(null));
  }, []);

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h2>Role access overview</h2>
        </div>
      </div>
      <div className="metric-grid">
        <article className="metric-card">
          <ShieldCheck size={22} aria-hidden="true" />
          <span>Role</span>
          <strong>{user.role}</strong>
        </article>
        <article className="metric-card">
          <GraduationCap size={22} aria-hidden="true" />
          <span>Visible Students</span>
          <strong>{studentCount ?? "Restricted"}</strong>
        </article>
        <article className="metric-card">
          <Activity size={22} aria-hidden="true" />
          <span>Token Scope</span>
          <strong>JWT Protected</strong>
        </article>
      </div>
    </div>
  );
}
