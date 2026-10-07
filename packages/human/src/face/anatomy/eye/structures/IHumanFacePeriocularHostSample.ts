import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/**
 * Source-chart witness for one posterior tissue station before its requested
 * normal offset. Retained only while constructing a shell, these records let
 * a failed geometric admission distinguish a folded host projection from
 * rounding or a source-declared zero-height endpoint.
 *
 * @evidence contracts/common.md#principled-implementation Retains the pre-projection point and actual host seat together, so an admission refusal can be traced to the construction mapping without changing that mapping.
 * @evidence contracts/common.md#clear-and-simple-design One transient record carries a sample's structured identity and attachment.
 * @evidence contracts/common.md#meaningful-documentation States the construction stage, units and limited diagnostic lifetime.
 * @evidence contracts/modeling.md#spatial-conventions The free point remains head-frame metres; row, column and barycentric seat are dimensionless source-chart coordinates.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries a geometric witness rather than an anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Transient construction metadata adds no authoring input.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularHostSample {
  /** Structured sheet row, increasing away from the lid margin. */
  row: number;

  /** Resampled sheet column, in the source cage's medial-to-lateral order. */
  column: number;

  /** Station before normal offset, head-frame metres; legacy seating records its free spatial sample. */
  point: number[];

  /** Actual dimensionless material coordinate when a source chart owns attachment. */
  materialPoint?: [number, number];

  /** Actual host triangle and its barycentric attachment weights. */
  seat: IHumanFaceSkinSeat;
}
