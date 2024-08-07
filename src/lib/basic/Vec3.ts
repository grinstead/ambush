/**
 * Class representing a 3-dimensional vector.
 *
 * It is intended to be used immutably, and all the built-in operations and
 * methods will create new vectors. If you wish (for memory reasons or
 * convenience) to mutate the x/y/z values, then call {@link mutable} which will
 * clone the vector, guaranteeing you don't try overriding the builtin vectors
 * like VEC_ZERO
 */
export class Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;

  /**
   * Creates an instance of Vec3.
   * @param x - The x coordinate.
   * @param y - The y coordinate.
   * @param z - The z coordinate.
   */
  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Calculates the dot product of this vector and another vector.
   * @param v - The other vector.
   * @returns The dot product.
   */
  dot(v: Vec3): number {
    const { x, y, z } = this;
    return x * v.x + y * v.y + z * v.z;
  }

  /**
   * Adds this vector to another vector.
   * @param v - The other vector.
   * @returns The resulting vector.
   */
  plus(v: Vec3): Vec3 {
    const { x, y, z } = this;
    return vec3(x + v.x, y + v.y, z + v.z);
  }

  /**
   * Subtracts another vector from this vector.
   * @param v - The other vector.
   * @returns The resulting vector.
   */
  minus(v: Vec3): Vec3 {
    const { x, y, z } = this;
    return vec3(x - v.x, y - v.y, z - v.z);
  }

  /**
   * Returns `v.minus(this)`. A convenience for when it is more intuitive to say
   * `a.to(b)` then it is to say `b.minus(a)`.
   * @param v - The other vector.
   * @returns The resulting vector.
   */
  to(v: Vec3): Vec3 {
    return v.minus(this);
  }

  /**
   * Calculates the cross product of this vector and another vector.
   * @param v - The other vector.
   * @returns The resulting vector.
   */
  cross(v: Vec3): Vec3 {
    const { x: ax, y: ay, z: az } = this;
    const { x: bx, y: by, z: bz } = v;

    return vec3(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }

  xy(): [number, number] {
    return [this.x, this.y];
  }

  xyz(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  /**
   * Checks if this vector has the same coordinates as another vector.
   * @param other - The other vector.
   * @returns True if the vectors are equal, otherwise false.
   */
  equals(other: Vec3): boolean {
    return (
      this === other ||
      (this.x === other.x && this.y === other.y && this.z === other.z)
    );
  }

  /**
   * Static method to check if two vectors have the same coordinates.
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns True if the vectors are equal, otherwise false.
   */
  static equals(a: Vec3, b: Vec3): boolean {
    return a.equals(b);
  }

  toString() {
    const { x, y, z } = this;
    // ⟨x,y,z⟩
    return `\u27E8${x},${y},${z}\u27E9`;
  }
}

/**
 * Calculates the magnitude (length) of a vector.
 * @param v - The vector.
 * @returns The magnitude of the vector.
 */
export function magnitude({ x, y, z }: Vec3): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Rescales a vector to a new magnitude. Equivalent to dividing by the old
 * magnitude and multiplying by the new one.
 * @param v - The vector.
 * @param newMag - The new magnitude.
 * @returns The rescaled vector or undefined if the original magnitude is zero.
 */
export function rescale(v: Vec3, newMag: number): Vec3 | undefined {
  if (!newMag) return VEC_ZERO;

  const { x, y, z } = v;
  const mag2 = x * x + y * y + z * z;
  if (!mag2) return;

  const ratio = newMag / Math.sqrt(mag2);
  return newVec3(v, ratio * x, ratio * y, ratio * z);
}

/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param scalar - The scalar to multiply by
 */
export function scale(v: Vec3, scalar: number): Vec3 {
  return newVec3(v, scalar * v.x, scalar * v.y, scalar * v.z);
}

/**
 * Normalizes a vector (scales it to a magnitude of 1).
 * @param v - The vector.
 * @returns The normalized vector or undefined if the original magnitude is zero.
 */
export function normalize(v: Vec3): Vec3 | undefined {
  return rescale(v, 1);
}

export type Vec3Mutable = Vec3 & {
  x: number;
  y: number;
  z: number;
};

/**
 * Clones a read-only vector into a new mutable vector.
 * @param v - The read-only vector.
 * @returns The mutable vector.
 */
export function mutable(v: Vec3): Vec3Mutable {
  return new Vec3(v.x, v.y, v.z) as Vec3Mutable;
}

export type Vec2 = Vec3 & { z: 0 };

/**
 * Creates a new 3-dimensional vector.
 * @param x - The x coordinate.
 * @param y - The y coordinate.
 * @param z - The z coordinate.
 * @returns The new vector.
 */
export function vec3(x: number, y: number, z: number): Vec3 {
  return new Vec3(x, y, z);
}

/**
 * Creates a new Vec3 if any of the coordinates are different, otherwise returns
 * the current vec3. Used for potential memory savings.
 */
export function newVec3(old: Vec3, x: number, y: number, z: number): Vec3 {
  return (old.x === x && old.y === y && old.z === z && old) || vec3(x, y, z);
}

/**
 * Creates a new Vec2 if any of the coordinates are different, otherwise returns
 * the current Vec2. Used for potential memory savings.
 */
export function newVec2(old: Vec3, x: number, y: number): Vec2 {
  return newVec3(old, x, y, 0) as Vec2;
}

/**
 * Creates a new 2-dimensional vector.
 * @param x - The x coordinate.
 * @param y - The y coordinate.
 * @returns The new vector with z coordinate set to 0.
 */
export function vec2(x: number, y: number): Vec2 {
  return new Vec3(x, y, 0) as Vec2;
}

export const VEC_ZERO = Object.freeze(vec3(0, 0, 0));
export const VEC_X = Object.freeze(vec3(1, 0, 0));
export const VEC_Y = Object.freeze(vec3(0, 1, 0));
export const VEC_Z = Object.freeze(vec3(0, 0, 1));

export const VEC2_ZERO = VEC_ZERO as Vec2;
export const VEC2_X = VEC_X as Vec2;
export const VEC2_Y = VEC_Y as Vec2;
