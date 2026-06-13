import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { Game } from "./game-logic";
import { fetchLastGame, saveGame, updatePlayerNumber } from "./utils";
import type { LastGame, PlayerSessionInfo, RoomState } from "../shared/types";
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

    io.on("connection", (socket) => {
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
                if (roomState && !roomState.game.state.isGameOver) {
                    socket.emit("game-start", {
                        playerNumber: info.number,
                        roomId: info.roomId,
                        gameState: roomState.game.clientState,
                    });
                    console.log(
                        new Date(),
                        `[] Recovered session for ${socket.id} in ${info.roomId}`,
                    );
                }
            }
        }

        connectedPlayers.add(socket.id);

        socket.on("start-game", ({ newGame = true }) => {
            const info = playerInfo.get(socket.id)!;
            const roomId = info.roomId;

            const roomState = roomStates.get(roomId)!;
            const opponentSocketId = roomState.socketIds.find(
                (id) => id !== socket.id,
            )!;
            const opponentSocket = io.sockets.sockets.get(opponentSocketId);
            if (!opponentSocket) {
                return;
            }
            const opponentInfo = playerInfo.get(opponentSocketId)!;

            if (!newGame && roomState.lastGame) {
                roomState.game.setState(roomState.lastGame.gameState);
                updatePlayerNumber(info, roomState.lastGame.playerIds);
                updatePlayerNumber(opponentInfo, roomState.lastGame.playerIds);
            }
            roomState.gameStarted = true;

            socket.emit("game-start", {
                gameState: roomState.game.clientState,
                playerNumber: info.number,
                roomId,
            });
            opponentSocket.emit("game-start", {
                gameState: roomState.game.clientState,
                playerNumber: opponentInfo.number,
                roomId,
            });

            console.log(
                new Date(),
                `[Game] ${roomId} game started:
                    ${info.id}: P${info.number}, ${opponentSocketId}: P${opponentInfo.number}`,
            );
        });

        socket.on("find-game", async () => {
            if (waitingSocketId && waitingSocketId !== socket.id) {
                const roomId = randomUUID();
                const waitingSocket = io.sockets.sockets.get(waitingSocketId);

                if (!waitingSocket) {
                    waitingSocketId = socket.id;
                    return;
                }

                const playerId = socketToPlayerMap.get(socket.id)!;
                const waitingPlayerId = socketToPlayerMap.get(waitingSocket.id)!;
                if (!playerId || !waitingPlayerId) return false;

                // Both join the room
                waitingSocket.join(roomId);
                socket.join(roomId);
                waitingSocketId = null;

                playerInfo.set(socket.id, {
                    roomId,
                    number: 1,
                    id: playerId,
                });

                playerInfo.set(waitingSocket.id, {
                    roomId,
                    number: 2,
                    id: waitingPlayerId,
                });

                const game = new Game();
                lastGame = await fetchLastGame(playerId, waitingPlayerId);
                roomStates.set(roomId, {
                    game,
                    lastGame,
                    socketIds: [socket.id, waitingSocket.id],
                    gameStarted: false,
                });

                console.log(
                    new Date(),
                    `[Room] ${roomId} created: P1=${waitingSocket.id}, P2=${socket.id}`,
                );

                if (lastGame) {
                    io.to(roomId).emit("room-found");
                } else {
                    socket.emit("game-start", {
                        gameState: game.clientState,
                        playerNumber: 1,
                        roomId,
                    });
                    waitingSocket.emit("game-start", {
                        gameState: game.clientState,
                        playerNumber: 2,
                        roomId,
                    });
                    const roomState = roomStates.get(roomId)!;
                    roomState.gameStarted = true;
                    console.log(
                        new Date(),
                        `[Game] ${roomId} game started:
                        ${playerId}: P${1}, ${waitingPlayerId}: P${2}`,
                    );
                }
            } else {
                waitingSocketId = socket.id;
                // for (const id of Array.from(connectedPlayers)) {
                //     socket.to(id).emit("waiting", {
                //         message: "Somebody just connected",
                //     });
                // }
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

        socket.on("disconnect", async (reason) => {
            console.log(reason);
            console.log(new Date(), `[Socket] Disconnected: ${socket.id}`);

            connectedPlayers.delete(socket.id);
            if (waitingSocketId === socket.id) {
                waitingSocketId = null;
            }

            const info = playerInfo.get(socket.id);
            if (info) {
                const roomState = roomStates.get(info.roomId)!;
                if (roomState.gameStarted) {
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

                    const isGameSaved = await saveGame(
                        playerIds,
                        roomState.game.state,
                        roomState.game.state.isGameOver,
                        roomState.lastGame
                            ? roomState.lastGame.gameId
                            : undefined,
                    );
                    if (isGameSaved) {
                        console.log("The game has been succesfully saved.");
                    } else {
                        console.log("The game hasn't been saved.");
                    }
                }
                info.deleteTimer = setTimeout(
                    () => {
                        socket.to(info.roomId).emit("opponent-disconnected");
                        // Clean up the other player's info and the room's game state
                        for (const socketId of roomState.socketIds) {
                            playerInfo.delete(socketId);
                        }
                        roomStates.delete(info.roomId);
                    },
                    60 * 10 ** 3,
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
