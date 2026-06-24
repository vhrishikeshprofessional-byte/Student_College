import { LockKeyhole, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { getApiMessage } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(getApiMessage(err, "Unable to login"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-heading">
          <LogIn size={30} aria-hidden="true" />
          <div>
            <span className="eyebrow">College SIS</span>
            <h1>Login</h1>
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        <label>
          Email
          <div className="input-with-icon">
            <Mail size={17} aria-hidden="true" />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
        </label>
        <label>
          Password
          <div className="input-with-icon">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>
        </label>
        <button className="primary-button" type="submit" disabled={submitting}>
          <LogIn size={18} aria-hidden="true" />
          <span>{submitting ? "Signing in..." : "Sign in"}</span>
        </button>
        <p className="auth-switch">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </main>
  );
}
