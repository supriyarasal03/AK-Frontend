
import { useCallback, useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  Wallet,
  Hash,
  ShieldCheck,
  RefreshCw,
  CircleUserRound,
} from "lucide-react";
import { getSessionUser } from "../../services/userService";
import { useOutletContext } from "react-router-dom";
import "../../styles/UserProfile.css";

function formatValue(value) {
  return value === null || value === undefined || value === ""
    ? "Not provided"
    : String(value);
}

export default function UserProfile() {
  const { user: layoutUser, coins: layoutCoins } = useOutletContext();

  const [profile, setProfile] = useState(layoutUser || {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getSessionUser();

      // Keep only the profile fields needed by this page.
      const safeProfile = {
        id: data?.id,
        userName: data?.userName,
        userEmail: data?.userEmail,
        userPhoneNo: data?.userPhoneNo,
        userImage: data?.userImage,
        coinsAmount: data?.coinsAmount ?? 0,
      };

      setProfile(safeProfile);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load your profile. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

    useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  const displayName =
    profile?.userName || profile?.name || "Player";

  const coinBalance =
    profile?.coinsAmount ?? layoutCoins ?? 0;

  return (
    <section className="up-page">
      <div className="up-page-heading">
        <div>
          <span className="up-eyebrow">ACCOUNT MANAGEMENT</span>
          <h2>My Profile</h2>
          <p>View your personal information and account details.</p>
        </div>

        <button
          type="button"
          className="up-refresh-button"
          onClick={loadProfile}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "up-spinning" : ""}
          />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="up-alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadProfile}>
            Retry
          </button>
        </div>
      )}

      <div className="up-profile-banner">
        <div className="up-avatar">
          {profile?.userImage ? (
            <img
              src={profile.userImage}
              alt={`${displayName}'s profile`}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <CircleUserRound size={54} strokeWidth={1.4} />
          )}
        </div>

        <div className="up-banner-info">
          <span className="up-account-label">
            <ShieldCheck size={15} />
            USER ACCOUNT
          </span>
          <h3>{displayName}</h3>
          <p>{formatValue(profile?.userEmail)}</p>
        </div>

        <div className="up-account-status">
          <span className="up-status-dot" />
          Session profile
        </div>
      </div>

      <div className="up-stats-grid">
        <article className="up-stat-card">
          <div className="up-stat-icon up-icon-coins">
            <Wallet size={21} />
          </div>
          <div>
            <span>Available Coins</span>
            <strong>
              {loading ? "—" : coinBalance}
            </strong>
          </div>
        </article>

        <article className="up-stat-card">
          <div className="up-stat-icon up-icon-id">
            <Hash size={21} />
          </div>
          <div>
            <span>Account ID</span>
            <strong>
              {loading ? "—" : formatValue(profile?.id)}
            </strong>
          </div>
        </article>
      </div>

      <div className="up-details-card">
        <div className="up-card-heading">
          <div className="up-heading-icon">
            <UserRound size={19} />
          </div>
          <div>
            <h3>Personal Information</h3>
            <p>Your registered account details</p>
          </div>
        </div>

        {loading && !profile?.userName ? (
          <div className="up-loading">
            <span className="up-loader" />
            Loading your information...
          </div>
        ) : (
          <div className="up-details-grid">
            <div className="up-detail-item">
              <span className="up-detail-label">
                <UserRound size={16} />
                Username
              </span>
              <strong>{formatValue(profile?.userName)}</strong>
            </div>

            <div className="up-detail-item">
              <span className="up-detail-label">
                <Mail size={16} />
                Email Address
              </span>
              <strong>{formatValue(profile?.userEmail)}</strong>
            </div>

            <div className="up-detail-item">
              <span className="up-detail-label">
                <Phone size={16} />
                Phone Number
              </span>
              <strong>{formatValue(profile?.userPhoneNo)}</strong>
            </div>

            <div className="up-detail-item">
              <span className="up-detail-label">
                <Hash size={16} />
                User ID
              </span>
              <strong>{formatValue(profile?.id)}</strong>
            </div>
          </div>
        )}

        <div className="up-info-note">
          <ShieldCheck size={17} />
          <p>
            Your profile information is retrieved from your existing
            authenticated account. Editing profile details is not enabled
            on this page.
          </p>
        </div>
      </div>
    </section>
  );
}
