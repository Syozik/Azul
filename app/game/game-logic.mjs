const TILE_COLORS = ["PURPLE", "GREEN", "ORANGE", "YELLOW", "BLUE", "RED"];
const TILES_PER_COLOR = 22;
const NUM_FACTORIES = 5;
const TILES_PER_FACTORY = 4;

/**
 * Create a shuffled tile bag: 22 tiles of each of the 6 colors = 132 total
 */
function createTileBag() {
    const bag = [];
    for (const color of TILE_COLORS) {
        for (let i = 0; i < TILES_PER_COLOR; i++) {
            bag.push(color);
        }
    }
    // Fisher-Yates shuffle
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
}

/**
 * Fill factories by drawing from the bag
 */
function fillFactories(bag) {
    const factories = [];
    for (let i = 0; i < NUM_FACTORIES; i++) {
        const factory = bag.splice(0, TILES_PER_FACTORY);
        factories.push(factory);
    }
    return factories;
}

/**
 * Initialize a new game state
 */
export function initGameState() {
    const bag = createTileBag();
    const factories = fillFactories(bag);

    return {
        factories,
        centerPool: [],
        players: [
            { pickedTiles: [], score: 5 },
            { pickedTiles: [], score: 5 },
        ],
        currentPlayer: 1,
        round: 1,
        phase: 1,
        _bag: bag, // keep the bag on the server (not sent to clients)
    };
}

/**
 * Apply a "pick from factory" action.
 * Returns { newState, error } — error is a string if invalid action.
 *
 * Rules:
 * - Player picks ALL tiles of the chosen color from the factory / center pool
 * - Remaining tiles in that factory go to the center pool
 * - Turn passes to the other player
 */
export function applyPickAction(state, playerNumber, color, { factoryIndex } = {}) {
    if (state.currentPlayer !== playerNumber) {
        return { error: "Not your turn" };
    }
    let pool;
    if (factoryIndex !== undefined) {
        if (factoryIndex < 0 || factoryIndex >= state.factories.length)
            return { error: "Invalid factory index" };
        pool = state.factories[factoryIndex];
    } else {
        pool = state.centerPool;
    }
    if (!pool.length) {
        return { error: "Selected pool is empty" };
    }
    if (!pool.includes(color)) {
        return { error: `Color ${color} not in the selected pool` };
    }
    const joker = TILE_COLORS[state.round];
    // TODO: case when there's no other piles
    if (color === joker) {
        return { error: `Can't choose the current joker` };
    }

    // Split tiles: picked (matching color) vs remaining (go to center)
    const picked = pool.filter((t) => t === color);
    const remaining = pool.filter((t) => t !== color);

    const jokerIdx = pool.indexOf(joker);
    if (jokerIdx !== -1) {
        picked.push(joker);
        remaining.splice(jokerIdx, 1);
    }

    const playerIdx = state.currentPlayer - 1;
    state.players[playerIdx]["pickedTiles"].push(...picked);
    if (factoryIndex !== undefined) {
        state.factories[factoryIndex] = [];
        state.centerPool.push(...remaining);
    } else {
        state.centerPool = remaining;
    }
    return {
        newState: {
            ...state,
            currentPlayer: playerNumber === 1 ? 2 : 1,
        },
    };
}

export function updatePhase(state) {
    if (isPickingPhaseOver(state)) {
        state.phase = 2;
    }
    return state;
}
/**
 * Check if the picking phase is over (all factories and center pool are empty)
 */
export function isPickingPhaseOver(state) {
    const factoriesEmpty = state.factories.every((f) => f.length === 0);
    return factoriesEmpty && state.centerPool.length === 0;
}

/**
 * Strip server-only fields before sending state to clients
 */
export function toClientState(state) {
    const { _bag: _unused, ...clientState } = state;
    void _unused;
    return clientState;
}
