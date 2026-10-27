import { useCallback, useEffect, useState } from "react";
import { Check, CheckCircle2, CircleAlert, RefreshCw, Wallet, X } from "lucide-react";

import AdminLayout from "./AdminLayout";
import {
  approveCoinRequest,
  getPendingCoinRequests,
  rejectCoinRequest,
} from "../../services/adminCoinRequestsService";
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

export default function AdminCoinRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getPendingCoinRequests();
      // जुन्या पानाप्रमाणे सर्वात नवीन request वर
      setRequests(Array.isArray(data) ? [...data].reverse() : []);
      setError("");
    } catch (err) {
      setError(
        `Could not load pending requests: ${getErrorMessage(err, "Unknown error")}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRequests();
  }, [loadRequests]);

  function handleRefresh() {
    setLoading(true);
    setMessage("");
    loadRequests();
  }

  async function handleAction(request, type) {
    const label = type === "approve" ? "Approve" : "Reject";
    if (!window.confirm(`${label} this request?`)) return;

    setMessage("");
    setError("");
    setProcessingId(request.id);

    try {
      if (type === "approve") {
        await approveCoinRequest(request.id);
        setMessage("Request approved. Coins were added to the user.");
      } else {
        await rejectCoinRequest(request.id);
        setMessage("Request rejected.");
      }
      await loadRequests();
    } catch (err) {
      setError(`Error: ${getErrorMessage(err, "Unknown error")}`);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <AdminLayout>
      <section className="ak-dashboard">
        <div className="ak-welcome-row">
          <div>
            <div className="ak-eyebrow">
              <Wallet size={15} />
              FINANCE
            </div>
            <h2>Coin Requests</h2>
            <p>Players who paid and are waiting for coins to be added.</p>
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
              <h3>Pending Requests</h3>
              <p>Approve adds the amount to the user's coins</p>
            </div>
            <span className="ak-count-badge">{requests.length} pending</span>
          </div>

          {loading ? (
            <div className="ak-empty-state">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="ak-empty-state">No pending requests</div>
          ) : (
            <div className="ak-table-wrapper">
              <table className="ak-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Current Coins</th>
                    <th>Request Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request, index) => {
                    const busy = processingId === request.id;

                    return (
                      <tr key={request.id}>
                        <td>{index + 1}</td>
                        <td>{request.userName}</td>
                        <td>{request.userPhoneNo}</td>
                        <td>{request.coinsAmount ?? 0}</td>
                        <td>
                          <span className="ak-coins-value">{request.amount}</span>
                        </td>
                        <td>
                          <span className="ak-status-badge">{request.status}</span>
                        </td>
                        <td>
                          <div className="ak-action-group">
                            <button
                              type="button"
                              className="ak-success-button"
                              onClick={() => handleAction(request, "approve")}
                              disabled={busy}
                            >
                              <Check size={14} />
                              {busy ? "Please wait..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              className="ak-danger-button"
                              onClick={() => handleAction(request, "reject")}
                              disabled={busy}
                            >
                              <X size={14} />
                              Reject
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