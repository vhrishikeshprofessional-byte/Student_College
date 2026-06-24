import { MinusCircle, PlusCircle, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api, getApiMessage } from "../api/client.js";

const subjects = ["maths", "physics", "chemistry", "biology", "social", "english"];

export default function AccessManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("maths");
  const [access, setAccess] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const instructors = useMemo(
    () => users.filter((user) => ["professor", "assistant"].includes(user.role) && user.is_active),
    [users],
  );

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/v1/users");
      setUsers(data);
      if (!selectedUserId) {
        const firstInstructor = data.find((user) => ["professor", "assistant"].includes(user.role));
        if (firstInstructor) {
          setSelectedUserId(String(firstInstructor.id));
        }
      }
    } catch (err) {
      setError(getApiMessage(err, "Unable to load users"));
    } finally {
      setLoading(false);
    }
  }

  async function loadAccess(userId = selectedUserId) {
    if (!userId) {
      setAccess([]);
      return;
    }
    try {
      const { data } = await api.get(`/v1/access/professor-subject/${userId}`);
      setAccess(data.access || []);
    } catch (err) {
      setError(getApiMessage(err, "Unable to load subject access"));
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadAccess(selectedUserId);
  }, [selectedUserId]);

  async function assignSubject(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/v1/access/professor-subject", {
        user_id: Number(selectedUserId),
        subject: selectedSubject,
      });
      setMessage("Subject access assigned");
      await loadAccess();
    } catch (err) {
      setError(getApiMessage(err, "Unable to assign subject"));
    }
  }

  async function removeAccess(accessId) {
    setError("");
    setMessage("");
    try {
      await api.delete(`/v1/access/professor-subject/${accessId}`);
      setMessage("Subject access removed");
      await loadAccess();
    } catch (err) {
      setError(getApiMessage(err, "Unable to remove subject access"));
    }
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Access</span>
          <h2>Professor Subject Access</h2>
        </div>
        <button className="secondary-button" type="button" onClick={loadUsers}>
          <RefreshCcw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      {loading ? (
        <div className="screen-message inline">Loading access...</div>
      ) : (
        <>
          <form className="management-form" onSubmit={assignSubject}>
            <label>
              Professor or Assistant
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} required>
                <option value="">Select user</option>
                {instructors.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Subject
              <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              <PlusCircle size={17} aria-hidden="true" />
              <span>Assign</span>
            </button>
          </form>
          <div className="access-list">
            {access.length === 0 && <div className="empty-state">No subject access found</div>}
            {access.map((item) => (
              <div className="access-row" key={item.id}>
                <span>{item.subject}</span>
                <button className="ghost-danger-button" type="button" onClick={() => removeAccess(item.id)}>
                  <MinusCircle size={16} aria-hidden="true" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
