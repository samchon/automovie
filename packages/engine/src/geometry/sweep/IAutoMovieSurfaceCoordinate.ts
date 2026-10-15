/**
 * A point of a surface network by patch and patch coordinates, the same on
 * every tier.
 *
 * `s` and `t` are the patch's own coordinates, so they name the same place on
 * the surface whatever the tier's row and column counts; this is the chart a
 * texture, a decal or a garment is bound to.
 *
 * @evidence contracts/common.md#principled-implementation Patch index plus local coordinates is the multi-block chart that every sampling of the same patch layout shares.
 * @evidence contracts/common.md#clear-and-simple-design Three numbers, the least that address a point of a patch layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates are never rounded to a tier's grid.
 * @evidence contracts/common.md#meaningful-documentation States what the coordinates address and why they are tier-independent.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record.
 * @author Samchon
 */
export interface IAutoMovieSurfaceCoordinate {
  /** Index of the patch in the network's patch list. */
  patch: number;

  /** Patch coordinate across, 0 to 1. */
  s: number;

  /** Patch coordinate up, 0 to 1. */
  t: number;
}
