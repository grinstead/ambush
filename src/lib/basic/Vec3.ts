export class Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  dot(v: Vec3) {
    const { x, y, z } = this;
    return x * v.x + y * v.y + z * v.z;
  }

  plus(v: Vec3) {
    const { x, y, z } = this;
    return vec3(x + v.x, y + v.y, z + v.z);
  }

  sub(v: Vec3) {
    const { x, y, z } = this;
    return vec3(x - v.x, y - v.y, z - v.z);
  }

  cross(v: Vec3) {
    const { x: ax, y: ay, z: az } = this;
    const { x: bx, y: by, z: bz } = v;

    return vec3(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }

  equals(other: Vec3) {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  static equals(a: Vec3, b: Vec3) {
    return a.equals(b);
  }
}

export function magnitude({ x, y, z }: Vec3) {
  return Math.sqrt(x * x + y * y + z * z);
}

export function rescale(v: Vec3, newMag: number) {
  if (!newMag) return VEC_ZERO;

  const { x, y, z } = v;
  const mag2 = x * x + y * y + z * z;

  if (!mag2) return;

  const ratio = newMag / Math.sqrt(mag2);

  return vec3(ratio * x, ratio * y, ratio * z);
}

export function normalize(v: Vec3) {
  return rescale(v, 1);
}

export type Vec3Mutable = Vec3 & {
  x: number;
  y: number;
  z: number;
};

export function mutable(v: Vec3): Vec3Mutable {
  return new Vec3(v.x, v.y, v.z);
}

export type Vec2 = Vec3 & { z: 0 };

export function vec3(x: number, y: number, z: number) {
  return new Vec3(x, y, z);
}

export function vec2(x: number, y: number): Vec2 {
  return new Vec3(x, y, 0) as Vec2;
}

export const VEC_ZERO = vec2(0, 0);
export const VEC_X = vec2(1, 0);
export const VEC_Y = vec2(0, 1);
export const VEC_Z = vec3(0, 0, 1);

Object.freeze(VEC_ZERO);
Object.freeze(VEC_X);
Object.freeze(VEC_Y);
Object.freeze(VEC_Z);
