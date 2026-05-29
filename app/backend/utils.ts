import { stateKeys } from "../consts";
import { Prisma } from "../generated/prisma/client";
import { createTileBag, fillFactories, initState } from "../utils/helpers";
import type { GameBackendState } from "../utils/types";
import { prisma } from "./prisma";

export async function fetchGame(): Promise<GameBackendState | false> {
    const bag = createTileBag();
    const state: GameBackendState = {
        ...initState(),
        factories: fillFactories(bag),
        baseTiles: [bag.splice(0, 5), bag.splice(0, 5)],
        phase: 2,
        _bag: bag,
        _trash: [],
    };
    state.players[0].score = 100;
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
        return makeGameState(lastGame.gameState);
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
        return false;
    }
}

export async function saveGame(
    roomId: string,
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

function makeGameState(json: Prisma.JsonValue): GameBackendState {
    const jsonObject = json as Prisma.JsonObject;
    const state = {} as GameBackendState;

    for (const stateKey of stateKeys) {
        const value = jsonObject[stateKey];
        if (value === undefined) {
            throw new Error(`Invalid gameState JSON: missing key \"${stateKey}\"`);
        }

        (state as Record<keyof GameBackendState, unknown>)[stateKey] = value;
    }

    return state;
}
