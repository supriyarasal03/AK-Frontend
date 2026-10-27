import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, RefreshCw, Trash2, Users } from "lucide-react";

import AdminLayout from "./AdminLayout";
import { deleteUser, getUsers } from "../../services/adminUsersService";
import "../../styles/AdminDashboard.css";
import "../../styles/AdminPages.css";

function getErrorMessage(error, fallback) {
  const data = error.response?.data;
  return (
    data?.error ||
    data?.message ||
    (typeof data === "string" && data ? data : null) ||
    fallback
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Error fetching users"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  function handleRefresh() {
    setLoading(true);
    setMessage("");
    loadUsers();
  }

  async function handleDelete(user) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    setMessage("");
    setError("");
    setDeletingId(user.id);

    try {
      const data = await deleteUser(user.id);
      setUsers((previous) => previous.filter((item) => item.id !== user.id));
      setMessage(data?.message || "User deleted successfully");
    } catch (err) {
      setError(`Error deleting user: ${getErrorMessage(err, "Unknown error")}`);
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
              <Users size={15} />
              USER MANAGEMENT
            </div>
            <h2>Users</h2>
            <p>All registered players and their coin balance.</p>
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
              <h3>All Users</h3>
              <p>Delete removes the user and their bets and coin requests</p>
            </div>
            <span className="ak-count-badge">{users.length} users</span>
          </div>

          {loading ? (
            <div className="ak-empty-state">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="ak-empty-state">No Users Found</div>
          ) : (
            <div className="ak-table-wrapper">
              <table className="ak-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Username</th>
                    <th>Coins</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.userPhoneNo}</td>
                      <td>{user.userName}</td>
                      <td>
                        <span className="ak-coins-value">
                          {user.coinsAmount ?? 0}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ak-danger-button"
                          onClick={() => handleDelete(user)}
                          disabled={deletingId === user.id}
                        >
                          <Trash2 size={14} />
                          {deletingId === user.id ? "Deleting..." : "Delete"}
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