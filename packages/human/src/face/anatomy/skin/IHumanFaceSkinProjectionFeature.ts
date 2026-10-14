import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

/**
 * Affine nearest point on a native face, edge or vertex, expressed relative
 * to one guide's first point and divided by that guide's numerical scale.
 * Exact rational projections retain the native binary64 coordinates through
 * edge dot products and face Gram equations. The closed membership domain
 * rounds its exact endpoints once to the course's binary64 parameter format.
 *
 * @evidence contracts/common.md#principled-implementation createHumanFaceSkinProjectionFeatures derives an exact rational affine projection and membership interval from actual native vertex, edge or face geometry; only domain endpoints round to binary64.
 * @evidence contracts/common.md#clear-and-simple-design One feature couples native identity, affine origin/velocity and valid domain so the envelope cannot compare a projection outside its own support.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native corners and coordinate-identical seam aliases retain source correspondence; no tolerance-welded substitute triangle is declared.
 * @evidence contracts/common.md#meaningful-documentation Members give normalized coordinates, parameter-zero position, unit-parameter velocity and closed validity bounds; rational precision does not imply anatomical measurement accuracy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This feature interface performs no projection; feature construction and pair comparison own rational arithmetic cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares no computations; the envelope owns guide-local comparison reuse keyed by feature identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resources; candidate arrays and their rational values live with the compiling guide.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionFeature {
  /** Actual native feature corners; coordinate-identical seam aliases are equivalent. */
  vertices: readonly number[];

  /** Projected position at guide parameter zero, in scaled local coordinates. */
  origin: readonly IHumanExactFraction[];

  /** Change per unit guide parameter, in scaled local coordinates. */
  velocity: readonly IHumanExactFraction[];

  /** First valid guide parameter. */
  lower: number;

  /** Last valid guide parameter. */
  upper: number;
}
