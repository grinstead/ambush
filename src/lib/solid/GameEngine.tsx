import { createContext } from "solid-js";
import { MouseAccessors } from "../../exports.ts";

export const GameEngineContext = createContext<GameEngine>();

export class GameEngine {
  constructor(readonly mouse: MouseAccessors) {}
}
