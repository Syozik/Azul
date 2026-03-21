import {
    COLORS,
    NUM_FACTORIES,
    TILE_COLORS,
    TILES_PER_COLOR,
    TILES_PER_FACTORY,
} from "../consts.js";

/**
 * Create a shuffled tile bag: 22 tiles of each of the 6 colors = 132 total
 */
export function createTileBag() {
    const bag = [];
    for (const color of TILE_COLORS) {
        for (let i = 0; i < TILES_PER_COLOR; i++) {
            bag.push(color);
        }
    }
    shuffle(bag);
    return bag;
}

// Fisher-Yates shuffle
export function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/**
 * Fill factories by drawing from the bag
 */
export function fillFactories(bag) {
    const factories = [];
    for (let i = 0; i < NUM_FACTORIES; i++) {
        const factory = bag.splice(0, TILES_PER_FACTORY);
        factories.push(factory);
    }
    return factories;
}

export function initCoveredTiles() {
    const coveredTiles = {};
    for (const color of Object.keys(COLORS)) {
        coveredTiles[color] = Array(6).fill(false);
    }
    return coveredTiles;
}

export function initState() {
    return /** @type {import('./types').GameState} */ ({
        factories: [[]],
        centerPool: [],
        players:
            /** @type {[import('./types').PlayerState, import('./types').PlayerState]} */ ([
                {
                    pickedTiles: [],
                    coveredTiles: initCoveredTiles(),
                    score: 5,
                    hasPassed: false,
                    canTakeBaseTiles: 0,
                    notifications:
                        /** @type {import('./types').NotificationType[]} */ ([]),
                },
                {
                    pickedTiles: [],
                    coveredTiles: initCoveredTiles(),
                    score: 5,
                    hasPassed: false,
                    canTakeBaseTiles: 0,
                    notifications:
                        /** @type {import('./types').NotificationType[]} */ ([]),
                },
            ]),
        currentPlayer: /** @type {1 | 2} */ (1),
        round: 1,
        phase: /** @type {1 | 2} */ (1),
        baseTiles: [[], []],
        isGameOver: false,
        firstPlayer: /** @type {1 | 2} */ (1),
        isFirstCenterPick: true,
    });
}

export function groupTilesByColor(tiles) {
    const groupedTiles = [];
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
