import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, MessageSquare, RefreshCw, Trash2 } from "lucide-react";

import AdminLayout from "./AdminLayout";
import { deleteContact, getContacts } from "../../services/adminContactsService";
import getErrorMessage from "../../utils/getErrorMessage";
import "../../styles/AdminDashboard.css";
import "../../styles/AdminPages.css";

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadContacts = useCallback(async () => {
    try {
      const data = await getContacts();
      setContacts(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(`Error fetching contacts: ${getErrorMessage(err, "Unknown error")}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContacts();
  }, [loadContacts]);

  function handleRefresh() {
    setLoading(true);
    setMessage("");
    loadContacts();
  }

  async function handleDelete(contact) {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;

    setMessage("");
    setError("");
    setDeletingId(contact.id);

    try {
      const data = await deleteContact(contact.id);
      setContacts((previous) => previous.filter((item) => item.id !== contact.id));
      setMessage(typeof data === "string" && data ? data : "Contact deleted successfully!");
    } catch {
      setError("Failed to delete contact!");
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
              <MessageSquare size={15} />
              SUPPORT
            </div>
            <h2>User Contacts</h2>
            <p>Messages sent by players from the contact form.</p>
          </div>

          <button
            type="button"
            className="ak-refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "ak-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
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

        <section className="ak-panel">
          <div className="ak-panel-header">
            <div>
              <h3>All Messages</h3>
              <p>Delete removes the message permanently</p>
            </div>
            <span className="ak-count-badge">{contacts.length} messages</span>
          </div>

          {loading ? (
            <div className="ak-empty-state">Loading messages...</div>
          ) : contacts.length === 0 ? (
            <div className="ak-empty-state">No contact messages found</div>
          ) : (
            <div className="ak-table-wrapper">
              <table className="ak-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Message</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, index) => (
                    <tr key={contact.id}>
                      <td>{index + 1}</td>
                      <td>{contact.name}</td>
                      <td>{contact.phone}</td>
                      <td className="ak-message-cell">{contact.message}</td>
                      <td>
                        <button
                          type="button"
                          className="ak-danger-button"
                          onClick={() => handleDelete(contact)}
                          disabled={deletingId === contact.id}
                        >
                          <Trash2 size={14} />
                          {deletingId === contact.id ? "Deleting..." : "Delete"}
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