import { useEffect, useMemo, useState } from "react";
import { CircleAlert, ClipboardList, Search } from "lucide-react";

import AdminLayout from "./AdminLayout";
import { getLotteries } from "../../services/adminLotteriesService";
import { getLotteryEntries } from "../../services/adminEntriesService";
import getErrorMessage from "../../utils/getErrorMessage";
import { GAME_TYPES, todayISO } from "../../utils/lotteryHelpers";
import "../../styles/AdminDashboard.css";
import "../../styles/AdminPages.css";
import "../../styles/AdminLottery.css";

const BID_FILTERS = ["All", "Open", "Close"];

function StatusPill({ status }) {
  const value = String(status || "").toUpperCase();

  if (value === "WIN") return <span className="al-status al-status-win">WIN</span>;
  if (value === "LOSE") return <span className="al-status al-status-lose">LOSE</span>;
  return <span className="al-status al-status-pending">Pending</span>;
}

export default function AdminLotteryEntries() {
  const [lotteryNames, setLotteryNames] = useState([]);
  const [lotteryName, setLotteryName] = useState("");
  const [gameType, setGameType] = useState("");
  const [bidDate, setBidDate] = useState(todayISO);

  const [entries, setEntries] = useState([]);
  // searched: शेवटचा यशस्वी शोध (heading साठी). null = अजून शोध नाही
  const [searched, setSearched] = useState(null);
  const [bidFilter, setBidFilter] = useState("All");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getLotteries()
      .then((data) => {
        if (cancelled) return;
        const names = [...new Set(data.map((lottery) => lottery.lotteryName).filter(Boolean))];
        setLotteryNames(names.sort((a, b) => a.localeCompare(b)));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(`Could not load lotteries: ${getErrorMessage(err, "Unknown error")}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleView(event) {
    event.preventDefault();

    if (!lotteryName || !gameType || !bidDate) {
      setError("Please select the lottery, game and date.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await getLotteryEntries({
        lotteryName,
        entryGameType: gameType,
        entryBidDate: bidDate,
      });
      setEntries(data);
      setSearched({ lotteryName, gameType, bidDate });
      setBidFilter("All");
    } catch (err) {
      setEntries([]);
      setSearched(null);
      setError(`Error fetching entries: ${getErrorMessage(err, "Unknown error")}`);
    } finally {
      setLoading(false);
    }
  }

  const visibleEntries = useMemo(
    () =>
      bidFilter === "All"
        ? entries
        : entries.filter(
            (entry) => String(entry.entryBidType || "").toLowerCase() === bidFilter.toLowerCase()
          ),
    [entries, bidFilter]
  );

  const totals = useMemo(
    () => ({
      entries: visibleEntries.length,
      // जुन्या पानावर "Total Users" म्हणून entries ची संख्या दाखवत होते; इथे दोन्ही वेगळे
      players: new Set(visibleEntries.map((entry) => entry.userPhoneNo)).size,
      points: visibleEntries.reduce((sum, entry) => sum + entry.entryBitPoints, 0),
    }),
    [visibleEntries]
  );

  return (
    <AdminLayout>
      <section className="ak-dashboard">
        <div className="ak-welcome-row">
          <div>
            <div className="ak-eyebrow">
              <ClipboardList size={15} />
              LOTTERY MANAGEMENT
            </div>
            <h2>Lottery Entries</h2>
            <p>See every bid placed on a lottery, game and date.</p>
          </div>
        </div>

        {error && (
          <div className="ak-dashboard-alert" role="alert">
            <CircleAlert size={19} />
            <span>{error}</span>
          </div>
        )}

        <section className="ak-panel">
          <form className="al-filter-bar" onSubmit={handleView}>
            <div className="ak-field">
              <label htmlFor="entryLottery">Lottery</label>
              <select
                id="entryLottery"
                className="ak-input"
                value={lotteryName}
                onChange={(event) => setLotteryName(event.target.value)}
              >
                <option value="">--- select lottery ---</option>
                {lotteryNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ak-field">
              <label htmlFor="entryGame">Game</label>
              <select
                id="entryGame"
                className="ak-input"
                value={gameType}
                onChange={(event) => setGameType(event.target.value)}
              >
                <option value="">--- select game ---</option>
                {GAME_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="ak-field">
              <label htmlFor="entryDate">Bid Date</label>
              <input
                id="entryDate"
                className="ak-input"
                type="date"
                value={bidDate}
                onChange={(event) => setBidDate(event.target.value)}
              />
            </div>

            <div className="ak-field">
              <button type="submit" className="ak-primary-button" disabled={loading}>
                <Search size={15} />
                {loading ? "Loading..." : "View"}
              </button>
            </div>
          </form>
        </section>

        {searched && (
          <section className="ak-panel">
            <div className="ak-panel-header">
              <div>
                <h3>All Entries</h3>
                <p>
                  {searched.lotteryName} · {searched.gameType} · {searched.bidDate}
                </p>
              </div>

              <div className="al-segment" role="group" aria-label="Bid type">
                {BID_FILTERS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={bidFilter === option ? "al-segment-active" : ""}
                    onClick={() => setBidFilter(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="al-stats">
              <div className="al-stat">
                <span>Total Entries</span>
                <strong>{totals.entries}</strong>
              </div>
              <div className="al-stat">
                <span>Total Players</span>
                <strong>{totals.players}</strong>
              </div>
              <div className="al-stat">
                <span>Total Points</span>
                <strong>{totals.points}</strong>
              </div>
            </div>

            {visibleEntries.length === 0 ? (
              <div className="ak-empty-state">No entries found</div>
            ) : (
              <div className="ak-table-wrapper">
                <table className="ak-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User Name</th>
                      <th>Mobile No.</th>
                      <th>Game Type</th>
                      <th>Bid Type</th>
                      <th>Bid Number</th>
                      <th>Bid Points</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEntries.map((entry, index) => (
                      <tr key={entry.id ?? index}>
                        <td>{index + 1}</td>
                        <td>{entry.userName}</td>
                        <td>{entry.userPhoneNo}</td>
                        <td>{entry.entryGameType}</td>
                        <td>{entry.entryBidType}</td>
                        <td>{entry.entryBitNumber}</td>
                        <td>
                          <span className="ak-coins-value">{entry.entryBitPoints}</span>
                        </td>
                        <td>
                          <StatusPill status={entry.winnerStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </section>
    </AdminLayout>
  );
}
