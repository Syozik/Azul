import Image from "next/image";
import {
    ANGLE,
    COLORS,
    SNOWFLAKE_POSITIONS,
    TILE_SIZE,
    DESK_IMAGE,
} from "../consts";
import { usePlayerDesk } from "../game/phase_two";
import { useSocket } from "../utils/socket-context";
import { TileColor } from "../utils/types";
import { Tile } from "./tile";

interface SnowflakeProps {
    color: TileColor;
    onTileSelect: (color: TileColor, points: number) => void;
}

function getStatueTransform(rotate: number): string {
    const angle = ANGLE * (1.5 + rotate);
    const x = 1.5 * TILE_SIZE * Math.cos(angle) - DESK_IMAGE.width / 2;
    const y = 1.5 * TILE_SIZE * Math.sin(angle) - DESK_IMAGE.height / 2;
    return `translate(${x}px, ${y}px) rotate(${angle}rad) `;
}

function getMirrorTransform(rotate: number): string {
    const angle = ANGLE * (rotate + 1);
    return `translate(-50%, -50%) rotate(${angle}rad) translate(0, -${TILE_SIZE + DESK_IMAGE.height / 2}px)`;
}

function getFontaineTransform(rotate: number): string {
    const angle = ANGLE * (rotate + 1);
    return `translate(-50%, -50%) rotate(${angle}rad) translate(0, ${TILE_SIZE + DESK_IMAGE.height / 2}px)`;
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
            {color !== "CENTER" && (
                <>
                    <Image
                        width={DESK_IMAGE.width}
                        height={DESK_IMAGE.height}
                        src="/statue.png"
                        alt="statue"
                        style={{
                            position: "absolute",
                            transformOrigin: "center",
                            transform: getStatueTransform(starPosition.rotate),
                        }}
                    />
                    <Image
                        width={DESK_IMAGE.width}
                        height={DESK_IMAGE.height}
                        src="/mirror.png"
                        alt="mirror"
                        style={{
                            position: "absolute",
                            transformOrigin: "center",
                            transform: getMirrorTransform(starPosition.rotate),
                        }}
                    />
                    <Image
                        width={DESK_IMAGE.width}
                        height={DESK_IMAGE.height}
                        src="/fontaine.png"
                        alt="fontaine"
                        style={{
                            position: "absolute",
                            transformOrigin: "center",
                            transform: getFontaineTransform(
                                starPosition.rotate,
                            ),
                        }}
                    />
                </>
            )}
        </div>
    );
}
