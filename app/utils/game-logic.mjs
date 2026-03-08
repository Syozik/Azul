import { allowedGameActions, TILE_COLORS } from "../consts.js";
import { createTileBag, fillFactories, initState } from "./helpers.js";

/**
 * Initialize a new game state
 */
export function initGameState() {
    const bag = createTileBag();
    const factories = fillFactories(bag);
    const state = initState();

    return {
        ...state,
        factories,
        baseTiles: [bag.splice(0, 5), bag.splice(0, 5)],
        _bag: bag, // keep the bag on the server (not sent to clients)
        _trash: [],
    };
}

export function applyAction(state, playerNumber, data) {
    let res;
    switch (data.type) {
        case "pick":
            res = applyPickAction(
                state,
                playerNumber,
                data.color,
                data.factoryIndex,
            );
            break;
        case "cover":
            res = applyCoverAction(
                state,
                playerNumber,
                data.color,
                data.points,
                data.usedTiles,
            );
            break;
        case "pass":
            res = applyPassAction(state, playerNumber);
            break;
        default:
            return {
                error:
                    "Wrong game action type. Allowed actions: " +
                    allowedGameActions.join(", "),
            };
    }
    if (res.error) return res;
    const nextPlayer = res.currentPlayer === 1 ? 2 : 1;
    if (!res.players[nextPlayer - 1].hasPassed) {
        res.currentPlayer = nextPlayer;
    }
    return {
        newState: { ...res },
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
    return state;
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
    const isCenter = color === "CENTER";
    let res = true;
    if (!isCenter) {
        usedTiles = usedTiles.filter(
            (tile) => tile === color || tile === joker,
        );
    } else {
        const usedTilesSet = new Set(usedTiles);
        if (
            usedTilesSet.length > 2 ||
            (usedTilesSet.length == 2 && !usedTilesSet.has(joker))
        ) {
            return { error: "You can't use these tiles" };
        }
        const centerColor = usedTiles.find((tile) => tile !== joker);
        res = centerColor;
        if (playerState.coveredTiles[color].includes(centerColor)) {
            return {
                error: `You can place ${centerColor} in the center only once.`,
            };
        }
    }
    if (usedTiles.length !== points) {
        return { error: "Not the right number of tiles" };
    }
    const pickedTilesCopy = [...playerState.pickedTiles];
    for (const usedTile of usedTiles) {
        const tileIdx = pickedTilesCopy.indexOf(usedTile);
        if (tileIdx === -1) {
            return { error: "You don't have the tiles you just used" };
        }
        pickedTilesCopy.splice(tileIdx, 1);
    }
    playerState.pickedTiles = pickedTilesCopy;
    state._trash.push(...usedTiles);
    // res is true if it's not a colored tile, and a color if it's center
    playerState.coveredTiles[color][points - 1] = res;

    let bonus = 1;
    let i = points - 2;
    while (i >= 0 && playerState.coveredTiles[color][i]) {
        bonus += 1;
        i -= 1;
    }
    i = points;
    while (i < 5 && playerState.coveredTiles[color][i]) {
        bonus += 1;
        i += 1;
    }
    playerState.score += bonus;

    return state;
}

export function applyPassAction(state, playerNumber) {
    if (state.players[playerNumber - 1].hasPassed) {
        return { error: "Player has already passed" };
    }
    state.players[playerNumber - 1].hasPassed = true;

    return state;
}

export function updatePhase(state) {
    if (state.phase === 1 && isPickingPhaseOver(state)) {
        state.phase = 2;
    } else if (state.phase === 2 && isCoveringPhaseOver(state)) {
        if (state.round === 6) {
            state.isGameOver = true;
        } else {
            state.phase = 1;
            state.players.forEach((player) => (player.hasPassed = false));
            if (state._bag.length <= 20) {
                state._bag.push(...state._trash);
                state._trash = [];
                shuffle(state._bag);
            }
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
    const { _bag: _unused_bag, _trash: _unused_trash, ...clientState } = state;
    void _unused_bag;
    void _unused_trash;
    return clientState;
}
