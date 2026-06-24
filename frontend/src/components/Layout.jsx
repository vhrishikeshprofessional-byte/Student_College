import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

const navByRole = {
  admin: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["Students", "/students", GraduationCap],
    ["Users", "/users", Users],
    ["Access Management", "/access", ShieldCheck],
    ["Audit Logs", "/audit-logs", ScrollText],
  ],
  chairman: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["Students", "/students", GraduationCap],
    ["Users", "/users", Users],
    ["Audit Logs", "/audit-logs", ScrollText],
  ],
  finance: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["Students Financial View", "/students", GraduationCap],
  ],
  principal: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["Students Academic View", "/students", GraduationCap],
    ["Access Management", "/access", ShieldCheck],
    ["Audit Logs", "/audit-logs", ScrollText],
  ],
  hod: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["Students Academic View", "/students", GraduationCap],
    ["Access Management", "/access", ShieldCheck],
    ["Audit Logs", "/audit-logs", ScrollText],
  ],
  dean: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["Students Academic View", "/students", GraduationCap],
    ["Access Management", "/access", ShieldCheck],
    ["Audit Logs", "/audit-logs", ScrollText],
  ],
  professor: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["My Subject Students", "/students", GraduationCap],
  ],
  assistant: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["My Subject Students", "/students", GraduationCap],
  ],
  student: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["My Details", "/students", GraduationCap],
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = navByRole[user.role] || navByRole.student;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <GraduationCap size={28} aria-hidden="true" />
          <div>
            <strong>College SIS</strong>
            <span>Role Based</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} className="nav-link">
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div>
            <span className="eyebrow">{user.role}</span>
            <h1>{user.name}</h1>
          </div>
          <button className="icon-button" type="button" onClick={handleLogout} title="Logout">
            <LogOut size={18} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </header>
        <section className="content-area">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
