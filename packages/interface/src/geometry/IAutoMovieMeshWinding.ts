/**
 * Signed winding, surface contact and solidity for one query point in the
 * triangle mesh's own metre frame.
 *
 * The generalized winding number describes open and overlapping surfaces
 * through their signed solid-angle contributions. Overlapping outward shells
 * add, inward shells subtract and a hole can leave a fractional winding. The
 * query snapshots finite mesh positions, requires three finite query
 * coordinates and returns a finite winding value for an admitted result.
 */
export interface IAutoMovieMeshWinding {
  /**
   * Signed sum of solid angles divided by four pi. Use the surface field to
   * identify positions where solid-angle winding is discontinuous.
   */
  winding: number;

  /**
   * True when a kept triangle's plane and edge tests accept the point,
   * including its edges and corners. The plane slack uses 1e-9 of its doubled
   * area.
   *
   * The operation skips triangles with doubled area of at most 1e-12 square
   * metres.
   */
  surface: boolean;

  /**
   * True when surface is false and the absolute winding number reaches 0.5.
   * Inward and outward orientations both count toward solidity.
   */
  inside: boolean;
}
