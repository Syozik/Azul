"use client";
import { useState } from "react";
import { PhaseOne } from "./phase_one";
import { PhaseTwo } from "./phase_two";

export function MainScreen() {
    const [isPhaseOne, setPhase] = useState(true);
    return (
        <>
            <button onClick={() => setPhase(!isPhaseOne)}>Switch Phase</button>
            {isPhaseOne ? <PhaseOne /> : <PhaseTwo />}
        </>
    );
}
