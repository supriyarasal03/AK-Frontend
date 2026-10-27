import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

import {
  getPaymentQr,
  sendCoinRequest,
  sendWithdrawRequest,
} from "../../services/userService";
import getErrorMessage from "../../utils/getErrorMessage.js";

// mode "add"      -> जुना "Send Coins Request" (QR दाखवतो, किमान 10)
// mode "withdraw" -> जुना "Withdraw Coins Request" (किमान 100)
const MODES = {
  add: {
    title: "Send Request For Deposit",
    min: 10,
    showQr: true,
    send: sendCoinRequest,
    successText: "Your coin request was sent.",
  },
  withdraw: {
    title: "Send Withdraw Coins Request",
    min: 100,
    showQr: false,
    send: sendWithdrawRequest,
    successText: "Your withdraw request was sent.",
  },
};

// Parent हे modal उघडताना mount करतो आणि बंद करताना unmount करतो,
// त्यामुळे प्रत्येक वेळी state आपोआप reset होते.
export default function CoinRequestModal({ mode, onClose, onSuccess }) {
  const config = MODES[mode];

  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // null = लोड होत आहे, "" = QR उपलब्ध नाही
  const [qr, setQr] = useState(config.showQr ? null : "");

  useEffect(() => {
    if (!config.showQr) return undefined;

    let cancelled = false;

    getPaymentQr()
      .then((path) => {
        if (!cancelled) setQr(path);
      })
      .catch(() => {
        if (!cancelled) setQr("");
      });

    return () => {
      cancelled = true;
    };
  }, [config.showQr]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const value = Number(amount);

    if (!value || value < config.min) {
      setError(`Please enter at least ${config.min} Rs.`);
      return;
    }

    setSubmitting(true);

    try {
      await config.send(value);
      setSuccess(config.successText);
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send request"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="ud-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="ud-modal" role="dialog" aria-modal="true" aria-label={config.title}>
        <div className={`ud-modal-header ud-modal-header-${mode}`}>
          <h3>{config.title}</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="ud-modal-body ud-modal-success">
            <CheckCircle2 size={56} />
            <h4>{success}</h4>
            <button type="button" className="ud-btn ud-btn-primary" onClick={onClose}>
              OK
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="ud-modal-body">
              {error && (
                <div className="ud-alert" role="alert">
                  <CircleAlert size={18} />
                  <span>{error}</span>
                </div>
              )}

              <label htmlFor="coinAmount">Enter Coins (Rs.)</label>
              <input
                id="coinAmount"
                type="number"
                min={config.min}
                placeholder="Enter amount in Rs."
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                autoFocus
              />
              <small>Minimum request {config.min} Rs.</small>

              {config.showQr && (
                <div className="ud-qr">
                  <span>Scan to Pay</span>
                  {qr === null ? (
                    <p>Loading QR code...</p>
                  ) : qr ? (
                    <img src={qr} alt="Payment QR code" width="200" height="200" />
                  ) : (
                    <p>QR code is not available right now.</p>
                  )}
                </div>
              )}
            </div>

            <div className="ud-modal-footer">
              <button type="button" className="ud-btn ud-btn-ghost" onClick={onClose}>
                Close
              </button>
              <button
                type="submit"
                className={`ud-btn ${mode === "add" ? "ud-btn-danger" : "ud-btn-success"}`}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
