export class Subscription {
  unsubscribed: boolean = false;

  constructor(private _u: () => void) {}

  static set(sub: Subscription, unsub: () => void) {
    sub.unsubscribed || (sub._u = unsub);
  }

  unsubscribe = () => {
    this.unsubscribed = true;

    const unsubscribe = this._u;
    this._u = noop;
    unsubscribe();
  };
}

export type SimpleEventListener<E = unknown> = (e: E, type: string) => void;

export class SingleEventTarget<E = unknown> {
  private readonly _l: Set<SimpleEventListener<E>> = new Set();

  constructor(readonly type: string) {}

  subscribe(callback: SimpleEventListener<E>): Subscription {
    this._l.add(callback);
    this.maybeDispatch ??= this.dispatch;

    return new Subscription(() => {
      const listeners = this._l;
      listeners.delete(callback);

      if (listeners.size == 0) {
        this.maybeDispatch = null;
      }
    });
  }

  dispatch = (e: E) => {
    const eventType = this.type;

    for (const listener of this._l) {
      listener(e, eventType);
    }
  };

  maybeDispatch: null | (typeof this)["dispatch"] = null;
}

function noop() {}
