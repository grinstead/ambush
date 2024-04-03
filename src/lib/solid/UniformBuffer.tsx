import { createMemo, useContext } from "solid-js";
import { CanvasContext } from "../Canvas.tsx";
import { pretendJSX, roundUpToMultiple } from "../utils.ts";
import { UNIFORM_ALIGNMENT } from "../webgpu_utils.ts";
import { createRenderPart } from "../RenderPart.tsx";

export type UniformBufferProps = {
  label?: string;
  usage?: number;
  bytes: ArrayBufferView;
};

export function UniformBuffer(props: UniformBufferProps) {
  const { device } = useContext(CanvasContext);

  const getSize = createMemo(() =>
    roundUpToMultiple(props.bytes.byteLength, UNIFORM_ALIGNMENT)
  );

  const getBuffer = createMemo(() => {
    return device.createBuffer({
      label: props.label,
      usage: (props.usage ?? GPUBufferUsage.UNIFORM) | GPUBufferUsage.COPY_DST,
      size: getSize(),
    });
  });

  createRenderPart(() => {
    const buffer = getBuffer();
    const bytes = props.bytes;

    return () => {
      device.queue.writeBuffer(
        buffer,
        0,
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength
      );
    };
  });

  return pretendJSX<GPUBindingResource>(() => ({
    buffer: getBuffer(),
  }));
}
