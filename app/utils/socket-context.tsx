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
import type { GameState, GameAction } from "./types";
import { initState } from "./helpers";

type ConnectionStatus =
    | "idle"
    | "searching"
    | "waiting"
    | "playing"
    | "disconnected";

interface SocketContextType {
    connectionStatus: ConnectionStatus;
    playerNumber: 1 | 2;
    roomId: string | null;
    gameState: GameState;
    findGame: () => void;
    sendGameAction: (action: GameAction) => void;
}

const SocketContext = createContext<SocketContextType>({
    connectionStatus: "idle",
    playerNumber: 1,
    roomId: null,
    gameState: initState(),
    findGame: () => {},
    sendGameAction: () => {},
});

export function useSocket() {
    return useContext(SocketContext);
}

type State = {
    connectionStatus: ConnectionStatus;
    playerNumber: 1 | 2;
    roomId: string | null;
    gameState: GameState;
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
    playerNumber: 1,
    roomId: null,
    gameState: initState(),
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
                playerNumber: 1,
                roomId: null,
                gameState: initState(),
            };
        case "DISCONNECT":
            return initialState;
        default:
            return state;
    }
}

export const socket = io({
    path: "/socket.io",
    autoConnect: false,
    reconnection: true,
    transports: ["websocket", "polling"],
});

export function SocketProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        if (!socket.connected) socket.connect();
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to server:", socket.id, "recovered:", socket.recovered);
        });
        socket.on("waiting", () => {
            dispatch({ type: "WAITING" });
        });
        socket.on(
            "game-start",
            (data: { playerNumber: 1 | 2; roomId: string }) => {
                dispatch({
                    type: "GAME_START",
                    playerNumber: data.playerNumber,
                    roomId: data.roomId,
                });
            },
        );
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

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && !socket.connected) {
                socket.connect();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
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
