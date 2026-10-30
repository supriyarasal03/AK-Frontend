import { useState } from "react";
import { useNavigate } from "react-router-dom";
import userAuthService from "../../services/userAuthService";
import "../../styles/UserLogin.css";
import { Link } from "react-router-dom";

export default function UserLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userName: "",
    userPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await userAuthService.login(formData);

      if (!result?.token) {
        throw new Error("Login response did not contain a token.");
      }

      sessionStorage.setItem("userToken", result.token);
      sessionStorage.setItem("user", JSON.stringify(result.user));

      setSuccess("Login successful!");
      navigate("/user/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : err.message) ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="user-login-page">
      <form className="user-login-card" onSubmit={handleSubmit}>
        <div className="user-login-heading">
          <div className="user-login-logo">A</div>
          <h1>AK_Game</h1>
          <p>User Portal</p>
        </div>

        <div className="user-login-title">
          <h2>Welcome Back</h2>
          <p>Sign in to access your account.</p>
        </div>

        {error && (
          <p className="user-login-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="user-login-success" role="status">
            {success}
          </p>
        )}

        <div className="user-login-field">
          <label htmlFor="userName">Username</label>
          <input
            id="userName"
            name="userName"
            type="text"
            placeholder="Enter your username"
            value={formData.userName}
            onChange={handleChange}
            autoComplete="username"
            required
          />
        </div>

        <div className="user-login-field">
          <label htmlFor="userPassword">Password</label>
          <input
            id="userPassword"
            name="userPassword"
            type="password"
            placeholder="Enter your password"
            value={formData.userPassword}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </div>


                <p className="user-login-forgot">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <button
          type="submit"
          className="user-login-button"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="user-login-footer">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </form>
    </main>
  );
}