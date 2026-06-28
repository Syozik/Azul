import { createContext, useContext } from "react";
import { PlayerDesk } from "../components/player_desk";
import { useSocket } from "../socket-context";
import { Base } from "../components/base";

export const PlayerDeskContext = createContext(0);

export function usePlayerDesk() {
    return useContext(PlayerDeskContext);
}

export function PhaseTwo() {
    const { state, sendGameAction } = useSocket();
    return (
        <div className="phase-two">
            <button className="pass-button" onClick={() => sendGameAction({ type: "pass" })}>
                Pass
            </button>

            <div className="phase-two-panel">
                <PlayerDeskContext.Provider value={state.playerNumber}>
                    <PlayerDesk />
                </PlayerDeskContext.Provider>
            </div>

            <div className="phase-two-panel flex">
                <Base />
            </div>

            <div className="phase-two-panel">
                <PlayerDeskContext.Provider value={state.playerNumber === 1 ? 2 : 1}>
                    <PlayerDesk />
                </PlayerDeskContext.Provider>
            </div>
        </div>
    );
}
