import {
    COLORS,
    NUM_FACTORIES,
    TILE_COLORS,
    TILES_PER_COLOR,
    TILES_PER_FACTORY,
} from "../consts";
import type { ColorKey, GameState } from "./types.ts";

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

export function groupTilesByColor(tiles: ColorKey[]) {
    const groupedTiles: ColorKey[][] = [];
    for (const tile of tiles) {
        let hasInsertedTile = false;
        for (const group of groupedTiles) {
            if (group[0] === tile) {
                group.push(tile);
                hasInsertedTile = true;
                break;
            }
        }
        if (!hasInsertedTile) {
            groupedTiles.push([tile]);
        }
    }
    return groupedTiles;
}

const ID_KEY = "DEVICE_PLAYER_ID";

export function getPlayerId(): string {
    let id = localStorage.getItem(ID_KEY);
    if (id) return id;

    id = window.crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
    return id;
}
