import { ColorKey } from "../consts";

export interface GameState {
    factories: ColorKey[][];
    centerPool: ColorKey[];
    players: [PlayerState, PlayerState];
    currentPlayer: 1 | 2;
    round: number;
    phase: 1 | 2;
}

export interface PlayerState {
    pickedTiles: ColorKey[]; // tiles the player has picked this round
    score: number,
}

// The action a player sends when clicking a tile color on a factory
export interface PickTilesAction {
    type: "pick";
    color: ColorKey;
    factoryIndex: number | undefined;
}

export type GameAction = Partial<PickTilesAction>;
export type TileColor = ColorKey;
