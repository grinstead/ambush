import { Accessor, createComputed, createSignal } from "solid-js";
import { FrameTimer } from "../FrameTimer.ts";
import { Subscription } from "../other/SimpleEventTarget.ts";

export function useTime(timer: Accessor<FrameTimer>): Accessor<number> {
  const [time, setTime] = createSignal<number>(0);

  createComputed<Subscription>((sub) => {
    sub?.unsubscribe();

    const t = timer();
    setTime(t.time);

    return t.subscribeFrameTime(() => {
      setTime(t.time);
    });
  });

  return time;
}

export function useFrame(timer: Accessor<FrameTimer>): Accessor<number> {
  const [frame, setFrame] = createSignal<number>(0);

  createComputed<Subscription>((sub) => {
    sub?.unsubscribe();

    const t = timer();
    setFrame(t.time);

    return t.subscribeFrameTime(() => {
      setFrame(t.frame);
    });
  });

  return frame;
}
