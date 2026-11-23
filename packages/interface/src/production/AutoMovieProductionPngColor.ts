/**
 * Colour model observed from the decoded PNG's IHDR colour type. This describes
 * stored channels, independently of colour space and bit depth.
 */
export type AutoMovieProductionPngColor =
  | "gray"
  | "gray-alpha"
  | "rgb"
  | "rgba"
  | "palette";
