"use client";
import { COLORS, RHOMBUS_HALF_LONG } from "../consts";
import type { TileColor, GameAction } from "../game/types";
import "@/app/static/style/circle.css";
import { Rhombus } from "./rhombus";

interface CircleProps {
    colors: TileColor[];
    factoryIndex: number;
    position: { top: string; left: string };
    isMyTurn: boolean;
    sendGameAction: (action: GameAction) => void;
}

export function CircleWithTiles({
    colors,
    position,
    factoryIndex,
    isMyTurn,
    sendGameAction,
}: CircleProps) {
    const isEmpty = colors.length === 0;

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
            className={`circle_with_tiles ${isEmpty ? "circle-empty" : ""} ${isMyTurn && !isEmpty ? "circle-active" : ""}`}
            style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                width: 4 * RHOMBUS_HALF_LONG + 10,
                height: 4 * RHOMBUS_HALF_LONG + 10,
            }}
        >
            <div style={{ position: "absolute", top: "50%", left: "50%" }}>
                {colors.map((color, idx) => (
                    <Rhombus
                        color={COLORS[color]}
                        transformAngle={(idx * Math.PI) / 2}
                        onClickHandler={() => onClickHandler(color)}
                        key={idx}
                    />
                ))}
            </div>
        </div>
    );
}
