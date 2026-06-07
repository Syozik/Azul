import { stateKeys } from "../consts";
import { Prisma } from "../generated/prisma/client";
import type {
    GameBackendState,
    LastGame,
    PlayerSessionInfo,
} from "../utils/types";
import { prisma } from "./prisma";

export async function fetchLastGame(
    id1: string,
    id2: string,
): Promise<LastGame | false> {
    try {
        const lastGame = await prisma.game.findFirst({
            where: {
                finished: false,
                AND: [
                    { players: { some: { id: id1 } } },
                    { players: { some: { id: id2 } } },
                ],
            },
            include: { players: true },
            orderBy: { time: "desc" },
        });
        if (!lastGame) {
            return false;
        }
        return {
            gameState: formatGameState(lastGame.gameState),
            playerIds: lastGame.players.map((id) => String(id)),
        };
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
        return false;
    }
}

export async function saveGame(
    roomId: string,
    playerIds: string[],
    gameState: GameBackendState,
    finished: boolean,
): Promise<boolean> {
    try {
        const operations = playerIds.map((id) =>
            prisma.player.upsert({
                where: { id },
                update: { id },
                create: { id },
            }),
        );
        await prisma.$transaction(operations);
        await prisma.game.upsert({
            where: { roomId },
            update: {
                finished,
                gameState: gameState as unknown as Prisma.InputJsonObject,
                time: new Date(),
            },
            create: {
                roomId,
                finished,
                gameState: gameState as unknown as Prisma.InputJsonObject,
                players: {
                    connect: playerIds.map((id) => ({ id })),
                },
                time: new Date(),
            },
        });
        return true;
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
        return false;
    }
}

function formatGameState(json: Prisma.JsonValue): GameBackendState {
    const jsonObject = json as Prisma.JsonObject;
    const state = {} as GameBackendState;

    for (const stateKey of stateKeys) {
        const value = jsonObject[stateKey];
        if (value === undefined) {
            throw new Error(
                `Invalid gameState JSON: missing key \"${stateKey}\"`,
            );
        }

        (state as Record<keyof GameBackendState, unknown>)[stateKey] = value;
    }

    return state;
}

export function updatePlayerNumber(
    playerInfo: PlayerSessionInfo,
    playerIds: string[],
) {
    const playerIdx = playerIds.indexOf(playerInfo.id);
    playerInfo.number = (playerIdx + 1) as 1 | 2;
    return true;
}
