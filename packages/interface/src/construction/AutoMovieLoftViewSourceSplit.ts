import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";

/**
 * Prepared scalar outlines for one split's [u, v, tangent angle, following
 * shoulder].
 *
 * The first two values are chart millimetres and use the section's
 * pole-coordinate closure. Angle is radians from +u toward +v in increasing
 * phase. Shoulder is the dimensionless share for the piece starting at this
 * split, admitted by the downstream conic reader. This order is heterogeneous
 * in meaning even though all four slots are scalar outline preparations.
 */
export type AutoMovieLoftViewSourceSplit = readonly [
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
];
