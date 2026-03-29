import Image from "next/image";
import {
    ANGLE,
    COLORS,
    getSnowflakePositions,
    getDeskImage,
} from "../consts";
import { usePlayerDesk } from "../game/phase_two";
import { useSocket } from "../utils/socket-context";
import { TileColor } from "../utils/types";
import { Tile } from "./tile";
import { useMemo } from "react";

interface SnowflakeProps {
    color: TileColor;
    tileSize: number;
    onTileSelect: (color: TileColor, points: number) => void;
}

function getStatueTransform(rotate: number, tileSize: number, deskImage: { width: number; height: number }): string {
    const angle = ANGLE * (1.5 + rotate);
    const x = 1.5 * tileSize * Math.cos(angle) - deskImage.width / 2;
    const y = 1.5 * tileSize * Math.sin(angle) - deskImage.height / 2;
    return `translate(${x}px, ${y}px) rotate(${angle}rad) `;
}

function getMirrorTransform(rotate: number, tileSize: number, deskImage: { width: number; height: number }): string {
    const angle = ANGLE * (rotate + 1);
    return `translate(-50%, -50%) rotate(${angle}rad) translate(0, -${tileSize + deskImage.height / 2}px)`;
}

function getFontaineTransform(rotate: number, tileSize: number, deskImage: { width: number; height: number }): string {
    const angle = ANGLE * (rotate + 1);
    return `translate(-50%, -50%) rotate(${angle}rad) translate(0, ${tileSize + deskImage.height / 2}px)`;
}

export function Snowflake({ color, tileSize, onTileSelect }: SnowflakeProps) {
    const { gameState, playerNumber } = useSocket();
    const player = usePlayerDesk();

    const snowflakePositions = useMemo(() => getSnowflakePositions(tileSize), [tileSize]);
    const deskImage = useMemo(() => getDeskImage(tileSize), [tileSize]);

    const starPosition = snowflakePositions[color];
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
                    size={tileSize}
                    isCovered={
                        !!gameState.players[player - 1].coveredTiles[color][idx]
                    }
                    onClickHandler={
                        player === playerNumber
                            ? () => onTileSelect(color, idx + 1)
                            : undefined
                    }
                />
            ))}
            {color !== "CENTER" && (
                <>
                    <Image
                        width={deskImage.width}
                        height={deskImage.height}
                        src="/statue.png"
                        alt="statue"
                        style={{
                            position: "absolute",
                            transformOrigin: "center",
                            transform: getStatueTransform(starPosition.rotate, tileSize, deskImage),
                        }}
                    />
                    <Image
                        width={deskImage.width}
                        height={deskImage.height}
                        src="/mirror.png"
                        alt="mirror"
                        style={{
                            position: "absolute",
                            transformOrigin: "center",
                            transform: getMirrorTransform(starPosition.rotate, tileSize, deskImage),
                        }}
                    />
                    <Image
                        width={deskImage.width}
                        height={deskImage.height}
                        src="/fontaine.png"
                        alt="fontaine"
                        style={{
                            position: "absolute",
                            transformOrigin: "center",
                            transform: getFontaineTransform(
                                starPosition.rotate,
                                tileSize,
                                deskImage,
                            ),
                        }}
                    />
                </>
            )}
        </div>
    );
}