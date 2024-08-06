import {
  createComputed,
  createMemo,
  ErrorBoundary,
  onCleanup,
  ParentProps,
} from "solid-js";
import { ABSOLUTE_COVER, Props } from "./solid_utils.tsx";
import { GPUContainer, GPUWorkQueue } from "@grinstead/webgpu";
import { GameLoop, GameLoopContext } from "./GameLoop.tsx";
import { BaseFrameTimer } from "../FrameTimer.ts";
import { createMouseTracker } from "./mouse.tsx";
import { GameEngine, GameEngineContext } from "./GameEngine.tsx";
import { createDimsTracker } from "./dims.tsx";
import { arrayExactEquals } from "../basic/equals.ts";

export type AmbushGameProps = ParentProps<{
  fallback?: Props<typeof ErrorBoundary>["fallback"];
  class?: string;
  steps?: Array<string>;
}>;

/**
 * A Game, provided with many builtin features.
 * @param props
 * @returns
 */
export function AmbushGame(props: AmbushGameProps) {
  let canvas: undefined | HTMLCanvasElement;
  const timer = new BaseFrameTimer();

  const steps = createMemo(() => props.steps ?? ["main", "render"], undefined, {
    equals: arrayExactEquals,
  });

  let gameloop: undefined | GameLoop;
  createComputed(() => {
    if (gameloop) {
      gameloop.steps = steps();
    } else {
      gameloop = new GameLoop(steps(), timer);
    }
  });

  const [mouse, trackMouse] = createMouseTracker();
  const [dims, trackDims] = createDimsTracker();
  const engine = new GameEngine(gameloop!, mouse, dims);

  onCleanup(() => {
    engine.audio.destroy();
  });

  return (
    <ErrorBoundary fallback={props.fallback ?? ambushDefaultErrorDisplay}>
      <div
        ref={(dom) => {
          trackMouse(dom);
          trackDims(dom);
        }}
        class={props.class}
        style="position:relative"
      >
        <canvas
          ref={canvas}
          style={ABSOLUTE_COVER}
          width={dims.width || undefined}
          height={dims.height || undefined}
        />
        <GPUContainer canvas={canvas!}>
          <GameLoopContext.Provider value={gameloop!}>
            <GPUWorkQueue.Provider>
              <GameEngineContext.Provider value={engine}>
                {props.children}
              </GameEngineContext.Provider>
            </GPUWorkQueue.Provider>
          </GameLoopContext.Provider>
        </GPUContainer>
      </div>
    </ErrorBoundary>
  );
}

export function ambushDefaultErrorDisplay(err: unknown) {
  return <div>{String(err)}</div>;
}
