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
 * Function to add two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns A new vector that is the result of adding the two input vectors
 */
export function addVec(a: Vec, b: Vec): Vec {
  return vec(a.x + b.x, a.y + b.y, a.z + b.z);
}

/**
 * Function to subtract one vector from another
 * @param a - First vector
 * @param b - Second vector to be subtracted from the first vector
 * @returns A new vector that is the result of subtracting the second vector from the first vector
 */
export function subtractVec(a: Vec, b: Vec): Vec {
  return vec(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * Function to scale a vector by a given factor
 * @param a - The vector to be scaled
 * @param scale - The factor by which to scale the vector
 * @returns A new vector that is the result of scaling the input vector by the given factor.
 *          If the scale factor is 1, the original vector is returned.
 *          If the scale factor is 0, {@link VEC_ZERO} is returned.
 */
export function scale(a: Vec, scale: number): Vec {
  return scale
    ? scale === 1
      ? a
      : vec(a.x * scale, a.y * scale, a.z * scale)
    : VEC_ZERO;
}

/**
 * Function to scale the coordinates of a vector by given factors for each axis
 * @param a - The vector to be scaled
 * @param scaleX - The factor by which to scale the x-coordinate of the vector
 * @param scaleY - The factor by which to scale the y-coordinate of the vector
 * @param scaleZ - The factor by which to scale the z-coordinate of the vector (default is 1)
 * @returns A new vector that is the result of scaling the input vector's coordinates by the given factors
 */
export function scaleCoords(
  a: Vec,
  scaleX: number,
  scaleY: number,
  scaleZ: number = 1
): Vec {
  return vec(a.x * scaleX, a.y * scaleY, a.z * scaleZ);
}

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

export function xyzArray(vec: Vec): [number, number, number] {
  return [vec.x, vec.y, vec.z];
}
