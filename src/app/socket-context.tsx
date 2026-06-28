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
import type { GameState, GameAction } from "../shared/types";
import { initState } from "../shared/helpers";
import { getPlayerId, getPlayerName, setPlayerName } from "./utils";

type ConnectionStatus = "idle" | "loaded" | "searching" | "waiting" | "playing" | "disconnected";

interface SocketContextType {
    state: State;
    findGame: () => boolean;
    startGame: (newGame?: boolean) => void;
    sendGameAction: (action: GameAction) => void;
    changePlayerName: (newName: string) => void;
    endGame: (shouldSave?: boolean) => void;
}

type State = {
    connectionStatus: ConnectionStatus;
    playerNumber: 1 | 2;
    roomId: string | null;
    playerName?: string | null;
    gameState: GameState;
    disconnectedReason?: string;
};

const initialState: State = {
    connectionStatus: "idle",
    playerNumber: 1,
    roomId: null,
    gameState: initState(),
};

const SocketContext = createContext<SocketContextType>({
    state: initialState,
    changePlayerName: () => {},
    findGame: () => false,
    startGame: () => {},
    endGame: () => {},
    sendGameAction: () => {},
});

export function useSocket() {
    return useContext(SocketContext);
}

type Action =
    | { type: "LOADED" }
    | { type: "SEARCHING" }
    | { type: "WAITING" }
    | {
          type: "GAME_START";
          playerNumber: 1 | 2;
          roomId: string;
          gameState: GameState;
      }
    | { type: "GAME_STATE"; gameState: GameState }
    | { type: "OPPONENT_DISCONNECTED" }
    | { type: "SET_NAME"; name: string | null }
    | { type: "END_GAME"; reason: string }
    | { type: "DISCONNECT" };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "LOADED":
            return { ...state, connectionStatus: "loaded" };
        case "SEARCHING":
            return { ...state, connectionStatus: "searching" };
        case "WAITING":
            return {
                ...state,
                connectionStatus: "waiting",
            };
        case "GAME_START":
            return {
                ...state,
                connectionStatus: "playing",
                playerNumber: action.playerNumber,
                roomId: action.roomId,
                gameState: action.gameState,
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
        case "SET_NAME":
            return { ...state, playerName: action.name };
        case "END_GAME":
            return {
                ...state,
                connectionStatus: "disconnected",
                disconnectedReason: action.reason,
            };
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
        dispatch({ type: "SET_NAME", name: getPlayerName() });

        if (!socket.connected) socket.connect();
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to server:", socket.id, "recovered:", socket.recovered);
        });
        socket.on("get-player-id", (callback) => {
            const playerId = getPlayerId();
            callback(playerId);
        });
        socket.on("game-loaded", () => {
            dispatch({ type: "LOADED" });
        });
        socket.on("room-found", () => {
            dispatch({ type: "WAITING" });
        });
        socket.on(
            "game-start",
            (data: { playerNumber: 1 | 2; roomId: string; gameState: GameState }) => {
                dispatch({
                    type: "GAME_START",
                    playerNumber: data.playerNumber,
                    roomId: data.roomId,
                    gameState: data.gameState,
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
        socket.on("end-game", (reason) => {
            dispatch({ type: "END_GAME", reason });
        });

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && !socket.connected) {
                socket.connect();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const findGame = useCallback(() => {
        const id = getPlayerId();
        const name = getPlayerName();
        if (socketRef.current && name) {
            dispatch({ type: "SEARCHING" });
            socketRef.current.emit("find-game", { id, name });
            return true;
        }
        return false;
    }, []);

    const startGame = useCallback((newGame: boolean = true) => {
        if (socketRef.current) {
            dispatch({ type: "SEARCHING" });
            socketRef.current.emit("start-game", { newGame });
        }
    }, []);

    const sendGameAction = useCallback((action: GameAction) => {
        socketRef.current?.emit("game-action", action);
    }, []);

    const endGame = useCallback((shouldSave: boolean = true) => {
        socketRef.current?.emit("end-game", shouldSave);
    }, []);

    const changePlayerName = (name: string) => {
        if (name) {
            dispatch({ type: "SET_NAME", name });
            setPlayerName(name);
        }
    };

    return (
        <SocketContext.Provider
            value={{
                state,
                findGame,
                startGame,
                endGame,
                changePlayerName,
                sendGameAction,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}
