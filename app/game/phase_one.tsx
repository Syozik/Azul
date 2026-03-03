"use client";
import { CIRCLE_POSITIONS, COLORS } from "../consts";
import { CircleWithTiles } from "../components/circle";
import "@/app/static/style/phase_one.css";
import { useSocket } from "../socket-context";

export function PhaseOne() {
    const { gameState, playerNumber, sendGameAction } = useSocket();

    if (!gameState) {
        return <div className="phase-one">Loading game...</div>;
    }

    const isMyTurn = gameState.currentPlayer === playerNumber;
    const myIndex = playerNumber ? playerNumber - 1 : 0;
    const opponentIndex = playerNumber === 1 ? 1 : 0;

    return (
        <div className="phase-one">
            <div className="tiles-box">
                <p className="tiles-box-title">
                    Your Tiles {isMyTurn && <span className="turn-badge">Your Turn</span>}
                </p>
                <div className="picked-tiles">
                    {gameState.players[myIndex].pickedTiles.map((color, i) => (
                        <span key={i} className="tile" style={{ backgroundColor: COLORS[color] }} />
                    ))}
                    {gameState.players[myIndex].pickedTiles.length === 0 && (
                        <span className="no-tiles">No tiles picked yet</span>
                    )}
                </div>
            </div>

            <div className="game-board">
                {gameState.factories.map((factoryTiles, idx) => (
                    <CircleWithTiles
                        colors={factoryTiles}
                        factoryIndex={idx}
                        position={CIRCLE_POSITIONS[idx]}
                        isMyTurn={isMyTurn}
                        sendGameAction={sendGameAction}
                        key={idx}
                    />
                ))}

                <div className="center-pool">
                    {gameState.centerPool.map((color, i) => (
                        <span
                            key={i}
                            className={`tile ${isMyTurn ? "clickable" : ""}`}
                            style={{ backgroundColor: COLORS[color] }}
                            onClick={() => {
                                if (isMyTurn) {
                                    sendGameAction({
                                        type: "pick",
                                        color,
                                    });
                                }
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="tiles-box">
                <p className="tiles-box-title">
                    Opponent
                    {!isMyTurn && <span className="turn-badge">{"Opponent's Turn"}</span>}
                </p>
                <div className="picked-tiles">
                    {gameState.players[opponentIndex].pickedTiles.map((color, i) => (
                        <span key={i} className="tile" style={{ backgroundColor: COLORS[color] }} />
                    ))}
                    {gameState.players[opponentIndex].pickedTiles.length === 0 && (
                        <span className="no-tiles">No tiles picked yet</span>
                    )}
                </div>
            </div>
        </div>
    );
}
