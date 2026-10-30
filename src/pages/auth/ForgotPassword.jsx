import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import userAuthService from "../../services/userAuthService";
import "../../styles/UserLogin.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [userEmail, setUserEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getError = (err, fallback) =>
    err.response?.data?.error || err.response?.data?.message || fallback;

  // Step 1: send OTP
  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await userAuthService.forgotPassword(userEmail.trim());
      setSuccess(result?.message || "OTP sent. Please check your email.");
      setStep(2);
    } catch (err) {
      setError(getError(err, "Could not send OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: reset password
  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await userAuthService.resetPassword({
        userEmail: userEmail.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });

      setSuccess(result?.message || "Password reset successful. Redirecting...");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(getError(err, "Could not reset password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (event) => {
    // digits only, max 6
    if (/^\d{0,6}$/.test(event.target.value)) {
      setOtp(event.target.value);
    }
  };

  const handleChangeEmail = () => {
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  };

  return (
    <main className="user-login-page">
      <form
        className="user-login-card"
        onSubmit={step === 1 ? handleSendOtp : handleResetPassword}
      >
        <div className="user-login-heading">
          <div className="user-login-logo">A</div>
          <h1>AK_Game</h1>
          <p>User Portal</p>
        </div>

        <div className="user-login-title">
          <h2>Forgot Password</h2>
          <p>
            {step === 1
              ? "Enter your registered email to receive an OTP."
              : `Enter the OTP sent to ${userEmail} and choose a new password.`}
          </p>
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

        {step === 1 && (
          <>
            <div className="user-login-field">
              <label htmlFor="userEmail">Email Address</label>
              <input
                id="userEmail"
                name="userEmail"
                type="email"
                placeholder="Enter your registered email"
                value={userEmail}
                onChange={(event) => setUserEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="user-login-button"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="user-login-field">
              <label htmlFor="otp">OTP</label>
              <input
                id="otp"
                name="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={handleOtpChange}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>

            <div className="user-login-field">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <div className="user-login-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="user-login-button"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <p className="user-login-footer">
              Didn't get the OTP?{" "}
              <a
                href="/forgot-password"
                onClick={(event) => {
                  event.preventDefault();
                  handleChangeEmail();
                }}
              >
                Send again
              </a>
            </p>
          </>
        )}

        <p className="user-login-footer">
          Remember your password? <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </main>
  );
}