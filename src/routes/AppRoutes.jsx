import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import UserProtectedRoute from "./UserProtectedRoute.jsx";
import SinglePanaGame from "../pages/games/SinglePanaGame";
import AdminClients from "../pages/admin/AdminClients";
import AdminPayments from "../pages/admin/AdminPayments";
import AdminDepositRequests from "../pages/admin/AdminDepositRequests";
import DoublePanaGame from "../pages/games/DoublePanaGame";
import TriplePanaGame from "../pages/games/TriplePanaGame"
import JodiDigitGame from "../pages/games/JodiDigitGame";
import SingleDigitGame from "../pages/games/SingleDigitGame";
import AdminContacts from "../pages/admin/AdminContacts";
import UserLayout from "../components/layout/UserLayout";
import FullSangamGame from "../pages/games/FullSangamGame";
import HalfSangamGame from "../pages/games/HalfSangamGame";

import UserProfile from "../pages/user/UserProfile";
import UserGameHistory from "../pages/user/UserGameHistory";
import PlayGame from "../pages/user/PlayGame";
import UserDashboard from "../pages/user/UserDashboard";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminLogin from "../pages/admin/AdminLogin";
import AdminUsers from "../pages/admin/AdminUsers";
import UserLogin from "../pages/auth/UserLogin";
import UserSignup from "../pages/auth/UserSignup";
import NotFound from "../pages/NotFound";
import LandingPage from "../pages/LandingPage";
import AdminCoinRequests from "../pages/admin/AdminCoinRequests";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* User authentication */}
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<UserSignup />} />

        {/* Admin authentication */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin users */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />


                {/* Admin coin requests */}
        <Route
          path="/admin/coin-requests"
          element={
            <ProtectedRoute>
              <AdminCoinRequests />
            </ProtectedRoute>
          }
        />

        {/* User area: एकच UserLayout, त्यात सर्व user पाने */}
        <Route
  path="/user"
  element={
    <UserProtectedRoute>
      <UserLayout />
    </UserProtectedRoute>
  }
>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<UserDashboard />} />
  <Route path="history" element={<UserGameHistory />} />
  <Route path="profile" element={<UserProfile />} />
  <Route path="play-game" element={<PlayGame />} />
  <Route path="single-digit" element={<SingleDigitGame />} />
  <Route path="jodi-digit" element={<JodiDigitGame />} />
  <Route path="single-pana" element={<SinglePanaGame />} />
  <Route path="double-pana" element={<DoublePanaGame />} />
  <Route path="triple-pana" element={<TriplePanaGame />} />
  <Route path="half-sangam" element={<HalfSangamGame />} />
  <Route path="full-sangam" element={<FullSangamGame />} />
  {/* पुढे: triple-pana, half-sangam, full-sangam */}
</Route>
                {/* Admin deposit requests */}
        <Route
          path="/admin/deposit-requests"
          element={
            <ProtectedRoute>
              <AdminDepositRequests />
            </ProtectedRoute>
          }
        />


                {/* Admin clients */}
        <Route
          path="/admin/clients"
          element={
            <ProtectedRoute>
              <AdminClients />
            </ProtectedRoute>
          }
        />


                {/* Admin payments */}
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute>
              <AdminPayments />
            </ProtectedRoute>
          }
        />


        {/* Admin contacts */}
        <Route
          path="/admin/contacts"
          element={
            <ProtectedRoute>
              <AdminContacts />
            </ProtectedRoute>
          }
        />


        {/* Unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}