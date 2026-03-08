import "@/app/static/style/game_over_screen.css";
import { useSocket } from "../utils/socket-context";

export function GameOverScreen() {
    const { gameState, playerNumber } = useSocket();
    const yourScore = gameState.players[playerNumber - 1].score;
    const opScore = gameState.players[playerNumber === 1 ? 1 : 0].score;

    const isWin = yourScore > opScore;
    const isDraw = yourScore === opScore;

    const icon = isWin ? "🏆❤️" : isDraw ? "❤️" : "❤️";
    const headline = isWin ? "Victory!" : isDraw ? "It's a Draw" : "Defeat";
    const subline = isWin
        ? "You're unbeatable!"
        : isDraw
          ? "It's a tie!!!"
          : "Better luck next time.";

    return (
        <div className="end-screen-overlay">
            <div className="end-screen-card">
                <div className="end-mosaic" aria-hidden="true">
                    <div className="end-mosaic-tile" />
                    <div className="end-mosaic-tile" />
                    <div className="end-mosaic-tile" />
                    <div className="end-mosaic-tile" />
                    <div className="end-mosaic-tile" />
                    <div className="end-mosaic-tile" />
                </div>

                <div
                    className="end-result-icon"
                    role="img"
                    aria-label={headline}
                >
                    {icon}
                </div>

                <h1
                    className={`end-headline${isDraw ? " end-headline--draw" : ""}`}
                >
                    {headline}
                </h1>
                <p className="end-subline">{subline}</p>

                <div className="end-divider" />

                <div className="end-scores">
                    <div
                        className={`end-score-block${isWin || isDraw ? " end-score-block--winner" : ""}`}
                    >
                        <span className="end-score-label">You</span>
                        <span className="end-score-value">{yourScore}</span>
                        {(isWin || isDraw) && (
                            <span className="end-score-badge">
                                {isDraw ? "Draw" : "Winner"}
                            </span>
                        )}
                    </div>

                    <div className="end-score-separator">VS</div>

                    <div
                        className={`end-score-block${!isWin || isDraw ? " end-score-block--winner" : ""}`}
                    >
                        <span className="end-score-label">Opponent</span>
                        <span className="end-score-value">{opScore}</span>
                        {(!isWin || isDraw) && (
                            <span className="end-score-badge">
                                {isDraw ? "Draw" : "Winner"}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    className="end-play-again-btn"
                    onClick={() => window.location.reload()}
                >
                    <span className="end-btn-icon">🎮</span>
                    Play Again
                </button>
            </div>
        </div>
    );
}
