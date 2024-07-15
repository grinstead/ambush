export type TaskCategoryConfig<E extends string> = {
  events?: Array<E>;
  /**
   * The order at which this category should be run, the lower the better.
   * Technically, negative numbers are allowed, but in general it is expected
   * that the highest category is given order 0 or 1.
   *
   * If no order is supplied, than it will be automatically assigned the value
   * of its index in the keys of the categories of the {@link Docket}
   * constructor.
   */
  order?: number;
};

export class Docket<Tasks extends {}, E extends string> extends EventTarget {
  readonly categories: Array<keyof Tasks>;
  private readonly scheduled: Array<number>;
  private readonly events: Map<E, number> = new Map();
  readonly queues: { [T in keyof Tasks]: Array<unknown> };

  readonly add: { [T in keyof Tasks]: (task: Tasks[T]) => void };

  flags: number = 0;

  constructor(
    readonly categoryOptions: Readonly<{
      [K in keyof Tasks]: TaskCategoryConfig<E>;
    }>
  ) {
    super();

    // categories: Array<[name, options, order]>
    const categories = (
      Object.entries(categoryOptions) as Array<
        [keyof Tasks, TaskCategoryConfig<E>]
      >
    ).map(([c, o], i) => [c, o, o.order ?? i] as const);

    categories.sort(([, , a], [, , b]) => a - b);

    this.categories = categories.map(([name]) => name);
    this.scheduled = categories.map(() => 0);

    // @ts-expect-error
    this.queues = Object.fromEntries(categories.map(([name]) => [name, []]));

    // @ts-expect-error
    this.add = Object.fromEntries(
      categories.map(([name, options], i) => {
        const addTask = (task: any) => {
          const numScheduled = this.queues[name].push(task);
          this.scheduled[i] = numScheduled;

          // if this is the first of a category, then we should trigger events
          if (numScheduled === 1 && options.events?.length) {
            const { events } = this;

            const toCall = options.events.filter((e) => {
              const current = events.get(e) ?? 0;
              events.set(e, current + 1);
              return !current;
            });

            for (const e of toCall) {
              this.dispatchEvent(new Event(e));
            }
          }
        };

        return [name, addTask];
      })
    );
  }

  next():
    | { done: true }
    | {
        [T in keyof Tasks]: { done: false; category: T; value: Tasks[T] };
      }[keyof Tasks] {
    const index = this.scheduled.findIndex(Boolean);
    if (index < 0) return { done: true };

    const category = this.categories[index];
    const queue = this.queues[category];

    const task = queue.shift()!;

    // if this is the last of the tasks, then remove it from the events
    if (!--this.scheduled[index]) {
      const { events } = this;
      this.categoryOptions[category].events?.forEach((e) => {
        events.set(e, events.get(e)! - 1);
      });
    }

    // @ts-expect-error
    return { done: false, category, value: task };
  }
}
