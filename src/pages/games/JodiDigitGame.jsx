
import { useCallback, useEffect, useState } from "react";
import { useNavigate ,useOutletContext } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import api from "../../services/axiosClient";
import "../../styles/SingleDigitGame.css";

const GAME_TYPE = "Jodi Digit";

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

export default function JodiDigitGame() {
  const navigate = useNavigate();
   const { refreshUser } = useOutletContext();

  const [lotteries, setLotteries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [lotteryName, setLotteryName] = useState("");
  const [bidType, setBidType] = useState("");
  const [bidDate, setBidDate] = useState(today());
  const [bidNumber, setBidNumber] = useState("");
  const [points, setPoints] = useState("");
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const selectedLottery = lotteries.find(
    (lottery) => lottery.lotteryName === lotteryName
  );

  const loadLotteries = useCallback(async () => {
    try {
      const response = await api.get("/api/allLotteries");
      const data = response.data;

      setLotteries(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : []


            
      );

          refreshUser();
    } catch (error) {
      console.error("Failed to load lotteries:", error);
      setNotice({
        type: "error",
        message: "Unable to load lotteries. Please try again.",
      });
    }
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const response = await api.get("/api/jodi-digit/my-entries");
      setEntries(
        Array.isArray(response.data) ? [...response.data].reverse() : []
      );
    } catch (error) {
      console.error("Failed to load Jodi Digit entries:", error);
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
    loadLotteries();
    loadEntries();
    loadUser();
    const timer = setInterval(loadEntries, 10000);

    return () => clearInterval(timer);
  }, [loadLotteries, loadEntries, loadUser]);

  function handleDateChange(value) {
    if (!value) {
      setBidDate("");
      return;
    }

    if (value < today()) {
      setBidDate("");
      setNotice({
        type: "error",
        message: "Please select today or a future date.",
      });
      return;
    }

    const runningDays = selectedLottery?.lotteryRunnningDays;

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
        setBidDate("");
        setNotice({
          type: "error",
          message: `This lottery runs on: ${allowedDays
            .map((day) => day.toLowerCase())
            .join(", ")}`,
        });
        return;
      }
    }

    setBidDate(value);
    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    if (!lotteryName || !bidType || !bidDate || !bidNumber || !points) {
      setNotice({
        type: "error",
        message: "Please complete all fields.",
      });
      return;
    }

    if (bidDate < today()) {
      setNotice({
        type: "error",
        message: "Please select today or a future date.",
      });
      return;
    }

    // Keep the number as text so values such as 07 retain their leading zero.
    if (!/^\d{2}$/.test(bidNumber)) {
      setNotice({
        type: "error",
        message: "Jodi Digit must contain exactly two digits (00–99).",
      });
      return;
    }

    const numericPoints = Number(points);

    if (!Number.isInteger(numericPoints) || numericPoints < 10 || numericPoints > 500) {
      setNotice({
        type: "error",
        message: "Points must be between 10 and 500.",
      });
      return;
    }

    const runningDays = selectedLottery?.lotteryRunnningDays;

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
      const response = await api.post("/api/jodi-digit", {
        entryGameType: GAME_TYPE,
        entryLotteryName: lotteryName,
        entryBidType: bidType,
        entryBidDate: bidDate,
        entryBitNumber: bidNumber,
        entryBitPoints: numericPoints,
      });

      const remainingCoins =
        response.data?.remainingCoins ?? response.data?.coinsAmount;

      if (remainingCoins != null) {
        setCoins(remainingCoins);
      } else {
        await loadUser();
      }

      setNotice({
        type: "success",
        message: "Jodi Digit bid submitted successfully.",
      });

      setBidType("");
      setBidNumber("");
      setPoints("");

      await loadEntries();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Unable to submit the bid. Please check the existing backend endpoint.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sd-page">
      <section className="sd-banner">
        <button
          type="button"
          onClick={() => navigate("/user/play-game")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            padding: 0,
            border: 0,
            color: "#fff",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={17} /> Back to Games
        </button>

        <div className="sd-eyebrow">AK_GAME · PLAY</div>
        <h2>Jodi Digit</h2>
        <p>Choose a two-digit number and place your bid.</p>
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
              <p>Enter your Jodi Digit details</p>
            </div>
          </div>

          <form className="sd-form" onSubmit={handleSubmit}>
            <label>
              Game Type
              <input value={GAME_TYPE} readOnly />
            </label>

            <label>
              Lottery Name
              <select
                value={lotteryName}
                onChange={(event) => {
                  setLotteryName(event.target.value);
                  setBidDate(today());
                }}
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
    <option value="Jodi">Jodi</option>
  </select>
</label>




            <label>
              Bid Date
              <input
                type="date"
                min={today()}
                value={bidDate}
                onChange={(event) => handleDateChange(event.target.value)}
                required
              />
            </label>

            <label>
              Jodi Digit
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                pattern="[0-9]{2}"
                placeholder="e.g. 07"
                value={bidNumber}
                onChange={(event) =>
                  setBidNumber(event.target.value.replace(/\D/g, "").slice(0, 2))
                }
                required
              />
            </label>

            <label>
              Points
              <input
                type="number"
                min="10"
                max="500"
                step="1"
                placeholder="Enter points (10–500)"
                value={points}
                onChange={(event) => setPoints(event.target.value)}
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
              <p>Your Jodi Digit entries</p>
            </div>
            <button
              type="button"
              className="sd-refresh"
              onClick={() => {
                loadEntries();
                loadUser();
              }}
              aria-label="Refresh entries"
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          <div className="sd-table-wrap">
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Bid Date</th>
                  <th>Lottery</th>
                  <th>Bid Type</th>
                  <th>Jodi Digit</th>
                  <th>Points</th>
                  <th>Result</th>
                </tr>
              </thead>

              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="sd-empty">
                      No Jodi Digit entries found.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr key={entry.id ?? `${entry.entryBidDate}-${index}`}>
                      <td>{entry.entryBidDate}</td>
                      <td>{entry.entryLotteryName}</td>
                      <td>{entry.entryBidType}</td>
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
