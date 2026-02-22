"use client";
import { CIRCLE_POSITIONS, ColorKey } from "../consts";
import { CircleWithTiles } from "./circle";

const onClickHandler = () => {};
export function PhaseOneDesk() {
    const colors: Array<Array<ColorKey>> = [
        ["RED", "RED", "GREEN", "ORANGE"],
        ["RED", "RED", "GREEN", "ORANGE"],
        ["RED", "RED", "GREEN", "ORANGE"],
        ["RED", "RED", "GREEN", "ORANGE"],
        ["RED", "RED", "GREEN", "ORANGE"],
    ];
    return (
        <div>
            {colors.map((color, idx) => (
                <CircleWithTiles
                    colors={color}
                    onClickHandler={onClickHandler}
                    position={CIRCLE_POSITIONS[idx]}
                    key={idx}
                />
            ))}
        </div>
    );
}
