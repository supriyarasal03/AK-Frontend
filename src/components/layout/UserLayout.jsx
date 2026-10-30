import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Coins,
  Gamepad2,
  LayoutDashboard,
  LogOut,
    History,
  Menu,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import CoinRequestModal from "../user/CoinRequestModal";
import { getSessionUser } from "../../services/userService";
import "../../styles/UserLayout.css";


import api from "../../services/axiosClient";

// नवीन user पान जोडायचे असेल तर फक्त इथे एक ओळ add करा
// (आणि AppRoutes.jsx मध्ये /user च्या आत route जोडा).
const menuItems = [
  { label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },


 { label: "History",
     path: "/user/history", 
     icon: History },


      {
    label: "Play Game",
    path: "/user/play-game",
    icon: Gamepad2,
  },


{
  label: "My Profile",
  path: "/user/profile",
  icon: UserRound,
},


];

const REFRESH_INTERVAL_MS = 15000;

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export default function UserLayout() {
  const navigate = useNavigate();

  const [user, setUser] = useState(readStoredUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // null / "add" / "withdraw"
  const [coinModal, setCoinModal] = useState(null);

  const coins = user.coinsAmount ?? 0;

  const handleLogout = useCallback(async () => {
  try {
  await api.get("/api/logout");
  } catch (error) {
    console.error("Backend logout failed:", error);
  } finally {
    sessionStorage.removeItem("userToken");
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
  }
}, [navigate]);


  // Backend कडून ताजा coin balance घेतो
  const refreshUser = useCallback(async () => {
    try {
      const data = await getSessionUser();

      // password सारखी फील्ड sessionStorage मध्ये ठेवत नाही, फक्त हवी ती घेतो
      const safeUser = {
        id: data.id,
        name: data.name,
        userName: data.userName,
        userEmail: data.userEmail,
        userPhoneNo: data.userPhoneNo,
        userImage: data.userImage,
        coinsAmount: data.coinsAmount ?? 0,
      };

      setUser(safeUser);
      sessionStorage.setItem("user", JSON.stringify(safeUser));
    } catch (err) {
      // Server session संपले असेल तर coin APIs चालणार नाहीत, म्हणून पुन्हा login
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  }, [handleLogout]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser();

    const timer = setInterval(refreshUser, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshUser);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refreshUser);
    };
  }, [refreshUser]);

  const closeModal = useCallback(() => setCoinModal(null), []);

  const displayName = user.name || user.userName || "Player";

  return (
    <div className="ud-layout">
      {sidebarOpen && (
        <button
          type="button"
          className="ud-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`ud-sidebar ${sidebarOpen ? "ud-sidebar-open" : ""}`}>
        <div className="ud-brand">
          <div className="ud-brand-icon">
            <Gamepad2 size={26} />
          </div>
          <div className="ud-brand-text">
            <h2>AK_GAME</h2>
            <span>USER PANEL</span>
          </div>
          <button
            type="button"
            className="ud-icon-button ud-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ud-wallet">
          <span className="ud-wallet-label">
            <Coins size={16} /> Coins
          </span>
          <strong>{coins}</strong>

          <button
            type="button"
            className="ud-btn ud-btn-danger ud-btn-block"
            onClick={() => {
              setCoinModal("add");
              setSidebarOpen(false);
            }}
          >
            Send Coins Request
          </button>
          <button
            type="button"
            className="ud-btn ud-btn-success ud-btn-block"
            onClick={() => {
              setCoinModal("withdraw");
              setSidebarOpen(false);
            }}
          >
            <Wallet size={16} /> Withdraw Coins Request
          </button>
        </div>

        <nav className="ud-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `ud-menu-link ${isActive ? "ud-menu-link-active" : ""}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <NavLink to="/" className="ud-menu-link">
            <ArrowLeft size={19} />
            <span>Back to Home</span>
          </NavLink>
        </nav>

        <div className="ud-sidebar-bottom">
          <button type="button" className="ud-logout" onClick={handleLogout}>
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="ud-main">
        <header className="ud-header">
          <div className="ud-header-left">
            <button
              type="button"
              className="ud-icon-button ud-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <div className="ud-header-title">
              <span>AK_GAME</span>
              <h1>My Account</h1>
            </div>
          </div>

          <div className="ud-header-right">
            <div className="ud-header-coins">
              <Coins size={16} />
              <span>{coins}</span>
            </div>
            <div className="ud-header-user">
              <span>{displayName}</span>
              <small>Player</small>
            </div>
            <div className="ud-avatar">
              <UserRound size={20} />
            </div>
            <button
              type="button"
              className="ud-icon-button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <main className="ud-content">
          {/* User ची सर्व पाने इथे दिसतात */}
          <Outlet
            context={{
              user,
              coins,
              refreshUser,
              openCoinRequest: () => setCoinModal("add"),
              openWithdrawRequest: () => setCoinModal("withdraw"),
            }}
          />
        </main>

        <footer className="ud-footer">
          <span>© {new Date().getFullYear()} AK_GAME</span>
        </footer>
      </div>

      {coinModal && (
        <CoinRequestModal
          key={coinModal}
          mode={coinModal}
          onClose={closeModal}
          onSuccess={refreshUser}
        />
      )}
    </div>
  );
}
