import { JSXElement } from "solid-js";
import { Result, failure, success } from "./utils.ts";
import { GPUCanvasDetails } from "./GPUCanvas.ts";
import { ShowResult } from "./solid_utils.tsx";

export type CanvasProps = {
  width: number;
  height: number;
  children?: JSXElement;
};

export function Canvas(props: CanvasProps) {
  const canvas = (
    <canvas width={props.width} height={props.height} />
  ) as HTMLCanvasElement;

  return (
    <ShowResult
      value={loadGPU(canvas)}
      fallback={canvas} // put the canvas in the dom while it's loading
      success={(details) => <div>TODO</div>}
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
