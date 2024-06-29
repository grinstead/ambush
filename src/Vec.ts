/** A constant representing the class name for vectors */
export const CLASS_VEC = "vec";

/**
 * Type definition for a Vec object
 * @property class - Class name for identification
 * @property x - x-coordinate
 * @property y - y-coordinate
 * @property z - z-coordinate (default is 0)
 */
export type Vec = {
  class: typeof CLASS_VEC;
  x: number;
  y: number;
  z: number;
};

/**
 * Function to create a new Vec object
 * @param x - x-coordinate
 * @param y - y-coordinate
 * @param z - z-coordinate (default is 0)
 * @returns New Vec object
 */
export function vec(x: number, y: number, z: number = 0): Vec {
  return { class: CLASS_VEC, x, y, z };
}

/** A constant representing a zero vector */
export const VEC_ZERO = vec(0, 0, 0);

/**
 * Function to compute the dot product of two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Dot product of the two vectors
 */
export function dot(a: Vec, b: Vec): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Function to compute the magnitude of a vector
 * @param param0 - Vector with x, y, and z coordinates
 * @returns Magnitude of the vector
 */
export function magnitude({ x, y, z }: Vec): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Function to normalize a vector (make it unit length)
 * @param v - Vector to be normalized
 * @returns Normalized vector, or undefined if the magnitude is zero
 */
export function normalize(v: Vec): undefined | Vec {
  const mag = magnitude(v);

  // If the magnitude is zero, return undefined. Otherwise, return the normalized vector.
  return mag ? vec(v.x / mag, v.y / mag, v.z / mag) : undefined;
}

/**
 * Function to check if two vectors are equal
 * @param a - First vector
 * @param b - Second vector
 * @returns True if the vectors are equal, false otherwise
 */
export function vecEqual(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

/**
 * Function to create a new Vec object if the given coordinates are different from the previous ones
 * @param prev - Previous vector
 * @param x - x-coordinate
 * @param y - y-coordinate
 * @param z - z-coordinate (default is 0)
 * @returns New Vec object or the previous one if coordinates are the same
 */
export function maybeNewVec(
  prev: Vec,
  x: number,
  y: number,
  z: number = 0
): Vec {
  return x === prev.x && y === prev.y && z === prev.z ? prev : vec(x, y, z);
}
