import {
  createContext,
  createRenderEffect,
  onCleanup,
  useContext,
} from "solid-js";

export type RenderFunc = (encoder: GPUCommandEncoder) => void;
export type UpdateRender = (
  update: null | RenderFunc,
  everyFrame?: boolean
) => void;

export const RenderContext = createContext<{
  reserveSlot: () => UpdateRender;
}>();

export type RenderPartProps = {
  everyFrame?: boolean;
  render: (encoder: GPUCommandEncoder) => void;
};

export function RenderPart(props: RenderPartProps) {
  const update = useContext(RenderContext)!.reserveSlot();

  // every time render function changes, it will call a re-render
  createRenderEffect(() => {
    update(props.render, props.everyFrame);
  });

  onCleanup(() => {
    update(null);
  });

  return null;
}

export function createRenderPart(code: () => RenderFunc) {
  const update = useContext(RenderContext)!.reserveSlot();

  createRenderEffect(() => {
    update(code(), false);
  });

  onCleanup(() => {
    update(null);
  });
}
