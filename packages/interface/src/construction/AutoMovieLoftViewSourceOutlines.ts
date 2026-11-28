import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";

/**
 * Four prepared scalar outlines in cyclic +u, +v, −u, −v order. The containing
 * field assigns units, such as chart millimetres for extents and touch
 * coordinates or dimensionless shares for shoulders. Keep the outlines
 * unchanged while station readers reuse them.
 */
export type AutoMovieLoftViewSourceOutlines = readonly [
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
];
