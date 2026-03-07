export const TILE_COLORS = ["PURPLE", "GREEN", "ORANGE", "YELLOW", "BLUE", "RED"];
export const COLORS = {
    BLUE: "#3f42d8ff",
    GREEN: "#3b9418ff",
    RED: "#e77878ff",
    YELLOW: "#e7d778ff",
    PURPLE: "#c678e7ff",
    ORANGE: "#e7a678ff",
    CENTER: "#4bc3b5ff",
};

export const TILES_PER_COLOR = 22;
export const NUM_FACTORIES = 5;
export const TILES_PER_FACTORY = 4;

export const ANGLE = Math.PI / 3;
export const TILE_SIZE = 40;
export const TILE_HALF_SHORT = TILE_SIZE * Math.cos(ANGLE);
export const TILE_HALF_LONG = TILE_SIZE * Math.sin(ANGLE);

export const JOKERS = ["PURPLE", "GREEN", "ORANGE", "YELLOW", "BLUE", "RED"];
export const SNOWFLAKE_POSITIONS = {
    CENTER: { x: 0, y: 0, rotate: 3 },
    RED: { x: 0, y: -(2 * TILE_SIZE + 2 * TILE_HALF_SHORT), rotate: 5 },
    BLUE: {
        x: 3 * TILE_HALF_LONG,
        y: -TILE_SIZE - TILE_HALF_SHORT,
        rotate: 0,
    },
    YELLOW: {
        x: 3 * TILE_HALF_LONG,
        y: TILE_SIZE + TILE_HALF_SHORT,
        rotate: 1,
    },
    GREEN: { x: 0, y: 2 * TILE_SIZE + 2 * TILE_HALF_SHORT, rotate: 2 },
    PURPLE: {
        x: -3 * TILE_HALF_LONG,
        y: TILE_SIZE + TILE_HALF_SHORT,
        rotate: 3,
    },
    ORANGE: {
        x: -3 * TILE_HALF_LONG,
        y: -TILE_SIZE - TILE_HALF_SHORT,
        rotate: 4,
    },
};


const PENTAGON_RADIUS = 33; // % of board
const CIRCLE_HALF = 8.5;    // half of the 17% circle diameter
const PENTAGON_ANGLES = [-90, -18, 54, 126, 198].map(deg => (deg * Math.PI) / 180);

export const CIRCLE_POSITIONS = PENTAGON_ANGLES.map(angle => ({
    top:  `${(50 + PENTAGON_RADIUS * Math.sin(angle) - CIRCLE_HALF).toFixed(2)}%`,
    left: `${(50 + PENTAGON_RADIUS * Math.cos(angle) - CIRCLE_HALF).toFixed(2)}%`,
}));

export const allowedGameActions = ["pick", "cover", "pass"];
