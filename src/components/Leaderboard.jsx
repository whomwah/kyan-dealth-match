import { usePlayersList } from "playroomkit";

export const Leaderboard = () => {
  const players = usePlayersList(true);
  return (
    <>
      <div className="leaderboard-container">
        <div className="christmas-decoration left">🎄</div>
        {players.map((player, index) => (
          <div key={player.id} className="player-card">
            <img
              src={player.state.profile?.photo || ""}
              className="player-avatar"
              style={{
                borderColor: player.state.profile?.color,
              }}
            />
            <div className="player-info">
              <h2 className="player-name">
                {index === 0 && "👑 "}
                {player.state.profile?.name}
              </h2>
              <div className="player-stats">
                <p>🎁 {player.state.kills}</p>
                <p>☃️ {player.state.deaths}</p>
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
