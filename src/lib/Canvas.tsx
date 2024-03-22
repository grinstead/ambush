import {
  JSX,
  JSXElement,
  createContext,
  createMemo,
  onCleanup,
} from "solid-js";
import { Result, failure, success } from "./utils.ts";
import { GPUCanvasDetails } from "./GPUCanvas.ts";
import { ShowResult } from "./solid_utils.tsx";
import { RenderContext, RenderFunc } from "./RenderPart.tsx";

export const CanvasContext = createContext(
  // tricks it into typing the context as always being defined
  undefined as any as GPUCanvasDetails
);

export type CanvasProps = JSX.CanvasHTMLAttributes<HTMLCanvasElement>;

export function Canvas(props: CanvasProps) {
  // giving canvas a dummy value for children makes sure that Solid does not
  // attempt to compute the children property, which is good because we have to
  // wait until WebGPU is initialized before we invoke that property.
  const canvas = (<canvas {...props} children={null} />) as HTMLCanvasElement;

  return (
    <ShowResult
      value={loadGPU(canvas)}
      fallback={canvas} // put the canvas in the dom while it's loading
      success={(details) => (
        <CanvasImpl details={details} children={props.children} />
      )}
      failure={(e) => <div>{e}</div>} // todo
    />
  );
}

export async function loadGPU(
  canvas: HTMLCanvasElement
): Promise<Result<GPUCanvasDetails, string>> {
  const { gpu } = navigator as Partial<NavigatorGPU>;
  if (!gpu) return failure("This browser is not supported, consider Chrome");

  const adapter = await gpu.requestAdapter();
  if (!adapter) return failure("This hardware is not supported");

  const device = await adapter.requestDevice();

  const context = canvas.getContext("webgpu");
  if (!context) return failure("Failed to initialize webgpu");

  const format = gpu.getPreferredCanvasFormat();

  context.configure({ device, format });

  return success({ context, device, canvas, format });
}

type CanvasImplProps = {
  details: GPUCanvasDetails;
  children: JSXElement;
};

function CanvasImpl(props: CanvasImplProps) {
  let timerId: number = 0;

  const renderContext = createMemo(() => {
    let nextPriorityId = 1;

    const onEveryRun: Map<number, RenderFunc> = new Map();
    const onNextRun: Map<number, RenderFunc> = new Map();
    const { device } = props.details;

    return {
      reserveSlot() {
        const id = nextPriorityId++;

        return (update: null | RenderFunc, everyFrame: boolean = false) => {
          onNextRun.delete(id);
          onEveryRun.delete(id);

          if (update) {
            (everyFrame ? onEveryRun : onNextRun).set(id, update);

            timerId ||= requestAnimationFrame(() => {
              timerId = 0;
              renderAll();
            });
          }
        };
      },
    };

    function renderAll() {
      const renders = [...onNextRun.entries(), ...onEveryRun.entries()];
      onNextRun.clear();

      const encoder = device.createCommandEncoder();

      // sort by priority id
      renders.sort(([a], [b]) => a - b);

      // render
      renders.forEach(([_id, render]) => {
        render(encoder);
      });

      device.queue.submit([encoder.finish()]);
    }
  });

  onCleanup(() => {
    timerId && cancelAnimationFrame(timerId);
  });

  return (
    <>
      {props.details.canvas}
      <CanvasContext.Provider value={props.details}>
        <RenderContext.Provider value={renderContext()}>
          {
            // invokes the children, we do not actually render them
            (props.children, null)
          }
        </RenderContext.Provider>
      </CanvasContext.Provider>
    </>
  );
}
