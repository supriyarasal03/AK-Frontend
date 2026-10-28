import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

import { getLotteries } from "../../services/userService";
import { WEEK_DAYS, splitDays, todayISO, weekdayIndex } from "../../utils/lotteryHelpers";

const REFRESH_INTERVAL_MS = 10000;

const hasValue = (value) => Boolean(value && String(value).trim());

// Lottery आज किंवा उद्या चालत असेल तरच दाखवतो (जुन्या index.html सारखेच)
function runsTodayOrTomorrow(lottery, todayDay) {
  const allowed = splitDays(lottery.lotteryRunnningDays).map((day) =>
    WEEK_DAYS.indexOf(day)
  );

  return allowed.includes(todayDay) || allowed.includes((todayDay + 1) % 7);
}

export default function LatestResults() {
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getLotteries();
        if (!cancelled) {
          setLotteries(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const today = todayISO();
  const todayDay = weekdayIndex(today);
  const visible = lotteries.filter((lottery) =>
    runsTodayOrTomorrow(lottery, todayDay)
  );

  if (loading || error || visible.length === 0) {
    return (
      <div className="results-placeholder">
        <BarChart3 size={28} />
        <div>
          <h3>
            {loading
              ? "Loading results..."
              : error
                ? "Could not load results"
                : "No results to show"}
          </h3>
          <p>
            {error
              ? "Please try again in a moment."
              : "Today's results will appear here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-grid">
      {visible.map((lottery) => {
        const showOpen =
          lottery.openDate === today && hasValue(lottery.openResultNo);
        const showClose =
          lottery.closeDate === today && hasValue(lottery.closeResultNo);

        return (
          <article className="result-card" key={lottery.id ?? lottery.lotteryName}>
            <h3>{lottery.lotteryName}</h3>

            <div className="result-digits">
              <span>{showOpen ? lottery.openResultNo : "***"}</span>
              <strong>
                {showOpen ? lottery.openFinalNo : "*"}
                {showClose ? lottery.closeFinalNo : "*"}
              </strong>
              <span>{showClose ? lottery.closeResultNo : "***"}</span>
            </div>

            {!showClose && (
              <p className="result-status result-running">Market is Running</p>
            )}

            {showOpen && showClose && (
              <p className="result-status result-closed">Closed for Today</p>
            )}

            {showClose && (
              <a className="btn btn-outline" href="/user/play-game">
                Bidding for next day
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
}