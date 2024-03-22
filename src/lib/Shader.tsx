import { useContext, createMemo } from "solid-js";
import { CanvasContext } from "./Canvas";

import { AsChildren, childrenArray } from "./solid_utils";
import { nonnullish, pretendJSX } from "./utils";
import { RenderPart } from "./RenderPart.tsx";

export type RenderShaderProps = {
  label?: string;
  code: string;
  vertexMain: string;
  fragmentMain: string;
  children?: AsChildren<BindGroupDefinition | null>;
  draw: number | ((encoder: GPURenderPassEncoder) => void);
  colorAttachments?: Iterable<GPURenderPassColorAttachment | null>;
};

export type BindGroupProps = {
  children: AsChildren<null | GPUBindingResource>;
};

const CLASS_BINDGROUPDEFINITION = "BindGroupDefinition";

export type BindGroupDefinition = {
  class: typeof CLASS_BINDGROUPDEFINITION;
  entries: Array<GPUBindingResource | null>;
};

export function BindGroup(props: BindGroupProps) {
  const groups = childrenArray(props);

  return pretendJSX<BindGroupDefinition>(() => ({
    class: CLASS_BINDGROUPDEFINITION,
    entries: groups(),
  }));
}

export function RenderShader(props: RenderShaderProps) {
  const details = useContext(CanvasContext);

  const getShader = createMemo(() => {
    return details.device.createShaderModule({
      label: props.label,
      code: props.code,
    });
  });

  const getPipeline = createMemo(() => {
    return details.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: getShader(),
        entryPoint: props.vertexMain,
      },
      fragment: {
        module: getShader(),
        entryPoint: props.fragmentMain,
        targets: [{ format: details.format }],
      },
      primitive: {
        topology: "triangle-strip",
      },
    });
  });

  const getDefs = childrenArray(props);
  const getBindGroups = createMemo(() => {
    const pipeline = getPipeline();

    let groups: Array<GPUBindGroup | null> | undefined;

    // make it slightly lazy, helps things initialize
    return () => {
      const { device } = details;

      return (groups ??= Array.from(getDefs()).map((group, i) => {
        if (!group) return null;

        return device.createBindGroup({
          layout: pipeline.getBindGroupLayout(i),
          entries: nonnullish(
            Array.from(group.entries).map(
              (resource, j) =>
                resource && {
                  binding: j,
                  resource,
                }
            )
          ),
        });
      }));
    };
  });

  const getRender = createMemo(() => {
    // read these outside the function so that the render function changes
    // whenever these change
    const pipeline = getPipeline();
    const colorAttachments = props.colorAttachments;

    const bindGroups = getBindGroups();
    const draw = props.draw;

    return (encoder: GPUCommandEncoder) => {
      const run = encoder.beginRenderPass({
        colorAttachments: colorAttachments ?? [
          {
            view: details.context.getCurrentTexture().createView(),
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
      run.setPipeline(pipeline);

      let i = 0;
      for (const group of bindGroups()) {
        run.setBindGroup(i++, group);
      }

      typeof draw === "number" ? run.draw(draw) : draw(run);
      run.end();
    };
  });

  return <RenderPart everyFrame render={getRender()} />;
}

export type ComputeShaderProps = {
  label?: string;
  code: string | GPUShaderModule;
  main: string;
  children: AsChildren<BindGroupDefinition | null>;
  workgroups: readonly [number, number?, number?];
};

export function ComputeShader(props: ComputeShaderProps) {
  const details = useContext(CanvasContext);

  const getShader = createMemo(() => {
    const code = props.code;

    if (typeof code !== "string") {
      // precompiled shader module
      return code;
    }

    return details.device.createShaderModule({
      label: props.label,
      code,
    });
  });

  const getPipeline = createMemo(() => {
    return details.device.createComputePipeline({
      layout: "auto",
      compute: {
        module: getShader(),
        entryPoint: props.main,
      },
    });
  });

  const getDefs = childrenArray(props);
  const getBindGroups = createMemo(() => {
    const pipeline = getPipeline();
    const defs = getDefs();

    let groups: Array<GPUBindGroup | null> | undefined;

    // make it slightly lazy, helps things initialize
    return () => {
      const { device } = details;

      return (groups ??= defs.map((group, i) => {
        if (!group) return null;

        return device.createBindGroup({
          layout: pipeline.getBindGroupLayout(i),
          entries: nonnullish(
            Array.from(group.entries).map(
              (resource, j) =>
                resource && {
                  binding: j,
                  resource,
                }
            )
          ),
        });
      }));
    };
  });

  const getRender = createMemo(() => {
    // read these outside the function so that the render function changes
    // whenever these change
    const pipeline = getPipeline();

    const bindGroups = getBindGroups();
    const workgroups = props.workgroups;

    // const label = `bind groups ${Math.round(Math.random() * 1000)} ${
    //   props.label
    // }`;

    // console.log("Created " + label);

    return (encoder: GPUCommandEncoder) => {
      // console.log("Running " + label);

      const run = encoder.beginComputePass();
      run.setPipeline(pipeline);

      let i = 0;
      for (const group of bindGroups()) {
        run.setBindGroup(i++, group);
      }

      run.dispatchWorkgroups(...workgroups);
      run.end();
    };
  });

  return <RenderPart everyFrame render={getRender()} />;
}
