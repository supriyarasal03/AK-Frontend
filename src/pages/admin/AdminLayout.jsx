
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  LayoutDashboard,
  Users,
  UserRound,
  Trophy,

  ShieldCheck,
  Wallet,
  Download,
  CreditCard,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  PanelLeftClose,
} from "lucide-react";

import "../../styles/AdminLayout.css";

const menuGroups = [
  {
    title: "MAIN MENU",
    items: [
      {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "Clients", path: "/admin/clients", icon: UserRound },
    ],
  },
  {
    title: "GAME MANAGEMENT",
    items: [
      { label: "Lotteries", path: "/admin/lottery", icon: Gamepad2 },
      {
        label: "Lottery Entries",
        path: "/admin/lottery-entries",
        icon: Trophy,
      },
      {
        label: "Lottery Results",
        path: "/admin/results",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "FINANCE",
    items: [
      {
        label: "Coin Requests",
        path: "/admin/coin-requests",
        icon: Wallet,
      },
      {
        label: "Deposit Requests",
        path: "/admin/deposit-requests",
        icon: Download,
      },
      {
        label: "Payments",
        path: "/admin/payments",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        label: "User Contacts",
        path: "/admin/contacts",
        icon: MessageSquare,
      },
      { label: "Settings", path: "/admin/access", icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const adminUser = JSON.parse(
    sessionStorage.getItem("adminUser") || "{}"
  );

  const adminName = adminUser.adminName || "System Admin";

  function handleLogout() {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");

    navigate("/admin/login", { replace: true });
  }

  return (
    <div
      className={`ak-admin-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {sidebarOpen && (
        <button
          type="button"
          className="ak-sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`ak-sidebar ${
          sidebarOpen ? "mobile-open" : ""
        }`}
      >
        <div className="ak-sidebar-brand">
          <div className="ak-brand-icon">
            <Gamepad2 size={27} />
          </div>

          <div className="ak-brand-text">
            <h2>AK_GAME</h2>
            <span>ADMIN PANEL</span>
          </div>

          <button
            type="button"
            className="ak-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={21} />
          </button>
        </div>

        <div className="ak-sidebar-content">
          {menuGroups.map((group) => (
            <div className="ak-menu-group" key={group.title}>
              <p className="ak-menu-heading">{group.title}</p>

              <nav className="ak-menu">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    location.pathname === item.path ||
                    (item.path !== "/admin/dashboard" &&
                      location.pathname.startsWith(
                        `${item.path}/`
                      ));

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={
                        sidebarCollapsed ? item.label : undefined
                      }
                      className={`ak-menu-link ${
                        active ? "active" : ""
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="ak-menu-icon" size={21} />

                      <span className="ak-menu-label">
                        {item.label}
                      </span>

                      <ChevronRight
                        className="ak-menu-chevron"
                        size={16}
                      />
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="ak-sidebar-bottom">
          <button
            type="button"
            className="ak-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className="ak-menu-label">Logout</span>
          </button>
        </div>
      </aside>

      <div className="ak-admin-main">
        <header className="ak-admin-header">
          <div className="ak-header-left">
            <button
              type="button"
              className="ak-header-icon ak-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={23} />
            </button>

            <button
              type="button"
              className="ak-header-icon ak-collapse-button"
              onClick={() =>
                setSidebarCollapsed((previous) => !previous)
              }
              aria-label="Toggle sidebar width"
            >
              <PanelLeftClose size={21} />
            </button>

            <div className="ak-header-title">
              <span>AK_GAME MANAGEMENT</span>
              <h1>Admin Panel</h1>
            </div>
          </div>

          <div className="ak-header-user">
            <div className="ak-header-user-details">
              <span>{adminName}</span>
              <small>Administrator</small>
            </div>

            <div className="ak-user-avatar">
              <UserRound size={21} />
            </div>

            <button
              type="button"
              className="ak-header-logout"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <main className="ak-admin-content">{children}</main>

        <footer className="ak-admin-footer">
          <span>© {new Date().getFullYear()} AK_GAME</span>
          <span>Administration Panel</span>
        </footer>
      </div>
    </div>
  );
}
