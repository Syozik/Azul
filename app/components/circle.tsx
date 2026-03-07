"use client";
import { COLORS, TILE_HALF_LONG } from "../consts";
import type { TileColor, GameAction } from "../utils/types";
import "@/app/static/style/circle.css";
import { Tile } from "./tile";
import { useRef, useEffect, useState } from "react";

interface CircleProps {
    colors: TileColor[];
    factoryIndex: number;
    position: { top: string; left: string };
    isMyTurn: boolean;
    sendGameAction: (action: GameAction) => void;
}

// The natural pixel diameter the tile layout occupies (4 tiles across)
const NATURAL_SIZE = 4 * TILE_HALF_LONG + 10;

export function CircleWithTiles({
    colors,
    position,
    factoryIndex,
    isMyTurn,
    sendGameAction,
}: CircleProps) {
    const isEmpty = colors.length === 0;
    const circleRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const el = circleRef.current;
        if (!el) return;

        const observer = new ResizeObserver(([entry]) => {
            const { width } = entry.contentRect;
            if (width > 0) {
                setScale(width / NATURAL_SIZE);
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const onClickHandler = (color: TileColor) => {
        if (isMyTurn && !isEmpty) {
            sendGameAction({
                type: "pick",
                color,
                factoryIndex,
            });
        }
    };

    return (
        <div
            ref={circleRef}
            className={`circle_with_tiles ${isEmpty ? "circle-empty" : ""} ${isMyTurn && !isEmpty ? "circle-active" : ""}`}
            style={{
                position: "absolute",
                top: position.top,
                left: position.left,
            }}
        >
            {/* This wrapper sits at the centre of the circle and scales
                the tile content to always fill the available space */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: "center center",
                    width: NATURAL_SIZE,
                    height: NATURAL_SIZE,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                    }}
                >
                    {colors.map((color, idx) => (
                        <Tile
                            color={COLORS[color]}
                            transformAngle={(idx * Math.PI) / 2}
                            onClickHandler={() => onClickHandler(color)}
                            key={idx}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
