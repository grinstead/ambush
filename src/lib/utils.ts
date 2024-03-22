/**
 * In theory, undefined, 0, or false could all be errors (they would be bad
 * error values, but who are we to judge), and so we wrap the error in an object
 * so it is always truthy.
 */
export type WrappedError<Error> = { error: Error };

export type SuccessResult<T> = { done: true; value: T; failure?: undefined };
export type FailureResult<Error = unknown> = {
  done: true;
  value?: undefined;
  failure: { error: Error };
};

export type Result<T, Error = unknown> =
  | SuccessResult<T>
  | FailureResult<Error>;

export function wrapError<Error>(error: Error): WrappedError<Error> {
  return { error };
}

export function success<T>(value: T): SuccessResult<T> {
  return { done: true, value, failure: undefined };
}

export function failure<Error>(error: Error): FailureResult<Error> {
  return { done: true, value: undefined, failure: wrapError(error) };
}

export function nonnullish<T>(given: Array<T | null | undefined>): Array<T> {
  return given.filter((x) => x != null) as Array<T>;
}

export function roundUpToMultiple(value: number, base: number) {
  return base * Math.ceil(value / base);
}

export function lerp(
  a: number,
  b: number,
  percent: number,
  clamp: boolean = true
) {
  const clamped = clamp ? Math.max(0, Math.min(percent, 1)) : percent;
  return a * (1 - clamped) + b * clamped;
}

export function randRange(min: number, max: number) {
  return lerp(min, max, Math.random(), false);
}
