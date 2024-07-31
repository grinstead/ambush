export type EqualityCheck<T> = (a: T, b: T) => boolean;

/**
 * Returns `a === b`.
 */
export function exactEquals(a: unknown, b: unknown) {
  return a === b;
}

export function arrayExactEquals<T>(a: Array<T>, b: Array<T>) {
  if (a === b) return true;

  let len = a.length;
  if (len !== b.length) return false;

  // Test every element in the array. this is a weird loop-construction that
  // avoids using a return/continue within it, which supposedly can cause a
  // de-optimization within vm's. However, I have never actually verified this
  // and it is quite possible this is technically slower or completely the same.
  let i: number;
  for (i = 0; i < len && a[i] === b[i]; i++);

  return i === len;
}

/**
 * Wrap an equality check to allow `undefined`. If both parameters are
 * `undefined`, the new equality check returns `true`, if only one is
 * `undefined`, it returns `false`, and if neither are `undefined` then it calls
 * into the given equality check.
 * @param equals The underlying equality
 */
export function undefinedOr<T>(
  equals: EqualityCheck<T>
): EqualityCheck<T | undefined> {
  return maybeEquals;

  function maybeEquals(a?: T, b?: T) {
    return a !== undefined ? b !== undefined && equals(a, b) : a === b;
  }
}
