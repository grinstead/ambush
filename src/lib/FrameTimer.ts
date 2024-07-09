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

export class FrameTimer {
  /**
   * The tracked time in milliseconds, starting from 0 for when the game began
   */
  time: number = 0;
  /** The most recent frame */
  frame: number = 0;
  /** Whether the timer is paused */
  paused: boolean = true;
  private lastTs: number = 0;
  avgMs: number;

  constructor(readonly config: FrameTimerConfig = {}) {
    this.avgMs = Math.min(15, config.maxFrameMs ?? DEFAULT_MAX_FRAME_MS);
  }

  pause() {
    this.paused = true;
  }

  /**
   * Call to start a frame, if the timer is paused it will automatically unpause.
   */
  markFrame() {
    this.frame++;

    const { avgMs, config } = this;
    const now = Date.now();

    let ms;
    if (this.paused) {
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

    this.time += ms;
    this.lastTs = now;
  }

  get fps() {
    return Math.round(1000 / this.avgMs);
  }
}
