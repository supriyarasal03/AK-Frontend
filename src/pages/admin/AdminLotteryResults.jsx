import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Pencil, RefreshCw, Trophy, X } from "lucide-react";

import AdminLayout from "./AdminLayout";
import {
  addCloseResult,
  addOpenResult,
  getLotteries,
  updateCloseResult,
} from "../../services/adminLotteriesService";
import getErrorMessage from "../../utils/getErrorMessage";
import {
  formatRunningDays,
  splitDays,
  todayISO,
  weekdayIndex,
  WEEK_DAYS,
} from "../../utils/lotteryHelpers";
import "../../styles/AdminDashboard.css";
import "../../styles/AdminPages.css";
import "../../styles/AdminLottery.css";

const REFRESH_INTERVAL_MS = 30000;

// kind: "open" | "close" | "editClose"
const MODAL_CONFIG = {
  open: {
    title: "Add Open Result",
    headerClass: "al-modal-header-open",
    submitLabel: "Submit open result",
    successText: "Open result added successfully.",
    send: addOpenResult,
  },
  close: {
    title: "Add Close Result",
    headerClass: "al-modal-header-close",
    submitLabel: "Submit close result",
    successText: "Close result added successfully.",
    send: addCloseResult,
  },
  editClose: {
    title: "Edit Close Result",
    headerClass: "al-modal-header-close",
    submitLabel: "Update close result",
    successText: "Close result updated successfully.",
    send: updateCloseResult,
  },
};

function ResultCell({ number, finalNo, date }) {
  if (!number) return <span className="al-muted">Not declared</span>;

  return (
    <div className="al-result">
      <strong>{number}</strong>
      <span>Final: {finalNo ?? "-"}</span>
      <small>{date || ""}</small>
    </div>
  );
}

function ResultModal({ kind, lottery, onClose, onDone }) {
  const config = MODAL_CONFIG[kind];
  const isOpen = kind === "open";
  const today = todayISO();

  const existingNo = kind === "editClose" ? lottery.closeResultNo || "" : "";
  const existingDate = kind === "editClose" ? lottery.closeDate || "" : "";

  const allowedDays = splitDays(lottery.lotteryRunnningDays);

  const [resultNo, setResultNo] = useState(existingNo);
  const [confirmNo, setConfirmNo] = useState(existingNo);
  const [date, setDate] = useState(existingDate);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Result number मध्ये फक्त अंक (leading zero जपण्यासाठी type="number" वापरत नाही)
  function digitsOnly(value) {
    return value.replace(/\D/g, "").slice(0, 3);
  }

  function handleDateChange(value) {
    setError("");

    if (value && allowedDays.length > 0) {
      const dayName = WEEK_DAYS[weekdayIndex(value)];
      if (!allowedDays.includes(dayName)) {
        setError(`This lottery runs only on: ${allowedDays.join(", ")}. Please select a valid day.`);
        setDate("");
        return;
      }
    }

    setDate(value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!resultNo) {
      setError("Please enter the result digit.");
      return;
    }
    if (resultNo !== confirmNo) {
      setError("Result does not match.");
      return;
    }
    if (!date) {
      setError("Please select the bid date.");
      return;
    }

    setSubmitting(true);
    try {
      if (isOpen) {
        await config.send(lottery.id, {
          openResultNo: resultNo,
          confirmOpenResultNo: confirmNo,
          openDate: date,
        });
      } else {
        await config.send(lottery.id, {
          closeResultNo: resultNo,
          confirmCloseResultNo: confirmNo,
          closeDate: date,
        });
      }
      onDone(`${config.successText} (${lottery.lotteryName})`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save result."));
      setSubmitting(false);
    }
  }

  return (
    <div
      className="al-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="al-modal" role="dialog" aria-modal="true" aria-label={config.title}>
        <div className={`al-modal-header ${config.headerClass}`}>
          <h3>{config.title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" disabled={submitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="al-modal-body">
            <div className="ak-field">
              <label htmlFor="resultLottery">Lottery Name</label>
              <input
                id="resultLottery"
                className="ak-input al-input-readonly"
                value={lottery.lotteryName}
                readOnly
              />
            </div>

            <div className="ak-field">
              <label htmlFor="resultType">Bid Type</label>
              <input
                id="resultType"
                className="ak-input al-input-readonly"
                value={isOpen ? "Open" : "Close"}
                readOnly
              />
            </div>

            <div className="ak-field">
              <label htmlFor="resultNo">Result Digit</label>
              <input
                id="resultNo"
                className="ak-input al-digit-input"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Enter result number"
                value={resultNo}
                onChange={(event) => setResultNo(digitsOnly(event.target.value))}
                autoFocus
              />
            </div>

            <div className="ak-field">
              <label htmlFor="confirmResultNo">Confirm Result Digit</label>
              <input
                id="confirmResultNo"
                className="ak-input al-digit-input"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Confirm result number"
                value={confirmNo}
                onChange={(event) => setConfirmNo(digitsOnly(event.target.value))}
              />
            </div>

            <div className="ak-field">
              <label htmlFor="resultDate">Bid Date</label>
              <input
                id="resultDate"
                className="ak-input"
                type="date"
                min={kind === "editClose" ? undefined : today}
                value={date}
                onChange={(event) => handleDateChange(event.target.value)}
              />
              <span className="al-hint">
                Runs on: {allowedDays.length ? allowedDays.join(", ") : "all days"}
              </span>
            </div>

            {error && (
              <p className="al-inline-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="al-modal-footer">
            <button
              type="button"
              className="ak-secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="ak-primary-button" disabled={submitting}>
              {submitting ? "Saving..." : config.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminLotteryResults() {
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState(null); // { kind, lottery }

  const loadLotteries = useCallback(async () => {
    try {
      const data = await getLotteries();
      setLotteries([...data].reverse());
      setError("");
    } catch (err) {
      setError(`Could not load lotteries: ${getErrorMessage(err, "Unknown error")}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLotteries();

    // जुना पान दर 1 सेकंदाला refresh करत होता; 30 सेकंद पुरेसे आहे
    const timer = setInterval(loadLotteries, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadLotteries]);

  function handleRefresh() {
    setLoading(true);
    setMessage("");
    loadLotteries();
  }

  const closeModal = useCallback(() => setModal(null), []);

  function handleDone(successText) {
    setModal(null);
    setMessage(successText);
    loadLotteries();
  }

  const today = todayISO();

  return (
    <AdminLayout>
      <section className="ak-dashboard">
        <div className="ak-welcome-row">
          <div>
            <div className="ak-eyebrow">
              <Trophy size={15} />
              LOTTERY MANAGEMENT
            </div>
            <h2>Lottery Results</h2>
            <p>Declare the open and close result of each lottery.</p>
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
              <h3>Results</h3>
              <p>The close result can be added only after the open result.</p>
            </div>
            <span className="ak-count-badge">{lotteries.length} lotteries</span>
          </div>

          {loading && lotteries.length === 0 ? (
            <div className="ak-empty-state">Loading lotteries...</div>
          ) : lotteries.length === 0 ? (
            <div className="ak-empty-state">No lotteries added yet</div>
          ) : (
            <div className="ak-table-wrapper">
              <table className="ak-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Lottery Name</th>
                    <th>Running Days</th>
                    <th>Open Result</th>
                    <th>Close Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lotteries.map((lottery, index) => {
                    const openDoneToday = Boolean(lottery.openResultNo) && lottery.openDate === today;
                    const closeDoneToday =
                      Boolean(lottery.closeResultNo) && lottery.closeDate === today;
                    // Backend: open result शिवाय close result स्वीकारत नाही
                    const canAddClose = Boolean(lottery.openDate);

                    return (
                      <tr key={lottery.id}>
                        <td>{index + 1}</td>
                        <td style={{ textTransform: "uppercase", fontWeight: 600 }}>
                          {lottery.lotteryName}
                        </td>
                        <td>{formatRunningDays(lottery.lotteryRunnningDays)}</td>
                        <td>
                          <ResultCell
                            number={lottery.openResultNo}
                            finalNo={lottery.openFinalNo}
                            date={lottery.openDate}
                          />
                        </td>
                        <td>
                          <ResultCell
                            number={lottery.closeResultNo}
                            finalNo={lottery.closeFinalNo}
                            date={lottery.closeDate}
                          />
                        </td>
                        <td>
                          <div className="ak-action-group">
                            <button
                              type="button"
                              className="ak-primary-button"
                              onClick={() => setModal({ kind: "open", lottery })}
                              disabled={openDoneToday}
                              title={openDoneToday ? "Today's open result is already declared" : ""}
                            >
                              {openDoneToday ? "Open declared" : "Open Result"}
                            </button>

                            {closeDoneToday ? (
                              <button
                                type="button"
                                className="ak-secondary-button"
                                onClick={() => setModal({ kind: "editClose", lottery })}
                              >
                                <Pencil size={14} />
                                Edit Close
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="ak-danger-button"
                                onClick={() => setModal({ kind: "close", lottery })}
                                disabled={!canAddClose}
                                title={canAddClose ? "" : "Declare the open result first"}
                              >
                                Close Result
                              </button>
                            )}
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

      {modal && (
        <ResultModal
          key={`${modal.kind}-${modal.lottery.id}`}
          kind={modal.kind}
          lottery={modal.lottery}
          onClose={closeModal}
          onDone={handleDone}
        />
      )}
    </AdminLayout>
  );
}
