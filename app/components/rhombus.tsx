"use client";
import { MouseEventHandler } from "react";
import { ANGLE as angle, RHOMBUS_SIZE as size } from "../consts";
import "./rhombus.css";

interface RhombusProps {
    points?: number;
    color?: string;
    transformAngle?: number;
    onClickHandler: MouseEventHandler;
}

export function Rhombus({
    color = "#0f1038ff",
    points: pointsCount,
    transformAngle = -30,
    onClickHandler,
}: RhombusProps) {
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

    // Center of the rhombus within the viewBox (accounting for stroke offset)
    const centerX = cx + strokeWidth / 2;
    const centerY = cy + strokeWidth / 2;

    const viewBoxWidth = 2 * cx + strokeWidth;
    const viewBoxHeight = 2 * cy + strokeWidth;

    return (
        <div
            className={`rhombus ${pointsCount ? "points" + pointsCount : ""}`}
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
                    style={{ cursor: "pointer" }}
                    onClick={onClickHandler}
                />
                {pointsCount && (
                    <text
                        x={centerX}
                        y={centerY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#000000ff"
                        fontSize={20}
                        fontWeight="bold"
                        transform={`rotate(180, ${centerX}, ${centerY})`}
                        style={{ cursor: "pointer" }}
                        onClick={onClickHandler}
                    >
                        {pointsCount}
                    </text>
                )}
            </svg>
        </div>
    );
}
