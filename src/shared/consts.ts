import type { ColorKey, GameBackendState } from "./types.js";

export const TILE_COLORS: ColorKey[] = [
    "RED",
    "BLUE",
    "YELLOW",
    "GREEN",
    "PURPLE",
    "ORANGE",
];

export const COLORS: Record<ColorKey | "CENTER", string> = {
    BLUE: "#1A4C9EFF",
    GREEN: "#27AE60FF",
    RED: "#E84545FF",
    YELLOW: "#E8B84BFF",
    PURPLE: "#8E44ADFF",
    ORANGE: "#E8762AFF",
    CENTER: "#0E6B5EFF",
};

export const stateKeys: (keyof GameBackendState)[] = [
    "factories",
    "centerPool",
    "players",
    "currentPlayer",
    "round",
    "phase",
    "baseTiles",
    "isGameOver",
    "firstPlayer",
    "isFirstCenterPick",
    "_bag",
    "_trash",
];

export const TILES_PER_COLOR = 22;
export const NUM_FACTORIES = 5;
export const TILES_PER_FACTORY = 4;

export const ANGLE = Math.PI / 3;
export const DEFAULT_TILE_SIZE = 50;

// Keep legacy constants for any code that still references them
export const TILE_SIZE = DEFAULT_TILE_SIZE;
export const TILE_HALF_SHORT = TILE_SIZE * Math.cos(ANGLE);
export const TILE_HALF_LONG = TILE_SIZE * Math.sin(ANGLE);

export const JOKERS: ColorKey[] = [
    "PURPLE",
    "GREEN",
    "ORANGE",
    "YELLOW",
    "BLUE",
    "RED",
];

// Compute snowflake positions for a given tile size
export function getSnowflakePositions(tileSize: number) {
    const halfShort = tileSize * Math.cos(ANGLE);
    const halfLong = tileSize * Math.sin(ANGLE);
    return {
        CENTER: { x: 0, y: 0, rotate: 3 },
        RED: { x: 0, y: -(2 * tileSize + 2 * halfShort), rotate: 5 },
        BLUE: {
            x: 3 * halfLong,
            y: -tileSize - halfShort,
            rotate: 0,
        },
        YELLOW: {
            x: 3 * halfLong,
            y: tileSize + halfShort,
            rotate: 1,
        },
        GREEN: { x: 0, y: 2 * tileSize + 2 * halfShort, rotate: 2 },
        PURPLE: {
            x: -3 * halfLong,
            y: tileSize + halfShort,
            rotate: 3,
        },
        ORANGE: {
            x: -3 * halfLong,
            y: -tileSize - halfShort,
            rotate: 4,
        },
    };
}

// Legacy static positions (at default tile size)
export const SNOWFLAKE_POSITIONS = getSnowflakePositions(DEFAULT_TILE_SIZE);

// Compute desk image dimensions scaled proportionally to tile size
export function getDeskImage(tileSize: number) {
    const scale = tileSize / DEFAULT_TILE_SIZE;
    return {
        width: Math.round(30 * scale),
        height: Math.round(40 * scale),
    };
}

// Legacy static desk image (at default tile size)
export const DESK_IMAGE = getDeskImage(DEFAULT_TILE_SIZE);

// Compute the snowflake board diameter for a given tile size
export function getSnowflakeBoardSize(tileSize: number) {
    const halfShort = tileSize * Math.cos(ANGLE);
    const halfLong = tileSize * Math.sin(ANGLE);
    // Each snowflake center is offset from the board center.
    // The farthest offset is RED/GREEN: 2*tileSize + 2*halfShort (vertical).
    // From each snowflake center, tile arms extend outward by 2*halfLong.
    const maxSnowflakeOffset = 2 * tileSize + 2 * halfShort;
    const tileArmExtent = 2 * halfLong;
    const radius = maxSnowflakeOffset + tileArmExtent;
    // diameter + small padding for decoration images
    return Math.ceil(2 * radius * 1.04);
}

export const NOTIFICATION_DURATION = 2500;

const PENTAGON_RADIUS = 33; // % of board
const CIRCLE_HALF = 8.5; // half of the 17% circle diameter
const PENTAGON_ANGLES = [-90, -18, 54, 126, 198].map(
    (deg) => (deg * Math.PI) / 180,
);

export const CIRCLE_POSITIONS = PENTAGON_ANGLES.map((angle) => ({
    top: `${(55 + PENTAGON_RADIUS * Math.sin(angle) - CIRCLE_HALF).toFixed(2)}%`,
    left: `${(50 + PENTAGON_RADIUS * Math.cos(angle) - CIRCLE_HALF).toFixed(2)}%`,
}));

export const allowedGameActions = ["pick", "cover", "pass", "base-pick"];

export const BONUSES = {
    CENTER: 12,
    RED: 14,
    BLUE: 15,
    YELLOW: 16,
    ORANGE: 17,
    GREEN: 18,
    PURPLE: 20,
};

export const DEFAULT_BASE_WIDTH = 400;
export const DEFAULT_JOKER_TILE_SIZE = 30;
export const DEFAULT_BASE_TILE_SIZE = 40;
export const DEFAULT_JOKER_PADDING_LEFT = 35;
export const DEFAULT_JOKER_GAP = 10;
export const DEFAULT_ROUND_TRANSLATE_X = -14;

export const DEFAULT_SNOWFLAKE_MARGINS = [
    { top: 100, right: 0, bottom: 0, left: 100 },
    { top: 220, right: 0, bottom: 300, left: 170 },
];
