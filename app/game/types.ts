// Tile colors that can appear on factories (excludes CENTER which is only for the snowflake)
export const TILE_COLORS = ["RED", "BLUE", "YELLOW", "PURPLE", "ORANGE"] as const;
export type TileColor = (typeof TILE_COLORS)[number];

export interface GameState {
    factories: TileColor[][];   // 5 factories, each with 0-4 tiles
    centerPool: TileColor[];    // tiles pushed to the center
    players: [PlayerState, PlayerState];
    currentPlayer: 1 | 2;       // whose turn it is
    round: number;
    phase: "pick";              // for now just the picking phase
}

export interface PlayerState {
    pickedTiles: TileColor[];   // tiles the player has picked this round
}

// The action a player sends when clicking a tile color on a factory
export interface PickFromFactoryAction {
    type: "pick-from-factory";
    factoryIndex: number;
    color: TileColor;
}

// The action a player sends when clicking a tile color in the center pool
export interface PickFromCenterAction {
    type: "pick-from-center";
    color: TileColor;
}

export type GameAction = PickFromFactoryAction | PickFromCenterAction;
