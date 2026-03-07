import { createContext, useContext } from "react";
import { PlayerDesk } from "../components/player_desk";
import { useSocket } from "../utils/socket-context";

const PlayerDeskContext = createContext(0);

export function usePlayerDesk() {
    return useContext(PlayerDeskContext);
}

export function PhaseTwo() {
    const { playerNumber } = useSocket();
    return (
        <div className="flex h-screen items-center justify-between font-sans text-[#2c2a26]">
            <PlayerDeskContext.Provider value={playerNumber}>
                <PlayerDesk />
            </PlayerDeskContext.Provider>

            <div className="h-3/4 w-px bg-gray-500" />

            <PlayerDeskContext.Provider value={playerNumber === 1 ? 2 : 1}>
                <PlayerDesk />
            </PlayerDeskContext.Provider>
        </div>
    );
}
