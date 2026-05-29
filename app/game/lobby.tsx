"use client";

import { useSocket } from "../utils/socket-context";
import "@/app/static/style/lobby.css";

export function Lobby() {
    const { connectionStatus, lastGameAvailable, findGame } = useSocket();

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

                {(connectionStatus === "idle" || connectionStatus === "waiting") && (
                    <div className="lobby-action">
                        <p className="lobby-instruction">
                            {connectionStatus === "idle"
                                ? "Press Play to find an opponent"
                                : "Press Play to join an opponent"}
                        </p>
                        <button className="lobby-play-btn" onClick={() => findGame()}>
                            <span className="btn-text">New Game</span>
                            <span className="btn-icon">→</span>
                        </button>
                        {lastGameAvailable && <button className="lobby-play-btn" onClick={() => findGame(false)}>
                            <span className="btn-text">Restore last game</span>
                            <span className="btn-icon">→</span>
                        </button>}
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
                        <p className="lobby-status lobby-status-error">Opponent disconnected</p>
                        <button
                            className="lobby-play-btn"
                            onClick={() => findGame(false)}
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
                                connectionStatus !== "idle" ? "player-connected" : ""
                            }`}
                        >
                            P1
                        </div>
                        <span className="player-label">
                            {connectionStatus !== "idle" ? "Connected" : "Waiting..."}
                        </span>
                    </div>
                    <span className="lobby-vs">vs</span>
                    <div className="lobby-player-slot">
                        <div
                            className={`player-avatar ${
                                connectionStatus === "playing" ? "player-connected" : ""
                            }`}
                        >
                            P2
                        </div>
                        <span className="player-label">
                            {connectionStatus === "playing" ? "Connected" : "Waiting..."}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
