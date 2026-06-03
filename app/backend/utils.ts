import { stateKeys } from "../consts";
import { Prisma } from "../generated/prisma/client";
import type { GameBackendState, LastGame } from "../utils/types";
import { prisma } from "./prisma";

export async function fetchGame(): Promise<LastGame | false> {
    try {
        const lastGame = await prisma.games.findFirst({
            where: {
                finished: false,
            },
            orderBy: { time: "desc" },
        });
        if (!lastGame) {
            return false;
        }
        return {
            gameState: formatGameState(lastGame.gameState),
            playerIds: (lastGame.playerIds as Prisma.JsonArray).map((id) =>
                String(id),
            ),
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
        await prisma.games.upsert({
            where: {
                roomId,
            },
            update: {
                finished,
                gameState: gameState as unknown as Prisma.InputJsonObject,
                time: new Date(),
            },
            create: {
                roomId,
                finished,
                gameState: gameState as unknown as Prisma.InputJsonObject,
                playerIds,
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
