"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
    useRef,
    useReducer,
} from "react";
import { io, Socket } from "socket.io-client";

type GameStatus = "idle" | "searching" | "waiting" | "playing" | "disconnected";

interface SocketContextType {
    // socket: Socket | null;
    gameStatus: GameStatus;
    playerNumber: 1 | 2 | null;
    roomId: string | null;
    findGame: () => void;
    sendGameAction: (action: Record<string, unknown>) => void;
    onGameAction: (handler: (data: Record<string, unknown>) => void) => () => void;
}

const SocketContext = createContext<SocketContextType>({
    // socket: null,
    gameStatus: "idle",
    playerNumber: null,
    roomId: null,
    findGame: () => {},
    sendGameAction: () => {},
    onGameAction: () => () => {},
});

export function useSocket() {
    return useContext(SocketContext);
}

type GameState = {
    status: GameStatus;
    playerNumber: 1 | 2 | null;
    roomId: string | null;
};

type GameAction =
    | { type: "WAITING" }
    | { type: "SEARCHING" }
    | { type: "GAME_START"; playerNumber: 1 | 2; roomId: string }
    | { type: "OPPONENT_DISCONNECTED" }
    | { type: "DISCONNECT" };

const initialState: GameState = {
    status: "idle",
    playerNumber: null,
    roomId: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case "SEARCHING":
            return { ...state, status: "searching" };
        case "WAITING":
            return { ...state, status: "waiting" };
        case "GAME_START":
            return { status: "playing", playerNumber: action.playerNumber, roomId: action.roomId };
        case "OPPONENT_DISCONNECTED":
            return { status: "disconnected", playerNumber: null, roomId: null };
        case "DISCONNECT":
            return initialState;
        default:
            return state;
    }
}

export function SocketProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const [gameState, dispatch] = useReducer(gameReducer, initialState);

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

    const sendGameAction = useCallback((action: Record<string, unknown>) => {
        socketRef.current?.emit("game-action", action);
    }, []);

    const onGameAction = useCallback((handler: (data: Record<string, unknown>) => void) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on("game-action", handler);
        return () => {
            socketRef.current?.off("game-action", handler);
        };
    }, []);

    return (
        <SocketContext.Provider
            value={{
                gameStatus: gameState.status,
                playerNumber: gameState.playerNumber,
                roomId: gameState.roomId,
                findGame,
                sendGameAction,
                onGameAction,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}
