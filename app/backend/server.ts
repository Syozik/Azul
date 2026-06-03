import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { Game } from "./game-logic";
import { fetchGame, saveGame } from "./utils";
import type { LastGame, PlayerSessionInfo, RoomState } from "../utils/types";
import { randomUUID } from "crypto";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let waitingSocketId: string | null = null;

const socketToPlayerMap: Map<string, string> = new Map();

const playerInfo: Map<string, PlayerSessionInfo> = new Map();

const roomStates: Map<string, RoomState> = new Map();

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

        socket.emit("get-player-id", (playerId: string) => {
            socketToPlayerMap.set(socket.id, playerId);
        });

        let lastGame: LastGame | false = false;
        if (socket.recovered) {
            const info = playerInfo.get(socket.id);
            if (info) {
                clearTimeout(info.deleteTimer);
                const roomState = roomStates.get(info.roomId);
                if (roomState) {
                    socket.emit("game-start", {
                        playerNumber: info.number,
                        roomId: info.roomId,
                    });
                    socket.emit("game-state", roomState.game.clientState);
                    console.log(
                        new Date(),
                        `[] Recovered session for ${socket.id} in ${info.roomId}`,
                    );
                }
            }
        } else {
            lastGame = await fetchGame();
            if (lastGame) {
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

                const playerId: string | undefined = socketToPlayerMap.get(
                    socket.id,
                );
                const waitingPlayerId: string | undefined =
                    socketToPlayerMap.get(waitingSocket.id);
                if (!(playerId && waitingPlayerId)) {
                    return false;
                }
                // Both join the room
                waitingSocket.join(roomId);
                socket.join(roomId);
                waitingSocketId = null;

                const game = new Game();
                let [socketPlayer, waitingSocketPlayer]: (1 | 2)[] = [1, 2];
                if (!newGame && lastGame) {
                    game.setState(lastGame.gameState);
                    socketPlayer = lastGame.playerIds.indexOf(playerId) + 1;
                    waitingSocketPlayer =
                        lastGame.playerIds.indexOf(waitingPlayerId) + 1;
                }

                playerInfo.set(socket.id, {
                    roomId,
                    number: socketPlayer as 1 | 2,
                    id: playerId as string,
                });

                playerInfo.set(waitingSocket.id, {
                    roomId,
                    number: waitingSocketPlayer as 1 | 2,
                    id: waitingPlayerId as string,
                });

                roomStates.set(roomId, {
                    game,
                    socketIds: [socket.id, waitingSocket.id],
                });

                const clientState = game.clientState;
                waitingSocket.emit("game-start", {
                    playerNumber: waitingSocketPlayer,
                    roomId,
                });
                socket.emit("game-start", {
                    playerNumber: socketPlayer,
                    roomId,
                });

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

            const game = roomStates.get(info.roomId)?.game;
            if (!game) return;

            const result = game.applyAction(info.number, data);

            if (result.error) {
                socket.emit("game-error", { error: result.error });
                socket.emit("game-state", game.clientState);
                console.log(
                    new Date(),
                    `[Game] Error for P${info.number}: ${result.error}`,
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
                const roomState = roomStates.get(info.roomId);
                if (roomState) {
                    const playerIds: string[] = new Array<string>(
                        roomState.socketIds.length,
                    );
                    for (const socketId of roomState.socketIds) {
                        const info = playerInfo.get(socketId);
                        if (!info) {
                            continue;
                        }
                        playerIds[info.number - 1] = info.id;
                    }
                    saveGame(
                        info.roomId,
                        playerIds,
                        roomState.game.state,
                        false,
                    );
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
                        roomStates.delete(info.roomId);
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
