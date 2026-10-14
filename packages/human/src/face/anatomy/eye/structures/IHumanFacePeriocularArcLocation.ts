import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/** One located plate border, retaining its actual material attachment and chart coordinate.
 *
 *
 * @evidence contracts/common.md#principled-implementation Dimensionless material coordinate retains its original actual-host barycentric attachment.
 * @evidence contracts/common.md#clear-and-simple-design locateHumanFacePeriocularArc produces the paired chart/seat location consumed by posterior band construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A chart location cannot replace incidence with nearest spatial projection.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish dimensionless coordinates from source triangle identity/weights.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularArcLocation is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularArcLocation declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularArcLocation acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularArcLocation {
  /** Dimensionless source material coordinate used to interpolate the tissue band. */
  coordinate: [number, number];

  /** Actual host triangle identity and ordered barycentric weights. */
  seat: IHumanFaceSkinSeat;
}
