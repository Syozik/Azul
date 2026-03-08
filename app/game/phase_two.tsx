import { createContext, useContext } from "react";
import { PlayerDesk } from "../components/player_desk";
import { useSocket } from "../utils/socket-context";
import { Base } from "../components/base";

const PlayerDeskContext = createContext(0);

export function usePlayerDesk() {
    return useContext(PlayerDeskContext);
}

export function PhaseTwo() {
    const { playerNumber, sendGameAction } = useSocket();
    return (
        <div className="flex h-full items-center justify-between font-sans text-[#2c2a26]">
            <button
                className="pass-button"
                onClick={() => sendGameAction({ type: "pass" })}
            >
                Pass
            </button>
            <PlayerDeskContext.Provider value={playerNumber}>
                <PlayerDesk />
            </PlayerDeskContext.Provider>

            <Base />

            <PlayerDeskContext.Provider value={playerNumber === 1 ? 2 : 1}>
                <PlayerDesk />
            </PlayerDeskContext.Provider>
        </div>
    );
}
