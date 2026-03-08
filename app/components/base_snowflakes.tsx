import { COLORS } from "../consts";
import { useSocket } from "../utils/socket-context";
import { Tile } from "./tile";

function getAngle(i: number, j: number): number {
    return Math.PI * (-1 / 3 + i / 1.5 + (2 * j) / 5);
}

export function BaseSnowflakes() {
    const { gameState } = useSocket();

    return gameState.baseTiles.map((snowflake, i) => (
        <div className={`base-snowflake base-snowflake-${i}`} key={i}>
            {snowflake.map((tile, idx) => (
                <Tile
                    color={COLORS[tile]}
                    transformAngle={getAngle(i, idx)}
                    size={40}
                    key={idx}
                />
            ))}
        </div>
    ));
}
