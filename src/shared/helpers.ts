import { COLORS } from "./consts";
import type { ColorKey, GameState } from "./types";

export function initCoveredTiles() {
    const coveredTiles = {} as Record<
        ColorKey | "CENTER",
        (boolean | string)[]
    >;
    for (const color of Object.keys(COLORS) as (ColorKey | "CENTER")[]) {
        coveredTiles[color] = Array(6).fill(false);
    }
    return coveredTiles;
}

export function initState(): GameState {
    return {
        factories: [[]],
        centerPool: [],
        players: [
            {
                pickedTiles: [],
                coveredTiles: initCoveredTiles(),
                score: 5,
                hasPassed: false,
                canTakeBaseTiles: 0,
                notifications: [],
            },
            {
                pickedTiles: [],
                coveredTiles: initCoveredTiles(),
                score: 5,
                hasPassed: false,
                canTakeBaseTiles: 0,
                notifications: [],
            },
        ],
        currentPlayer: 1,
        round: 1,
        phase: 1,
        baseTiles: [[], []],
        isGameOver: false,
        firstPlayer: 1,
        isFirstCenterPick: true,
    };
}
