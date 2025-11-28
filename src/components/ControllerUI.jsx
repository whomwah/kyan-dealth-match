import { myPlayer, usePlayersList } from "playroomkit";
import { MAX_LIVES } from "./CharacterController";

export const ControllerUI = () => {
  const players = usePlayersList(true);
  const currentPlayer = myPlayer();

  // Find the current player's data
  const playerData = players.find((p) => p.id === currentPlayer?.id);

  if (!playerData) {
    return (
      <div className="controller-ui">
        <div className="controller-waiting">
          <p>Connecting...</p>
        </div>
      </div>
    );
  }

  const deaths = playerData.state.deaths || 0;
  const kills = playerData.state.kills || 0;
  const lives = Math.max(0, MAX_LIVES - deaths);
  const isEliminated = playerData.state.eliminated || deaths >= MAX_LIVES;
  const health = playerData.state.health || 100;

  const profile = playerData.state.profile;

  return (
    <div className="controller-ui">
      <div className="controller-stats">
        <div className="controller-player-info">
          {profile?.photo && (
            <img
              src={profile.photo}
              className={`controller-avatar ${isEliminated ? "grayscale" : ""}`}
              style={{
                borderColor: isEliminated ? "#666" : profile.color || "#fff",
              }}
            />
          )}
          <span className="controller-name">
            {profile?.name || "Loading..."}
          </span>
        </div>

        {isEliminated ? (
          <div className="controller-eliminated">
            <span className="eliminated-icon">💀</span>
            <span>ELIMINATED</span>
          </div>
        ) : (
          <>
            <div className="controller-health">
              <div className="health-bar-container">
                <div
                  className="health-bar-fill"
                  style={{
                    width: `${health}%`,
                    backgroundColor:
                      health > 60
                        ? "#4ade80"
                        : health > 30
                          ? "#fbbf24"
                          : "#ef4444",
                  }}
                />
              </div>
              <span className="health-text">{health}%</span>
            </div>

            <div className="controller-lives">
              {Array.from({ length: MAX_LIVES }, (_, i) => (
                <span
                  key={i}
                  className={i < lives ? "life-full" : "life-empty"}
                >
                  {i < lives ? "❤️" : "🖤"}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="controller-kills">
          <span className="kills-icon">🎯</span>
          <span className="kills-count">{kills}</span>
        </div>
      </div>

      <div className="controller-instructions">
        <p>Use the joystick to move • Fire button to shoot</p>
        <p className="controller-hint">Watch the big screen!</p>
      </div>
    </div>
  );
};
