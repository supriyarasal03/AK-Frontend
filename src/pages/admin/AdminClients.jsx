import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import {
  addClient,
  deleteClient,
  getClients,
  updateClient,
} from "../../services/adminClientsService";
import getErrorMessage from "../../utils/getErrorMessage";
import "../../styles/AdminDashboard.css";
import "../../styles/AdminPages.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // backend मर्यादा: 10 MB

const FIELDS = [
  { name: "clientName", label: "Client Name", type: "text" },
  { name: "branchName", label: "Branch Name", type: "text" },
  { name: "phoneNo", label: "Phone No.", type: "tel", inputMode: "numeric" },
  { name: "email", label: "Email", type: "email" },
  { name: "password", label: "Password", type: "password" },
  { name: "confirmPassword", label: "Confirm Password", type: "password" },
  { name: "bankAccountNo", label: "Bank Account No.", type: "text", inputMode: "numeric" },
  { name: "bankIfscCode", label: "Bank IFSC Code", type: "text" },
];

const emptyForm = {
  clientName: "",
  branchName: "",
  phoneNo: "",
  email: "",
  password: "",
  confirmPassword: "",
  bankAccountNo: "",
  bankIfscCode: "",
};

// Client ची image दाखवतो; उघडली नाही तर संदेश दाखवतो
function ClientImage({ src }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className="ak-qr-missing">No image</span>;
  }

  return (
    <img
      src={src}
      alt="Client"
      className="ak-qr-thumb"
      onError={() => setFailed(true)}
    />
  );
}

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadClients = useCallback(async () => {
    try {
      const data = await getClients();
      setClients(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(`Error fetching clients: ${getErrorMessage(err, "Unknown error")}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClients();
  }, [loadClients]);

  function handleRefresh() {
    setLoading(true);
    setMessage("");
    loadClients();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] || null;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (chosen && chosen.size > MAX_FILE_SIZE) {
      setError("Image is too large. Maximum size is 10 MB.");
      setFile(null);
      setPreviewUrl("");
      setFileInputKey((key) => key + 1);
      return;
    }

    setError("");
    setFile(chosen);
    setPreviewUrl(chosen ? URL.createObjectURL(chosen) : "");
  }

  function resetForm() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setForm(emptyForm);
    setFile(null);
    setPreviewUrl("");
    setCurrentImage("");
    setEditingId(null);
    setFileInputKey((key) => key + 1);
  }

  function handleAdd() {
    resetForm();
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function handleEdit(client) {
    resetForm();
    setMessage("");
    setError("");
    setEditingId(client.id);
    setCurrentImage(client.clientImage || "");
    setForm({
      clientName: client.clientName ?? "",
      branchName: client.branchName ?? "",
      phoneNo: client.phoneNo ?? "",
      email: client.email ?? "",

      password: "",
      confirmPassword: "",


      bankAccountNo: client.bankAccountNo ?? "",
      bankIfscCode: client.bankIfscCode ?? "",
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

    if (form.password !== form.confirmPassword) {
      setError("Password and Confirm Password do not match!");
      return;
    }

    if (!editingId && !file) {
      setError("Please choose a client image.");
      return;
    }

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const formData = new FormData();
      FIELDS.forEach(({ name }) => {
        const value = form[name];
        // password मध्ये जागा (space) बदलत नाही; बाकीची फील्ड्स trim करतो
        formData.append(name, name.toLowerCase().includes("password") ? value : value.trim());
      });
      if (file) formData.append("clientImage", file);

      if (editingId) {
        await updateClient(editingId, formData);
        setMessage("Client updated successfully.");
      } else {
        await addClient(formData);
        setMessage("Client added successfully.");
      }

      resetForm();
      setShowForm(false);
      await loadClients();
    } catch (err) {
      setError(
        getErrorMessage(err, editingId ? "Failed to update client" : "Failed to add client")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client) {
    if (!window.confirm("Are you sure you want to delete this client?")) return;

    setMessage("");
    setError("");
    setDeletingId(client.id);

    try {
      const data = await deleteClient(client.id);
      setClients((previous) => previous.filter((item) => item.id !== client.id));
      setMessage(data?.message || "Client deleted successfully");
    } catch (err) {
      setError(getErrorMessage(err, "Error deleting client"));
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
              <UserRound size={15} />
              CLIENT MANAGEMENT
            </div>
            <h2>Clients</h2>
            <p>Agents and branches with their bank details.</p>
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
                Add client
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
                <h3>{editingId ? "Edit Client" : "Add Client"}</h3>
                <p>
                  {editingId
                    ? "Leave the image empty to keep the current one"
                    : "All fields and an image are required"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ak-form-grid">
                {FIELDS.map((field) => (
                  <div className="ak-field" key={field.name}>
                    <label htmlFor={field.name}>{field.label}</label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      inputMode={field.inputMode}
                      className="ak-input"
                      value={form[field.name]}
                      onChange={handleChange}
                    required={!editingId || !field.name.toLowerCase().includes("password")}
                    />
                  </div>
                ))}

                <div className="ak-field">
                  <label htmlFor="clientImage">Image</label>
                  <input
                    key={fileInputKey}
                    id="clientImage"
                    name="clientImage"
                    type="file"
                    accept="image/*"
                    className="ak-input"
                    onChange={handleFileChange}
                    required={!editingId}
                  />
                </div>

                {(previewUrl || currentImage) && (
                  <div className="ak-field">
                    <label>{previewUrl ? "New image" : "Current image"}</label>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Selected" className="ak-qr-thumb" />
                    ) : (
                      <ClientImage src={currentImage} />
                    )}
                  </div>
                )}
              </div>

              <div className="ak-form-actions">
                <button type="submit" className="ak-primary-button" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update client" : "Add client"}
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
              <h3>All Clients</h3>
              <p>Passwords are hidden in this list</p>
            </div>
            <span className="ak-count-badge">{clients.length} clients</span>
          </div>

          {loading ? (
            <div className="ak-empty-state">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="ak-empty-state">No clients found</div>
          ) : (
            <div className="ak-table-wrapper">
              <table className="ak-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Branch</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Bank Account</th>
                    <th>IFSC</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, index) => (
                    <tr key={client.id}>
                      <td>{index + 1}</td>
                      <td>
                        <ClientImage src={client.clientImage} />
                      </td>
                      <td>{client.clientName}</td>
                      <td>{client.branchName}</td>
                      <td>{client.phoneNo}</td>
                      <td>{client.email}</td>
                      <td>{client.bankAccountNo}</td>
                      <td>{client.bankIfscCode}</td>
                      <td>
                        <div className="ak-action-group">
                          <button
                            type="button"
                            className="ak-secondary-button"
                            onClick={() => handleEdit(client)}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ak-danger-button"
                            onClick={() => handleDelete(client)}
                            disabled={deletingId === client.id}
                          >
                            <Trash2 size={14} />
                            {deletingId === client.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </AdminLayout>
  );
}