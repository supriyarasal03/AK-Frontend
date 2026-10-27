import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css";
import {
  Users,
  Dices,
  CreditCard,
  Clock3,
  ArrowUpRight,
  RefreshCw,
  CalendarDays,
  CircleAlert,
  Trophy,
  Activity,
  MessageSquare,
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import { getAdminDashboardData } from "../../services/AdminDashboard";

const emptyData = {
  users: [],
  lotteries: [],
  payments: [],
  coinRequests: [],
  depositRequests: [],
  contacts: [],
  errors: [],
};

function getList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.content)) return value.data.content;
  return [];
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function countPending(list) {
  return list.filter((item) => item.status === "PENDING").length;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const result = await getAdminDashboardData();

      const normalized = {
        users: getList(result.users),
        lotteries: getList(result.lotteries),
        payments: getList(result.payments),
        coinRequests: getList(result.coinRequests),
        depositRequests: getList(result.depositRequests),
        contacts: getList(result.contacts),
        errors: result.errors || [],
      };

      setDashboard(normalized);

      if (normalized.errors.length > 0) {
        setLoadError(
          "Some dashboard data could not be loaded. Check the failed API requests in the browser Network tab."
        );
      }
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
      setLoadError(
        "Unable to load dashboard data. Check the backend connection and admin authentication."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  const pendingCoinRequests = countPending(dashboard.coinRequests);
  const pendingDepositRequests = countPending(dashboard.depositRequests);

  const cards = [
    {
      title: "Total Users",
      value: dashboard.users.length,
      detail: "Registered users",
      icon: Users,
      color: "blue",
      path: "/admin/users",
    },
    {
      title: "Total Lotteries",
      value: dashboard.lotteries.length,
      detail: "Available lottery records",
      icon: Dices,
      color: "purple",
      path: "/admin/lottery",
    },
    {
      title: "Payment Records",
      value: dashboard.payments.length,
      detail: "Saved payment methods",
      icon: CreditCard,
      color: "green",
      path: "/admin/payments",
    },
    {
      title: "Pending Requests",
      value: pendingCoinRequests + pendingDepositRequests,
      detail: "Coin and deposit requests",
      icon: Clock3,
      color: "orange",
      path: "/admin/deposit-requests",
    },
  ];

  const recentLotteries = [...dashboard.lotteries]
    .sort((a, b) => {
      const dateA = new Date(a.lotteryDate || 0).getTime();
      const dateB = new Date(b.lotteryDate || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const quickActions = [
    {
      title: "Manage Lotteries",
      description: "Create and manage lottery records",
      icon: Dices,
      path: "/admin/lottery",
    },
    {
      title: "View Results",
      description: "Check and manage lottery results",
      icon: Trophy,
      path: "/admin/results",
    },
    {
      title: "Manage Users",
      description: "View registered users",
      icon: Users,
      path: "/admin/users",
    },
    {
      title: "Review Requests",
      description: "Check pending coin and deposit requests",
      icon: Activity,
      path: "/admin/deposit-requests",
    },
  ];

  return (
    <AdminLayout>
      <section className="ak-dashboard">
        <div className="ak-welcome-row">
          <div>
            <div className="ak-eyebrow">
              <CalendarDays size={15} />
              ADMINISTRATION OVERVIEW
            </div>
            <h2>Welcome back, Admin</h2>
            <p>
              Monitor your users, lotteries, payments, and pending requests
              from one place.
            </p>
          </div>

          <button
            type="button"
            className="ak-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "ak-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
        </div>

        {loadError && (
          <div className="ak-dashboard-alert" role="alert">
            <CircleAlert size={19} />
            <span>{loadError}</span>
          </div>
        )}

        <div className="ak-section-heading">
          <div>
            <h3>Dashboard Overview</h3>
            <p>Live totals from your existing backend APIs</p>
          </div>
          <span className="ak-live-label">
            <span />
            Live data
          </span>
        </div>

        <div className="ak-stats-grid">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                type="button"
                className="ak-stat-card"
                key={card.title}
                onClick={() => navigate(card.path)}
              >
                <div className="ak-stat-top">
                  <span className={`ak-stat-icon ${card.color}`}>
                    <Icon size={21} />
                  </span>
                  <ArrowUpRight size={18} className="ak-stat-arrow" />
                </div>

                <span className="ak-stat-title">{card.title}</span>

                <strong className="ak-stat-value">
                  {loading ? "—" : card.value.toLocaleString("en-IN")}
                </strong>

                <span className="ak-stat-detail">{card.detail}</span>
              </button>
            );
          })}
        </div>

        <div className="ak-dashboard-columns">
          <section className="ak-panel ak-lottery-panel">
            <div className="ak-panel-header">
              <div>
                <h3>Recent Lotteries</h3>
                <p>Latest lottery records from your system</p>
              </div>

              <button
                type="button"
                className="ak-text-button"
                onClick={() => navigate("/admin/lottery")}
              >
                View all <ArrowUpRight size={15} />
              </button>
            </div>

            {loading ? (
              <div className="ak-empty-state">Loading lottery records...</div>
            ) : recentLotteries.length === 0 ? (
              <div className="ak-empty-state">
                No lottery records are available.
              </div>
            ) : (
              <div className="ak-table-wrapper">
                <table className="ak-table">
                  <thead>
                    <tr>
                      <th>Lottery</th>
                      <th>Date</th>
                      <th>Open Result</th>
                      <th>Close Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLotteries.map((lottery, index) => (
                      <tr key={lottery.id ?? `${lottery.lotteryName}-${index}`}>
                        <td>
                          <div className="ak-lottery-name">
                            <span className="ak-lottery-symbol">
                              <Dices size={16} />
                            </span>
                            <div>
                              <strong>
                                {lottery.lotteryName || "Unnamed lottery"}
                              </strong>
                              <small>
                                {lottery.lotteryGameType || "Lottery"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(lottery.lotteryDate)}</td>
                        <td>
                          <span className="ak-result-value">
                            {lottery.openResultNo || "Pending"}
                          </span>
                        </td>
                        <td>
                          <span className="ak-result-value">
                            {lottery.closeResultNo || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="ak-panel ak-requests-panel">
            <div className="ak-panel-header">
              <div>
                <h3>Request Summary</h3>
                <p>Items that may need your attention</p>
              </div>
              <Clock3 size={19} className="ak-panel-icon" />
            </div>

            <button
              type="button"
              className="ak-request-row"
              onClick={() => navigate("/admin/deposit-requests")}
            >
              <span className="ak-request-icon orange">
                <ArrowUpRight size={19} />
              </span>
              <span className="ak-request-copy">
                <strong>Deposit requests</strong>
                <small>Pending deposits</small>
              </span>
              <span className="ak-request-count">
                {loading ? "—" : pendingDepositRequests}
              </span>
            </button>

            <button
              type="button"
              className="ak-request-row"
              onClick={() => navigate("/admin/coin-requests")}
            >
              <span className="ak-request-icon purple">
                <ArrowUpRight size={19} />
              </span>
              <span className="ak-request-copy">
                <strong>Coin requests</strong>
                <small>Pending coin requests</small>
              </span>
              <span className="ak-request-count">
                {loading ? "—" : pendingCoinRequests}
              </span>
            </button>

            <button
              type="button"
              className="ak-request-row"
              onClick={() => navigate("/admin/contacts")}
            >
              <span className="ak-request-icon blue">
                <MessageSquare size={19} />
              </span>
              <span className="ak-request-copy">
                <strong>User contacts</strong>
                <small>Contact records</small>
              </span>
              <span className="ak-request-count">
                {loading ? "—" : dashboard.contacts.length}
              </span>
            </button>

            <div className="ak-request-note">
              <Activity size={17} />
              <span>
                Request counts reflect the records returned by the existing
                APIs.
              </span>
            </div>
          </section>
        </div>

        <section className="ak-panel ak-quick-panel">
          <div className="ak-panel-header">
            <div>
              <h3>Quick Actions</h3>
              <p>Jump directly to an administration module</p>
            </div>
          </div>

          <div className="ak-quick-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  type="button"
                  className="ak-quick-action"
                  key={action.title}
                  onClick={() => navigate(action.path)}
                >
                  <span className="ak-quick-icon">
                    <Icon size={21} />
                  </span>
                  <span className="ak-quick-copy">
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>
                  <ArrowUpRight size={17} className="ak-quick-arrow" />
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </AdminLayout>
  );
}