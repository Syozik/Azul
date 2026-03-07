"use client";
import { CIRCLE_POSITIONS, COLORS } from "../consts";
import { CircleWithTiles } from "../components/circle";
import "@/app/static/style/phase_one.css";
import { useSocket } from "../utils/socket-context";

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
                <p className="tiles-box-title">Your Tiles</p>
                <div className="picked-tiles">
                    {gameState.players[myIndex].pickedTiles.map((color, i) => (
                        <span
                            key={i}
                            className="box-tile"
                            style={{ backgroundColor: COLORS[color] }}
                        />
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
                            className={`box-tile ${isMyTurn ? "clickable" : ""}`}
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
                <p className="tiles-box-title">Opponent</p>
                <div className="picked-tiles">
                    {gameState.players[opponentIndex].pickedTiles.map(
                        (color, i) => (
                            <span
                                key={i}
                                className="box-tile"
                                style={{ backgroundColor: COLORS[color] }}
                            />
                        ),
                    )}
                    {gameState.players[opponentIndex].pickedTiles.length ===
                        0 && (
                        <span className="no-tiles">No tiles picked yet</span>
                    )}
                </div>
            </div>
        </div>
    );
}
