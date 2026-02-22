export const COLORS  = {
    BLUE: "#3f42d8ff",
    GREEN: "#3b9418ff",
    RED: "#e77878ff",
    YELLOW: "#e7d778ff",
    PURPLE: "#c678e7ff",
    ORANGE: "#e7a678ff",
    CENTER: "#4bc3b5ff",
} as const;

export const ANGLE = Math.PI / 3;
export const RHOMBUS_SIZE = 60;
export const RHOMBUS_HALF_SHORT = RHOMBUS_SIZE * Math.cos(ANGLE);
export const RHOMBUS_HALF_LONG = RHOMBUS_SIZE * Math.sin(ANGLE);

export type ColorKey = keyof typeof COLORS;
export const STAR_POSITIONS: Record<ColorKey, { x: number; y: number, rotate: number }> = {
    CENTER: { x: 0, y: 0, rotate: 3},
    RED: { x: 0, y: -(2 * RHOMBUS_SIZE + 2 * RHOMBUS_HALF_SHORT), rotate: 5 },
    BLUE: { x: 3*RHOMBUS_HALF_LONG, y: -RHOMBUS_SIZE - RHOMBUS_HALF_SHORT, rotate: 0},
    YELLOW: { x: 3*RHOMBUS_HALF_LONG, y: RHOMBUS_SIZE + RHOMBUS_HALF_SHORT, rotate: 1},
    GREEN: { x: 0, y: (2 * RHOMBUS_SIZE + 2 * RHOMBUS_HALF_SHORT), rotate: 2},
    PURPLE: { x: -3*RHOMBUS_HALF_LONG, y: RHOMBUS_SIZE + RHOMBUS_HALF_SHORT, rotate: 3},
    ORANGE: { x: -3*RHOMBUS_HALF_LONG, y: -RHOMBUS_SIZE - RHOMBUS_HALF_SHORT, rotate: 4},
}
