import { useCallback, useEffect, useState } from "react";
import { Check, CheckCircle2, CircleAlert, Landmark, RefreshCw, X } from "lucide-react";

import AdminLayout from "./AdminLayout";
import {
  approveDepositRequest,
  getPendingDepositRequests,
  rejectDepositRequest,
} from "../../services/adminDepositRequestsService";
import getErrorMessage from "../../utils/getErrorMessage";
import "../../styles/AdminDashboard.css";
import "../../styles/AdminPages.css";

export default function AdminDepositRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getPendingDepositRequests();
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
        await approveDepositRequest(request.id);
        setMessage(
          "Request approved. Coins were deducted from the user. Please pay the player manually."
        );
      } else {
        await rejectDepositRequest(request.id);
        setMessage("Request rejected.");
      }
      await loadRequests();
    } catch (err) {
      // Backend 500 देतो (उदा. user कडे पुरेसे coins नाहीत) पण कारण सांगत नाही
      if (err.response?.status === 500) {
        setError(
          `Could not ${type} this request. The user may not have enough coins, or the request is no longer pending.`
        );
      } else {
        setError(`Error: ${getErrorMessage(err, "Unknown error")}`);
      }
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
              <Landmark size={15} />
              FINANCE
            </div>
            <h2>Deposit Requests</h2>
            <p>Players who want to take their coins out as money.</p>
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
              <p>Approve deducts the amount from the user's coins</p>
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
                    const notEnough = (request.coinsAmount ?? 0) < request.amount;

                    return (
                      <tr key={request.id}>
                        <td>{index + 1}</td>
                        <td>{request.userName}</td>
                        <td>{request.userPhoneNo}</td>
                        <td>{request.coinsAmount ?? 0}</td>
                        <td>
                          <span
                            className="ak-coins-value"
                            style={notEnough ? { color: "#c0392b" } : undefined}
                            title={notEnough ? "User does not have enough coins" : undefined}
                          >
                            {request.amount}
                          </span>
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