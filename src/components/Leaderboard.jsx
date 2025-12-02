import { usePlayersList, isHost } from "playroomkit";
import { MAX_LIVES } from "./CharacterController";

// Snowflake component for festive effect
const Snowflake = ({ style }) => (
  <div className="snowflake" style={style}>
    ❄
  </div>
);

// Generate random snowflakes
const generateSnowflakes = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${3 + Math.random() * 4}s`,
    animationDelay: `${Math.random() * 3}s`,
    fontSize: `${0.8 + Math.random() * 1.2}rem`,
    opacity: 0.6 + Math.random() * 0.4,
  }));
};

export const Leaderboard = () => {
  const players = usePlayersList(true);

  const playersWithLives = players.map((player) => ({
    player,
    lives: Math.max(0, MAX_LIVES - (player.state.deaths || 0)),
    isEliminated:
      player.state.eliminated || (player.state.deaths || 0) >= MAX_LIVES,
  }));

  const sortedPlayers = [...playersWithLives].sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    if (a.lives !== b.lives) return b.lives - a.lives;
    return (b.player.state.kills || 0) - (a.player.state.kills || 0);
  });

  const activePlayers = playersWithLives.filter((p) => !p.isEliminated).length;
  const hasWinner = activePlayers === 1 && players.length > 1;
  const winner = hasWinner ? sortedPlayers[0] : null;
  const hostPlayer = isHost();

  const resetGame = () => {
    players.forEach((player) => {
      player.setState("deaths", 0);
      player.setState("kills", 0);
      player.setState("eliminated", false);
      player.setState("health", 100);
      player.setState("dead", false);
    });
  };

  return (
    <>
      {/* Christmas Winner Overlay */}
      {hasWinner && winner && (
        <div className="winner-overlay christmas-overlay">
          {/* Snowflakes */}
          <div className="snowflakes-container">
            {generateSnowflakes(30).map((flake) => (
              <Snowflake
                key={flake.id}
                style={{
                  left: flake.left,
                  animationDuration: flake.animationDuration,
                  animationDelay: flake.animationDelay,
                  fontSize: flake.fontSize,
                  opacity: flake.opacity,
                }}
              />
            ))}
          </div>

          {/* Christmas decorations */}
          <div className="christmas-decorations">
            <span className="decoration decoration-left">🎄</span>
            <span className="decoration decoration-right">🎄</span>
          </div>

          <div className="winner-content christmas-content">
            {/* Top garland */}
            <div className="christmas-garland">🎅 ⭐ 🦌 ⭐ 🎅</div>

            <h1 className="winner-title christmas-title">WINNER</h1>

            {/* Wreath around avatar */}
            <div className="winner-avatar-wrapper">
              <img
                src={winner.player.state.profile?.photo || ""}
                className="winner-avatar christmas-avatar"
                alt="Winner"
              />
            </div>

            <div
              className="winner-name christmas-name"
              style={{ color: winner.player.state.profile?.color || "#fff" }}
            >
              {winner.player.state.profile?.name || "Player"}
            </div>

            <div className="christmas-message">
              ✨ Merry Christmas, Champion! ✨
            </div>

            {hostPlayer && (
              <button
                className="reset-game-button christmas-button"
                onClick={resetGame}
              >
                🎅 New Game 🎄
              </button>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard chips - hidden when winner is shown */}
      {!hasWinner && (
        <div className="leaderboard-compact">
          {sortedPlayers.map(({ player, lives, isEliminated }, index) => (
            <div
              key={player.id}
              className={`player-chip ${isEliminated ? "eliminated" : ""} ${hasWinner && index === 0 ? "winner" : ""}`}
              style={{
                borderColor: isEliminated
                  ? "#666"
                  : player.state.profile?.color,
              }}
            >
              <span className="chip-rank">
                {isEliminated ? "💀" : hasWinner && index === 0 ? "🏆" : ""}
              </span>
              <img
                src={player.state.profile?.photo || ""}
                className="chip-avatar"
              />
              <span
                className="chip-name"
                style={{ color: player.state.profile?.color || "#fff" }}
              >
                {player.state.profile?.name || "Player"}
              </span>
              <span className="chip-lives">
                {"♥".repeat(lives)}
                {"♡".repeat(MAX_LIVES - lives)}
              </span>
              <span className="chip-kills">🎯{player.state.kills || 0}</span>
            </div>
          ))}
        </div>
      )}
      <button
        className="fullscreen-button"
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="fullscreen-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </svg>
      </button>
    </>
  );
};
