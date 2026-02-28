"use client";
import { useState } from "react";
import { useSocket } from "../socket-context";
import { Lobby } from "./lobby";
import { PhaseOne } from "./phase_one";
import { PhaseTwo } from "./phase_two";

export function MainScreen() {
    const { gameStatus, playerNumber } = useSocket();
    const [isPhaseOne, setPhase] = useState(true);

    // Show the lobby until both players are connected and game starts
    if (gameStatus !== "playing") {
        return <Lobby />;
    }

    return (
        <>
            <div className="game-header" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, rgba(92,61,26,0.08), rgba(196,162,101,0.12))",
                borderBottom: "2px solid rgba(196,162,101,0.3)",
            }}>
                <button
                    onClick={() => setPhase(!isPhaseOne)}
                    style={{
                        padding: "0.4rem 1rem",
                        background: "linear-gradient(135deg, #5c3d1a, #8b6a3e)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                    }}
                >
                    Switch Phase
                </button>
            </div>
            {isPhaseOne ? <PhaseOne /> : <PhaseTwo />}
        </>
    );
}
