
import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../services/axiosClient";
import "../../styles/FullSangamGame.css";
import { useOutletContext } from "react-router-dom";

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getErrorMessage = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function FullSangamGame() {
    const { refreshUser } = useOutletContext();
  const [lotteries, setLotteries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [coins, setCoins] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState(null);

  const [form, setForm] = useState({
    entryGameType: "Full Sangam",
    entryLotteryName: "",
    entryBidType: "JODI SANGAM",
    entryBidDate: getToday(),
    entryBitNumber: "",
    entryBitPoints: "",
  });

  const selectedLottery = lotteries.find(
    (lottery) => lottery.lotteryName === form.entryLotteryName
  );

  const loadLotteries = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/allLotteries");
      setLotteries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setPageError(`Unable to load lotteries: ${getErrorMessage(error)}`);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/full-sangam/my-entries");
      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (error?.response?.status === 401) {
        setPageError("Please log in to view your Full Sangam entries.");
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

  // Accept digits and format them as XXX-X X-XXX.
  const formatFullSangam = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length === 4) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 4)} ${digits.slice(4)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 4)} ${digits.slice(4, 5)}-${digits.slice(5)}`;
  };

  const handleDigitChange = (event) => {
    setForm((previous) => ({
      ...previous,
      entryBitNumber: formatFullSangam(event.target.value),
    }));
    setNotice(null);
  };

  const validateForm = () => {
    if (!form.entryLotteryName) {
      return "Please select a lottery.";
    }

    if (!form.entryBidDate) {
      return "Please select a bid date.";
    }

    if (form.entryBidDate < getToday()) {
      return "Please select today or a future date.";
    }

    const runningDays =
      selectedLottery?.lotteryRunnningDays ??
      selectedLottery?.lotteryRunningDays ??
      selectedLottery?.runningDays;

    if (runningDays) {
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

    if (!/^\d{3}-\d\s\d-\d{3}$/.test(form.entryBitNumber)) {
      return "Format must be like 456-1 5-678.";
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
        entryGameType: "Full Sangam",
        entryLotteryName: form.entryLotteryName,
        entryBidType: "JODI SANGAM",
        entryBidDate: form.entryBidDate,
        entryBitNumber: form.entryBitNumber,
        entryBitPoints: Number(form.entryBitPoints),
      };

      const response = await axiosClient.post(
        "/api/full-sangam",
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
            // Keep the server response as the source of truth.
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
        entryGameType: "Full Sangam",
        entryLotteryName: "",
        entryBidType: "JODI SANGAM",
        entryBidDate: getToday(),
        entryBitNumber: "",
        entryBitPoints: "",
      });

      await Promise.all([loadEntries(), loadCoins()]);


        refreshUser();
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const recentEntries = [...entries].reverse().slice(0, 5);

  return (
    <main className="full-sangam-page">
      <section className="full-sangam-banner">
        <span className="full-sangam-eyebrow">AK Matka Games</span>
        <h1>Full Sangam</h1>
        <p>Place your Full Sangam entry and follow your recent results.</p>
      </section>

      <div className="full-sangam-content">
        <section className="full-sangam-card">
          <div className="full-sangam-card-heading">
            <div>
              <span className="full-sangam-eyebrow">Place your bid</span>
              <h2>Entry Details</h2>
            </div>

            <div className="full-sangam-balance">
              <span>Available coins</span>
              <strong>{coins === null ? "—" : coins}</strong>
            </div>
          </div>

          <form className="full-sangam-form" onSubmit={handleSubmit}>
            <label>
              Game Type
              <input value="Full Sangam" readOnly />
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
                min={getToday()}
                value={form.entryBidDate}
                onChange={updateForm}
                required
              />
            </label>

            <label>
              Bid Type
              <input value="JODI SANGAM" readOnly />
            </label>

            <label>
              Bid Digit
              <input
                name="entryBitNumber"
                value={form.entryBitNumber}
                onChange={handleDigitChange}
                placeholder="Example: 456-1 5-678"
                maxLength={11}
                inputMode="numeric"
                autoComplete="off"
                required
              />
              <small>
                Format: 3 digits - 1 digit, space, 1 digit - 3 digits.
                Example: 456-1 5-678.
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
                className={`full-sangam-notice ${notice.type}`}
                role="status"
              >
                {notice.message}
              </div>
            )}

            {pageError && (
              <div className="full-sangam-notice error" role="alert">
                {pageError}
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Add Entry"}
            </button>
          </form>
        </section>

        <section className="full-sangam-card full-sangam-history">
          <div className="full-sangam-card-heading">
            <div>
              <span className="full-sangam-eyebrow">Recent activity</span>
              <h2>Live Action</h2>
            </div>

            <button
              type="button"
              className="full-sangam-refresh"
              onClick={() => {
                loadEntries();
                loadCoins();
              }}
            >
              Refresh
            </button>
          </div>

          <div className="full-sangam-table-wrap">
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
                    <td colSpan="6" className="full-sangam-empty">
                      No Full Sangam entries found.
                    </td>
                  </tr>
                ) : (
                  recentEntries.map((entry, index) => (
                    <tr key={entry.id ?? `${entry.entryBidDate}-${index}`}>
                      <td>{entry.entryBidDate || "-"}</td>
                      <td>{entry.entryLotteryName || "-"}</td>
                      <td>{entry.entryBidType || "JODI SANGAM"}</td>
                      <td className="full-sangam-digit">
                        {entry.entryBitNumber || "-"}
                      </td>
                      <td>{entry.entryBitPoints ?? 0}</td>
                      <td>
                        <span className="full-sangam-result">
                          {entry.finalResult || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="full-sangam-footnote">
            Entries refresh automatically every 5 seconds.
          </p>
        </section>
      </div>
    </main>
  );
}
