/**
 * A point of a surface network by patch and patch coordinates, the same on
 * every tier.
 *
 * `s` and `t` are the patch's own coordinates, so they name the same place on
 * the surface whatever the tier's row and column counts; this is the chart a
 * texture, a decal or a garment is bound to.
 */
export interface IAutoMovieSurfaceCoordinate {
  /** Index of the patch in the network's patch list. */
  patch: number;

  /** Patch coordinate across, 0 to 1. */
  s: number;

  /** Patch coordinate up, 0 to 1. */
  t: number;
}
