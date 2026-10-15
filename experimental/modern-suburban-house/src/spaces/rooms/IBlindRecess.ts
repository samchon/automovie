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

