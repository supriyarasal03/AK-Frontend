import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import {
  addAdmin,
  deleteAdmin,
  getAdmins,
  updateAdmin,
} from "../../services/adminAccessService";
import getErrorMessage from "../../utils/getErrorMessage";
import "../../styles/AdminDashboard.css";
import "../../styles/AdminPages.css";

const emptyForm = { adminName: "", adminEmail: "", adminPassword: "" };

// These rules must match AdminCreateRequest / AdminUpdateRequest on the backend.
const adminValidators = {
  adminName: (value) => {
    const v = value.trim();
    if (!v) return "Admin name is required";
    if (v.length < 2 || v.length > 50) return "Admin name must be 2 to 50 characters";
    if (!/^[A-Za-z0-9][A-Za-z0-9 ._'-]*$/.test(v)) {
      return "Admin name can contain only letters, numbers, spaces and . _ ' -";
    }
    return "";
  },

  adminEmail: (value) => {
    const v = value.trim();
    if (!v) return "Email is required";
    if (v.length > 100) return "Email must be at most 100 characters";
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v)) {
      return "Enter a valid email address";
    }
    return "";
  },

  // Required when adding; optional when editing (empty = keep current password)
  adminPassword: (value, isEditing) => {
    if (!value) return isEditing ? "" : "Password is required";
    if (value.length < 8 || value.length > 64) return "Password must be 8 to 64 characters";
    if (!/^(?=.*[A-Za-z])(?=.*\d).*$/.test(value)) {
      return "Password must contain at least one letter and one number";
    }
    return "";
  },
};

function validateAdminForm(form, isEditing) {
  const result = {};
  Object.keys(adminValidators).forEach((key) => {
    const message = adminValidators[key](form[key], isEditing);
    if (message) result[key] = message;
  });
  return result;
}

// सध्या login असलेला admin (sessionStorage मधून)
function getCurrentAdmin() {
  try {
    return JSON.parse(sessionStorage.getItem("adminUser")) || {};
  } catch {
    return {};
  }
}

export default function AdminAccess() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const currentAdmin = getCurrentAdmin();

  const loadAdmins = useCallback(async () => {
    try {
      const data = await getAdmins();
      setAdmins(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(`Error fetching admins: ${getErrorMessage(err, "Unknown error")}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdmins();
  }, [loadAdmins]);

  function handleRefresh() {
    setLoading(true);
    setMessage("");
    loadAdmins();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));

    // Remove the old message for this field while the user is typing
    setFieldErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    const message = adminValidators[name](value, Boolean(editingId));

    setFieldErrors((previous) => {
      const next = { ...previous };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
  }

  function handleAdd() {
    resetForm();
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function handleEdit(admin) {
    setMessage("");
    setError("");
    setEditingId(admin.id);
    setFieldErrors({});
    // password जाणूनबुजून रिकामा; रिकामा ठेवला तर बदलत नाही
    setForm({
      adminName: admin.adminName ?? "",
      adminEmail: admin.adminEmail ?? "",
      adminPassword: "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    resetForm();
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const isEditing = Boolean(editingId);
    const errors = validateAdminForm(form, isEditing);

    const name = form.adminName.trim();
    const email = form.adminEmail.trim();

    // Duplicate email check against the loaded list (backend checks too)
    if (!errors.adminEmail) {
      const duplicate = admins.some(
        (admin) =>
          admin.id !== editingId &&
          (admin.adminEmail || "").toLowerCase() === email.toLowerCase()
      );
      if (duplicate) {
        errors.adminEmail = "An admin with this email already exists";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    try {
      const payload = {
        adminName: name,
        adminEmail: email,
        adminPassword: form.adminPassword,
      };

      if (editingId) {
        await updateAdmin(editingId, payload);

        // If you changed your own name/email, update the saved login info too
        if (editingId === currentAdmin.id) {
          sessionStorage.setItem(
            "adminUser",
            JSON.stringify({ ...currentAdmin, adminName: name, adminEmail: email })
          );
        }
        setMessage("Admin updated successfully.");
      } else {
        await addAdmin(payload);
        setMessage("Admin added successfully.");
      }

      resetForm();
      setShowForm(false);
      await loadAdmins();
    } catch (err) {
      const data = err.response?.data;
      const text = getErrorMessage(
        err,
        editingId ? "Failed to update admin" : "Failed to add admin"
      );

      if (data?.errors && typeof data.errors === "object") {
        // Field errors sent by the backend validation
        setFieldErrors(data.errors);
      } else if (/email/i.test(text)) {
        // e.g. "An admin with this email already exists"
        setFieldErrors({ adminEmail: text });
      } else {
        setError(text);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(admin) {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;

    setMessage("");
    setError("");
    setDeletingId(admin.id);

    try {
      await deleteAdmin(admin.id);
      setAdmins((previous) => previous.filter((item) => item.id !== admin.id));
      setMessage("Admin deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Error deleting admin"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <section className="ak-dashboard">
        <div className="ak-welcome-row">
          <div>
            <div className="ak-eyebrow">
              <ShieldCheck size={15} />
              ADMIN ACCESS
            </div>
            <h2>Settings</h2>
            <p>People who can log in to this admin panel.</p>
          </div>

          <div className="ak-action-group">
            <button
              type="button"
              className="ak-refresh-button"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "ak-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh data"}
            </button>

            {!showForm && (
              <button type="button" className="ak-primary-button" onClick={handleAdd}>
                <Plus size={16} />
                Add admin
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="ak-dashboard-alert" role="alert">
            <CircleAlert size={19} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="ak-page-success" role="status">
            <CheckCircle2 size={19} />
            <span>{message}</span>
          </div>
        )}

        {showForm && (
          <section className="ak-panel">
            <div className="ak-panel-header">
              <div>
                <h3>{editingId ? "Edit Admin" : "Add New Admin"}</h3>
                <p>
                  {editingId
                    ? "Leave the password empty to keep the current one"
                    : "Name, email and a password for the new admin"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="ak-form-grid">
                <div className="ak-field">
                  <label htmlFor="adminName">Name</label>
                  <input
                    id="adminName"
                    name="adminName"
                    type="text"
                    className={`ak-input${fieldErrors.adminName ? " ak-input-invalid" : ""}`}
                    placeholder="Enter Name"
                    value={form.adminName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={fieldErrors.adminName ? "true" : "false"}
                  />
                  {fieldErrors.adminName && (
                    <p className="ak-field-error" role="alert">
                      {fieldErrors.adminName}
                    </p>
                  )}
                </div>

                <div className="ak-field">
                  <label htmlFor="adminEmail">Email</label>
                  <input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    className={`ak-input${fieldErrors.adminEmail ? " ak-input-invalid" : ""}`}
                    placeholder="Enter email"
                    value={form.adminEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={fieldErrors.adminEmail ? "true" : "false"}
                  />
                  {fieldErrors.adminEmail && (
                    <p className="ak-field-error" role="alert">
                      {fieldErrors.adminEmail}
                    </p>
                  )}
                </div>

                <div className="ak-field">
                  <label htmlFor="adminPassword">
                    {editingId ? "New password (optional)" : "Password"}
                  </label>
                  <input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    className={`ak-input${fieldErrors.adminPassword ? " ak-input-invalid" : ""}`}
                    placeholder={editingId ? "Leave empty to keep current" : "Enter password"}
                    value={form.adminPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="new-password"
                    aria-invalid={fieldErrors.adminPassword ? "true" : "false"}
                  />
                  {fieldErrors.adminPassword ? (
                    <p className="ak-field-error" role="alert">
                      {fieldErrors.adminPassword}
                    </p>
                  ) : (
                    <p className="ak-field-hint">
                      8-64 characters, with a letter and a number
                    </p>
                  )}
                </div>
              </div>

              <div className="ak-form-actions">
                <button type="submit" className="ak-primary-button" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update admin" : "Add admin"}
                </button>
                <button
                  type="button"
                  className="ak-secondary-button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="ak-panel">
          <div className="ak-panel-header">
            <div>
              <h3>All Admins</h3>
              <p>Passwords are never shown</p>
            </div>
            <span className="ak-count-badge">{admins.length} admins</span>
          </div>

          {loading ? (
            <div className="ak-empty-state">Loading admins...</div>
          ) : admins.length === 0 ? (
            <div className="ak-empty-state">No admins found</div>
          ) : (
            <div className="ak-table-wrapper">
              <table className="ak-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin, index) => {
                    const isYou = admin.id === currentAdmin.id;
                    const isLast = admins.length === 1;

                    return (
                      <tr key={admin.id}>
                        <td>{index + 1}</td>
                        <td>
                          {admin.adminName}
                          {isYou && <span className="ak-count-badge"> You</span>}
                        </td>
                        <td>{admin.adminEmail}</td>
                        <td>
                          <div className="ak-action-group">
                            <button
                              type="button"
                              className="ak-secondary-button"
                              onClick={() => handleEdit(admin)}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="ak-danger-button"
                              onClick={() => handleDelete(admin)}
                              disabled={deletingId === admin.id || isYou || isLast}
                              title={
                                isYou
                                  ? "You cannot delete the admin you are logged in as"
                                  : isLast
                                    ? "At least one admin must remain"
                                    : undefined
                              }
                            >
                              <Trash2 size={14} />
                              {deletingId === admin.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </AdminLayout>
  );
}