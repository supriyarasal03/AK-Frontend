
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../services/adminAuthService";
import "../../styles/AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await adminLogin(adminEmail, adminPassword);

      if (!data?.token) {
        throw new Error("Login succeeded, but the server did not return a token.");
      }

      sessionStorage.setItem("adminToken", data.token);
      sessionStorage.setItem(
        "adminUser",
        JSON.stringify({
          id: data.id,
          adminName: data.adminName,
          adminEmail: data.adminEmail,
        })
      );

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-heading">
          <div className="admin-login-logo">A</div>
          <h1>AK Matka</h1>
          <p>Admin Portal</p>
        </div>

        <div className="admin-login-title">
          <h2>Welcome Back</h2>
          <p>Sign in to access your admin dashboard.</p>
        </div>

        {error && (
          <p className="admin-login-error" role="alert">
            {error}
          </p>
        )}

        <div className="admin-login-field">
          <label htmlFor="adminEmail">Admin Email</label>
          <input
            id="adminEmail"
            type="email"
            autoComplete="username"
            placeholder="Enter your admin email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
        </div>

        <div className="admin-login-field">
          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="admin-login-button"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login as Admin"}
        </button>

        <p className="admin-login-footer">
          Secure access for authorized administrators
        </p>
      </form>
    </main>
  );
}
