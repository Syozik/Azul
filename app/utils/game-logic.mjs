import { allowedGameActions, BONUSES, JOKERS, TILE_COLORS } from "../consts.js";
import { createTileBag, fillFactories, initState, shuffle } from "./helpers.js";

export class Game {
    constructor() {
        const bag = createTileBag();
        this.state = {
            ...initState(),
            factories: fillFactories(bag),
            baseTiles: [bag.splice(0, 5), bag.splice(0, 5)],
            _bag: bag, // keep the bag on the server (not sent to clients)
            _trash: [],
        };
    }

    applyAction(playerNumber, data) {
        try {
            switch (data.type) {
                case "pick":
                    this.applyPickAction(
                        playerNumber,
                        data.color,
                        data.factoryIndex,
                    );
                    break;
                case "cover":
                    this.applyCoverAction(
                        playerNumber,
                        data.color,
                        data.points,
                        data.usedTiles,
                    );
                    break;
                case "pass":
                    this.applyPassAction(playerNumber);
                    break;
                case "base-pick":
                    this.applyBasePickAction(playerNumber, data.selectedTiles);
                    break;
                default:
                    throw new Error(
                        "Wrong game action type. Allowed actions: " +
                            allowedGameActions.join(", "),
                    );
            }
        } catch (error) {
            console.log(error);
            return { error: error.message };
        }
        const nextPlayer = this.state.currentPlayer === 1 ? 2 : 1;
        if (
            !this.state.players[this.state.currentPlayer - 1].canTakeBaseTiles &&
            !this.state.players[nextPlayer - 1].hasPassed
        ) {
            this.state.currentPlayer = nextPlayer;
        }
        return {
            success: "Action done!",
        }
    }

    applyPickAction(playerNumber, color, factoryIndex) {
        if (this.state.currentPlayer !== playerNumber) {
            throw new Error("Not your turn");
        }
        let pool;
        if (factoryIndex !== undefined) {
            if (factoryIndex < 0 || factoryIndex >= this.state.factories.length)
                throw new Error("Invalid factory index");
            pool = this.state.factories[factoryIndex];
        } else {
            pool = this.state.centerPool;
        }
        if (!pool.length) {
            throw new Error("Selected pool is empty");
        }
        if (!pool.includes(color)) {
            throw new Error(`Color ${color} not in the selected pool`);
        }
        const joker = JOKERS[this.state.round - 1];
        if (color === joker && pool.some((color) => color !== joker)) {
            throw new Error(`Can't choose the current joker`);
        }

        // Split tiles: picked (matching color) vs remaining (go to center)
        const picked = pool.filter((t) => t === color);
        const remaining = pool.filter((t) => t !== color);

        const jokerIdx = remaining.indexOf(joker);
        if (jokerIdx !== -1) {
            picked.push(joker);
            remaining.splice(jokerIdx, 1);
        }

        const playerIdx = this.state.currentPlayer - 1;
        this.state.players[playerIdx].pickedTiles.push(...picked);
        if (factoryIndex !== undefined) {
            this.state.factories[factoryIndex] = [];
            this.state.centerPool.push(...remaining);
        } else {
            this.state.centerPool = remaining;
            if (this.state.isFirstCenterPick) {
                this.state.firstPlayer = playerNumber;
                this.state.players[playerIdx].score = Math.max(
                    this.state.players[playerIdx].score - picked.length,
                    0,
                );
                this.state.isFirstCenterPick = false;
            }
        }
    }

    applyCoverAction(playerNumber, color, points, usedTiles) {
        if (this.state.currentPlayer !== playerNumber) {
            throw new Error("Not your turn");
        }
        const playerState = this.state.players[playerNumber - 1];
        if (playerState.coveredTiles[color][points - 1]) {
            throw new Error("This tile has already been closed");
        }

        const joker = JOKERS[this.state.round - 1];
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
                throw new Error("You can't use these tiles");
            }
            const centerColor = usedTiles.find((tile) => tile !== joker);
            res = centerColor;
            if (playerState.coveredTiles[color].includes(centerColor)) {
                throw new Error(`You can place ${centerColor} in the center only once.`);
            }
        }
        if (usedTiles.length !== points) {
            throw new Error("Not the right number of tiles");
        }
        const pickedTilesCopy = [...playerState.pickedTiles];
        for (const usedTile of usedTiles) {
            const tileIdx = pickedTilesCopy.indexOf(usedTile);
            if (tileIdx === -1) {
                throw new Error("You don't have the tiles you just used");
            }
            pickedTilesCopy.splice(tileIdx, 1);
        }
        playerState.pickedTiles = pickedTilesCopy;
        this.state._trash.push(...usedTiles);
        // res is true if it's not a colored tile, and a color if it's center
        playerState.coveredTiles[color][points - 1] = res;

        playerState.score += this.getBonus(playerState.coveredTiles, color, points);
        playerState.canTakeBaseTiles += this.checkForCombinations(
            playerState.coveredTiles,
            color,
            points,
        );
    }

    getBonus(coveredTiles, color, points) {
        let bonus = 1;
        let i = points - 2;
        while (i >= 0 && coveredTiles[color][i]) {
            bonus += 1;
            i -= 1;
        }
        i = points;
        while (coveredTiles[color][i % 6] && bonus < 6) {
            bonus += 1;
            i += 1;
        }

        if (1 <= points <= 4) {
            if (
                Object.values(coveredTiles).every(
                    (color) => !!color[points - 1],
                )
            ) {
                bonus += points * 4;
            }
        }

        if (coveredTiles[color].every((point) => !!point)) {
            bonus += BONUSES[color];
        }

        return bonus;
    }

    checkForCombinations(coveredTiles, color, points) {
        let numberOfPilesToTake = 0;
        if (color !== "CENTER") {
            if (points === 5 || points === 6) {
                if (coveredTiles[color][4] && coveredTiles[color][5]) {
                    numberOfPilesToTake += 3;
                    return numberOfPilesToTake;
                }
            }
            if (points === 3 || points === 4) {
                if (coveredTiles[color][2] && coveredTiles[color][3]) {
                    const previousColor =
                        TILE_COLORS[(5 + TILE_COLORS.indexOf(color)) % 6];
                    if (
                        coveredTiles[previousColor][0] &&
                        coveredTiles[previousColor][1]
                    ) {
                        numberOfPilesToTake += 2;
                    }
                }
            }
            if (points === 2 || points === 3) {
                if (coveredTiles[color][1] && coveredTiles[color][2]) {
                    const idx = TILE_COLORS.indexOf(color);
                    numberOfPilesToTake += !!(
                        coveredTiles["CENTER"][idx] &&
                        coveredTiles["CENTER"[(idx + 1) % 6]]
                    );
                }
            }
            if (points === 1 || points === 2) {
                if (coveredTiles[color][0] && coveredTiles[color][1]) {
                    const nextColor =
                        TILE_COLORS[(1 + TILE_COLORS.indexOf(color)) % 6];
                    if (
                        coveredTiles[nextColor][2] &&
                        coveredTiles[nextColor][3]
                    ) {
                        numberOfPilesToTake += 2;
                    }
                }
            }
        } else {
            const checkColor = (color) =>
                coveredTiles[color][1] && coveredTiles[color][2];
            if (coveredTiles[color][points]) {
                numberOfPilesToTake += checkColor(TILE_COLORS[points - 1]);
            }
            if (coveredTiles[color][(4 + points) % 6]) {
                numberOfPilesToTake += checkColor(
                    TILE_COLORS[(4 + points) % 6],
                );
            }
        }
        return numberOfPilesToTake;
    }

    applyPassAction(playerNumber) {
        this.state.players[playerNumber - 1].hasPassed = true;
    }

    applyBasePickAction(playerNumber, selectedTiles) {
        if (this.state.currentPlayer !== playerNumber) {
            throw new Error("It's not your turn");
        }
        const playerState = this.state.players[playerNumber - 1];

        if (playerState.canTakeBaseTiles < selectedTiles.length) {
            throw new Error("You can't take this many tiles");
        }

        if (this.state._bag.length < selectedTiles.length) {
            this.state._bag.push(...this.state._trash);
            this.state._trash = [];
            shuffle(this.state._bag);
        }

        for (const tile of selectedTiles) {
            const [i, j, color] = tile.split("_");
            playerState.pickedTiles.push(color);
            this.state.baseTiles[Number(i)][Number(j)] = this.state._bag.splice(
                0,
                1,
            );
        }
        playerState.canTakeBaseTiles = 0;
    }

    updatePhase() {
        if (this.state.phase === 1 && this.isPickingPhaseOver) {
            this.state.phase = 2;
            this.state.currentPlayer = this.state.firstPlayer;
            return;
        }

        if (this.state.phase === 2 && this.isCoveringPhaseOver) {
            if (this.state.round === 6) {
                this.state.isGameOver = true;
                return;
            }
            this.state.phase = 1;
            this.state.players.forEach((player) => (player.hasPassed = false));
            if (this.state._bag.length <= 20) {
                this.state._bag.push(...this.state._trash);
                this.state._trash = [];
                shuffle(this.state._bag);
            }
            this.state.factories = fillFactories(this.state._bag);
            this.state.isFirstCenterPick = true;
            this.state.currentPlayer = this.state.firstPlayer;
            this.state.round += 1;
        }
    }

    get isCoveringPhaseOver() {
        return this.state.players.every(
            (player) =>
                !player.canTakeBaseTiles &&
                (player.hasPassed || !player.pickedTiles.length),
        );
    }

    /**
     * Check if the picking phase is over (all factories and center pool are empty)
     */
    get isPickingPhaseOver() {
        return (
            this.state.factories.every((f) => f.length === 0) &&
            this.state.centerPool.length === 0
        );
    }

    /**
     * Strip server-only fields before sending this.state.to clients
     */
    get clientState() {
        const {
            _bag: _unused_bag,
            _trash: _unused_trash,
            ...clientState
        } = this.state;
        void _unused_bag;
        void _unused_trash;
        return clientState;
    }
}
