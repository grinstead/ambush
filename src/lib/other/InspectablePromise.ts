const PENDING = 0;
const FULFILLED = 1;
const ERROR = 2;

export class InspectablePromise<T> {
  private _v: any;
  private _s = PENDING;

  constructor(readonly promise: Promise<T>) {
    promise.then(
      (value) => {
        this._s = FULFILLED;
        this._v = value;
      },
      (error) => {
        this._s = ERROR;
        this._v = error;
      }
    );
  }

  isPending() {
    return this._s === PENDING;
  }

  isFulfilled() {
    return this._s === FULFILLED;
  }

  isError() {
    return this._s === ERROR;
  }

  get(): T {
    const { _s: status, _v: value } = this;
    if (status === FULFILLED) return value;

    throw status === PENDING
      ? new Error("Called get() on unresolved promise")
      : value;
  }
}

export function createPromise<T>(): [
  Promise<T>,
  (value: T | PromiseLike<T>) => void
] {
  let resolve: any;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });

  return [promise, resolve];
}
