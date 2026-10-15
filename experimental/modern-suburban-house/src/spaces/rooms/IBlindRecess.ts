/**
 * One watertight partition with a blind, rectangular wall recess. The solid
 * remains connected behind the recess; its near face opens toward +X and the
 * back closes before the opposite room's wall face. Grid cells are emitted
 * only on occupied/empty boundaries, so no internal mating faces survive.
 *
 * Geometry is determined from the wall and recess intervals. The part keeps
 * the full wall's boundary record with no through-hole, since a niche is not
 * a door, route, or opening between spaces.
 */


/**
 * Metric envelope and cavity intervals for the shower's blind wall niche.
 */
export interface IBlindRecess {
  /** World x range of the partition. */
  wallX: readonly [number, number];
  /** Height range of the partition. */
  wallY: readonly [number, number];
  /** World z range of the partition. */
  wallZ: readonly [number, number];
  /** Height range of the recess opening. */
  openingY: readonly [number, number];
  /** World z range of the recess opening. */
  openingZ: readonly [number, number];
  /** Depth of the recess into the partition. */
  depth: number;
}

