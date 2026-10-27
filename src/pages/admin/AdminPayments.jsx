import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import {
  addPayment,
  deletePayment,
  getPayments,
} from "../../services/adminPaymentsService";
import getErrorMessage from "../../utils/getErrorMessage";
import "../../styles/AdminDashboard.css";
import "../../styles/AdminPages.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // backend मर्यादा: 10 MB

const emptyForm = { adminName: "", adminMobileNo: "" };

// QR image दाखवतो; उघडली नाही तर संदेश दाखवतो
function QrImage({ src }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className="ak-qr-missing">Image not available</span>;
  }

  return (
    <img
      src={src}
      alt="QR code"
      className="ak-qr-thumb"
      onError={() => setFailed(true)}
    />
  );
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadPayments = useCallback(async () => {
    try {
      const data = await getPayments();
      setPayments(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(`Error fetching payments: ${getErrorMessage(err, "Unknown error")}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPayments();
  }, [loadPayments]);

  function handleRefresh() {
    setLoading(true);
    setMessage("");
    loadPayments();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] || null;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (chosen && chosen.size > MAX_FILE_SIZE) {
      setError("QR image is too large. Maximum size is 10 MB.");
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
    setFileInputKey((key) => key + 1);
  }

  function handleCancel() {
    resetForm();
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError("Please choose a QR code image.");
      return;
    }

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("adminName", form.adminName.trim());
      formData.append("adminMobileNo", form.adminMobileNo.trim());
      formData.append("qrCode", file);

      await addPayment(formData);

      setMessage("Payment saved successfully.");
      resetForm();
      setShowForm(false);
      await loadPayments();
    } catch (err) {
      setError(getErrorMessage(err, "Error saving payment"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(payment) {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;

    setMessage("");
    setError("");
    setDeletingId(payment.id);

    try {
      const data = await deletePayment(payment.id);
      setPayments((previous) => previous.filter((item) => item.id !== payment.id));
      setMessage(typeof data === "string" && data ? data : "Payment deleted successfully");
    } catch (err) {
      setError(getErrorMessage(err, "Error deleting payment"));
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
              <CreditCard size={15} />
              PAYMENT SETTINGS
            </div>
            <h2>Payments</h2>
            <p>The QR code players see when they request coins.</p>
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
              <button
                type="button"
                className="ak-primary-button"
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} />
                Add payment
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
                <h3>Add Payment</h3>
                <p>Name, mobile number and the QR code image</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ak-form-grid">
                <div className="ak-field">
                  <label htmlFor="adminName">Name</label>
                  <input
                    id="adminName"
                    name="adminName"
                    type="text"
                    className="ak-input"
                    placeholder="Enter Name"
                    value={form.adminName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="ak-field">
                  <label htmlFor="adminMobileNo">Mobile No</label>
                  <input
                    id="adminMobileNo"
                    name="adminMobileNo"
                    type="text"
                    className="ak-input"
                    placeholder="Enter Mobile No"
                    value={form.adminMobileNo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="ak-field">
                  <label htmlFor="qrCode">QR Code image</label>
                  <input
                    key={fileInputKey}
                    id="qrCode"
                    name="qrCode"
                    type="file"
                    accept="image/*"
                    className="ak-input"
                    onChange={handleFileChange}
                    required
                  />
                </div>

                {previewUrl && (
                  <div className="ak-field">
                    <label>Preview</label>
                    <img src={previewUrl} alt="Selected QR preview" className="ak-qr-thumb" />
                  </div>
                )}
              </div>

              <div className="ak-form-actions">
                <button type="submit" className="ak-primary-button" disabled={saving}>
                  {saving ? "Saving..." : "Save payment"}
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
              <h3>Saved Payments</h3>
              <p>Players are shown the first saved QR code</p>
            </div>
            <span className="ak-count-badge">{payments.length} records</span>
          </div>

          {loading ? (
            <div className="ak-empty-state">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="ak-empty-state">No payments found</div>
          ) : (
            <div className="ak-table-wrapper">
              <table className="ak-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Mobile No</th>
                    <th>QR Code</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr key={payment.id}>
                      <td>{index + 1}</td>
                      <td>{payment.adminName}</td>
                      <td>{payment.adminMobileNo}</td>
                      <td>
                        <QrImage src={payment.qrCode} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ak-danger-button"
                          onClick={() => handleDelete(payment)}
                          disabled={deletingId === payment.id}
                        >
                          <Trash2 size={14} />
                          {deletingId === payment.id ? "Deleting..." : "Delete"}
                        </button>
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