/**
 * Constant used to help distinguish rgb data
 */
export const CLASS_RBG = "rgb-decimal";

/**
 * Type representing an RGB color with red, green, blue, and alpha components.
 */
export type RGB = {
  /** Class name for the RGB color */
  class: typeof CLASS_RBG;
  /** Red component (0-255) */
  r: number;
  /** Green component (0-255) */
  g: number;
  /** Blue component (0-255) */
  b: number;
  /** Alpha component (0-1) */
  a: number;
};

/**
 * Function to create an RGB color object.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @param a - Alpha component (0-1), default is 1
 * @returns An object representing the RGB color
 */
export function rgb(r: number, g: number, b: number, a: number = 1): RGB {
  return { class: CLASS_RBG, r, g, b, a };
}

export function rgbArray(rgb: RGB): [number, number, number] {
  return [rgb.r, rgb.g, rgb.b];
}

export function bgrArray(rgb: RGB): [number, number, number] {
  return [rgb.b, rgb.g, rgb.r];
}
export function rgbaArray(rgb: RGB): [number, number, number, number] {
  return [rgb.r, rgb.g, rgb.b, rgb.a];
}
