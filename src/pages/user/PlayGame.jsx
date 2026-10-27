
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Gamepad2,
  Hash,
  Grid2X2,
  Layers,
  CircleDot,
  LayoutGrid,
  Shuffle,
  Sparkles,
} from "lucide-react";
import "../../styles/PlayGame.css";

const games = [
  {
    title: "Single Digit",
    description: "Choose a single digit from 0 to 9.",
    path: "/user/single-digit",
    icon: Hash,
    number: "01",
  },
  {
    title: "Jodi Digit",
    description: "Play with a two-digit number.",
    path: "/user/jodi-digit",
    icon: Grid2X2,
    number: "02",
  },
  {
    title: "Single Pana",
    description: "Choose a single pana combination.",
    path: "/user/single-pana",
    icon: Layers,
    number: "03",
  },
  {
    title: "Double Pana",
    description: "Choose a double pana combination.",
    path: "/user/double-pana",
    icon: CircleDot,
    number: "04",
  },
  {
    title: "Triple Pana",
    description: "Choose a triple pana combination.",
    path: "/user/triple-pana",
    icon: LayoutGrid,
    number: "05",
  },
  {
    title: "Half Sangam",
    description: "Explore the Half Sangam game.",
    path: "/user/half-sangam",
    icon: Shuffle,
    number: "06",
  },
  {
    title: "Full Sangam",
    description: "Explore the Full Sangam game.",
    path: "/user/full-sangam",
    icon: Sparkles,
    number: "07",
  },
];

export default function PlayGame() {
  const navigate = useNavigate();

  return (
    <div className="pg-page">
      <section className="pg-hero">
        <div className="pg-hero-icon">
          <Gamepad2 size={30} />
        </div>

        <div>
          <span className="pg-eyebrow">AK_GAME / GAMES</span>
          <h2>Choose Your Game</h2>
          <p>Select a game to open its entry form.</p>
        </div>
      </section>

      <div className="pg-section-heading">
        <div>
          <h3>Available Games</h3>
          <p>Choose one of the available game types below.</p>
        </div>
        <span className="pg-count">{games.length} Games</span>
      </div>

      <div className="pg-grid">
        {games.map((game) => {
          const Icon = game.icon;

          return (
            <button
              type="button"
              className="pg-card"
              key={game.path}
              onClick={() => navigate(game.path)}
            >
              <div className="pg-card-top">
                <span className="pg-number">{game.number}</span>
                <span className="pg-card-icon">
                  <Icon size={24} />
                </span>
              </div>

              <div className="pg-card-body">
                <h4>{game.title}</h4>
                <p>{game.description}</p>
              </div>

              <div className="pg-card-bottom">
                <span>Play Now</span>
                <ArrowRight size={18} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
