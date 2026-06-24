import { ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Unauthorized() {
  const location = useLocation();
  const message = location.state?.message || "You are not authorized to access this resource";

  return (
    <main className="auth-page">
      <section className="auth-card compact">
        <div className="auth-heading">
          <ShieldAlert size={30} aria-hidden="true" />
          <div>
            <span className="eyebrow">403</span>
            <h1>Unauthorized</h1>
          </div>
        </div>
        <div className="alert error">{message}</div>
        <Link className="primary-button link-button" to="/dashboard">
          Dashboard
        </Link>
      </section>
    </main>
  );
}
