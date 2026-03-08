import { GameOverScreen } from "../components/game_over_screen";
import { useSocket } from "../utils/socket-context";
import { Lobby } from "./lobby";
import { PhaseOne } from "./phase_one";
import { PhaseTwo } from "./phase_two";
import "@/app/static/style/main_screen.css";

export function MainScreen() {
    const { gameState, playerNumber, connectionStatus } = useSocket();

    return (
        <>
            {connectionStatus !== "playing" && <Lobby />}
            {gameState.isGameOver && <GameOverScreen />}

            <div
                className="game-header flex gap-10 items-center justify-center"
                style={{
                    padding: "0.75rem 1.5rem",
                    background:
                        "linear-gradient(135deg, rgba(92,61,26,0.08), rgba(196,162,101,0.12))",
                    borderBottom: "2px solid rgba(196,162,101,0.3)",
                }}
            >
                <div className="flex items-center">
                    <span
                        className={`turn-badge ${gameState.currentPlayer === playerNumber ? "turn-badge--yours" : "turn-badge--theirs"}`}
                    >
                        {gameState.currentPlayer === playerNumber ? (
                            <>
                                <svg
                                    className="turn-arrow turn-arrow--left"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Your Turn
                            </>
                        ) : (
                            <>
                                Opponent&apos;s Turn
                                <svg
                                    className="turn-arrow turn-arrow--right"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </>
                        )}
                    </span>
                </div>
            </div>
            {gameState.phase === 1 ? <PhaseOne /> : <PhaseTwo />}
        </>
    );
}
