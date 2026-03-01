"use client";

import {
    createContext,
    useContext,
    useEffect,
    useCallback,
    ReactNode,
    useRef,
    useReducer,
} from "react";
import { io, Socket } from "socket.io-client";
import type { GameState, GameAction } from "./game/types";

type ConnectionStatus = "idle" | "searching" | "waiting" | "playing" | "disconnected";

interface SocketContextType {
    connectionStatus: ConnectionStatus;
    playerNumber: 1 | 2 | null;
    roomId: string | null;
    gameState: GameState | null;
    findGame: () => void;
    sendGameAction: (action: GameAction) => void;
}

const SocketContext = createContext<SocketContextType>({
    connectionStatus: "idle",
    playerNumber: null,
    roomId: null,
    gameState: null,
    findGame: () => {},
    sendGameAction: () => {},
});

export function useSocket() {
    return useContext(SocketContext);
}

type State = {
    connectionStatus: ConnectionStatus;
    playerNumber: 1 | 2 | null;
    roomId: string | null;
    gameState: GameState | null;
};

type Action =
    | { type: "WAITING" }
    | { type: "SEARCHING" }
    | { type: "GAME_START"; playerNumber: 1 | 2; roomId: string }
    | { type: "GAME_STATE"; gameState: GameState }
    | { type: "OPPONENT_DISCONNECTED" }
    | { type: "DISCONNECT" };

const initialState: State = {
    connectionStatus: "idle",
    playerNumber: null,
    roomId: null,
    gameState: null,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "SEARCHING":
            return { ...state, connectionStatus: "searching" };
        case "WAITING":
            return { ...state, connectionStatus: "waiting" };
        case "GAME_START":
            return {
                ...state,
                connectionStatus: "playing",
                playerNumber: action.playerNumber,
                roomId: action.roomId,
            };
        case "GAME_STATE":
            return { ...state, gameState: action.gameState };
        case "OPPONENT_DISCONNECTED":
            return {
                ...state,
                connectionStatus: "disconnected",
                playerNumber: null,
                roomId: null,
                gameState: null,
            };
        case "DISCONNECT":
            return initialState;
        default:
            return state;
    }
}

export function SocketProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        const socket = io({ path: "/socket.io" });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to server:", socket.id);
        });
        socket.on("waiting", () => {
            dispatch({ type: "WAITING" });
        });
        socket.on("game-start", (data: { playerNumber: 1 | 2; roomId: string }) => {
            dispatch({ type: "GAME_START", playerNumber: data.playerNumber, roomId: data.roomId });
        });
        socket.on("game-state", (gameState: GameState) => {
            dispatch({ type: "GAME_STATE", gameState });
        });
        socket.on("game-error", (data: { error: string }) => {
            console.warn("Game error:", data.error);
        });
        socket.on("opponent-disconnected", () => {
            dispatch({ type: "OPPONENT_DISCONNECTED" });
        });
        socket.on("disconnect", () => {
            dispatch({ type: "DISCONNECT" });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const findGame = useCallback(() => {
        if (socketRef.current) {
            dispatch({ type: "SEARCHING" });
            socketRef.current.emit("find-game");
        }
    }, []);

    const sendGameAction = useCallback((action: GameAction) => {
        socketRef.current?.emit("game-action", action);
    }, []);

    return (
        <SocketContext.Provider
            value={{
                connectionStatus: state.connectionStatus,
                playerNumber: state.playerNumber,
                roomId: state.roomId,
                gameState: state.gameState,
                findGame,
                sendGameAction,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}
