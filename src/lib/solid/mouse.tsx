import { Accessor, batch, createSignal } from "solid-js";
import { VEC_ZERO, Vec, maybeNewVec } from "../../Vec.ts";

/**
 * Type representing the accessors for mouse tracking state.
 * Includes accessors for mouse position, button states, and tracking status.
 *
 * @property pos - Accessor for the mouse position, which is a vector.
 * @property buttons - Accessor for the mouse button states, represented as a bitmask, see [MouseEvent.buttons](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons) for more details.
 * @property tracked - Accessor for the tracking status, indicating whether the mouse is being tracked.
 */
export type MouseAccessors = {
  pos: Accessor<Vec>;
  buttons: Accessor<number>;
  tracked: Accessor<boolean>;
};

/**
 * Function to keep track of the mouse within a specified element.
 *
 * @returns An object with signals for mouse position, button states, and tracking status,
 *          and a function to start tracking the mouse in a specified DOM element.
 *
 * @example
 * // Import the createMouseTracker function
 * import { createMouseTracker } from './path/to/module';
 * import { createMemo } from 'solid-js';
 *
 * // Initialize the mouse tracker
 * const [mouse, trackMouseInElement] = createMouseTracker();
 *
 * // Start tracking the mouse in a specified DOM element, e.g., a canvas
 * const canvas = document.getElementById('myCanvas');
 * if (canvas) {
 *   trackMouseInElement(canvas);
 * }
 *
 * // Use a SolidJS createMemo to reactively log the mouse position, button states, and tracking status
 * createMemo(() => {
 *   console.log("Mouse Position:", mouse.pos());
 *   console.log("Mouse Buttons:", mouse.buttons());
 *   console.log("Tracking Active:", mouse.tracked());
 * });
 *
 * // Example usage in an actual SolidJS component
 * function App() {
 *   const [mouse, trackMouseInElement] = createMouseTracker();
 *   let canvasRef;
 *
 *   onMount(() => {
 *     if (canvasRef) {
 *       trackMouseInElement(canvasRef);
 *     }
 *   });
 *
 *   return (
 *     <div>
 *       <canvas ref={canvasRef} id="myCanvas" width={500} height={500}></canvas>
 *       <div>
 *         <p>Mouse Position: {mouse.pos().x}, {mouse.pos().y}</p>
 *         <p>Mouse Buttons: {mouse.buttons()}</p>
 *         <p>Tracking Active: {mouse.tracked().toString()}</p>
 *       </div>
 *     </div>
 *   );
 * }
 */
export function createMouseTracker() {
  const [pos, setPos] = createSignal(VEC_ZERO);
  const [buttons, setButtons] = createSignal(0);
  const [tracked, setTracked] = createSignal(false);

  let activeDom: undefined | HTMLElement;

  return [
    { pos, buttons, tracked } as MouseAccessors,
    trackMouseInElement,
  ] as const;

  function trackMouseInElement(dom: HTMLElement) {
    if (activeDom === dom) return;

    activeDom?.removeEventListener("mousemove", handleMouseEvent);
    activeDom?.removeEventListener("mouseup", handleMouseEvent);
    activeDom?.removeEventListener("mousedown", handleMouseEvent);
    activeDom?.removeEventListener("mouseleave", handleMouseLeave);

    activeDom = dom;
    dom.addEventListener("mousemove", handleMouseEvent);
    dom.addEventListener("mouseup", handleMouseEvent);
    dom.addEventListener("mousedown", handleMouseEvent);
    dom.addEventListener("mouseleave", handleMouseLeave);
  }

  function handleMouseEvent(e: MouseEvent) {
    batch(() => {
      setTracked(true);
      setPos((prev) => maybeNewVec(prev, e.offsetX, e.offsetY));
      setButtons(e.buttons);
    });
  }

  function handleMouseLeave(e: MouseEvent) {
    batch(() => {
      setTracked(false);
      setPos((prev) => maybeNewVec(prev, e.offsetX, e.offsetY));
      setButtons(0);
    });
  }
}
