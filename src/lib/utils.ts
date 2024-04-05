import { JSXElement } from "solid-js";

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

export function throwError(message: string): any {
  throw new Error(message);
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

/**
 * Within this library, we often pretend like we are making JSX, but the reality
 * is that it is an element that uses side-effects to affect the canvas's rendering.
 * @param x the value to re-type as a JSXElement
 * @returns the given value, but now retyped to pretend to be a JSXElement
 */
export function pretendJSX<T>(x: () => T): JSXElement {
  return x as any as JSXElement;
}
