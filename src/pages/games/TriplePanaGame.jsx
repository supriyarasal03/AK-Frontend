
import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../services/axiosClient";
import "../../styles/TriplePanaGame.css";

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialForm = {
  entryGameType: "Triple Pana",
  entryLotteryName: "",
  entryBidType: "",
  entryBidDate: getLocalDate(),
  entryBitNumber: "",
  entryBitPoints: "",
};

const dayNumbers = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function getRunningDays(lottery) {
  const value =
    lottery?.lotteryRunnningDays ??
    lottery?.lotteryRunningDays ??
    lottery?.runningDays ??
    "";

  if (Array.isArray(value)) {
    return value.map((day) => String(day).trim().toUpperCase());
  }

  return String(value)
    .split(",")
    .map((day) => day.trim().toUpperCase())
    .filter(Boolean);
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.message) {
    return data.message;
  }

  if (error?.response?.status === 401) {
    return "Please log in before placing an entry.";
  }

  return "Something went wrong. Please try again.";
}

export default function TriplePanaGame() {
  const [form, setForm] = useState(initialForm);
  const [lotteries, setLotteries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [remainingCoins, setRemainingCoins] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const selectedLottery = lotteries.find(
    (lottery) => lottery.lotteryName === form.entryLotteryName
  );

  const loadLotteries = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/allLotteries");
      setLotteries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    }
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const response = await axiosClient.get(
        "/api/triple-pana/my-entries"
      );

      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setEntries([]);

      if (error?.response?.status === 401) {
        setNotice({
          type: "error",
          message: "Please log in to view your Triple Pana entries.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserSession = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/user/session");
      const coins = response.data?.coinsAmount ?? 0;

      setRemainingCoins(coins);

      const storedUser = sessionStorage.getItem("loggedUser");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          user.coinsAmount = coins;
          sessionStorage.setItem("loggedUser", JSON.stringify(user));
        } catch {
          // Ignore invalid sessionStorage data.
        }
      }
    } catch {
      setRemainingCoins(null);
    }
  }, []);

  useEffect(() => {
    loadLotteries();
    loadEntries();
    loadUserSession();

    const intervalId = window.setInterval(() => {
      loadEntries();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [loadLotteries, loadEntries, loadUserSession]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setNotice(null);
  };

  const handleLotteryChange = (event) => {
    const lotteryName = event.target.value;

    setForm((previous) => ({
      ...previous,
      entryLotteryName: lotteryName,
      entryBidDate: "",
    }));

    setNotice(null);
  };

  const validateForm = () => {
    if (!form.entryLotteryName) {
      return "Please select a lottery.";
    }

    if (!form.entryBidType) {
      return "Please select Open or Close.";
    }

    if (!form.entryBidDate) {
      return "Please select a bid date.";
    }

    if (form.entryBidDate < getLocalDate()) {
      return "Please select today or a future date.";
    }

    if (selectedLottery) {
      const runningDays = getRunningDays(selectedLottery);

      if (runningDays.length > 0) {
        const selectedDate = new Date(
          `${form.entryBidDate}T12:00:00`
        );
        const selectedDayName = [
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
        ][selectedDate.getDay()];

        if (!runningDays.includes(selectedDayName)) {
          return `Please select only on these days: ${runningDays
            .map((day) => day.toLowerCase())
            .join(", ")}.`;
        }
      }
    }

    // The original HTML uses a number input and comments out
    // the list of 000, 111, 222 ... 999 options.
    if (!/^\d{3}$/.test(String(form.entryBitNumber))) {
      return "Please enter a three-digit Triple Pana number.";
    }

    const points = Number(form.entryBitPoints);

    if (
      form.entryBitPoints === "" ||
      !Number.isInteger(points) ||
      points < 10 ||
      points > 500
    ) {
      return "Points must be between 10 and 500.";
    }

    if (remainingCoins !== null && points > Number(remainingCoins)) {
      return `Insufficient balance. Your coins: ${remainingCoins}`;
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);

    const validationError = validateForm();

    if (validationError) {
      setNotice({
        type: "error",
        message: validationError,
      });
      return;
    }

    const payload = {
      entryGameType: "Triple Pana",
      entryLotteryName: form.entryLotteryName,
      entryBidType: form.entryBidType,
      entryBidDate: form.entryBidDate,
      entryBitNumber: String(form.entryBitNumber),
      entryBitPoints: Number(form.entryBitPoints),
    };

    setSubmitting(true);

    try {
      const response = await axiosClient.post(
        "/api/triple-pana",
        payload
      );

      if (response.data?.remainingCoins !== undefined) {
        setRemainingCoins(response.data.remainingCoins);

        const storedUser = sessionStorage.getItem("loggedUser");

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            user.coinsAmount = response.data.remainingCoins;
            sessionStorage.setItem(
              "loggedUser",
              JSON.stringify(user)
            );
          } catch {
            // Ignore invalid sessionStorage data.
          }
        }
      }

      setNotice({
        type: "success",
        message: `Triple Pana entry submitted successfully!${
          response.data?.remainingCoins !== undefined
            ? ` Remaining coins: ${response.data.remainingCoins}`
            : ""
        }`,
      });

      setForm({
        ...initialForm,
        entryBidDate: getLocalDate(),
      });

      await Promise.all([
        loadEntries(),
        loadUserSession(),
      ]);
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const recentEntries = [...entries].reverse().slice(0, 5);

  return (
    <main className="tp-page">
      <section className="tp-banner">
        <div className="tp-banner-content">
          <span className="tp-eyebrow">AK GAME</span>
          <h1>TRIPLE PANA</h1>
          <p>Place your Triple Pana entry</p>
        </div>
      </section>

      <div className="tp-container">
        {remainingCoins !== null && (
          <div className="tp-balance">
            <span className="tp-balance-label">Available Coins</span>
            <strong>{remainingCoins}</strong>
          </div>
        )}

        {notice && (
          <div
            className={`tp-notice tp-notice-${notice.type}`}
            role="alert"
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <div className="tp-layout">
          <section className="tp-card tp-form-card">
            <div className="tp-card-header">
              <h2>Entry</h2>
              <span>Triple Pana</span>
            </div>

            <form className="tp-form" onSubmit={handleSubmit}>
              <div className="tp-field">
                <label htmlFor="tp-game-type">Game Type</label>
                <input
                  id="tp-game-type"
                  value="Triple Pana"
                  readOnly
                />
              </div>

              <div className="tp-field">
                <label htmlFor="tp-lottery">Lottery Name</label>
                <select
                  id="tp-lottery"
                  name="entryLotteryName"
                  value={form.entryLotteryName}
                  onChange={handleLotteryChange}
                  required
                >
                  <option value="">Select lottery</option>
                  {lotteries.map((lottery) => (
                    <option
                      key={lottery.id ?? lottery.lotteryName}
                      value={lottery.lotteryName}
                    >
                      {lottery.lotteryName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tp-field">
                <label htmlFor="tp-bid-type">Bid Type</label>
                <select
                  id="tp-bid-type"
                  name="entryBidType"
                  value={form.entryBidType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select bid type</option>
                  <option value="Open">Open</option>
                  <option value="Close">Close</option>
                </select>
              </div>

              <div className="tp-field">
                <label htmlFor="tp-bid-date">Bid Date</label>
                <input
                  id="tp-bid-date"
                  type="date"
                  name="entryBidDate"
                  value={form.entryBidDate}
                  min={getLocalDate()}
                  onChange={handleChange}
                  required
                />
                {selectedLottery && (
                  <small className="tp-help">
                    Running days:{" "}
                    {getRunningDays(selectedLottery).length
                      ? getRunningDays(selectedLottery)
                          .map(
                            (day) =>
                              day.charAt(0) +
                              day.slice(1).toLowerCase()
                          )
                          .join(", ")
                      : "Not specified"}
                  </small>
                )}
              </div>

              <div className="tp-field">
                <label htmlFor="tp-number">Bid Digit</label>
                <input
                  id="tp-number"
                  type="number"
                  name="entryBitNumber"
                  value={form.entryBitNumber}
                  onChange={handleChange}
                  placeholder="Enter three-digit number"
                  min="0"
                  max="999"
                  inputMode="numeric"
                  required
                />
                <small className="tp-help">
                  Enter a three-digit number, including leading zeros.
                </small>
              </div>

              <div className="tp-field">
                <label htmlFor="tp-points">Points</label>
                <input
                  id="tp-points"
                  type="number"
                  name="entryBitPoints"
                  value={form.entryBitPoints}
                  onChange={handleChange}
                  placeholder="Enter points (10–500)"
                  min="10"
                  max="500"
                  step="1"
                  required
                />
              </div>

              <button
                className="tp-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Add Entry"}
              </button>
            </form>
          </section>

          <section className="tp-card tp-history-card">
            <div className="tp-history-header">
              <div>
                <span className="tp-eyebrow">YOUR ACTIVITY</span>
                <h2>Live Action</h2>
              </div>

              <button
                type="button"
                className="tp-refresh"
                onClick={() => {
                  loadEntries();
                  loadUserSession();
                }}
              >
                Refresh
              </button>
            </div>

            <div className="tp-table-wrap">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Bid Date</th>
                    <th>Lottery</th>
                    <th>Bid Type</th>
                    <th>Bid Digit</th>
                    <th>Points</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="tp-empty">
                        Loading entries...
                      </td>
                    </tr>
                  ) : recentEntries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="tp-empty">
                        Your Triple Pana Live Action is empty.
                      </td>
                    </tr>
                  ) : (
                    recentEntries.map((entry, index) => (
                      <tr
                        key={
                          entry.id ??
                          `${entry.entryBidDate}-${entry.entryLotteryName}-${entry.entryBidType}-${index}`
                        }
                      >
                        <td>{entry.entryBidDate ?? "—"}</td>
                        <td>{entry.entryLotteryName ?? "—"}</td>
                        <td>
                          <span
                            className={`tp-type tp-type-${String(
                              entry.entryBidType ?? ""
                            ).toLowerCase()}`}
                          >
                            {entry.entryBidType ?? "—"}
                          </span>
                        </td>
                        <td className="tp-number-cell">
                          {entry.entryBitNumber ?? "—"}
                        </td>
                        <td>{entry.entryBitPoints ?? "—"}</td>
                        <td>
                          <span className="tp-result">
                            {entry.finalResult || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="tp-history-note">
              Showing the latest five entries. Results refresh automatically.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
