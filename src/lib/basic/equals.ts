export type EqualityCheck<T> = (a: T, b: T) => boolean;

/**
 * Returns `a === b`.
 */
export function exactEquals(a: unknown, b: unknown) {
  return a === b;
}

/**
 * Wrap an equality check to allow `undefined`. If both parameters are
 * `undefined`, the new equality check returns `true`, if only one is
 * `undefined`, it returns `false`, and if neither are `undefined` then it calls
 * into the given equality check.
 * @param equals The underlying equality
 */
export function maybe<T>(
  equals: EqualityCheck<T>
): EqualityCheck<T | undefined> {
  return maybeEquals;

  function maybeEquals(a?: T, b?: T) {
    return a !== undefined ? b !== undefined && equals(a, b) : a === b;
  }
}
