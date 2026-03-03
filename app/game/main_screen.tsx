import { useSocket } from "../socket-context";
import { Lobby } from "./lobby";
import { PhaseOne } from "./phase_one";
import { PhaseTwo } from "./phase_two";
import { COLORS, JOKERS } from "../consts";
import "@/app/static/style/main_screen.css";

export function MainScreen() {
    const { gameState, connectionStatus } = useSocket();

    // Show the lobby until both players are connected and game starts
    if (connectionStatus !== "playing") {
        return <Lobby />;
    }

    return (
        <>
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
                    <span>Round: {gameState?.round}</span>
                    <div className="ml-2 flex items-center gap-1">
                        Joker:
                        <span
                            className="tile"
                            style={{ backgroundColor: COLORS[JOKERS[gameState?.round || 1 - 1]] }}
                        />
                    </div>
                </div>
            </div>
            {gameState?.phase !== 2 ? <PhaseOne /> : <PhaseTwo />}
        </>
    );
}
