import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";

/**
 * Four scalar outlines of one interior conic split in [u, v, tangent angle,
 * following shoulder] order. The point is in chart millimetres and shares the
 * extent closure parameter. The tangent angle is in radians from +u toward +v.
 * The last outline gives the dimensionless shoulder share of the piece that
 * starts at the split.
 */
export type AutoMovieLoftViewSourceSplit = readonly [
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
];
