import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { Game } from "./game-logic";
import { fetchLastGame, saveGame, updatePlayerNumber } from "./utils";
import type { PlayerInfo, PlayerSessionInfo, RoomState } from "../shared/types";
import { randomUUID } from "crypto";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let waitingSocketId: string | null = null;

const socketToPlayerMap: Map<string, PlayerInfo> = new Map();

const playerInfo: Map<string, PlayerSessionInfo> = new Map(); // playerId: info

const roomStates: Map<string, RoomState> = new Map();

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

        let shouldGetPlayerId = true;
        if (socket.recovered) {
            const player = socketToPlayerMap.get(socket.id);
            shouldGetPlayerId = !!player;
            const info = player && playerInfo.get(player.id);
            if (info) {
                clearTimeout(info.deleteTimer);
                delete info.deleteTimer;
                const roomState = roomStates.get(info.roomId);
                if (roomState && !roomState.game.state.isGameOver) {
                    socket.emit("game-start", {
                        playerNumber: info.number,
                        roomId: info.roomId,
                        gameState: roomState.game.clientState,
                    });
                    console.log(
                        new Date(),
                        `: Recovered session for ${socket.id} in ${info.roomId}`,
                    );
                }
            }
        }
        if (shouldGetPlayerId) {
            socket.emit("get-player-id", (playerId: string) => {
                const info = playerInfo.get(playerId);
                if (info && info.socketId) {
                    const player = socketToPlayerMap.get(info.socketId)!;
                    socketToPlayerMap.delete(info.socketId);
                    socketToPlayerMap.set(socket.id, player);
                    clearTimeout(info.deleteTimer);
                    delete info.deleteTimer;
                    const roomState = roomStates.get(info.roomId)!;
                    socket.join(info.roomId);
                    socket.emit("game-start", {
                        playerNumber: info.number,
                        roomId: info.roomId,
                        gameState: roomState.game.clientState,
                    });
                    console.log(
                        new Date(),
                        `: Recovered session for ${info.socketId}, id: ${playerId} (new socket: ${socket.id}) in ${info.roomId}`,
                    );
                    info.socketId = socket.id;
                    return;
                }
                socketToPlayerMap.set(socket.id, { id: playerId });
                socket.emit("game-loaded");
            });
        }

        socket.on("start-game", ({ newGame = true }) => {
            const player = socketToPlayerMap.get(socket.id)!;
            const info = playerInfo.get(player.id)!;
            const roomId = info.roomId;

            const roomState = roomStates.get(roomId)!;
            const opponentPlayerId = roomState.playerIds.find((id) => id !== player.id)!;
            const opponentInfo = playerInfo.get(opponentPlayerId)!;
            const opponentSocket = io.sockets.sockets.get(opponentInfo.socketId);
            if (!opponentSocket) {
                return;
            }

            if (!newGame && roomState.lastGame) {
                roomState.game.setState(roomState.lastGame.gameState);
                updatePlayerNumber(info, roomState.lastGame.playerIds);
                updatePlayerNumber(opponentInfo, roomState.lastGame.playerIds);
                roomState.playerIds[info.number - 1] = player.id;
                roomState.playerIds[opponentInfo.number - 1] = opponentPlayerId;
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
                    ${info.id}: P${info.number}, ${opponentInfo.id}: P${opponentInfo.number}`,
            );
        });

        socket.on("find-game", async ({ id, name }: { id: string; name: string }) => {
            socketToPlayerMap.set(socket.id, { id, name });
            if (waitingSocketId && waitingSocketId !== socket.id) {
                const roomId = randomUUID();
                const waitingSocket = io.sockets.sockets.get(waitingSocketId);

                if (!waitingSocket) {
                    waitingSocketId = socket.id;
                    return;
                }

                const player = socketToPlayerMap.get(socket.id)!;
                const waitingPlayer = socketToPlayerMap.get(waitingSocket.id)!;
                if (!player.id || !waitingPlayer.id) return false;

                // Both join the room
                waitingSocket.join(roomId);
                socket.join(roomId);
                waitingSocketId = null;

                playerInfo.set(player.id, {
                    roomId,
                    number: 1,
                    id: player.id,
                    socketId: socket.id,
                });

                playerInfo.set(waitingPlayer.id, {
                    roomId,
                    number: 2,
                    id: waitingPlayer.id,
                    socketId: waitingSocket.id,
                });

                const game = new Game([player.name!, waitingPlayer.name!]);
                const lastGame = await fetchLastGame(player.id, waitingPlayer.id);
                roomStates.set(roomId, {
                    game,
                    lastGame,
                    playerIds: [player.id, waitingPlayer.id],
                    gameStarted: false,
                });

                console.log(
                    new Date(),
                    `[Room] ${roomId} created: P1=${player.id}, P2=${waitingPlayer.id}`,
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
                        ${player.id}: P1, ${waitingPlayer.id}: P2`,
                    );
                }
            } else {
                waitingSocketId = socket.id;
                // for (const id of Array.from(connectedPlayers)) {
                //     socket.to(id).emit("waiting", {
                //         message: "Somebody just connected",
                //     });
                // }
                console.log(new Date(), `[Socket] ${socket.id} is waiting for an opponent`);
            }
        });

        socket.on("game-action", async (data) => {
            const player = socketToPlayerMap.get(socket.id)!;
            const info = playerInfo.get(player.id);
            if (!info) return;

            const game = roomStates.get(info.roomId)?.game;
            if (!game) return;

            const result = game.applyAction(info.number, data);

            if (result.error) {
                socket.emit("game-error", { error: result.error });
                socket.emit("game-state", game.clientState);
                console.log(new Date(), `[Game] Error for P${info.number}: ${result.error}`);
                return;
            }

            game.updatePhase();

            io.to(info.roomId).emit("game-state", game.clientState);
            if (game.state.isGameOver) {
                await endGame(info.roomId);
            }
        });

        socket.on("end-game", async (shouldSave: boolean) => {
            const player = socketToPlayerMap.get(socket.id)!;
            const info = playerInfo.get(player.id);
            if (!info) return;

            const game = roomStates.get(info.roomId)!.game;
            const playerName = game.state.players[info.number - 1].name;
            const message = (name: string) => `${name} ended the game. You can continue it later.`;
            try {
                await endGame(info.roomId, shouldSave);
            } catch (err) {
                console.error(`[Error] Failed to endGame for room ${info.roomId}:`, err);
            }

            socket.emit("end-game", message("You"));
            socket.to(info.roomId).emit("end-game", message(playerName));
        });

        socket.on("disconnect", async () => {
            console.log(new Date(), `[Socket] Disconnected: ${socket.id}`);

            if (waitingSocketId === socket.id) {
                waitingSocketId = null;
            }

            const player = socketToPlayerMap.get(socket.id);
            const info = player && playerInfo.get(player.id);
            if (info) {
                info.deleteTimer = setTimeout(
                    () => {
                        io.to(info.roomId).emit("opponent-disconnected");
                        endGame(info.roomId).catch((err) => {
                            console.error(
                                `[Error] Failed to endGame for room ${info.roomId}:`,
                                err,
                            );
                        });
                        socketToPlayerMap.delete(socket.id);
                    },
                    60 * 10 ** 3,
                );
            } else {
                socketToPlayerMap.delete(socket.id);
            }
        });
    });

    httpServer.listen(port, hostname, () => {
        console.log(new Date(), `> Ready on http://${hostname}:${port}`);
    });
}

async function endGame(roomId: string, shouldSave: boolean = true) {
    const roomState = roomStates.get(roomId);
    if (!roomState) {
        return;
    }

    if (roomState.gameStarted && shouldSave) {
        const playerIds: string[] = new Array<string>(roomState.playerIds.length);
        for (const playerId of roomState.playerIds) {
            const info = playerInfo.get(playerId);
            if (info) {
                playerIds[info.number - 1] = info.id;
            }
        }
        const isGameSaved = await saveGame(
            playerIds,
            roomState.game.state,
            roomState.game.state.isGameOver,
            roomState.lastGame ? roomState.lastGame.gameId : undefined,
        );
        if (isGameSaved) {
            console.log(new Date(), "The game has been succesfully saved.");
        } else {
            console.log(new Date(), "The game hasn't been saved.");
        }
    }
    // Clean up the other player's info and the room's game state
    for (const playerId of roomState.playerIds) {
        playerInfo.delete(playerId);
    }
    roomStates.delete(roomId);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
