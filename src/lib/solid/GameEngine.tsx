import { createContext } from "solid-js";
import { MouseAccessors } from "./mouse.tsx";
import { Dimensions } from "./dims.tsx";

export const GameEngineContext = createContext<GameEngine>();

export class GameEngine {
  constructor(readonly mouse: MouseAccessors, readonly area: Dimensions) {}
}
