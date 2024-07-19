import { batch, createSignal, onMount } from "solid-js";

import { VEC_ZERO, Vec, vec, vecEqual } from "../basic/Vec.ts";

export type Dimensions = {
  offset: Vec;
  width: number;
  height: number;
  dims: Vec;
};

export function createDimsTracker() {
  const observer = new ResizeObserver(readDims);

  let element: undefined | HTMLElement;
  let mounted = false;

  onMount(() => {
    mounted = true;
    readDims();
  });

  const [offset, setOffset] = createSignal(VEC_ZERO, { equals: vecEqual });
  const [dims, setDims] = createSignal(VEC_ZERO, { equals: vecEqual });
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

      setOffset(vec(rect.x, rect.y));
      setDims(vec(width, height));
      setWidth(width);
      setHeight(height);
    });
  }
}
