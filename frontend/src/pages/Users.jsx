import { Link2, Power, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api, getApiMessage } from "../api/client.js";
import DataTable from "../components/DataTable.jsx";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const studentUsers = useMemo(
    () => users.filter((user) => user.role === "student" && user.is_active),
    [users],
  );

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [usersResponse, studentsResponse] = await Promise.all([
        api.get("/v1/users"),
        api.get("/v1/student"),
      ]);
      setUsers(usersResponse.data);
      setStudents(studentsResponse.data);
    } catch (err) {
      setError(getApiMessage(err, "Unable to load users"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function linkStudent(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post(`/v1/users/${selectedUserId}/link-student/${selectedStudentId}`);
      setMessage("Student profile linked");
      await loadData();
    } catch (err) {
      setError(getApiMessage(err, "Unable to link student"));
    }
  }

  async function deactivate(userId) {
    setError("");
    setMessage("");
    try {
      await api.patch(`/v1/users/${userId}/deactivate`);
      setMessage("User deactivated");
      await loadData();
    } catch (err) {
      setError(getApiMessage(err, "Unable to deactivate user"));
    }
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Users</span>
          <h2>User Management</h2>
        </div>
        <button className="secondary-button" type="button" onClick={loadData}>
          <RefreshCcw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <form className="management-form" onSubmit={linkStudent}>
        <label>
          Student User
          <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} required>
            <option value="">Select user</option>
            {studentUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
        </label>
        <label>
          Student Profile
          <select
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
            required
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.id} - {student.name}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" type="submit">
          <Link2 size={17} aria-hidden="true" />
          <span>Link</span>
        </button>
      </form>

      {loading ? (
        <div className="screen-message inline">Loading users...</div>
      ) : (
        <>
          <DataTable rows={users} />
          <div className="user-actions">
            {users.map((user) => (
              <button
                key={user.id}
                className="danger-button"
                type="button"
                disabled={!user.is_active}
                onClick={() => deactivate(user.id)}
              >
                <Power size={16} aria-hidden="true" />
                <span>{user.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
