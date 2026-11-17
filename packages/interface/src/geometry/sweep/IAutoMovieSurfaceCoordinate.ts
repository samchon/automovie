/**
 * A point of a surface network by patch and patch coordinates, the same on
 * every tier.
 *
 * `s` and `t` are the patch's own coordinates, so they name the same place on
 * the surface whatever the tier's row and column counts; this is the chart a
 * texture, a decal or a garment is bound to.
 *
 * @evidence contracts/development/design.md#principled-representation Patch index plus local coordinates is the multi-block chart that every sampling of the same patch layout shares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three numbers, the least that address a point of a patch layout.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Coordinates are never rounded to a tier's grid.
 * @evidence contracts/development/common.md#meaningful-documentation States what the coordinates address and why they are tier-independent.
 */
export interface IAutoMovieSurfaceCoordinate {
  /** Index of the patch in the network's patch list. */
  patch: number;

  /** Patch coordinate across, 0 to 1. */
  s: number;

  /** Patch coordinate up, 0 to 1. */
  t: number;
}
