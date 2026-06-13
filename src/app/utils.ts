import { ColorKey } from "@/shared/types";
import { useEffect, useState } from "react";

export function groupTilesByColor(tiles: ColorKey[]) {
    const groupedTiles: ColorKey[][] = [];
    for (const tile of tiles) {
        let hasInsertedTile = false;
        for (const group of groupedTiles) {
            if (group[0] === tile) {
                group.push(tile);
                hasInsertedTile = true;
                break;
            }
        }
        if (!hasInsertedTile) {
            groupedTiles.push([tile]);
        }
    }
    return groupedTiles;
}

const ID_KEY = "DEVICE_PLAYER_ID";

export function getPlayerId(): string {
    let id = localStorage.getItem(ID_KEY);
    if (id) return id;

    id = window.crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
    return id;
}

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkWidth = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkWidth();
        window.addEventListener("resize", checkWidth);
        return () => {
            window.removeEventListener("resize", checkWidth);
        };
    }, []);
    return isMobile;
}
