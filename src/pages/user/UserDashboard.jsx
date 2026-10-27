import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  CircleCheck,
  CircleX,
  Clock,
  Coins,
  Dices,
  Mail,
  Phone,
  RefreshCw,
  UserRound,
  Wallet,
} from "lucide-react";

import StatusBadge from "./StatusBadge";



import { getGameHistory } from "../../services/userService";
import "../../styles/UserDashboard.css";
import "../../styles/UserGameHistory.css";

export default function UserDashboard() {
  const { user, coins, refreshUser, openCoinRequest, openWithdrawRequest } =
    useOutletContext();

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);

  const displayName = user.userName || user.name || "Player";

  async function loadHistory() {
    try {
      setHistory(await getGameHistory());
      setHistoryError(false);
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, []);

  function handleRefresh() {
    refreshUser();
    loadHistory();
  }

  const bidStats = useMemo(
    () => ({
      total: history.length,
      win: history.filter((entry) => entry.winnerStatus === "WIN").length,
      lose: history.filter((entry) => entry.winnerStatus === "LOSE").length,
      pending: history.filter(
        (entry) => entry.winnerStatus !== "WIN" && entry.winnerStatus !== "LOSE"
      ).length,
    }),
    [history]
  );

  // Backend ने आधीच नवीन तारीख आधी sort करून पाठवले आहे
  const recentBids = history.slice(0, 5);

  return (
    <section className="ud-dashboard">
      <div className="ud-welcome">
        <div>
          <h2>Welcome, {displayName} 👋</h2>
          <p>Manage your coins, requests and bids from here.</p>
        </div>

        <button type="button" className="ud-btn ud-btn-ghost" onClick={handleRefresh}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="ud-stats">
        <article className="ud-stat-card ud-stat-card-primary">
          <div className="ud-stat-icon">
            <Coins size={22} />
          </div>
          <div>
            <span>Coin Balance</span>
            <strong>{coins}</strong>
          </div>
        </article>

        <article className="ud-stat-card">
          <div className="ud-stat-icon">
            <UserRound size={22} />
          </div>
          <div>
            <span>Username</span>
            <strong>{user.userName || "-"}</strong>
          </div>
        </article>

        <article className="ud-stat-card">
          <div className="ud-stat-icon">
            <Phone size={22} />
          </div>
          <div>
            <span>Phone</span>
            <strong>{user.userPhoneNo || "-"}</strong>
          </div>
        </article>

        <article className="ud-stat-card">
          <div className="ud-stat-icon">
            <Mail size={22} />
          </div>
          <div>
            <span>Email</span>
            <strong className="ud-stat-small">{user.userEmail || "-"}</strong>
          </div>
        </article>
      </div>

      <div className="ud-stats">
        <article className="ud-stat-card">
          <div className="ud-stat-icon">
            <Dices size={22} />
          </div>
          <div>
            <span>Total Bids</span>
            <strong>{historyLoading ? "-" : bidStats.total}</strong>
          </div>
        </article>

        <article className="ud-stat-card">
          <div className="ud-stat-icon ud-icon-win">
            <CircleCheck size={22} />
          </div>
          <div>
            <span>Win</span>
            <strong>{historyLoading ? "-" : bidStats.win}</strong>
          </div>
        </article>

        <article className="ud-stat-card">
          <div className="ud-stat-icon ud-icon-lose">
            <CircleX size={22} />
          </div>
          <div>
            <span>Lose</span>
            <strong>{historyLoading ? "-" : bidStats.lose}</strong>
          </div>
        </article>

        <article className="ud-stat-card">
          <div className="ud-stat-icon ud-icon-pending">
            <Clock size={22} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{historyLoading ? "-" : bidStats.pending}</strong>
          </div>
        </article>
      </div>

      <div className="ud-panel">
        <div className="ud-panel-header">
          <h3>Quick Actions</h3>
          <p>Send a request to the admin to add or withdraw coins.</p>
        </div>

        <div className="ud-actions">
          <button type="button" className="ud-action ud-action-add" onClick={openCoinRequest}>
            <Coins size={22} />
            <div>
              <strong>Send Coins Request</strong>
              <span>Deposit via QR code (minimum 10 Rs.)</span>
            </div>
          </button>

          <button
            type="button"
            className="ud-action ud-action-withdraw"
            onClick={openWithdrawRequest}
          >
            <Wallet size={22} />
            <div>
              <strong>Withdraw Coins Request</strong>
              <span>Request a withdrawal (minimum 100 Rs.)</span>
            </div>
          </button>
        </div>
      </div>

      <div className="ud-panel">
        <div className="ud-panel-header ud-panel-header-row">
          <div>
            <h3>Recent Bids</h3>
            <p>Your last 5 bids.</p>
          </div>
          <Link to="/user/history" className="ud-link">
            View all
          </Link>
        </div>

        {historyLoading ? (
          <p className="ud-empty">Loading bids...</p>
        ) : historyError ? (
          <p className="ud-empty">Could not load your bids right now.</p>
        ) : recentBids.length === 0 ? (
          <p className="ud-empty">You have not placed any bids yet.</p>
        ) : (
          <div className="ud-table-wrapper">
            <table className="ud-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lottery</th>
                  <th>Game Type</th>
                  <th>Bid Number</th>
                  <th>Bid Points</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBids.map((entry, index) => (
                  <tr key={`${entry.entryGameType}-${entry.id ?? index}-${index}`}>
                    <td>{entry.entryBidDate}</td>
                    <td>{entry.entryLotteryName}</td>
                    <td>{entry.entryGameType}</td>
                    <td>{entry.entryBitNumber}</td>
                    <td>{entry.entryBitPoints}</td>
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