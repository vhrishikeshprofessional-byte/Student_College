import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AccessManagement from "./pages/AccessManagement.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StudentDetails from "./pages/StudentDetails.jsx";
import StudentsList from "./pages/StudentsList.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import Users from "./pages/Users.jsx";

const userManagementRoles = ["admin", "chairman", "principal"];
const accessUiRoles = ["admin", "principal", "chairman", "dean", "hod"];
const auditUiRoles = ["admin", "chairman", "principal", "dean", "hod"];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<StudentsList />} />
        <Route path="/students/:studentId" element={<StudentDetails />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={userManagementRoles}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/access"
          element={
            <ProtectedRoute allowedRoles={accessUiRoles}>
              <AccessManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={auditUiRoles}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
