
import { useCallback, useEffect, useState } from "react";
import api from "../../services/axiosClient";
import { useOutletContext } from "react-router-dom";
import "../../styles/SingleDigitGame.css";

const GAME_TYPE = "Single Digit";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export default function SingleDigitGame() {


     const { refreshUser } = useOutletContext();
  const [lotteries, setLotteries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedLottery, setSelectedLottery] = useState("");
  const [bidType, setBidType] = useState("");
  const [bidDate, setBidDate] = useState(today());
  const [bidDigit, setBidDigit] = useState("");
  const [bidPoints, setBidPoints] = useState("");
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const currentLottery = lotteries.find(
    (lottery) => lottery.lotteryName === selectedLottery
  );

  const loadEntries = useCallback(async () => {
    try {
      const response = await api.get("/api/single-digit/my-entries");
      setEntries(Array.isArray(response.data) ? [...response.data].reverse() : []);



          refreshUser();
    } catch (error) {
      console.error("Failed to load Single Digit entries:", error);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const response = await api.get("/api/user/session");
      setCoins(response.data?.coinsAmount ?? 0);
    } catch (error) {
      console.error("Failed to load user session:", error);
    }
  }, []);

   useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries();
    loadUser();

    // Replace this URL only if your existing project uses a different
    // endpoint to retrieve all lotteries.
    api.get("/api/allLotteries")
      .then((response) => {
        const data = response.data;
        setLotteries(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : []
        );
      })
      .catch((error) => {
        console.error("Failed to load lotteries:", error);
        setNotice({
          type: "error",
          message: "Could not load lotteries. Please try again.",
        });
      });

    const interval = setInterval(loadEntries, 10000);
    return () => clearInterval(interval);
  }, [loadEntries, loadUser]);

  function handleLotteryChange(value) {
    setSelectedLottery(value);
    setBidDate(today());
  }

  function handleDateChange(value) {
    if (!value) {
      setBidDate("");
      return;
    }

    if (value < today()) {
      setNotice({ type: "error", message: "Please select a valid date." });
      setBidDate("");
      return;
    }

    const runningDays = currentLottery?.lotteryRunnningDays;

    if (runningDays) {
      const allowedDays = runningDays
        .split(",")
        .map((day) => day.trim().toUpperCase())
        .filter((day) => day in DAYS);

      const selectedDay = new Date(`${value}T12:00:00`).getDay();

      if (
        allowedDays.length > 0 &&
        !allowedDays.some((day) => DAYS[day] === selectedDay)
      ) {
        setNotice({
          type: "error",
          message: `Please select only on these days: ${allowedDays
            .map((day) => day.toLowerCase())
            .join(", ")}`,
        });
        setBidDate("");
        return;
      }
    }

    setBidDate(value);
    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    if (!selectedLottery || !bidType || !bidDate) {
      setNotice({ type: "error", message: "Please complete all fields." });
      return;
    }

    if (bidDate < today()) {
      setNotice({ type: "error", message: "Please select a valid date." });
      return;
    }

    const digit = Number(bidDigit);
    const points = Number(bidPoints);

    if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
      setNotice({
        type: "error",
        message: "Bid Digit must be a whole number from 0 to 9.",
      });
      return;
    }

    if (!Number.isInteger(points) || points <= 0) {
      setNotice({
        type: "error",
        message: "Points must be a positive whole number.",
      });
      return;
    }

    const runningDays = currentLottery?.lotteryRunnningDays;
    if (runningDays) {
      const allowedDays = runningDays
        .split(",")
        .map((day) => day.trim().toUpperCase())
        .filter((day) => day in DAYS);
      const selectedDay = new Date(`${bidDate}T12:00:00`).getDay();

      if (
        allowedDays.length > 0 &&
        !allowedDays.some((day) => DAYS[day] === selectedDay)
      ) {
        setNotice({
          type: "error",
          message: `This lottery runs on: ${allowedDays
            .map((day) => day.toLowerCase())
            .join(", ")}`,
        });
        return;
      }
    }

    setLoading(true);

    try {
      const response = await api.post("/api/single-digit", {
        entryGameType: GAME_TYPE,
        entryLotteryName: selectedLottery,
        entryBidType: bidType,
        entryBidDate: bidDate,
        entryBitNumber: String(digit),
        entryBitPoints: points,
      });

      if (response.data?.coinsAmount != null) {
        setCoins(response.data.coinsAmount);
      } else {
        await loadUser();
      }

      setNotice({
        type: "success",
        message: "Your bid has been submitted successfully!",
      });

      setBidType("");
      setBidDigit("");
      setBidPoints("");
      await loadEntries();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sd-page">
      <section className="sd-banner">
        <span className="sd-eyebrow">AK_GAME · PLAY</span>
        <h2>Single Digit</h2>
        <p>Let's play with Single Digit</p>
      </section>

      <div className="sd-balance">
        <span>Available coins</span>
        <strong>{coins}</strong>
      </div>

      {notice && (
        <div
          className={`sd-notice sd-notice-${notice.type}`}
          role="status"
        >
          <span>{notice.message}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="sd-content-grid">
        <section className="sd-card">
          <div className="sd-card-heading">
            <span>01</span>
            <div>
              <h3>Place your bid</h3>
              <p>Enter your Single Digit details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="sd-form">
            <label>
              Game Type
              <input value={GAME_TYPE} readOnly />
            </label>

            <label>
              Lottery Name
              <select
                value={selectedLottery}
                onChange={(event) => handleLotteryChange(event.target.value)}
                required
              >
                <option value="">Select lottery</option>
                {lotteries.map((lottery, index) => (
                  <option
                    key={lottery.id ?? lottery.lotteryName ?? index}
                    value={lottery.lotteryName}
                  >
                    {lottery.lotteryName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Bid Type
              <select
                value={bidType}
                onChange={(event) => setBidType(event.target.value)}
                required
              >
                <option value="">Select bid type</option>
                <option value="Open">Open</option>
                <option value="Close">Close</option>
              </select>
            </label>

            <label>
              Bid Date
              <input
                type="date"
                value={bidDate}
                min={today()}
                onChange={(event) => handleDateChange(event.target.value)}
                required
              />
            </label>

            <label>
              Bid Digit
              <input
                type="number"
                min="0"
                max="9"
                step="1"
                value={bidDigit}
                onChange={(event) => setBidDigit(event.target.value)}
                placeholder="Enter digit (0–9)"
                required
              />
            </label>

            <label>
              Points
              <input
                type="number"
                min="1"
                step="1"
                value={bidPoints}
                onChange={(event) => setBidPoints(event.target.value)}
                placeholder="Enter points"
                required
              />
            </label>

            <button
              className="sd-submit"
              type="submit"
              disabled={loading || lotteries.length === 0}
            >
              {loading ? "Submitting..." : "Add Bid"}
            </button>
          </form>
        </section>

        <section className="sd-card sd-live-card">
          <div className="sd-card-heading">
            <span>02</span>
            <div>
              <h3>Live Action</h3>
              <p>Your Single Digit entries</p>
            </div>
            <button
              className="sd-refresh"
              type="button"
              onClick={() => {
                loadEntries();
                loadUser();
              }}
            >
              Refresh
            </button>
          </div>

          <div className="sd-table-wrap">
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Bid Date</th>
                  <th>Lottery</th>
                  <th>Bid Type</th>
                  <th>Digit</th>
                  <th>Points</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="sd-empty">
                      Your Single Digit live action is empty.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr key={entry.id ?? `${entry.entryBidDate}-${index}`}>
                      <td>{entry.entryBidDate}</td>
                      <td>{entry.entryLotteryName}</td>
                      <td>
                        <span className="sd-type">{entry.entryBidType}</span>
                      </td>
                      <td>{entry.entryBitNumber}</td>
                      <td>{entry.entryBitPoints}</td>
                      <td>
                        <span
                          className={
                            entry.finalResult
                              ? "sd-result"
                              : "sd-result sd-result-pending"
                          }
                        >
                          {entry.finalResult || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
