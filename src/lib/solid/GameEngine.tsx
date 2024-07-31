import { createContext, useContext } from "solid-js";
import { MouseAccessors } from "./mouse.tsx";
import { Dimensions } from "./dims.tsx";
import { AudioManager } from "../audio/AudioManager.ts";
import { GameLoop } from "./GameLoop.tsx";

export const GameEngineContext = createContext<GameEngine>();

export class GameEngine {
  readonly audio = new AudioManager();

  constructor(
    readonly loop: GameLoop,
    readonly mouse: MouseAccessors,
    readonly area: Dimensions
  ) {}
}

export function useGameEngine() {
  return useContext(GameEngineContext)!;
}
