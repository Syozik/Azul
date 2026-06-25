import { allowedGameActions } from "../shared/consts";
import { initState } from "../shared/helpers";
import { createTileBag, fillFactories, shuffle } from "./utils";
import type { GameAction, GameBackendState } from "../shared/types";
import { Player } from "./player";

export class Game {
    public state: GameBackendState;

    public constructor(playerNames: string[]) {
        const bag = createTileBag();
        this.state = {
            ...initState(),
            factories: fillFactories(bag),
            baseTiles: [bag.splice(0, 5), bag.splice(0, 5)],
            _bag: bag, // keep the bag on the server (not sent to clients)
            _trash: [],
        };
        this.state.players = playerNames.map((name, idx) => new Player(idx + 1, name, this));
    }

    public setState(newState: GameBackendState) {
        const hydratedPlayers = newState.players.map((playerState, idx) => {
            const source = playerState as Player & {
                playerNumber?: number;
            };
            const player = new Player(source.playerNumber ?? idx + 1, source.name, this);
            player.pickedTiles = [...(source.pickedTiles ?? [])];
            player.coveredTiles = Object.fromEntries(
                Object.entries(source.coveredTiles ?? player.coveredTiles).map(([color, tiles]) => [
                    color,
                    [...tiles],
                ]),
            ) as Player["coveredTiles"];
            player.savedTilesForNextRound = [
                ...(source.savedTilesForNextRound ?? Array(4).fill(null)),
            ];
            player.canTakeBaseTiles = source.canTakeBaseTiles ?? 0;
            player.score = source.score ?? 5;
            player.hasPassed = source.hasPassed ?? false;
            player.notifications = [...(source.notifications ?? [])];
            return player;
        });

        this.state = {
            ...newState,
            players: hydratedPlayers,
        };
    }

    public applyAction(playerNumber: 1 | 2, data: GameAction) {
        let shouldSwitchPlayer = true;
        const player = this.state.players[playerNumber - 1];
        try {
            switch (data.type) {
                case "pick":
                    player.applyPickAction(data.color, data.factoryIndex);
                    break;
                case "cover":
                    const { color, points, usedTiles } = data;
                    player.applyCoverAction(color, points, usedTiles);
                    break;
                case "pass":
                    player.applyPassAction();
                    break;
                case "base-pick":
                    player.applyBasePickAction(data.selectedTiles);
                    break;
                case "save-for-next-round":
                    const { slotIdx, selectedTiles } = data;
                    player.applySaveForNextRoundAction(slotIdx, selectedTiles);
                    if (player.pickedTiles) {
                        shouldSwitchPlayer = false;
                    }
                    break;
                default:
                    throw new Error(
                        "Wrong game action type. Allowed actions: " + allowedGameActions.join(", "),
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
            this.state.players.forEach((player) => {
                player.hasPassed = false;
                player.pickedTiles.push(...player.savedTilesForNextRound.filter((tile) => !!tile));
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
                !player.canTakeBaseTiles && (player.hasPassed || !player.pickedTiles.length),
        );
    }

    /**
     * Check if the picking phase is over (all factories and center pool are empty)
     */
    public get isPickingPhaseOver() {
        return (
            this.state.factories.every((f) => f.length === 0) && this.state.centerPool.length === 0
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
        const { _bag: _unused_bag, _trash: _unused_trash, ...clientState } = this.state;
        void _unused_bag;
        void _unused_trash;
        return clientState;
    }

    public pushNotification(
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
                message: message.replaceAll("You", "Opponent"),
                id: this.getNewNotificationId(idx),
            });
        }
    }

    public getNewNotificationId(player: number) {
        return this.state.players[player].notifications.length + 1;
    }
}
