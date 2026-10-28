import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Pencil,
  Plus,
  RefreshCw,
  Ticket,
  Trash2,
  X,
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import {
  addLottery,
  deleteLottery,
  getLotteries,
  updateLottery,
} from "../../services/adminLotteriesService";
import getErrorMessage from "../../utils/getErrorMessage";
import {
  GAME_TYPES,
  WEEK_DAYS,
  formatRunningDays,
  parseGameDetails,
  splitDays,
  toBackendTime,
  toTimeInputValue,
} from "../../utils/lotteryHelpers";
import "../../styles/AdminDashboard.css";
import "../../styles/AdminPages.css";
import "../../styles/AdminLottery.css";

const emptyGame = () => ({ gameType: "", gameRate: "", gamePrice: "" });

const emptyForm = () => ({
  name: "",
  openTime: "",
  closeTime: "",
  days: [],
  games: [emptyGame()],
});

export default function AdminLottery() {
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadLotteries = useCallback(async () => {
    try {
      const data = await getLotteries();
      // जुन्या पानाप्रमाणे सर्वात नवीन lottery वर
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
  }, [loadLotteries]);

  function handleRefresh() {
    setLoading(true);
    setMessage("");
    loadLotteries();
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
  }

  function handleAdd() {
    setMessage("");
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setShowForm(true);
  }

  function handleEdit(lottery) {
    const games = parseGameDetails(lottery.gameDetails);

    setMessage("");
    setFormError("");
    setEditingId(lottery.id);
    setForm({
      name: lottery.lotteryName || "",
      openTime: toTimeInputValue(lottery.openTimmer),
      closeTime: toTimeInputValue(lottery.closeTimmer),
      days: splitDays(lottery.lotteryRunnningDays),
      games: games.length ? games : [emptyGame()],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleDay(day) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day],
    }));
  }

  function setGame(index, name, value) {
    setForm((current) => ({
      ...current,
      games: current.games.map((game, i) =>
        i === index ? { ...game, [name]: value } : game
      ),
    }));
  }

  function addGameRow() {
    setForm((current) => ({ ...current, games: [...current.games, emptyGame()] }));
  }

  function removeGameRow(index) {
    setForm((current) => ({
      ...current,
      games: current.games.filter((_, i) => i !== index),
    }));
  }

  // चूक असेल तर message परत करतो, नाहीतर ""
  function validate() {
    const name = form.name.trim();

    if (!name) return "Lottery name is required.";

    // Backend bid वेळी lottery नावाने शोधतो (findByLotteryName), म्हणून नाव unique हवे
    const duplicate = lotteries.some(
      (lottery) =>
        lottery.id !== editingId &&
        (lottery.lotteryName || "").trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) return "A lottery with this name already exists.";

    if (!form.openTime || !form.closeTime) {
      return "Please select both the open and close bid closing time.";
    }
    if (form.days.length === 0) return "Select at least one running day.";
    if (form.games.length === 0) return "Add at least one game.";

    const seen = new Set();
    for (const game of form.games) {
      if (!game.gameType) return "Select a game type for every game row.";
      if (!(Number(game.gameRate) > 0) || !(Number(game.gamePrice) > 0)) {
        return `Enter a valid rate and winning price for ${game.gameType}.`;
      }
      if (seen.has(game.gameType)) {
        return `${game.gameType} is added more than once.`;
      }
      seen.add(game.gameType);
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError("");

    const payload = {
      lotteryName: form.name.trim(),
      openTimmer: toBackendTime(form.openTime),
      closeTimmer: toBackendTime(form.closeTime),
      // आठवड्याच्या क्रमाने (Sunday..Saturday)
      lotteryRunnningDays: WEEK_DAYS.filter((day) => form.days.includes(day)).join(","),
      // जुन्या पानाप्रमाणेच rate/price string म्हणून साठवतो
      gameDetails: JSON.stringify(
        form.games.map((game) => ({
          gameType: game.gameType,
          gameRate: String(game.gameRate),
          gamePrice: String(game.gamePrice),
        }))
      ),
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateLottery(editingId, payload);
        setMessage("Lottery updated successfully.");
      } else {
        await addLottery(payload);
        setMessage("Lottery added successfully.");
      }
      resetForm();
      await loadLotteries();
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to save lottery."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lottery) {
    const confirmed = window.confirm(
      `Delete "${lottery.lotteryName}"?\n\nAll bids placed on this lottery will be deleted too.`
    );
    if (!confirmed) return;

    setMessage("");
    setError("");
    setDeletingId(lottery.id);

    try {
      await deleteLottery(lottery.id);
      setMessage("Lottery deleted successfully.");
      if (editingId === lottery.id) resetForm();
      await loadLotteries();
    } catch (err) {
      setError(`Failed to delete lottery: ${getErrorMessage(err, "Unknown error")}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <section className="ak-dashboard">
        <div className="ak-welcome-row">
          <div>
            <div className="ak-eyebrow">
              <Ticket size={15} />
              LOTTERY MANAGEMENT
            </div>
            <h2>Lotteries</h2>
            <p>Create lotteries, set bid timings and game rates.</p>
          </div>

          <div className="ak-action-group">
            <button
              type="button"
              className="ak-refresh-button"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "ak-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh data"}
            </button>

            {!showForm && (
              <button type="button" className="ak-primary-button" onClick={handleAdd}>
                <Plus size={16} />
                Add lottery
              </button>
            )}
          </div>
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

        {showForm && (
          <section className="ak-panel">
            <div className="ak-panel-header">
              <div>
                <h3>{editingId ? "Edit Lottery" : "Add New Lottery"}</h3>
                <p>
                  {editingId
                    ? "Changing the name does not rename bids that were already placed."
                    : "Bid closing time is the last time users can place a bid."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ak-form-grid">
                <div className="ak-field">
                  <label htmlFor="lotteryName">Name</label>
                  <input
                    id="lotteryName"
                    className="ak-input"
                    type="text"
                    placeholder="Enter name"
                    value={form.name}
                    onChange={(event) => setField("name", event.target.value)}
                    autoFocus
                  />
                </div>

                <div className="ak-field">
                  <label htmlFor="openTime">Open Bid Closing Time</label>
                  <input
                    id="openTime"
                    className="ak-input"
                    type="time"
                    value={form.openTime}
                    onChange={(event) => setField("openTime", event.target.value)}
                  />
                </div>

                <div className="ak-field">
                  <label htmlFor="closeTime">Close Bid Closing Time</label>
                  <input
                    id="closeTime"
                    className="ak-input"
                    type="time"
                    value={form.closeTime}
                    onChange={(event) => setField("closeTime", event.target.value)}
                  />
                </div>
              </div>

              {editingId && (!form.openTime || !form.closeTime) && (
                <div className="al-section">
                  <span className="al-hint">
                    The saved time could not be read (old format). Please select it again.
                  </span>
                </div>
              )}

              <div className="al-section">
                <span className="al-section-label">Running Days</span>
                <div className="al-days">
                  {WEEK_DAYS.map((day) => {
                    const active = form.days.includes(day);

                    return (
                      <label
                        key={day}
                        className={`al-day-chip ${active ? "al-day-chip-active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleDay(day)}
                        />
                        {day}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="al-section">
                <span className="al-section-label">Games, Rate and Winning Price</span>

                {form.games.map((game, index) => (
                  <div className="al-game-row" key={index}>
                    <div className="ak-field">
                      <label htmlFor={`gameType-${index}`}>Game Type</label>
                      <select
                        id={`gameType-${index}`}
                        className="ak-input"
                        value={game.gameType}
                        onChange={(event) => setGame(index, "gameType", event.target.value)}
                      >
                        <option value="">-- game type --</option>
                        {GAME_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ak-field">
                      <label htmlFor={`gameRate-${index}`}>Rate</label>
                      <input
                        id={`gameRate-${index}`}
                        className="ak-input"
                        type="number"
                        min="1"
                        placeholder="Rate"
                        value={game.gameRate}
                        onChange={(event) => setGame(index, "gameRate", event.target.value)}
                      />
                    </div>

                    <div className="ak-field">
                      <label htmlFor={`gamePrice-${index}`}>Winning Price</label>
                      <input
                        id={`gamePrice-${index}`}
                        className="ak-input"
                        type="number"
                        min="1"
                        placeholder="Winning price"
                        value={game.gamePrice}
                        onChange={(event) => setGame(index, "gamePrice", event.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="ak-danger-button"
                      onClick={() => removeGameRow(index)}
                      disabled={form.games.length === 1}
                      aria-label="Remove game"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <div className="al-game-actions">
                  <button type="button" className="ak-secondary-button" onClick={addGameRow}>
                    <Plus size={14} />
                    Add game
                  </button>
                  <span className="al-hint">
                    Rate : Winning price, e.g. 10 : 95 means 10 points win 95.
                  </span>
                </div>
              </div>

              {formError && (
                <div className="al-section">
                  <p className="al-inline-error" role="alert">
                    {formError}
                  </p>
                </div>
              )}

              <div className="ak-form-actions">
                <button type="submit" className="ak-primary-button" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update lottery" : "Add lottery"}
                </button>
                <button
                  type="button"
                  className="ak-secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="ak-panel">
          <div className="ak-panel-header">
            <div>
              <h3>All Lotteries</h3>
              <p>Newest first</p>
            </div>
            <span className="ak-count-badge">{lotteries.length} total</span>
          </div>

          {loading ? (
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
                    <th>Open Bid Closes</th>
                    <th>Close Bid Closes</th>
                    <th>Games (Rate : Price)</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lotteries.map((lottery, index) => {
                    const games = parseGameDetails(lottery.gameDetails);

                    return (
                      <tr key={lottery.id}>
                        <td>{index + 1}</td>
                        <td style={{ textTransform: "uppercase", fontWeight: 600 }}>
                          {lottery.lotteryName}
                        </td>
                        <td>{formatRunningDays(lottery.lotteryRunnningDays)}</td>
                        <td>{lottery.openTimmer || "-"}</td>
                        <td>{lottery.closeTimmer || "-"}</td>
                        <td>
                          {games.length === 0 ? (
                            <span className="al-muted">No games</span>
                          ) : (
                            <div className="al-game-chips">
                              {games.map((game) => (
                                <span className="al-game-chip" key={game.gameType}>
                                  {game.gameType}
                                  <small>
                                    {game.gameRate} : {game.gamePrice}
                                  </small>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>{lottery.lotteryDate || "-"}</td>
                        <td>
                          <div className="ak-action-group">
                            <button
                              type="button"
                              className="ak-secondary-button"
                              onClick={() => handleEdit(lottery)}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="ak-danger-button"
                              onClick={() => handleDelete(lottery)}
                              disabled={deletingId === lottery.id}
                            >
                              <Trash2 size={14} />
                              {deletingId === lottery.id ? "Deleting..." : "Delete"}
                            </button>
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
    </AdminLayout>
  );
}
