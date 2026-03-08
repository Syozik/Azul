import { Tile } from "./tile";
import { ANGLE, COLORS, SNOWFLAKE_POSITIONS } from "../consts";
import { TileColor } from "../utils/types";
import { useSocket } from "../utils/socket-context";
import { usePlayerDesk } from "../game/phase_two";

interface SnowflakeProps {
    color: TileColor;
    onTileSelect: (color: TileColor, points: number) => void;
}

export function Snowflake({ color, onTileSelect }: SnowflakeProps) {
    const { gameState } = useSocket();
    const player = usePlayerDesk();
    const starPosition = SNOWFLAKE_POSITIONS[color];
    const angles = [];
    for (let i = 0; i < 6; i++) {
        angles.push(ANGLE * (starPosition.rotate - 1 / 2 + i));
    }
    return (
        <div
            className={`snowflake snowflake-${color}`}
            style={{
                transform: `translate(${starPosition.x}px, ${starPosition.y}px)`,
            }}
        >
            {angles.map((angle, idx) => (
                <Tile
                    color={
                        (color === "CENTER" &&
                            (gameState.players[player - 1].coveredTiles[color][
                                idx
                            ] as string)) ||
                        COLORS[color]
                    }
                    points={idx + 1}
                    transformAngle={angle}
                    key={angle}
                    isCovered={
                        !!gameState.players[player - 1].coveredTiles[color][idx]
                    }
                    onClickHandler={() => onTileSelect(color, idx + 1)}
                />
            ))}
        </div>
    );
}
