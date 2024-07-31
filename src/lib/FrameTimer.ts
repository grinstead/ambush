import {
  SimpleEventListener,
  SingleEventTarget,
} from "./other/SimpleEventTarget.ts";
import { lerp } from "./utils.ts";

const DEFAULT_FPS_SMOOTHING = 0.8;
const DEFAULT_MAX_FRAME_MS = 500;

export type FrameTimerConfig = {
  /**
   * A number between 0 and 1, the closer to 1 the less a bad frame impacts the
   * fps. Defaults to 0.8
   */
  fpsSmoothing?: number;
  /**
   * The maximum amount of milliseconds a single frame will take. If a frame
   * takes longer than this time, it is assumed that the frame skipped (for
   * instance, the browser was tabbed away from and came back), and the game
   * tracking time will skip whatever was lost.
   *
   * Defaults to 500
   */
  maxFrameMs?: number;
};

export class BaseFrameTimer implements FrameTimer {
  readonly parent: BaseFrameTimer = this;
  readonly timeOffset: number = 0;
  readonly frameOffset: number = 0;

  time: number = 0;
  deltaTime: number = 0;

  frame: number = 0;
  /** Whether the timer is paused */
  paused: boolean = true;
  private lastTs: number = 0;
  avgMs: number;

  constructor(readonly config: FrameTimerConfig = {}) {
    this.avgMs = Math.min(15, config.maxFrameMs ?? DEFAULT_MAX_FRAME_MS);
  }

  pause() {
    if (this.paused) return;

    this.paused = true;
    this.pauseSubs?.dispatch(undefined);
  }

  unpause() {
    if (!this.paused) return;

    this.paused = false;
    this.pauseSubs?.dispatch(undefined);
  }

  /**
   * Call to start a frame, if the timer is paused it will automatically unpause.
   * @returns The time since the last frame
   */
  markFrame(): number {
    const { avgMs, config } = this;
    const now = Date.now();

    let ms;
    if (!this.frame++) {
      ms = 0;
    } else if (this.paused) {
      this.paused = false;
      ms = avgMs;
    } else {
      ms = now - this.lastTs;

      // check to see if we had a skip
      if (ms > (config.maxFrameMs ?? DEFAULT_MAX_FRAME_MS)) {
        ms = avgMs;
      } else {
        this.avgMs = lerp(
          ms,
          avgMs,
          config.fpsSmoothing ?? DEFAULT_FPS_SMOOTHING
        );
      }
    }

    const deltaTime = ms / 1000;

    this.time += deltaTime;
    this.deltaTime = deltaTime;
    this.lastTs = now;

    this.subs?.dispatch(undefined);

    return deltaTime;
  }

  get fps() {
    return Math.round(1000 / this.avgMs);
  }

  subtimer(): FrameTimer {
    return new FrameTimer(this);
  }

  // event listening

  private subs?: SingleEventTarget;
  private pauseSubs?: SingleEventTarget;

  subscribeFrameTime(listener: SimpleEventListener) {
    return (this.subs ??= new SingleEventTarget("frametime")).subscribe(
      listener
    );
  }

  subscribePauseChange(listener: SimpleEventListener) {
    return (this.pauseSubs ??= new SingleEventTarget("pausechange")).subscribe(
      listener
    );
  }
}

export class FrameTimer {
  readonly timeOffset: number;
  readonly frameOffset: number;

  constructor(readonly parent: BaseFrameTimer) {
    this.timeOffset = parent.time;
    this.frameOffset = parent.frame;
  }

  subscribeFrameTime(listener: SimpleEventListener) {
    return this.parent.subscribeFrameTime(listener);
  }

  subtimer(): FrameTimer {
    return new FrameTimer(this.parent);
  }

  /**
   * The tracked time in milliseconds, starting from 0 for when the game began
   */
  get time(): number {
    return this.parent.time - this.timeOffset;
  }

  /**
   * The time between the current frame and the previous frame
   */
  get deltaTime(): number {
    const { parent } = this;
    return parent.frame === parent.frameOffset ? 0 : parent.deltaTime;
  }

  /** The most recent frame */
  get frame(): number {
    return this.parent.frame - this.frameOffset;
  }

  get fps() {
    return this.parent.fps;
  }
}
