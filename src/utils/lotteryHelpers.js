export const WEEK_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const GAME_TYPES = [
  "Single Digit",
  "Jodi Digit",
  "Single Pana",
  "Double Pana",
  "Triple Pana",
  "Half Sangam",
  "Full Sangam",
];

const pad = (value) => String(value).padStart(2, "0");

// आजची तारीख yyyy-MM-dd (local time). toISOString() वापरत नाही, कारण ते UTC देते
// आणि भारतात पहाटे 5:30 च्या आधी काल ची तारीख येते.
export function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "yyyy-MM-dd" -> 0..6 (Sunday = 0), local time मध्ये
export function weekdayIndex(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

// "Monday,Tuesday" -> ["Monday", "Tuesday"]
export function splitDays(value) {
  return value
    ? value
        .split(",")
        .map((day) => day.trim())
        .filter(Boolean)
    : [];
}

export function formatRunningDays(value) {
  const days = splitDays(value);
  return days.length ? days.map((day) => day.slice(0, 3)).join(", ") : "-";
}

// gameDetails हा JSON string असतो: [{gameType, gameRate, gamePrice}]
export function parseGameDetails(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map((game) => ({
      gameType: game.gameType ?? game.game_type ?? "",
      gameRate: String(game.gameRate ?? game.rate ?? game.game_rate ?? ""),
      gamePrice: String(game.gamePrice ?? game.price ?? game.game_price ?? ""),
    }));
  } catch {
    return [];
  }
}

// Backend bid वेळ "h.mm a" (उदा. "9.30 PM") या format मध्ये parse करतो
// (SingleDigitRestController मधील DateTimeFormatter.ofPattern("h.mm a")).
// चुकीचा text टाकला तर bid करताना error येतो, म्हणून इथे time picker वापरतो.

// "21:30" -> "9.30 PM"
export function toBackendTime(value) {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}.${pad(minutes)} ${period}`;
}

// "9.30 PM" (किंवा जुना "09:30 pm") -> "21:30"; ओळखता आला नाही तर ""
export function toTimeInputValue(text) {
  const match = String(text || "")
    .trim()
    .match(/^(\d{1,2})[.:](\d{2})\s*([AaPp][Mm])$/);
  if (!match) return "";
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return `${pad(hours)}:${match[2]}`;
}
