import { useCallback, useEffect, useState } from "react";
import { CircleAlert, History, RefreshCw } from "lucide-react";

import StatusBadge from "./StatusBadge";



import { getGameHistory } from "../../services/userService";
import getErrorMessage from "../../utils/getErrorMessage";
import "../../styles/UserGameHistory.css";

export default function UserGameHistory() {





  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      const data = await getGameHistory();
      setEntries(data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Error loading game history"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory]);

  function handleRefresh() {
    setLoading(true);
    loadHistory();
  }

  // Backend सध्या winCoins पाठवत नाही; आले तरच Coins column दाखवतो
  const showCoins = entries.some((entry) => entry.winCoins != null);

  return (
    <section className="ud-dashboard">
      <div className="ud-welcome">
        <div>
          <h2>Game History</h2>
          <p>All your bids, latest first.</p>
        </div>

        <button
          type="button"
          className="ud-btn ud-btn-ghost"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} /> {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="ud-session-banner" role="alert">
          <span>
            <CircleAlert size={16} /> {error}
          </span>
        </div>
      )}

      <div className="ud-panel">
        <div className="ud-panel-header">
          <h3>
            <History size={18} /> Bids <span className="ud-count">{entries.length}</span>
          </h3>
        </div>

        {loading ? (
          <p className="ud-empty">Loading game history...</p>
        ) : entries.length === 0 ? (
          <p className="ud-empty">No game history found.</p>
        ) : (
          <div className="ud-table-wrapper">
            <table className="ud-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lottery</th>
                  <th>Game Type</th>
                  <th>Bid Type</th>
                  <th>Bid Number</th>
                  <th>Bid Points</th>
                  {showCoins && <th>Coins</th>}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={`${entry.entryGameType}-${entry.id ?? index}-${index}`}>
                    <td>{entry.entryBidDate}</td>
                    <td>{entry.entryLotteryName}</td>
                    <td>{entry.entryGameType}</td>
                    <td>{entry.entryBidType}</td>
                    <td>{entry.entryBitNumber}</td>
                    <td>{entry.entryBitPoints}</td>
                    {showCoins && <td>{entry.winCoins || 0}</td>}
                    <td>
                      <StatusBadge status={entry.winnerStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}