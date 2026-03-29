"use client";
import { MouseEventHandler } from "react";
import { ANGLE as angle, TILE_SIZE, DEFAULT_TILE_SIZE } from "../consts";
import "@/app/static/style/tile.css";

interface TileProps {
    points?: number;
    color?: string;
    transformAngle?: number;
    onClickHandler?: MouseEventHandler;
    isCovered?: boolean;
    size?: number;
}

export function Tile({
    color = "#0f1038ff",
    points: pointsCount,
    size = TILE_SIZE,
    transformAngle = -Math.PI / 6,
    isCovered,
    onClickHandler,
}: TileProps) {
    const stroke = "#ffffff";
    const strokeWidth = 2;

    const side = size / (2 * Math.cos(angle));
    const halfShort = side * Math.cos(angle);
    const halfLong = side * Math.sin(angle);

    const cx = halfShort;
    const cy = halfLong;

    const polygonPoints = [
        [0, cy], // left
        [cx, 0], // top
        [2 * cx, cy], // right
        [cx, 2 * cy], // bottom
    ]
        .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
        .join(" ");

    // Center of the tile within the viewBox (accounting for stroke offset)
    const centerX = cx + strokeWidth / 2;
    const centerY = cy + strokeWidth / 2;

    const viewBoxWidth = 2 * cx + strokeWidth;
    const viewBoxHeight = 2 * cy + strokeWidth;

    return (
        <div
            className={`tile` + (isCovered ? ` tile_covered` : ``)}
            style={{
                transform: `rotate(${transformAngle}rad)`,
                transformOrigin: `${cx + strokeWidth / 2}px 0px`,
                left: `${-(cx + strokeWidth / 2)}px`,
                top: `0px`,
            }}
        >
            <svg
                width={viewBoxWidth}
                height={viewBoxHeight}
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                xmlns="http://www.w3.org/2000/svg"
            >
                <polygon
                    points={polygonPoints}
                    fill={color}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    transform={`translate(${strokeWidth / 2}, ${strokeWidth / 2})`}
                    style={{ cursor: onClickHandler ? "pointer" : "auto" }}
                    onClick={onClickHandler}
                />
                {pointsCount && !isCovered && (
                    <text
                        x={centerX}
                        y={centerY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#000000ff"
                        fontSize={Math.round(20 * (size / DEFAULT_TILE_SIZE))}
                        fontWeight="bold"
                        transform={`rotate(180, ${centerX}, ${centerY})`}
                        style={{ cursor: onClickHandler ? "pointer" : "auto" }}
                        onClick={onClickHandler}
                    >
                        {pointsCount}
                    </text>
                )}
            </svg>
        </div>
    );
}
