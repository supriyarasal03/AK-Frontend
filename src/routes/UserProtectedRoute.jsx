import { Navigate, useLocation } from "react-router-dom";

// User पानांसाठी: userToken नसेल तर /login वर पाठवतो
export default function UserProtectedRoute({ children }) {
  const location = useLocation();
  const userToken = sessionStorage.getItem("userToken");

  if (!userToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
