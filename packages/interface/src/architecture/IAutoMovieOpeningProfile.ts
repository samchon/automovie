import { IAutoMoviePlanarPoint } from "./IAutoMoviePlanarPoint";

/**
 * A closed outline in the host boundary's own frame, straight edges or arcs.
 *
 * Edge `i` runs from `outline[i]` to `outline[(i + 1) % outline.length]`. A
 * rectangular door is four points and no bulge at all; a semicircular oculus is
 * two points and two half-turn bulges; a round-headed arch is the jambs and the
 * head as one bulged edge. Nothing here names a door type: the outline is the
 * general shape and the rectangle is one of its cases.
 *
 * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-two-sided-ownership Exposes `IAutoMovieOpeningProfile` as the portable data boundary for the interior wall two sided ownership requirement.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-wall-partition-boundary Types `IAutoMovieOpeningProfile` for the interior space wall partition boundary system contract.
 */
export interface IAutoMovieOpeningProfile {
  /**
   * Closed outline in host-boundary-local XY metres, at least two points.
   *
   * Two is the floor rather than three because a circle is two arcs, and
   * demanding a third corner would outlaw a round oculus for no geometric
   * reason. What must hold is that the outline encloses area once its arcs are
   * taken into account, so two points with no bulge between them are still
   * refused.
   *
   * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-two-sided-ownership Exposes `outline` as the portable data boundary for the interior wall two sided ownership requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-wall-partition-boundary Types `outline` for the interior space wall partition boundary system contract.
   */
  outline: IAutoMoviePlanarPoint[];
  /**
   * Per-edge circular bulge, one entry per edge when stated at all.
   *
   * The value is AutoCAD's polyline convention `tan(theta / 4)` for the arc's
   * included angle `theta`, so `0` is a straight edge and `1` is a half turn
   * bulging to the left of the edge's own direction. The magnitude may not
   * exceed `1`: an arc longer than a half turn is authored as two edges, which
   * is what keeps each arc's extent exactly boundable rather than sampled.
   *
   * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-two-sided-ownership Exposes `bulges` as the portable data boundary for the interior wall two sided ownership requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-wall-partition-boundary Types `bulges` for the interior space wall partition boundary system contract.
   */
  bulges?: number[];
}
