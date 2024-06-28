import { createMemo, useContext } from "solid-js";
import { CanvasContext } from "../Canvas.tsx";
import { pretendJSX, roundUpToMultiple } from "../utils.ts";
import { UNIFORM_ALIGNMENT, WebGpuScalar } from "../webgpu_utils.ts";
import { createRenderPart } from "../RenderPart.tsx";
import {
  BinaryArray,
  appendFloat32,
  appendInt32,
  appendUint32,
  littleEndian,
} from "../BinaryArray.ts";

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

export type UniformScalarProps = {
  label?: string;
  usage?: number;
  type: WebGpuScalar;
  value: number;
};

export function UniformScalar(props: UniformScalarProps) {
  const { device } = useContext(CanvasContext);

  const getBuffer = createMemo(() => {
    return device.createBuffer({
      label: props.label,
      usage: (props.usage ?? GPUBufferUsage.UNIFORM) | GPUBufferUsage.COPY_DST,
      size: UNIFORM_ALIGNMENT,
    });
  });

  createRenderPart(() => {
    const buffer = getBuffer();
    const bytes = new ArrayBuffer(UNIFORM_ALIGNMENT);
    const view = new DataView(bytes);

    const { type: datatype, value } = props;
    switch (datatype) {
      case "u32":
        view.setUint32(0, value, true);
        break;
      case "i32":
        view.setInt32(0, value, true);
        break;
      default:
        datatype satisfies "f32";
        view.setFloat32(0, value, true);
        break;
    }

    return () => {
      device.queue.writeBuffer(buffer, 0, bytes, 0, UNIFORM_ALIGNMENT);
    };
  });

  return pretendJSX<GPUBindingResource>(() => ({
    buffer: getBuffer(),
  }));
}

export type UniformVectorProps = {
  label?: string;
  usage?: number;
  /** Defaults to f32 */
  type?: WebGpuScalar;
  value:
    | [number, number]
    | [number, number, number]
    | [number, number, number, number];
};

export function UniformVector(props: UniformVectorProps) {
  const { device } = useContext(CanvasContext);

  const getBuffer = createMemo(() => {
    return device.createBuffer({
      label: props.label,
      usage: (props.usage ?? GPUBufferUsage.UNIFORM) | GPUBufferUsage.COPY_DST,
      size: UNIFORM_ALIGNMENT,
    });
  });

  createRenderPart(() => {
    const buffer = getBuffer();
    const { type: datatype = "f32", value } = props;

    const bytes = new ArrayBuffer(UNIFORM_ALIGNMENT);
    const bin = littleEndian(bytes, true);

    let appendValue: (bin: BinaryArray, value: number) => void;
    switch (datatype) {
      case "u32":
        appendValue = appendUint32;
        break;
      case "i32":
        appendValue = appendInt32;
        break;
      default:
        datatype satisfies "f32";
        appendValue = appendFloat32;
        break;
    }

    for (let v of value) {
      appendValue(bin, v);
    }

    return () => {
      device.queue.writeBuffer(buffer, 0, bytes, 0, UNIFORM_ALIGNMENT);
    };
  });

  return pretendJSX<GPUBindingResource>(() => ({
    buffer: getBuffer(),
  }));
}
