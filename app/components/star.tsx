import { Rhombus } from "./rhombus";
import { ANGLE, ColorKey, COLORS, STAR_POSITIONS } from "../consts";

interface StarProps {
    color: ColorKey;
}

export function Star({ color }: StarProps) {
    const starPosition = STAR_POSITIONS[color];
    const angles = [];
    for (let i = 0; i < 6; i++) {
        angles.push(ANGLE*(starPosition.rotate - 1/2 + i));
    }
    return (
        <div className={`star star-${color}`} style={{ transform: `translate(${starPosition.x}px, ${starPosition.y}px)`}}>
            {angles.map((angle, idx) => (
                <Rhombus color={COLORS[color]} points={idx+1} transformAngle={angle} key={angle} />
            ))}
        </div>
    )
}
