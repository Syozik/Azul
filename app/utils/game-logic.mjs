import { allowedGameActions, TILE_COLORS } from "../consts.js";
import { createTileBag, fillFactories, initCoveredTiles } from "./helpers.js";

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
            {
                pickedTiles: [],
                coveredTiles: initCoveredTiles(),
                score: 5,
                hasPassed: false,
            },
            {
                pickedTiles: [],
                score: 5,
                coveredTiles: initCoveredTiles(),
                hasPassed: false,
            },
        ],
        currentPlayer: 1,
        round: 1,
        phase: 1,
        _base: [],
        _bag: bag, // keep the bag on the server (not sent to clients)
    };
}

export function applyAction(state, playerNumber, data) {
    switch (data.type) {
        case "pick":
            return applyPickAction(
                state,
                playerNumber,
                data.color,
                data.factoryIndex,
            );
        case "cover":
            return applyCoverAction(
                state,
                playerNumber,
                data.color,
                data.points,
                data.usedTiles,
            );
    }
    return {
        error:
            "Wrong game action type. Allowed actions: " +
            allowedGameActions.join(", "),
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
export function applyPickAction(state, playerNumber, color, factoryIndex) {
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
    const joker = TILE_COLORS[state.round - 1];
    if (color === joker && pool.some((color) => color !== joker)) {
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

export function applyCoverAction(
    state,
    playerNumber,
    color,
    points,
    usedTiles,
) {
    if (state.currentPlayer !== playerNumber) {
        return { error: "Not your turn" };
    }
    const playerState = state.players[playerNumber - 1];
    if (playerState.coveredTiles[color][points - 1]) {
        return { error: "This tile has already been closed" };
    }

    const joker = TILE_COLORS[state.round - 1];
    usedTiles = usedTiles.filter((tile) => tile === color || tile === joker);
    if (usedTiles.length < points) {
        return { error: "Not enough tiles" };
    }
    const pickedTilesCopy = [...playerState.pickedTiles];
    for (const tile of usedTiles) {
        const tileIdx = pickedTilesCopy.indexOf(tile);
        if (tileIdx === -1) {
            return { error: "You don't have all used tiles" };
        }
        pickedTilesCopy.splice(tileIdx, 1);
    }
    playerState.pickedTiles = pickedTilesCopy;
    state._base.push(...usedTiles);
    playerState.coveredTiles[color][points - 1] = true;
    return {
        newState: {
            ...state,
            currentPlayer: playerNumber === 1 ? 2 : 1,
        },
    };
}

export function updatePhase(state) {
    if (state.phase === 1 && isPickingPhaseOver(state)) {
        state.phase = 2;
    } else if (state.phase === 2 && isCoveringPhaseOver(state)) {
        if (state.round === 6) {
            state.isGameOver = true;
        } else {
            state.phase = 1;
            // TODO: handle the case when there's not enough tiles in the bag
            state.factories = fillFactories(state._bag);
            state.round += 1;
        }
    }
    return state;
}

export function isCoveringPhaseOver(state) {
    return state.players.every(
        (player) => player.hasPassed || !player.pickedTiles.length,
    );
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
    const { _bag: _unused_bag, _base: _unused_base, ...clientState } = state;
    void _unused_bag;
    void _unused_base;
    return clientState;
}
