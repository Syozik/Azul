"use client";

import { useSocket } from "../utils/socket-context";
import "@/app/static/style/lobby.css";

export function Lobby() {
    const { connectionStatus, lastGameAvailable, findGame, startGame } =
        useSocket();

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

                {connectionStatus === "idle" && (
                    <div className="lobby-action">
                        <p className="lobby-instruction">
                            Press Play to find an opponent
                        </p>
                        <button
                            className="lobby-play-btn"
                            onClick={() => findGame()}
                        >
                            <span className="btn-text">Play</span>
                            <span className="btn-icon">→</span>
                        </button>
                    </div>
                )}
                {connectionStatus === "waiting" && (
                    <div className="lobby-action">
                        <p
                            className="lobby-instruction font-bold underline"
                            style={{ fontSize: "1.5rem" }}
                        >
                            Opponent found!
                        </p>
                        <p className="lobby-instruction">
                            Would you like to start a new game
                        </p>
                        <button
                            className="lobby-play-btn"
                            onClick={() => startGame()}
                        >
                            <span className="btn-text">New game</span>
                            <span className="btn-icon">→</span>
                        </button>
                        <p className="lobby-instruction">
                            ...or continue the previous one?
                        </p>
                        <button
                            className="lobby-play-btn"
                            onClick={() => startGame(false)}
                        >
                            <span className="btn-text">Last game</span>
                            <span className="btn-icon">→</span>
                        </button>
                        <p className="lobby-instruction">
                            Note: any of you can choose new or last game
                        </p>
                    </div>
                )}

                {connectionStatus === "searching" && (
                    <div className="lobby-action">
                        <div className="lobby-spinner" />
                        <p className="lobby-status">Connecting...</p>
                    </div>
                )}

                {connectionStatus === "disconnected" && (
                    <div className="lobby-action">
                        <p className="lobby-status lobby-status-error">
                            Opponent disconnected
                        </p>
                        <button
                            className="lobby-play-btn"
                            onClick={() => findGame()}
                            id="play-again-button"
                        >
                            <span className="btn-text">Find New Game</span>
                            <span className="btn-icon">↻</span>
                        </button>
                    </div>
                )}

                {/* TODO fix me */}
                {false && (
                    <div className="lobby-players">
                        <div className="lobby-player-slot">
                            <div
                                className={`player-avatar ${
                                    true || connectionStatus !== "idle"
                                        ? "player-connected"
                                        : ""
                                }`}
                            >
                                P1
                            </div>
                            <span className="player-label">
                                {true || connectionStatus !== "idle"
                                    ? "Connected"
                                    : "Waiting..."}
                            </span>
                        </div>
                        <span className="lobby-vs">vs</span>
                        <div className="lobby-player-slot">
                            <div
                                className={`player-avatar ${
                                    true || connectionStatus === "playing"
                                        ? "player-connected"
                                        : ""
                                }`}
                            >
                                P2
                            </div>
                            <span className="player-label">
                                {true || connectionStatus === "playing"
                                    ? "Connected"
                                    : "Waiting..."}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
