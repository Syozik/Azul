import {
    NUM_FACTORIES,
    stateKeys,
    TILE_COLORS,
    TILES_PER_COLOR,
    TILES_PER_FACTORY,
} from "../shared/consts";
import { Prisma } from "./db/generated/prisma/client";
import type {
    ColorKey,
    GameBackendState,
    LastGame,
    PlayerSessionInfo,
} from "../shared/types";
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
            gameId: lastGame.id,
            playerIds: lastGame.playersOrder as Prisma.JsonArray as string[],
        };
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
        return false;
    }
}

export async function saveGame(
    playerIds: string[],
    gameState: GameBackendState,
    finished: boolean,
    gameId: number | undefined,
): Promise<boolean> {
    try {
        if (gameId) {
            await prisma.game.update({
                where: { id: gameId },
                data: {
                    finished,
                    gameState: gameState as unknown as Prisma.InputJsonObject,
                    time: new Date(),
                },
            });
            return true;
        }
        const operations = playerIds.map((id) =>
            prisma.player.upsert({
                where: { id },
                update: { id },
                create: { id },
            }),
        );
        await prisma.$transaction(operations);
        await prisma.game.create({
            data: {
                finished,
                gameState: gameState as unknown as Prisma.InputJsonObject,
                players: {
                    connect: playerIds.map((id) => ({ id })),
                },
                playersOrder: playerIds as unknown as Prisma.InputJsonArray,
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

/**
 * Create a shuffled tile bag: 22 tiles of each of the 6 colors = 132 total
 */
export function createTileBag() {
    const bag: ColorKey[] = [];
    for (const color of TILE_COLORS) {
        for (let i = 0; i < TILES_PER_COLOR; i++) {
            bag.push(color);
        }
    }
    shuffle(bag);
    return bag;
}

// Fisher-Yates shuffle
export function shuffle<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/**
 * Fill factories by drawing from the bag
 */
export function fillFactories(bag: ColorKey[]) {
    const factories = [];
    for (let i = 0; i < NUM_FACTORIES; i++) {
        const factory = bag.splice(0, TILES_PER_FACTORY);
        factories.push(factory);
    }
    return factories;
}
