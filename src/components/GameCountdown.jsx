import { useState, useEffect, useCallback } from "react";
import "./GameCountdown.css";

const COUNTDOWN_ITEMS = [
  { text: "3", emoji: "🎄", subtext: "Get Ready!" },
  { text: "2", emoji: "🎅", subtext: "Steady..." },
  { text: "1", emoji: "🦌", subtext: "Almost..." },
  { text: "GO!", emoji: "⭐", subtext: "FIGHT!" },
];

export const GameCountdown = ({ isActive, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    setCurrentIndex(0);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      setCurrentIndex(0);
      return;
    }

    setIsVisible(true);
    setCurrentIndex(0);

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= COUNTDOWN_ITEMS.length) {
          clearInterval(intervalId);
          // Short delay before hiding to let "GO!" be visible
          setTimeout(handleComplete, 800);
          return prev;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, handleComplete]);

  if (!isVisible) return null;

  const currentItem = COUNTDOWN_ITEMS[currentIndex];
  const isGo = currentIndex === COUNTDOWN_ITEMS.length - 1;

  return (
    <div className="countdown-overlay">
      {/* Snowfall effect */}
      <div className="countdown-snow" />

      {/* Decorative corners */}
      <div className="countdown-corner countdown-corner-tl">🎄</div>
      <div className="countdown-corner countdown-corner-tr">🎄</div>
      <div className="countdown-corner countdown-corner-bl">🎁</div>
      <div className="countdown-corner countdown-corner-br">🎁</div>

      {/* Garland */}
      <div className="countdown-garland">✨🔔✨🎀✨🔔✨🎀✨🔔✨</div>

      {/* Game title */}
      <div className="countdown-title">Kyan Christmas Death Match</div>

      {/* Main countdown content */}
      <div className={`countdown-content ${isGo ? "countdown-go" : ""}`}>
        <div className="countdown-emoji">{currentItem.emoji}</div>

        <div className={`countdown-number ${isGo ? "go-text" : ""}`}>
          {currentItem.text}
        </div>

        <div className="countdown-subtext">{currentItem.subtext}</div>

        {/* Christmas lights */}
        <div className="countdown-lights">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="light"
              style={{
                animationDelay: `${i * 0.1}s`,
                background: ["#ff0000", "#00ff00", "#ffd700", "#ff69b4"][i % 4],
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="countdown-bottom-deco">🎅🦌🦌🦌🛷</div>
    </div>
  );
};
