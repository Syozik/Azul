import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import {
    initGameState,
    applyPickFromFactory,
    applyPickFromCenter,
    toClientState,
    isPickingPhaseOver,
} from "./app/game/game-logic.mjs";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

/** @type {string | null} */
let waitingSocketId = null;

/** @type {Map<string, { roomId: string; playerNumber: 1 | 2 }>} */
const playerInfo = new Map();

/** @type {Map<string, object>} */
const roomGameStates = new Map();

let roomCounter = 0;
const connectedPlayers = new Set();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        handle(req, res);
    });

    const io = new Server(httpServer, {
        cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);
        if (connectedPlayers.size > 0) {
            socket.emit("waiting", {
                message: "Somebody's waiting",
            });
        }
        connectedPlayers.add(socket.id);

        socket.on("find-game", () => {
            if (waitingSocketId && waitingSocketId !== socket.id) {
                const roomId = `room-${++roomCounter}`;
                const waitingSocket = io.sockets.sockets.get(waitingSocketId);

                if (!waitingSocket) {
                    waitingSocketId = socket.id;
                    socket.emit("waiting", {
                        message: "Waiting for Player 2...",
                    });
                    return;
                }

                // Both join the room
                waitingSocket.join(roomId);
                socket.join(roomId);

                playerInfo.set(waitingSocket.id, {
                    roomId,
                    playerNumber: 1,
                });
                playerInfo.set(socket.id, { roomId, playerNumber: 2 });

                waitingSocketId = null;

                // Initialize game state for this room
                const gameState = initGameState();
                roomGameStates.set(roomId, gameState);

                // Notify both players the game is starting + send initial state
                const clientState = toClientState(gameState);
                waitingSocket.emit("game-start", {
                    playerNumber: 1,
                    roomId,
                });
                socket.emit("game-start", { playerNumber: 2, roomId });

                // Send initial game state to both
                io.to(roomId).emit("game-state", clientState);

                console.log(`[Room] ${roomId} created: P1=${waitingSocket.id}, P2=${socket.id}`);
                console.log(
                    `[Game] Initial factories:`,
                    gameState.factories.map((f) => f.join(",")),
                );
            } else {
                waitingSocketId = socket.id;
                for (const id of Array.from(connectedPlayers)) {
                    socket.to(id).emit("waiting", {
                        message: "Somebody just connected",
                    });
                }
                console.log(`[Socket] ${socket.id} is waiting for an opponent`);
            }
        });

        socket.on("game-action", (data) => {
            const info = playerInfo.get(socket.id);
            if (!info) return;

            const state = roomGameStates.get(info.roomId);
            if (!state) return;

            let result;

            if (data.type === "pick-from-factory") {
                result = applyPickFromFactory(
                    state,
                    info.playerNumber,
                    data.factoryIndex,
                    data.color,
                );
            } else if (data.type === "pick-from-center") {
                result = applyPickFromCenter(state, info.playerNumber, data.color);
            } else {
                console.log(`[Game] Unknown action type: ${data.type}`);
                return;
            }

            if (result.error) {
                // Send error back to the player who made the invalid action
                socket.emit("game-error", { error: result.error });
                console.log(`[Game] Error for P${info.playerNumber}: ${result.error}`);
                return;
            }

            // Update the room's game state
            roomGameStates.set(info.roomId, result.newState);

            // Broadcast the new state to both players
            const clientState = toClientState(result.newState);
            io.to(info.roomId).emit("game-state", clientState);

            console.log(
                `[Game] P${info.playerNumber} picked ${data.color} from ${data.type === "pick-from-factory" ? `factory ${data.factoryIndex}` : "center"}`,
            );

            // Check if picking phase is over
            if (isPickingPhaseOver(result.newState)) {
                console.log(`[Game] Picking phase is over in ${info.roomId}!`);
                io.to(info.roomId).emit("phase-over", {
                    message: "All tiles have been picked!",
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);

            connectedPlayers.delete(socket.id);
            if (waitingSocketId === socket.id) {
                waitingSocketId = null;
            }

            const info = playerInfo.get(socket.id);
            if (info) {
                socket.to(info.roomId).emit("opponent-disconnected");
                playerInfo.delete(socket.id);

                // Clean up the other player's info and the room's game state
                for (const [id, pInfo] of playerInfo.entries()) {
                    if (pInfo.roomId === info.roomId) {
                        playerInfo.delete(id);
                        break;
                    }
                }
                roomGameStates.delete(info.roomId);
            }
        });
    });

    httpServer.listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
