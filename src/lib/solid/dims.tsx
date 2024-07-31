import { batch, createSignal, onMount } from "solid-js";
import { vec2, Vec2, VEC2_ZERO, Vec3 } from "../basic/Vec3.ts";

export type Dimensions = {
  offset: Vec2;
  width: number;
  height: number;
  dims: Vec2;
};

export function createDimsTracker() {
  const observer = new ResizeObserver(readDims);

  let element: undefined | HTMLElement;
  let mounted = false;

  onMount(() => {
    mounted = true;
    readDims();
  });

  const [offset, setOffset] = createSignal(VEC2_ZERO, { equals: Vec3.equals });
  const [dims, setDims] = createSignal(VEC2_ZERO, { equals: Vec3.equals });
  const [width, setWidth] = createSignal(0);
  const [height, setHeight] = createSignal(0);

  const dimensions: Dimensions = {
    get offset() {
      return offset();
    },
    get width() {
      return width();
    },
    get height() {
      return height();
    },
    get dims() {
      return dims();
    },
  };

  return [dimensions, trackDims] as const;

  function trackDims(el: null | HTMLElement) {
    if (!el) {
      if (element) {
        element = undefined;
        observer.disconnect();
      }
      return;
    }

    if (element === el) return;

    if (element) observer.unobserve(element);

    element = el;
    observer.observe(el);

    if (mounted) readDims();
  }

  function readDims() {
    if (!element) return;

    const rect = element.getBoundingClientRect();

    batch(() => {
      const { width, height } = rect;

      setOffset(vec2(rect.x, rect.y));
      setDims(vec2(width, height));
      setWidth(width);
      setHeight(height);
    });
  }
}
