import { COLORS } from "./consts";
import type { ColorKey, GameState } from "./types";

export function initCoveredTiles() {
    const coveredTiles = {} as Record<ColorKey | "CENTER", (boolean | string)[]>;
    for (const color of Object.keys(COLORS) as (ColorKey | "CENTER")[]) {
        coveredTiles[color] = Array(6).fill(false);
    }
    return coveredTiles;
}

export function initState(): GameState {
    return {
        factories: [[]],
        centerPool: [],
        players: [],
        currentPlayer: 1,
        round: 1,
        phase: 1,
        baseTiles: [[], []],
        isGameOver: false,
        firstPlayer: 1,
        isFirstCenterPick: true,
    };
}

/**
 * Returns the number of elements that satisfy a provided condition.
 */
export function numberOf<T>(arr: T[], fn: (el: T) => boolean): number {
    let res = 0;
    arr.forEach((el) => (res += Number(fn(el))));
    return res;
}
