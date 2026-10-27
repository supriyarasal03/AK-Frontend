import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/UserSignup.css";
import userAuthService from "../../services/userAuthService";

export default function UserSignup() {


    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    userEmail: "",
    userPassword: "",
    confirmPassword: "",
    userPhoneNo: "",
       otp: "1234",
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

    if (formData.userPassword !== formData.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await userAuthService.register(formData);

            setSuccess(
        result?.message || "Registration successful! Redirecting to login..."
      );
      setTimeout(() => navigate("/login"), 1500);




    } 
    
    
    
    
    catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter your full name",
      autoComplete: "name",
    },
    {
      name: "userName",
      label: "Username",
      type: "text",
      placeholder: "Choose a username",
      autoComplete: "username",
    },
    {
      name: "userEmail",
      label: "Email Address",
      type: "email",
      placeholder: "Enter your email",
      autoComplete: "email",
    },
    {
      name: "userPhoneNo",
      label: "Phone Number",
      type: "tel",
      placeholder: "Enter your phone number",
      autoComplete: "tel",
    },
    {
      name: "userPassword",
      label: "Password",
      type: "password",
      placeholder: "Create a password",
      autoComplete: "new-password",
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      placeholder: "Confirm your password",
      autoComplete: "new-password",
    },
  ];

  return (
    <main className="user-signup-page">
      <section className="user-signup-card">
        <header className="user-signup-header">
          <div className="user-signup-icon" aria-hidden="true">
            🎮
          </div>

          <p className="user-signup-eyebrow">
            Welcome to the arena
          </p>

          <h1 className="user-signup-title">
            Create your <span>AK_Game</span> account
          </h1>

          <p className="user-signup-subtitle">
            Join the game. Create your player profile.
          </p>
        </header>

        <form className="user-signup-form" onSubmit={handleSubmit}>
          <div className="user-signup-grid">
            {fields.map((field) => (
              <div className="user-signup-field" key={field.name}>
                <label htmlFor={field.name}>
                  {field.label}
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={handleChange}
                  autoComplete={field.autoComplete}
                  required
                />
              </div>
            ))}
          </div>

                    <div className="user-signup-field">
            <label htmlFor="otp">OTP</label>

            <input
              id="otp"
              name="otp"
              type="text"
              placeholder="Enter OTP if required"
              value={formData.otp}
              onChange={handleChange}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <p
              className="user-signup-message user-signup-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              className="user-signup-message user-signup-success"
              role="status"
            >
              {success}
            </p>
          )}

          <button
            className="user-signup-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <div className="user-signup-divider">
          <span />
          <span>OR</span>
          <span />
        </div>

        <p className="user-signup-footer">
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}