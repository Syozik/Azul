import {
    allowedGameActions,
    BONUSES,
    JOKERS,
    TILE_COLORS,
} from "../shared/consts";
import { initState, numberOf } from "../shared/helpers";
import { createTileBag, fillFactories, shuffle } from "./utils";
import type {
    ColorKey,
    GameAction,
    GameBackendState,
    TileColor,
} from "../shared/types";

export class Game {
    public state: GameBackendState;

    public constructor() {
        const bag = createTileBag();
        this.state = {
            ...initState(),
            factories: fillFactories(bag),
            baseTiles: [bag.splice(0, 5), bag.splice(0, 5)],
            _bag: bag, // keep the bag on the server (not sent to clients)
            _trash: [],
        };
    }

    public setState(newState: GameBackendState) {
        this.state = newState;
    }

    public applyAction(playerNumber: 1 | 2, data: GameAction) {
        let shouldSwitchPlayer = true;
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
                case "save-for-next-round":
                    this.applySaveForNextRoundAction(
                        playerNumber,
                        data.slotIdx,
                        data.selectedTiles,
                    );
                    shouldSwitchPlayer = false;
                    break;
                default:
                    throw new Error(
                        "Wrong game action type. Allowed actions: " +
                            allowedGameActions.join(", "),
                    );
            }
        } catch (error) {
            console.log(error);
            if (error instanceof Error) {
                this.pushNotification(playerNumber - 1, "error", error.message);
                return { error: error.message };
            }
        }
        if (
            shouldSwitchPlayer &&
            !this.state.players[this.state.currentPlayer - 1].canTakeBaseTiles
        ) {
            const nextPlayer = this.state.currentPlayer === 1 ? 2 : 1;
            if (!this.state.players[nextPlayer - 1].hasPassed) {
                this.state.currentPlayer = nextPlayer;
            }
        }
        return {
            success: "Action done!",
        };
    }

    private applyPickAction(
        playerNumber: 1 | 2,
        color: ColorKey,
        factoryIndex?: number,
    ) {
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
        const joker: ColorKey = JOKERS[this.state.round - 1];
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
        this.pushNotification(
            playerNumber - 1,
            "success",
            `You picked up ${picked.join(" ")} tiles`,
            true,
        );
    }

    private applyCoverAction(
        playerNumber: 1 | 2,
        color: TileColor,
        points: number,
        usedTiles: ColorKey[],
    ) {
        if (this.state.currentPlayer !== playerNumber) {
            throw new Error("Not your turn");
        }
        if (this.state.players[playerNumber - 1].canTakeBaseTiles) {
            throw new Error("You need to pick from the base first");
        }
        const playerState = this.state.players[playerNumber - 1];
        if (playerState.coveredTiles[color][points - 1]) {
            throw new Error("This tile has already been closed");
        }

        const joker = JOKERS[this.state.round - 1];
        const isCenter = color === "CENTER";
        let res: ColorKey | boolean = true;
        if (!isCenter) {
            usedTiles = usedTiles.filter(
                (tile) => tile === color || tile === joker,
            );
        } else {
            const usedTilesSet = new Set(usedTiles);
            if (
                usedTilesSet.size > 2 ||
                (usedTilesSet.size == 2 && !usedTilesSet.has(joker))
            ) {
                throw new Error("You can't use these tiles");
            }
            const centerColor = usedTiles.find((tile) => tile !== joker);
            if (
                !centerColor ||
                playerState.coveredTiles[color].includes(centerColor)
            ) {
                throw new Error(
                    `You can place ${centerColor} in the center only once.`,
                );
            }
            res = centerColor;
        }
        if (usedTiles.length !== points) {
            throw new Error("Not the right number of tiles");
        }
        const pickedTilesCopy = [...playerState.pickedTiles];
        for (const usedTile of usedTiles) {
            const tileIdx = pickedTilesCopy.indexOf(usedTile);
            if (tileIdx === -1) {
                throw new Error("You don't have the tiles you tried to use.");
            }
            pickedTilesCopy.splice(tileIdx, 1);
        }
        playerState.pickedTiles = pickedTilesCopy;
        this.state._trash.push(...usedTiles);
        // res is true if it's not a colored tile, and a color if it's center
        playerState.coveredTiles[color][points - 1] = res;

        playerState.score += this.getBonus(playerNumber, color, points);
        playerState.canTakeBaseTiles += this.checkForCombinations(
            playerNumber,
            color,
            points,
        );
        this.pushNotification(
            playerNumber - 1,
            "success",
            `You covered ${points} ${color} tile`,
            true,
        );
    }

    private getBonus(playerNumber: 1 | 2, color: TileColor, points: number) {
        const coveredTiles = this.state.players[playerNumber - 1].coveredTiles;
        let bonus = 1;
        let i = points - 2;
        while (coveredTiles[color][(i + 6) % 6] && bonus < 6) {
            bonus += 1;
            i -= 1;
        }
        i = points;
        while (coveredTiles[color][i % 6] && bonus < 6) {
            bonus += 1;
            i += 1;
        }

        if (1 <= points && points <= 4) {
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
            this.pushNotification(
                playerNumber - 1,
                "success",
                `You covered all ${color} tiles`,
                true,
            );
        }

        return bonus;
    }

    private checkForCombinations(
        playerNumber: 1 | 2,
        color: TileColor,
        points: number,
    ) {
        const coveredTiles = this.state.players[playerNumber - 1].coveredTiles;
        let numberOfPilesToTake = 0;
        if (color !== "CENTER") {
            if (points === 5 || points === 6) {
                if (coveredTiles[color][4] && coveredTiles[color][5]) {
                    this.pushNotification(
                        playerNumber - 1,
                        "success",
                        `You covered ${color} mirror tiles!`,
                        true,
                    );
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
                        this.pushNotification(
                            playerNumber - 1,
                            "success",
                            `You covered a statue!`,
                            true,
                        );
                        numberOfPilesToTake += 2;
                    }
                }
            }
            if (points === 2 || points === 3) {
                if (coveredTiles[color][1] && coveredTiles[color][2]) {
                    const idx = TILE_COLORS.indexOf(color);
                    if (
                        coveredTiles["CENTER"][idx] &&
                        coveredTiles["CENTER"][(idx + 1) % 6]
                    ) {
                        this.pushNotification(
                            playerNumber - 1,
                            "success",
                            `You covered a fountain!`,
                            true,
                        );
                        numberOfPilesToTake += 1;
                    }
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
                        this.pushNotification(
                            playerNumber - 1,
                            "success",
                            `You covered a statue!`,
                            true,
                        );
                        numberOfPilesToTake += 2;
                    }
                }
            }
        } else {
            const checkColor = (color: ColorKey) =>
                coveredTiles[color][1] && coveredTiles[color][2];
            if (coveredTiles[color][points]) {
                if (checkColor(TILE_COLORS[points - 1])) {
                    numberOfPilesToTake += 1;
                    this.pushNotification(
                        playerNumber - 1,
                        "success",
                        `You covered ${color} a fountain!`,
                        true,
                    );
                }
            }
            if (coveredTiles[color][(4 + points) % 6]) {
                if (checkColor(TILE_COLORS[(4 + points) % 6])) {
                    numberOfPilesToTake += 1;
                    this.pushNotification(
                        playerNumber - 1,
                        "success",
                        `You covered ${color} a fountain!`,
                        true,
                    );
                }
            }
        }
        return numberOfPilesToTake;
    }

    private applyPassAction(playerNumber: 1 | 2) {
        const playerState = this.state.players[playerNumber - 1];
        playerState.hasPassed = true;
        const tilesLeft = playerState.pickedTiles.length;
        playerState.score -= tilesLeft;
        let message = "You passed!";
        if (tilesLeft) {
            message += ` You got minus ${tilesLeft} points for unused tiles.`;
        }
        this.pushNotification(playerNumber - 1, "success", message, true);
        this.state._trash.push(...playerState.pickedTiles);
        playerState.pickedTiles = [];
    }

    private applyBasePickAction(playerNumber: 1 | 2, selectedTiles: string[]) {
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

        const colors: ColorKey[] = [];
        for (const tile of selectedTiles) {
            const [i, j, color] = tile.split("_");
            colors.push(color as ColorKey);
            playerState.pickedTiles.push(color as ColorKey);
            this.state.baseTiles[Number(i)][Number(j)] = this.state._bag.splice(
                0,
                1,
            )[0];
        }
        this.pushNotification(
            playerNumber - 1,
            "success",
            `You took ${colors.join(" ")} tiles from the base.`,
            true,
        );
        playerState.canTakeBaseTiles = 0;
    }

    private applySaveForNextRoundAction(
        playerNumber: 1 | 2,
        idx: number,
        selectedTiles: ColorKey[],
    ) {
        const playerState = this.state.players[playerNumber - 1];
        const savedTiles = playerState.savedTilesForNextRound;
        if (savedTiles[idx]) {
            throw new Error("You've already used that slot.");
        }
        const nbAvailable = numberOf(savedTiles, (tile) => !tile);
        if (selectedTiles.length > nbAvailable) {
            throw new Error(`You can't save ${selectedTiles.length} tiles.
                You have only ${nbAvailable} available slots left.`);
        }
        let saved = 0;
        while (saved < selectedTiles.length && idx < 8) {
            if (!savedTiles[idx % 4]) {
                const tile = selectedTiles[saved];
                const idxOfTile = playerState.pickedTiles.indexOf(tile);
                if (idxOfTile === -1) {
                    throw new Error(`You don't have ${tile} tile!`);
                }
                playerState.pickedTiles.splice(idxOfTile, 1);
                savedTiles[idx % 4] = tile;
                saved += 1;
            }
            idx += 1;
        }
    }

    public updatePhase() {
        if (this.state.phase === 1 && this.isPickingPhaseOver) {
            this.state.phase = 2;
            this.state.currentPlayer = this.state.firstPlayer;
            return;
        }

        if (this.state.phase === 2 && this.isCoveringPhaseOver) {
            if (this.state.round === 6) {
                this.endGame();
                return;
            }
            this.state.phase = 1;
            this.state.players.forEach((player) => (player.hasPassed = false));
            this.state.players.forEach((player) => {
                player.pickedTiles.push(
                    ...player.savedTilesForNextRound.filter((tile) => !!tile),
                );
                player.savedTilesForNextRound = Array(4).fill(null);
            });
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

    public get isCoveringPhaseOver() {
        return this.state.players.every(
            (player) =>
                !player.canTakeBaseTiles &&
                (player.hasPassed || !player.pickedTiles.length),
        );
    }

    /**
     * Check if the picking phase is over (all factories and center pool are empty)
     */
    public get isPickingPhaseOver() {
        return (
            this.state.factories.every((f) => f.length === 0) &&
            this.state.centerPool.length === 0
        );
    }

    private endGame() {
        for (const [playerNumber, player] of this.state.players.entries()) {
            const unusedTiles = player.pickedTiles.length;
            this.pushNotification(
                playerNumber,
                "info",
                `You lost ${unusedTiles} points for unused tiles.`,
            );
            player.score -= unusedTiles;
            player.pickedTiles = [];
        }
        this.state.isGameOver = true;
    }

    /**
     * Strip server-only fields before sending this.state to clients
     */
    public get clientState() {
        const {
            _bag: _unused_bag,
            _trash: _unused_trash,
            ...clientState
        } = this.state;
        void _unused_bag;
        void _unused_trash;
        return clientState;
    }

    private pushNotification(
        player: number,
        type: "error" | "success" | "info",
        message: string,
        pushToOpponent: boolean = false,
    ) {
        this.state.players[player].notifications.push({
            type,
            message,
            id: this.getNewNotificationId(player),
        });
        if (pushToOpponent) {
            const idx = player === 1 ? 0 : 1;
            this.state.players[idx].notifications.push({
                type: "info",
                message: message.replace("You", "Opponent"),
                id: this.getNewNotificationId(idx),
            });
        }
    }

    public getNewNotificationId(player: number) {
        return this.state.players[player].notifications.length + 1;
    }
}
