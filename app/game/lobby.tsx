"use client";

import { useSocket } from "../socket-context";
import "./lobby.css";

export function Lobby() {
    const { gameStatus, findGame } = useSocket();

    return (
        <div className="lobby-container">
            <div className="lobby-card">
                <div className="lobby-mosaic">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="mosaic-tile" />
                    ))}
                </div>

                <h1 className="lobby-title">Azul</h1>
                <p className="lobby-subtitle">The Tile-Laying Game</p>

                <div className="lobby-divider" />

                {(gameStatus === "idle" || gameStatus === "waiting") && (
                    <div className="lobby-action">
                        <p className="lobby-instruction">{gameStatus === "idle" ? "Press Play to find an opponent" : "Press Play to join an opponent"}</p>
                        <button className="lobby-play-btn" onClick={findGame} id="play-button">
                            <span className="btn-text">Play</span>
                            <span className="btn-icon">→</span>
                        </button>
                    </div>
                )}

                {gameStatus === "searching" && (
                    <div className="lobby-action">
                        <div className="lobby-spinner" />
                        <p className="lobby-status">Connecting...</p>
                    </div>
                )}

                {gameStatus === "disconnected" && (
                    <div className="lobby-action">
                        <p className="lobby-status lobby-status-error">Opponent disconnected</p>
                        <button
                            className="lobby-play-btn"
                            onClick={findGame}
                            id="play-again-button"
                        >
                            <span className="btn-text">Find New Game</span>
                            <span className="btn-icon">↻</span>
                        </button>
                    </div>
                )}

                <div className="lobby-players">
                    <div className="lobby-player-slot">
                        <div
                            className={`player-avatar ${
                                gameStatus !== "idle" ? "player-connected" : ""
                            }`}
                        >
                            P1
                        </div>
                        <span className="player-label">
                            {gameStatus !== "idle" ? "Connected" : "Waiting..."}
                        </span>
                    </div>
                    <span className="lobby-vs">vs</span>
                    <div className="lobby-player-slot">
                        <div
                            className={`player-avatar ${
                                gameStatus === "playing" ? "player-connected" : ""
                            }`}
                        >
                            P2
                        </div>
                        <span className="player-label">
                            {gameStatus === "playing" ? "Connected" : "Waiting..."}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
