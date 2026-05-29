import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { Game } from "./game-logic";
import { fetchGame, saveGame } from "./utils";
import type { GameBackendState } from "../utils/types";
import { randomUUID } from "crypto";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let waitingSocketId: string | null = null;

interface PlayerSessionInfo {
    roomId: string;
    playerNumber: 1 | 2;
    deleteTimer?: ReturnType<typeof setTimeout>;
}

const playerInfo: Map<string, PlayerSessionInfo> = new Map();

const roomGameStates: Map<string, Game> = new Map();

const connectedPlayers: Set<string> = new Set();

async function main() {
    await app.prepare();

    const httpServer = createServer((req, res) => {
        handle(req, res);
    });

    const io = new Server(httpServer, {
        cors: { origin: "*" },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true,
        },
        pingInterval: 10000,
        pingTimeout: 20000,
    });

    io.on("connection", async (socket) => {
        console.log(new Date(), `[Socket] Connected: ${socket.id}`);

        let lastGameState: GameBackendState | false = false;
        if (socket.recovered) {
            const info = playerInfo.get(socket.id);
            if (info) {
                clearTimeout(info.deleteTimer);
                const game = roomGameStates.get(info.roomId);
                if (game) {
                    socket.emit("game-start", {
                        playerNumber: info.playerNumber,
                        roomId: info.roomId,
                    });
                    socket.emit("game-state", game.clientState);
                    console.log(
                        new Date(),
                        `[Socket] Recovered session for ${socket.id} in ${info.roomId}`,
                    );
                }
            }
        } else {
            lastGameState = await fetchGame();

            if (lastGameState) {
                socket.emit("last-game-available");
            }

            if (connectedPlayers.size > 0) {
                socket.emit("waiting", {
                    message: "Somebody's waiting",
                });
            }
        }

        connectedPlayers.add(socket.id);

        socket.on("find-game", ({ newGame = true }) => {
            if (waitingSocketId && waitingSocketId !== socket.id) {
                const roomId = randomUUID();
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

                const game = new Game();
                if (!newGame && lastGameState) {
                    game.setState(lastGameState);
                }

                roomGameStates.set(roomId, game);

                const clientState = game.clientState;
                waitingSocket.emit("game-start", {
                    playerNumber: 1,
                    roomId,
                });
                socket.emit("game-start", { playerNumber: 2, roomId });

                // Send initial game state to both
                io.to(roomId).emit("game-state", clientState);

                console.log(
                    new Date(),
                    `[Room] ${roomId} created: P1=${waitingSocket.id}, P2=${socket.id}`,
                );
            } else {
                waitingSocketId = socket.id;
                for (const id of Array.from(connectedPlayers)) {
                    socket.to(id).emit("waiting", {
                        message: "Somebody just connected",
                    });
                }
                console.log(
                    new Date(),
                    `[Socket] ${socket.id} is waiting for an opponent`,
                );
            }
        });

        socket.on("game-action", (data) => {
            const info = playerInfo.get(socket.id);
            if (!info) return;

            const game = roomGameStates.get(info.roomId);
            if (!game) return;

            const result = game.applyAction(info.playerNumber, data);

            if (result.error) {
                socket.emit("game-error", { error: result.error });
                socket.emit("game-state", game.clientState);
                console.log(
                    new Date(),
                    `[Game] Error for P${info.playerNumber}: ${result.error}`,
                );
                return;
            }

            game.updatePhase();

            io.to(info.roomId).emit("game-state", game.clientState);
        });

        socket.on("disconnect", (reason) => {
            console.log(reason);
            console.log(new Date(), `[Socket] Disconnected: ${socket.id}`);

            connectedPlayers.delete(socket.id);
            if (waitingSocketId === socket.id) {
                waitingSocketId = null;
            }

            const info = playerInfo.get(socket.id);
            if (info) {
                const game = roomGameStates.get(info.roomId);
                if (game) {
                    saveGame(info.roomId, game.state, false);
                }
                info.deleteTimer = setTimeout(
                    () => {
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
                    },
                    5 * 60 * 10 ** 3,
                );
            }
        });
    });

    httpServer.listen(port, hostname, () => {
        console.log(new Date(), `> Ready on http://${hostname}:${port}`);
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
