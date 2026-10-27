
import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../services/axiosClient";
import "../../styles/HalfSangamGame.css";

const todayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getErrorMessage = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function HalfSangamGame() {
  const [lotteries, setLotteries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [coins, setCoins] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState(null);

  const [form, setForm] = useState({
    entryGameType: "Half Sangam",
    entryLotteryName: "",
    entryBidType: "",
    entryBidDate: todayString(),
    entryBitNumber: "",
    entryBitPoints: "",
  });

  const selectedLottery = lotteries.find(
    (lottery) => lottery.lotteryName === form.entryLotteryName
  );

  const loadLotteries = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/allLotteries");
      const data = response.data;
      setLotteries(Array.isArray(data) ? data : []);
    } catch (error) {
      setPageError(`Unable to load lotteries: ${getErrorMessage(error)}`);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/half-sangam/my-entries");
      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (error?.response?.status === 401) {
        setPageError("Please log in to view your Half Sangam entries.");
      }
    }
  }, []);

  const loadCoins = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/user/session");
      setCoins(response.data?.coinsAmount ?? 0);
    } catch {
      setCoins(null);
    }
  }, []);

  useEffect(() => {
    loadLotteries();
    loadEntries();
    loadCoins();

    const intervalId = window.setInterval(loadEntries, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadLotteries, loadEntries, loadCoins]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setNotice(null);
    setPageError("");
  };

  const handleBidTypeChange = (event) => {
    setForm((previous) => ({
      ...previous,
      entryBidType: event.target.value,
      entryBitNumber: "",
    }));
    setNotice(null);
  };

  const formatDigit = (rawValue, bidType) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 4);

    if (bidType === "Open Pana") {
      return digits.length > 3
        ? `${digits.slice(0, 3)}-${digits.slice(3)}`
        : digits;
    }

    if (bidType === "Close Pana") {
      return digits.length > 1
        ? `${digits.slice(0, 1)}-${digits.slice(1)}`
        : digits;
    }

    return digits;
  };

  const handleDigitChange = (event) => {
    const value = formatDigit(event.target.value, form.entryBidType);
    setForm((previous) => ({ ...previous, entryBitNumber: value }));
    setNotice(null);
  };

  const validateForm = () => {
    if (!form.entryLotteryName) return "Please select a lottery.";
    if (!form.entryBidType) return "Please select Open Pana or Close Pana.";
    if (!form.entryBidDate) return "Please select a bid date.";
    if (form.entryBidDate < todayString()) {
      return "Please select today or a future date.";
    }

    const runningDays =
      selectedLottery?.lotteryRunnningDays ??
      selectedLottery?.lotteryRunningDays ??
      selectedLottery?.runningDays;

    if (runningDays && form.entryBidDate) {
      const allowedDays = runningDays
        .split(",")
        .map((day) => day.trim().toUpperCase());

      const selectedDay = new Date(
        `${form.entryBidDate}T12:00:00`
      )
        .toLocaleDateString("en-US", { weekday: "long" })
        .toUpperCase();

      if (!allowedDays.includes(selectedDay)) {
        return `This lottery runs on: ${allowedDays.join(", ")}. Please select an allowed day.`;
      }
    }

    if (form.entryBidType === "Open Pana" &&
        !/^\d{3}-\d$/.test(form.entryBitNumber)) {
      return "Open Pana must use XXX-X format, for example 456-1.";
    }

    if (form.entryBidType === "Close Pana" &&
        !/^\d-\d{3}$/.test(form.entryBitNumber)) {
      return "Close Pana must use X-XXX format, for example 5-678.";
    }

    const points = Number(form.entryBitPoints);
    if (!Number.isInteger(points) || points < 10 || points > 500) {
      return "Points must be a whole number between 10 and 500.";
    }

    if (coins !== null && points > coins) {
      return `Insufficient balance. Your coins: ${coins}.`;
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);
    setPageError("");

    const validationError = validateForm();
    if (validationError) {
      setNotice({ type: "error", message: validationError });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        entryGameType: "Half Sangam",
        entryLotteryName: form.entryLotteryName,
        entryBidType: form.entryBidType,
        entryBidDate: form.entryBidDate,
        entryBitNumber: form.entryBitNumber,
        entryBitPoints: Number(form.entryBitPoints),
      };

      const response = await axiosClient.post(
        "/api/half-sangam",
        payload
      );

      const remainingCoins = response.data?.remainingCoins;
      if (remainingCoins !== undefined) {
        setCoins(remainingCoins);

        const storedUser = sessionStorage.getItem("loggedUser");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            user.coinsAmount = remainingCoins;
            sessionStorage.setItem("loggedUser", JSON.stringify(user));
          } catch {
            // Ignore malformed session storage; server response remains authoritative.
          }
        }
      }

      setNotice({
        type: "success",
        message: `Entry added successfully! Remaining coins: ${
          remainingCoins ?? "updated"
        }.`,
      });

      setForm({
        entryGameType: "Half Sangam",
        entryLotteryName: "",
        entryBidType: "",
        entryBidDate: todayString(),
        entryBitNumber: "",
        entryBitPoints: "",
      });

      await Promise.all([loadEntries(), loadCoins()]);
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const recentEntries = [...entries]
    .reverse()
    .slice(0, 5);

  return (
    <main className="half-sangam-page">
      <section className="half-sangam-banner">
        <span className="half-sangam-eyebrow">AK Matka Games</span>
        <h1>Half Sangam</h1>
        <p>Choose your lottery, select your bid type, and place your entry.</p>
      </section>

      <div className="half-sangam-content">
        <section className="half-sangam-card">
          <div className="half-sangam-card-heading">
            <div>
              <span className="half-sangam-eyebrow">Place your bid</span>
              <h2>Entry Details</h2>
            </div>
            <div className="half-sangam-balance">
              <span>Available coins</span>
              <strong>{coins === null ? "—" : coins}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="half-sangam-form">
            <label>
              Game Type
              <input value="Half Sangam" readOnly />
            </label>

            <label>
              Lottery Name
              <select
                name="entryLotteryName"
                value={form.entryLotteryName}
                onChange={updateForm}
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
            </label>

            <label>
              Bid Date
              <input
                type="date"
                name="entryBidDate"
                min={todayString()}
                value={form.entryBidDate}
                onChange={updateForm}
                required
              />
            </label>

            <label>
              Bid Type
              <select
                name="entryBidType"
                value={form.entryBidType}
                onChange={handleBidTypeChange}
                required
              >
                <option value="">Select bid type</option>
                <option value="Open Pana">Open Pana (XXX-X)</option>
                <option value="Close Pana">Close Pana (X-XXX)</option>
              </select>
            </label>

            <label>
              Bid Digit
              <input
                name="entryBitNumber"
                value={form.entryBitNumber}
                onChange={handleDigitChange}
                placeholder={
                  form.entryBidType === "Close Pana"
                    ? "Example: 5-678"
                    : "Example: 456-1"
                }
                inputMode="numeric"
                maxLength={5}
                disabled={!form.entryBidType}
                required
              />
              <small>
                {form.entryBidType === "Open Pana"
                  ? "Enter 3 digits, then 1 digit: 456-1"
                  : form.entryBidType === "Close Pana"
                    ? "Enter 1 digit, then 3 digits: 5-678"
                    : "Select a bid type to enter your digit."}
              </small>
            </label>

            <label>
              Bid Points
              <input
                type="number"
                name="entryBitPoints"
                value={form.entryBitPoints}
                onChange={updateForm}
                placeholder="10–500"
                min="10"
                max="500"
                step="1"
                required
              />
            </label>

            {notice && (
              <div
                className={`half-sangam-notice ${notice.type}`}
                role="status"
              >
                {notice.message}
              </div>
            )}

            {pageError && (
              <div className="half-sangam-notice error" role="alert">
                {pageError}
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Add Entry"}
            </button>
          </form>
        </section>

        <section className="half-sangam-card half-sangam-history">
          <div className="half-sangam-card-heading">
            <div>
              <span className="half-sangam-eyebrow">Recent activity</span>
              <h2>Live Action</h2>
            </div>
            <button
              type="button"
              className="half-sangam-refresh"
              onClick={() => {
                loadEntries();
                loadCoins();
              }}
            >
              Refresh
            </button>
          </div>

          <div className="half-sangam-table-wrap">
            <table>
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
                {recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="half-sangam-empty">
                      No Half Sangam entries found.
                    </td>
                  </tr>
                ) : (
                  recentEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.entryBidDate}</td>
                      <td>{entry.entryLotteryName}</td>
                      <td>{entry.entryBidType}</td>
                      <td className="half-sangam-digit">
                        {entry.entryBitNumber}
                      </td>
                      <td>{entry.entryBitPoints}</td>
                      <td>
                        <span className="half-sangam-result">
                          {entry.finalResult || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="half-sangam-footnote">
            Entries refresh automatically every 5 seconds.
          </p>
        </section>
      </div>
    </main>
  );
}
