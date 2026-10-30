import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/UserSignup.css";
import userAuthService from "../../services/userAuthService";

// These rules must match UserRegistrationRequest.java on the backend.
const validators = {
  name: (value) => {
    const v = value.trim();
    if (!v) return "Full name is required";
    if (v.length < 2 || v.length > 50) return "Full name must be 2 to 50 characters";
    if (!/^[A-Za-z][A-Za-z ]*$/.test(v)) return "Full name can contain only letters and spaces";
    return "";
  },

  userName: (value) => {
    const v = value.trim();
    if (!v) return "Username is required";
    if (v.length < 4 || v.length > 20) return "Username must be 4 to 20 characters";
    if (!/^[A-Za-z0-9_]+$/.test(v)) return "Username can contain only letters, numbers and underscore";
    return "";
  },

  userEmail: (value) => {
    const v = value.trim();
    if (!v) return "Email is required";
    if (v.length > 100) return "Email must be at most 100 characters";
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v)) {
      return "Enter a valid email address";
    }
    return "";
  },

  userPhoneNo: (value) => {
    const v = value.trim();
    if (!v) return "Phone number is required";
    if (!/^[6-9]\d{9}$/.test(v)) return "Enter a valid 10-digit mobile number";
    return "";
  },

  userPassword: (value) => {
    if (!value) return "Password is required";
    if (value.length < 8 || value.length > 64) return "Password must be 8 to 64 characters";
    if (!/^(?=.*[A-Za-z])(?=.*\d).*$/.test(value)) {
      return "Password must contain at least one letter and one number";
    }
    return "";
  },

  confirmPassword: (value, data) => {
    if (!value) return "Confirm password is required";
    if (value !== data.userPassword) return "Password and confirm password do not match";
    return "";
  },
};

function validateAll(data) {
  const result = {};
  Object.keys(validators).forEach((key) => {
    const message = validators[key](data[key], data);
    if (message) result[key] = message;
  });
  return result;
}

export default function UserSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    userEmail: "",
    userPassword: "",
    confirmPassword: "",
    userPhoneNo: "",
  });

  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clientErrors = validateAll(formData);

  const getFieldError = (fieldName) => {
    if (touched[fieldName] || submitted) {
      if (clientErrors[fieldName]) return clientErrors[fieldName];
    }
    return serverErrors[fieldName] || "";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    // Full Name: Only letters and spaces
    if (name === "name" && !/^[a-zA-Z ]*$/.test(value)) {
      return;
    }

    // Phone Number: Only digits, maximum 10
    if (name === "userPhoneNo" && !/^\d{0,10}$/.test(value)) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear the old server message for this field while the user edits it
    if (serverErrors[name]) {
      setServerErrors((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((previous) => ({ ...previous, [name]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setServerErrors({});
    setSubmitted(true);

    if (Object.keys(clientErrors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      userName: formData.userName.trim(),
      userEmail: formData.userEmail.trim(),
      userPhoneNo: formData.userPhoneNo.trim(),
    };

    setLoading(true);

    try {
      const result = await userAuthService.register(payload);

      setSuccess(
        result?.message || "Registration successful! Redirecting to login..."
      );
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.message ||
        data?.error ||
        "Registration failed. Please try again.";

      // 1) Field errors sent by the backend validation
      if (data?.errors && typeof data.errors === "object") {
        setServerErrors(data.errors);
        setError("Please fix the highlighted fields.");
      }
      // 2) Business errors like "Username already exists"
      else if (/username/i.test(message)) {
        setServerErrors({ userName: message });
      } else if (/phone/i.test(message)) {
        setServerErrors({ userPhoneNo: message });
      } else if (/email/i.test(message)) {
        setServerErrors({ userEmail: message });
      } else {
        setError(message);
      }
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
      hint: "4-20 characters: letters, numbers, underscore",
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
      hint: "10-digit mobile number",
    },
    {
      name: "userPassword",
      label: "Password",
      type: "password",
      placeholder: "Create a password",
      autoComplete: "new-password",
      hint: "At least 8 characters, with a letter and a number",
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

          <p className="user-signup-eyebrow">Welcome to the arena</p>

          <h1 className="user-signup-title">
            Create your <span>AK_Game</span> account
          </h1>

          <p className="user-signup-subtitle">
            Join the game. Create your player profile.
          </p>
        </header>

        <form className="user-signup-form" onSubmit={handleSubmit} noValidate>
          <div className="user-signup-grid">
            {fields.map((field) => {
              const fieldError = getFieldError(field.name);

              return (
                <div className="user-signup-field" key={field.name}>
                  <label htmlFor={field.name}>{field.label}</label>

                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete={field.autoComplete}
                    className={fieldError ? "user-signup-input-invalid" : ""}
                    aria-invalid={fieldError ? "true" : "false"}
                    aria-describedby={`${field.name}-message`}
                    required
                  />

                  {fieldError ? (
                    <p
                      id={`${field.name}-message`}
                      className="user-signup-field-error"
                      role="alert"
                    >
                      {fieldError}
                    </p>
                  ) : (
                    field.hint && (
                      <p
                        id={`${field.name}-message`}
                        className="user-signup-field-hint"
                      >
                        {field.hint}
                      </p>
                    )
                  )}
                </div>
              );
            })}
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
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}