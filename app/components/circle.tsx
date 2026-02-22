import { MouseEventHandler } from "react";
import { ColorKey, COLORS, RHOMBUS_HALF_LONG } from "../consts";
import "./circle.css";
import { Rhombus } from "./rhombus";

interface CircleProps {
    colors: Array<ColorKey>;
    position: { top: string; left: string };
    onClickHandler: MouseEventHandler;
}

export function CircleWithTiles({
    colors,
    position,
    onClickHandler,
}: CircleProps) {
    return (
        <div
            className="circle_with_tiles"
            style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                width: 4 * RHOMBUS_HALF_LONG+10,
                height: 4 * RHOMBUS_HALF_LONG+10,
            }}
        >
            <div style={{ position: "absolute", top: "50%", left: "50%" }}>
                {colors.map((color, idx) => (
                    <Rhombus
                        color={COLORS[color]}
                        transformAngle={(idx * Math.PI) / 2}
                        onClickHandler={onClickHandler}
                        key={idx}
                    />
                ))}
            </div>
        </div>
    );
}
