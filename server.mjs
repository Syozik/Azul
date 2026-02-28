import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

/** @type {string | null} */
let waitingSocketId = null;

/** @type {Map<string, { roomId: string; playerNumber: 1 | 2 }>} */
const playerInfo = new Map();

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
        if (connectedPlayers.length) {
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
                    // Waiting socket disconnected, this player becomes the new waiter
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

                waitingSocket.emit("game-start", {
                    playerNumber: 1,
                    roomId,
                });
                socket.emit("game-start", { playerNumber: 2, roomId });

                console.log(`[Room] ${roomId} created: P1=${waitingSocket.id}, P2=${socket.id}`);
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

            // Broadcast the action to the other player in the room
            socket.to(info.roomId).emit("game-action", {
                ...data,
                fromPlayer: info.playerNumber,
            });
        });

        socket.on("disconnect", () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);

            connectedPlayers.delete(socket.id);
            // If the waiting player disconnects, clear them
            if (waitingSocketId === socket.id) {
                waitingSocketId = null;
            }

            // If a player in a room disconnects, notify the other player
            const info = playerInfo.get(socket.id);
            if (info) {
                socket.to(info.roomId).emit("opponent-disconnected");
                playerInfo.delete(socket.id);

                // Also clean up the other player's info
                for (const [id, pInfo] of playerInfo.entries()) {
                    if (pInfo.roomId === info.roomId) {
                        playerInfo.delete(id);
                        break;
                    }
                }
            }
        });
    });

    httpServer.listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
