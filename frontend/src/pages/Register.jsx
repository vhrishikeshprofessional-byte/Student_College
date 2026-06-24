import { Save, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { getApiMessage } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

const roles = [
  "admin",
  "student",
  "professor",
  "assistant",
  "principal",
  "hod",
  "chairman",
  "dean",
  "finance",
];

export default function Register() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getApiMessage(err, "Unable to register"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card wide" onSubmit={handleSubmit}>
        <div className="auth-heading">
          <UserPlus size={30} aria-hidden="true" />
          <div>
            <span className="eyebrow">College SIS</span>
            <h1>Register</h1>
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="form-grid">
          <label>
            Name
            <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              value={form.confirm_password}
              onChange={(event) => updateField("confirm_password", event.target.value)}
              required
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => updateField("role", event.target.value)}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="primary-button" type="submit" disabled={submitting}>
          <Save size={18} aria-hidden="true" />
          <span>{submitting ? "Creating..." : "Create account"}</span>
        </button>
        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
