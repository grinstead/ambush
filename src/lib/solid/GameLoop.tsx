import {
  JSXElement,
  createContext,
  createMemo,
  createRenderEffect,
  onCleanup,
  useContext,
} from "solid-js";
import { BaseFrameTimer } from "../FrameTimer.ts";

export type GameLoopProps = {
  steps: Array<string>;
  timer?: BaseFrameTimer;
  children: JSXElement;
};

export const GameLoopContext = createContext<GameLoop>();

export type GameLoopStepInfo = {
  /** Time in seconds since the last run of the game loop */
  deltaTime: number;
};

export type GameLoopScheduleStrategy = "once" | "passive" | "active";

export type GameLoopWork = (step: GameLoopStepInfo) => void;

export type UpdateGameLoopWork = (
  update: null | GameLoopWork,
  schedule?: GameLoopScheduleStrategy
) => void;

type GameLoopNode = {
  active: boolean;
  schedule: GameLoopScheduleStrategy;
  work: GameLoopWork | null;
};

export class GameLoop {
  private stepQueues: Map<string, Set<GameLoopNode>> = new Map();
  private activePending = 0;
  private nextAnimFrame: undefined | ReturnType<typeof requestAnimationFrame>;

  constructor(public steps: Array<string>, public timer: BaseFrameTimer) {}

  /**
   * Registers a step in the game loop.
   * @param name
   */
  join(name: string): UpdateGameLoopWork {
    let queue = this.stepQueues.get(name);

    if (!queue) {
      queue = new Set();
      this.stepQueues.set(name, queue);
    }

    const node: GameLoopNode = {
      active: false,
      schedule: "active",
      work: null,
    };

    return (work, schedule = node.schedule) => {
      node.schedule = schedule;
      node.work = work;

      if (!work) {
        queue.delete(node);

        if (node.active) {
          node.active = false;
          this.activePending--;
        }
      } else if (!node.active) {
        queue.add(node);

        // we mark the node as active and increment pending even if schedule is
        // "passive" because we figure the first time something is added, it
        // should be run. "passive" will only not pro-actively cause future
        // renders after the first one.
        this.activePending++;
        node.active = true;
        this.schedule();
      }
    };
  }

  private schedule() {
    this.nextAnimFrame ??= requestAnimationFrame(this.runLoop);
  }

  private runLoop = () => {
    const { timer, steps, stepQueues } = this;

    const stepInfo: GameLoopStepInfo = {
      deltaTime: timer.markFrame(),
    };

    this.nextAnimFrame = undefined;

    // check if we have a reason to run the loop, something may have been added,
    // scheduled, then removed before we acted on it
    if (!this.activePending) return;

    for (const step of steps) {
      const queue = stepQueues.get(step);

      if (queue?.size) {
        for (const node of Array.from(queue)) {
          const { active, schedule, work } = node;

          if (work) {
            if (active && schedule !== "active") {
              node.active = false;
              this.activePending--;

              if (schedule === "once") {
                node.work = null;
                queue.delete(node);
              }
            }

            work(stepInfo);
          }
        }
      }
    }

    if (this.activePending) {
      // if we have more work to do, schedule it
      this.schedule();
    }
  };

  static Part(props: {
    step: string;
    passive?: boolean;
    work: null | GameLoopWork;
  }): undefined {
    const gameloop = useContext(GameLoopContext)!;

    const update = createMemo<UpdateGameLoopWork>((prev) => {
      prev?.(null);
      return gameloop.join(props.step);
    });

    createRenderEffect(() => {
      update()(props.work, props.passive ? "passive" : "active");
    });

    onCleanup(() => {
      update()(null);
    });
  }
}
