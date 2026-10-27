import { Navigate, useLocation } from "react-router-dom";

// Admin पानांसाठी: adminToken नसेल तर /admin/login वर पाठवतो
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const adminToken = sessionStorage.getItem("adminToken");

  if (!adminToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}