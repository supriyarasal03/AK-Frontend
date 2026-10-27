import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Send,
  History,
} from "lucide-react";
import axiosClient from "../../services/axiosClient";
import "../../styles/SingleDigitGame.css";

export default function SinglePanaGame() {
  const today = new Date().toLocaleDateString("en-CA");

   const { refreshUser } = useOutletContext();
  const [lotteries, setLotteries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    entryLotteryName: "",
    entryBidType: "Open",
    entryBidDate: today,
    entryBitNumber: "",
    entryBitPoints: 10,
  });

  useEffect(() => {
    loadLotteries();
    loadEntries();
  }, []);

  async function loadLotteries() {
    try {
      const response = await axiosClient.get("/api/allLotteries");
      const data = Array.isArray(response.data) ? response.data : [];

      setLotteries(data);

      if (data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          entryLotteryName:
            prev.entryLotteryName || data[0].lotteryName || "",
        }));
      }

          refreshUser();
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to load lotteries."
      );
    }
  }

  async function loadEntries() {
    try {
      const response = await axiosClient.get(
        "/api/single-pana/my-entries"
      );
      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please login first.");
      } else {
        setEntries([]);
      }
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "entryBitPoints" ? value : value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const number = String(formData.entryBitNumber).trim();
    const points = Number(formData.entryBitPoints);

    if (!/^\d{3}$/.test(number)) {
      setError("Enter a valid 3-digit Pana number.");
      return;
    }

    if (!Number.isInteger(points) || points < 10 || points > 500) {
      setError("Points must be between 10 and 500.");
      return;
    }

    if (!formData.entryLotteryName) {
      setError("Please select a lottery.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        entryGameType: "Single Pana",
        entryLotteryName: formData.entryLotteryName,
        entryBidType: formData.entryBidType,
        entryBidDate: formData.entryBidDate,
        entryBitNumber: number,
        entryBitPoints: points,
      };

      const response = await axiosClient.post(
        "/api/single-pana",
        payload
      );

      setSuccess(
        response.data?.message || "Single Pana entry submitted successfully."
      );

      setFormData((prev) => ({
        ...prev,
        entryBitNumber: "",
        entryBitPoints: 10,
      }));

      await loadEntries();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "string"
          ? data
          : data?.error || data?.message || "Unable to submit entry."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sd-page">
      <div className="sd-header">
        <div>
          <h1>Single Pana</h1>
          <p>Place your Single Pana entry and check your history.</p>
        </div>

        <button
          type="button"
          className="sd-refresh-btn"
          onClick={loadEntries}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="sd-card">
        <h2>Place Entry</h2>

        {error && <div className="sd-alert sd-error">{error}</div>}
        {success && (
          <div className="sd-alert sd-success">{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="sd-form-grid">
            <div className="sd-field">
              <label htmlFor="entryLotteryName">Select Lottery</label>
              <select
                id="entryLotteryName"
                name="entryLotteryName"
                value={formData.entryLotteryName}
                onChange={handleChange}
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
            </div>

            <div className="sd-field">
              <label htmlFor="entryBidType">Bid Type</label>
              <select
                id="entryBidType"
                name="entryBidType"
                value={formData.entryBidType}
                onChange={handleChange}
                required
              >
                <option value="Open">Open</option>
                <option value="Close">Close</option>
              </select>
            </div>

            <div className="sd-field">
              <label htmlFor="entryBidDate">Bid Date</label>
              <div className="sd-input-icon">
                <CalendarDays size={17} />
                <input
                  id="entryBidDate"
                  type="date"
                  name="entryBidDate"
                  min={today}
                  value={formData.entryBidDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sd-field">
              <label htmlFor="entryBitNumber">Single Pana Number</label>
              <input
                id="entryBitNumber"
                type="text"
                name="entryBitNumber"
                inputMode="numeric"
                placeholder="Enter 3-digit number"
                maxLength={3}
                value={formData.entryBitNumber}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "");
                  setFormData((prev) => ({
                    ...prev,
                    entryBitNumber: value,
                  }));
                  setError("");
                  setSuccess("");
                }}
                required
              />
            </div>

            <div className="sd-field">
              <label htmlFor="entryBitPoints">Points (10–500)</label>
              <input
                id="entryBitPoints"
                type="number"
                name="entryBitPoints"
                min="10"
                max="500"
                step="1"
                value={formData.entryBitPoints}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="sd-submit-btn"
            disabled={loading}
          >
            <Send size={16} />
            {loading ? "Submitting..." : "Submit Entry"}
          </button>
        </form>
      </div>

      <div className="sd-card">
        <div className="sd-history-header">
          <h2>
            <History size={19} />
            My Single Pana Entries
          </h2>
        </div>

        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead>
              <tr>
                <th>Lottery</th>
                <th>Date</th>
                <th>Bid Type</th>
                <th>Number</th>
                <th>Points</th>
                <th>Result</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sd-empty">
                    No entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr key={entry.id ?? index}>
                    <td>{entry.entryLotteryName ?? "-"}</td>
                    <td>{entry.entryBidDate ?? "-"}</td>
                    <td>{entry.entryBidType ?? "-"}</td>
                    <td>{entry.entryBitNumber ?? "-"}</td>
                    <td>{entry.entryBitPoints ?? "-"}</td>
                    <td>{entry.finalResult || "Pending"}</td>
                    <td>{entry.winnerStatus || "Pending"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
