"use client";

import { MainScreen } from "./game/main_screen";
import { SocketProvider } from "./socket-context";

export default function Home() {
    return (
        <SocketProvider>
            <MainScreen />
        </SocketProvider>
    );
}
