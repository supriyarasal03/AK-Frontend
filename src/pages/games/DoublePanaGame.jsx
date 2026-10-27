import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../services/axiosClient";
import "../../styles/DoublePanaGame.css";
import { useOutletContext } from "react-router-dom";

const getLocalDate = () => {


     const { refreshUser } = useOutletContext();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (typeof data === "string") return data;

  return (
    data?.message ||
    data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

const getLotteryName = (lottery) =>
  lottery?.lotteryName || lottery?.name || "";

const getRunningDays = (lottery) => {
  const days =
    lottery?.lotteryRunnningDays ??
    lottery?.lotteryRunningDays ??
    lottery?.runningDays;

  if (Array.isArray(days)) return days;

  if (typeof days === "string") {
    return days
      .split(/[,;|]/)
      .map((day) => day.trim())
      .filter(Boolean);
  }

  return [];
};

const isDateAllowed = (dateValue, lottery) => {
  const runningDays = getRunningDays(lottery);

  // If the API does not provide running days, don't block the selection.
  if (runningDays.length === 0) return true;

  const selectedDate = new Date(`${dateValue}T12:00:00`);
  const weekday = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const aliases = {
    monday: ["monday", "mon"],
    tuesday: ["tuesday", "tue", "tues"],
    wednesday: ["wednesday", "wed"],
    thursday: ["thursday", "thu", "thur", "thurs"],
    friday: ["friday", "fri"],
    saturday: ["saturday", "sat"],
    sunday: ["sunday", "sun"],
  };

  const allowedNames = aliases[weekday.toLowerCase()] || [weekday.toLowerCase()];

  return runningDays.some((day) => {
    const normalized = String(day).trim().toLowerCase();
    return allowedNames.includes(normalized);
  });
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN");
};

export default function DoublePanaGame() {
  const [lotteries, setLotteries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [remainingCoins, setRemainingCoins] = useState(null);

  const [formData, setFormData] = useState({
    entryGameType: "Double Pana",
    entryLotteryName: "",
    entryBidType: "Open",
    entryBidDate: getLocalDate(),
    entryBitNumber: "",
    entryBitPoints: "",
  });

  const [loadingLotteries, setLoadingLotteries] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedLottery = lotteries.find(
    (lottery) =>
      getLotteryName(lottery).toLowerCase() ===
      formData.entryLotteryName.toLowerCase()
  );

  const loadLotteries = useCallback(async () => {
    setLoadingLotteries(true);

    try {
      const response = await axiosClient.get("/api/allLotteries");
      const data = response.data;

      const lotteryList = Array.isArray(data)
        ? data
        : Array.isArray(data?.lotteries)
          ? data.lotteries
          : [];

      setLotteries(lotteryList);
          refreshUser();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoadingLotteries(false);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);

    try {
      const response = await axiosClient.get(
        "/api/double-pana/my-entries"
      );

      const data = response.data;

      const entryList = Array.isArray(data)
        ? data
        : Array.isArray(data?.entries)
          ? data.entries
          : [];

      setEntries(entryList);
    } catch (error) {
      // Keep the page usable if entries cannot be loaded.
      console.error("Failed to load Double Pana entries:", error);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  const loadUserBalance = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/user/session");
      const data = response.data;

      const user =
        data?.user ||
        data?.loggedUser ||
        data?.loggedInUser ||
        data;

      const coins =
        user?.coins ??
        user?.remainingCoins ??
        user?.coinBalance;

      if (coins !== undefined && coins !== null) {
        setRemainingCoins(coins);
      }
    } catch (error) {
      console.error("Failed to load user session:", error);
    }
  }, []);

  useEffect(() => {
   // eslint-disable-next-line react-hooks/set-state-in-effect
loadLotteries();
    loadEntries();
    loadUserBalance();
  }, [loadLotteries, loadEntries, loadUserBalance]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadEntries();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [loadEntries]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  };

  const validateForm = () => {
    if (!formData.entryLotteryName) {
      return "Please select a lottery.";
    }

    if (!formData.entryBidType) {
      return "Please select Open or Close.";
    }

    if (!formData.entryBidDate) {
      return "Please select a bid date.";
    }

    if (formData.entryBidDate < getLocalDate()) {
      return "Bid date cannot be in the past.";
    }

    if (
      selectedLottery &&
      !isDateAllowed(formData.entryBidDate, selectedLottery)
    ) {
      return "The selected lottery is not running on this day.";
    }

    const bidNumber = String(formData.entryBitNumber).trim();

    if (!/^\d{3}$/.test(bidNumber)) {
      return "Bid Digit must contain exactly three digits.";
    }

    const points = Number(formData.entryBitPoints);
if (!Number.isInteger(points) || points < 10 || points > 500) {
  setNotice({ type: "error", message: "Points must be between 10 and 500." });
  return;
}




    if (
      remainingCoins !== null &&
      Number.isFinite(Number(remainingCoins)) &&
      points > Number(remainingCoins)
    ) {
      return "You do not have enough coins for this bid.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const payload = {
      entryGameType: "Double Pana",
      entryLotteryName: formData.entryLotteryName,
      entryBidType: formData.entryBidType,
      entryBidDate: formData.entryBidDate,
      entryBitNumber: Number(formData.entryBitNumber),
      entryBitPoints: Number(formData.entryBitPoints),
    };

    setSubmitting(true);

    try {
      const response = await axiosClient.post(
        "/api/double-pana",
        payload
      );

      const data = response.data;

      if (data?.remainingCoins !== undefined) {
        setRemainingCoins(data.remainingCoins);
      } else {
        await loadUserBalance();
      }

      setSuccessMessage(
        data?.message || "Double Pana bid submitted successfully."
      );

      setFormData((previous) => ({
        ...previous,
        entryBitNumber: "",
        entryBitPoints: "",
      }));

      await loadEntries();

      try {
        const storedUser = sessionStorage.getItem("loggedUser");

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);

          if (data?.remainingCoins !== undefined) {
            parsedUser.coins = data.remainingCoins;
            parsedUser.remainingCoins = data.remainingCoins;
          }

          sessionStorage.setItem(
            "loggedUser",
            JSON.stringify(parsedUser)
          );
        }
      } catch {
        // Session storage is optional for this page.
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const getEntryResult = (entry) =>
    entry?.finalResult ||
    entry?.winnerStatus ||
    entry?.result ||
    "Pending";

  const getEntryNumber = (entry) =>
    entry?.entryBitNumber ??
    entry?.bidNumber ??
    entry?.bidDigit ??
    "-";

  const getEntryPoints = (entry) =>
    entry?.entryBitPoints ??
    entry?.bidPoints ??
    "-";

  return (
    <div className="dp-page">
      <div className="dp-container">
        <header className="dp-header">
          <h1 className="dp-title">Double Pana</h1>
          <p className="dp-subtitle">
            Select a lottery, choose your bid type, and submit your bid.
          </p>

          {remainingCoins !== null && (
            <div className="dp-balance">
              <span>Available Coins:</span>
              <span>{remainingCoins}</span>
            </div>
          )}
        </header>

        <div className="dp-layout">
          <section className="dp-card">
            <h2 className="dp-card-title">Place Your Bid</h2>

            {successMessage && (
              <div
                className="dp-message dp-message-success"
                role="status"
              >
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div
                className="dp-message dp-message-error"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <form className="dp-form" onSubmit={handleSubmit}>
              <input
                type="hidden"
                name="entryGameType"
                value="Double Pana"
              />

              <div className="dp-field">
                <label className="dp-label" htmlFor="dp-lottery">
                  Lottery
                </label>

                <select
                  id="dp-lottery"
                  name="entryLotteryName"
                  className="dp-select"
                  value={formData.entryLotteryName}
                  onChange={handleChange}
                  disabled={loadingLotteries || submitting}
                  required
                >
                  <option value="">
                    {loadingLotteries
                      ? "Loading lotteries..."
                      : "Select Lottery"}
                  </option>

                  {lotteries.map((lottery, index) => {
                    const name = getLotteryName(lottery);

                    if (!name) return null;

                    return (
                      <option key={`${name}-${index}`} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="dp-field">
                <span className="dp-label">Bid Type</span>

                <div className="dp-bid-types">
                  {["Open", "Close"].map((type) => (
                    <label className="dp-bid-option" key={type}>
                      <input
                        type="radio"
                        name="entryBidType"
                        value={type}
                        checked={formData.entryBidType === type}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="dp-field">
                <label className="dp-label" htmlFor="dp-date">
                  Bid Date
                </label>

                <input
                  id="dp-date"
                  className="dp-input"
                  type="date"
                  name="entryBidDate"
                  min={getLocalDate()}
                  value={formData.entryBidDate}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="dp-field">
                <label className="dp-label" htmlFor="dp-number">
                  Bid Digit
                </label>

                <input
                  id="dp-number"
                  className="dp-input"
                  type="number"
                  name="entryBitNumber"
                  placeholder="Enter 3-digit number"
                  value={formData.entryBitNumber}
                  onChange={handleChange}
                  min="100"
                  max="999"
                  step="1"
                  inputMode="numeric"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="dp-field">
                <label className="dp-label" htmlFor="dp-points">
                  Bid Points
                </label>

                <input
                  id="dp-points"
                  className="dp-input"
                  type="number"
                  name="entryBitPoints"
                  placeholder="Enter points (10–500)"
                  value={formData.entryBitPoints}
                  onChange={handleChange}
                  min="10"
                  max="500"
                  step="1"
                  disabled={submitting}
                  required
                />
              </div>

              <button
                className="dp-submit"
                type="submit"
                disabled={submitting || loadingLotteries}
              >
                {submitting ? "Submitting..." : "Submit Bid"}
              </button>
            </form>
          </section>

          <section className="dp-card">
            <h2 className="dp-card-title">Recent Double Pana Entries</h2>

            <div className="dp-table-wrapper">
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>Bid Date</th>
                    <th>Lottery</th>
                    <th>Bid Type</th>
                    <th>Bid Digit</th>
                    <th>Bid Points</th>
                    <th>Result</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="dp-empty">
                        {loadingEntries
                          ? "Loading entries..."
                          : "No Double Pana entries found."}
                      </td>
                    </tr>
                  ) : (
                    entries.slice(0, 5).map((entry, index) => {
                      const result = String(
                        getEntryResult(entry)
                      ).toUpperCase();

                      const resultClass =
                        result === "WIN"
                          ? "dp-result dp-result-win"
                          : result === "LOSE"
                            ? "dp-result dp-result-lose"
                            : "dp-result";

                      return (
                        <tr
                          key={
                            entry.id ??
                            `${entry.entryLotteryName}-${entry.entryBidDate}-${index}`
                          }
                        >
                          <td>
                            {formatDate(
                              entry.entryBidDate ?? entry.bidDate
                            )}
                          </td>
                          <td>
                            {entry.entryLotteryName ??
                              entry.lotteryName ??
                              "-"}
                          </td>
                          <td>{entry.entryBidType ?? entry.bidType ?? "-"}</td>
                          <td>{getEntryNumber(entry)}</td>
                          <td>{getEntryPoints(entry)}</td>
                          <td>
                            <span className={resultClass}>
                              {getEntryResult(entry)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <p className="dp-refresh-note">
              Recent entries refresh automatically.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}