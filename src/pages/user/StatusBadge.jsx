import "../../styles/UserGameHistory.css";

// WIN / LOSE / Pending badge (Dashboard आणि Game History दोन्हीकडे वापरतो)
export default function StatusBadge({ status }) {
  if (status === "WIN") return <span className="ud-badge ud-badge-win">WIN</span>;
  if (status === "LOSE") return <span className="ud-badge ud-badge-lose">LOSE</span>;
  return <span className="ud-badge ud-badge-pending">Pending</span>;
}