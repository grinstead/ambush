import { ErrorBoundary, ParentProps } from "solid-js";
import { ABSOLUTE_COVER, Props } from "./solid_utils.tsx";
import { GPUContainer, GPUWorkQueue } from "@grinstead/webgpu";
import { GameLoop } from "./GameLoop.tsx";
import { BaseFrameTimer } from "../FrameTimer.ts";
import { createMouseTracker } from "./mouse.tsx";
import { GameEngine, GameEngineContext } from "./GameEngine.tsx";
import { createDimsTracker } from "./dims.tsx";

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

  const [mouse, trackMouse] = createMouseTracker();
  const [dims, trackDims] = createDimsTracker();

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
          <GameLoop.Provider
            steps={props.steps ?? ["main", "render"]}
            timer={timer}
          >
            <GPUWorkQueue.Provider>
              <GameEngineContext.Provider value={new GameEngine(mouse, dims)}>
                {props.children}
              </GameEngineContext.Provider>
            </GPUWorkQueue.Provider>
          </GameLoop.Provider>
        </GPUContainer>
      </div>
    </ErrorBoundary>
  );
}

export function ambushDefaultErrorDisplay(err: unknown) {
  return <div>{String(err)}</div>;
}
