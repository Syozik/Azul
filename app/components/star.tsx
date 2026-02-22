import React from "react";
import { Rhombus } from "./rhombus";

interface StarProps {
    color?: string;
}

export function Star({ color = "#0f1038ff" }: StarProps) {
    const angles = [];
    for (let i = 0; i < 6; i++) {
        angles.push(-30 + i * 60);
    }
    return (
        <div className="star">
            {angles.map((angle, idx) => (
                <Rhombus color={color} points={idx+1} transformAngle={angle} key={angle} />
            ))}
        </div>
    )
}
