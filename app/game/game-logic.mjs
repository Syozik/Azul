const TILE_COLORS = ["RED", "BLUE", "YELLOW", "PURPLE", "ORANGE"];
const TILES_PER_COLOR = 20;
const NUM_FACTORIES = 5;
const TILES_PER_FACTORY = 4;

/**
 * Create a shuffled tile bag: 20 tiles of each of the 5 colors = 100 total
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
            { pickedTiles: [] },
            { pickedTiles: [] },
        ],
        currentPlayer: 1,
        round: 1,
        phase: "pick",
        _bag: bag, // keep the bag on the server (not sent to clients)
    };
}

/**
 * Apply a "pick from factory" action.
 * Returns { newState, error } — error is a string if invalid action.
 *
 * Rules:
 * - Player picks ALL tiles of the chosen color from the factory
 * - Remaining tiles in that factory go to the center pool
 * - Turn passes to the other player
 */
export function applyPickFromFactory(state, playerNumber, factoryIndex, color) {
    if (state.currentPlayer !== playerNumber) {
        return { error: "Not your turn" };
    }
    if (factoryIndex < 0 || factoryIndex >= state.factories.length) {
        return { error: "Invalid factory index" };
    }

    const factory = state.factories[factoryIndex];
    if (factory.length === 0) {
        return { error: "Factory is empty" };
    }
    if (!factory.includes(color)) {
        return { error: `Color ${color} not in factory ${factoryIndex}` };
    }

    // Split tiles: picked (matching color) vs remaining (go to center)
    const picked = factory.filter((t) => t === color);
    const remaining = factory.filter((t) => t !== color);

    // Update state
    const newFactories = [...state.factories];
    newFactories[factoryIndex] = []; // factory is now empty

    const newCenterPool = [...state.centerPool, ...remaining];

    const playerIdx = playerNumber - 1;
    const newPlayers = [...state.players];
    newPlayers[playerIdx] = {
        ...newPlayers[playerIdx],
        pickedTiles: [...newPlayers[playerIdx].pickedTiles, ...picked],
    };

    const newState = {
        ...state,
        factories: newFactories,
        centerPool: newCenterPool,
        players: newPlayers,
        currentPlayer: playerNumber === 1 ? 2 : 1,
    };

    return { newState };
}

/**
 * Apply a "pick from center" action.
 * Player picks ALL tiles of the chosen color from the center pool.
 * Turn passes to the other player.
 */
export function applyPickFromCenter(state, playerNumber, color) {
    if (state.currentPlayer !== playerNumber) {
        return { error: "Not your turn" };
    }
    if (state.centerPool.length === 0) {
        return { error: "Center pool is empty" };
    }
    if (!state.centerPool.includes(color)) {
        return { error: `Color ${color} not in center pool` };
    }

    const picked = state.centerPool.filter((t) => t === color);
    const remaining = state.centerPool.filter((t) => t !== color);

    const playerIdx = playerNumber - 1;
    const newPlayers = [...state.players];
    newPlayers[playerIdx] = {
        ...newPlayers[playerIdx],
        pickedTiles: [...newPlayers[playerIdx].pickedTiles, ...picked],
    };

    const newState = {
        ...state,
        centerPool: remaining,
        players: newPlayers,
        currentPlayer: playerNumber === 1 ? 2 : 1,
    };

    return { newState };
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
