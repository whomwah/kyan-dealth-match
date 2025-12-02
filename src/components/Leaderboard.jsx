import { usePlayersList } from "playroomkit";
import { MAX_LIVES } from "./CharacterController";

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

  return (
    <>
      {/* Winner Overlay */}
      {hasWinner && winner && (
        <div className="winner-overlay">
          <div className="winner-content">
            <h1 className="winner-title">WINNER</h1>
            <img
              src={winner.player.state.profile?.photo || ""}
              className="winner-avatar"
              alt="Winner"
            />
            <div
              className="winner-name"
              style={{ color: winner.player.state.profile?.color || "#fff" }}
            >
              {winner.player.state.profile?.name || "Player"}
            </div>
            <div className="winner-stats">
              <span>🎯 {winner.player.state.kills || 0} kills</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard chips */}
      <div className="leaderboard-compact">
        {sortedPlayers.map(({ player, lives, isEliminated }, index) => (
          <div
            key={player.id}
            className={`player-chip ${isEliminated ? "eliminated" : ""} ${hasWinner && index === 0 ? "winner" : ""}`}
            style={{
              borderColor: isEliminated ? "#666" : player.state.profile?.color,
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
