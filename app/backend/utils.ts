import { createTileBag, fillFactories, initState } from "../utils/helpers";
import { GameBackendState } from "../utils/types";

export async function fetchGame(): Promise<GameBackendState | false>{
    const bag = createTileBag();
    return {
        ...initState(),
        factories: fillFactories(bag),
        baseTiles: [bag.splice(0, 5), bag.splice(0, 5)],
        _bag: bag,
        _trash: [],
    };
    return false;
}
