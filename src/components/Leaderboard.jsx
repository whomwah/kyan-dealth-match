import { usePlayersList } from "playroomkit";
import { MAX_LIVES } from "./CharacterController";

export const Leaderboard = () => {
  const players = usePlayersList(true);

  // Calculate lives remaining for each player (MAX_LIVES - deaths)
  const playersWithLives = players.map((player) => ({
    player,
    lives: Math.max(0, MAX_LIVES - (player.state.deaths || 0)),
    isEliminated:
      player.state.eliminated || (player.state.deaths || 0) >= MAX_LIVES,
  }));

  // Sort: active players by lives (descending), then eliminated players at bottom
  const sortedPlayers = [...playersWithLives].sort((a, b) => {
    // Eliminated players go to the bottom
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;

    // Among active players, sort by lives remaining (descending)
    if (a.lives !== b.lives) return b.lives - a.lives;

    // Tiebreaker: more kills = higher rank
    return (b.player.state.kills || 0) - (a.player.state.kills || 0);
  });

  // Count active (non-eliminated) players
  const activePlayers = playersWithLives.filter((p) => !p.isEliminated).length;
  const hasWinner = activePlayers === 1 && players.length > 1;

  return (
    <>
      <div className="leaderboard-container">
        <div className="christmas-decoration left">🎄</div>

        <div className="match-status">
          <span className="lives-indicator">❤️ {MAX_LIVES} Lives Each</span>
          <span className="players-remaining">
            {activePlayers}/{players.length} Survivors
          </span>
        </div>

        {sortedPlayers
          .filter(({ player }) => player.state.profile)
          .map(({ player, lives, isEliminated }, index) => (
            <div
              key={player.id}
              className={`player-card ${isEliminated ? "eliminated" : ""}`}
            >
              <div className="player-rank">
                {isEliminated
                  ? "💀"
                  : hasWinner && index === 0
                    ? "🏆"
                    : `#${index + 1}`}
              </div>
              <img
                src={player.state.profile.photo || ""}
                className={`player-avatar ${isEliminated ? "grayscale" : ""}`}
                style={{
                  borderColor: isEliminated
                    ? "#666"
                    : player.state.profile.color || "#666",
                }}
              />
              <div className="player-info">
                <h2 className="player-name">
                  {hasWinner && index === 0 && "👑 "}
                  {player.state.profile.name || "Player"}
                  {isEliminated && " (OUT)"}
                </h2>
                <div className="player-stats">
                  <p className="lives-display">
                    {Array.from({ length: MAX_LIVES }, (_, i) => (
                      <span
                        key={i}
                        className={i < lives ? "life-full" : "life-empty"}
                      >
                        {i < lives ? "❤️" : "🖤"}
                      </span>
                    ))}
                  </p>
                  <p>🎯 {player.state.kills || 0}</p>
                </div>
              </div>
              <div className="candy-cane">🎅</div>
            </div>
          ))}
        <div className="christmas-decoration right">🎄</div>
      </div>
      <button
        className="fullscreen-button"
        onClick={() => {
          // toggle fullscreen
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
