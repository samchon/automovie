import { IAutoMovieClampViolation } from "./IAutoMovieClampViolation";

/**
 * The clamped value plus the list of bounds it crossed (empty if in range).
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Pairs a constrained channel value with its explicit correction receipt.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Defines the public result of one channel constraint pass.
 * @author Samchon
 */
export interface IAutoMovieClampOutcome {
  /**
   * The value after clamping, same length as the input.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Carries the channel value after every declared component range is enforced.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Emits the resolved channel state produced by the constraint pass.
   */
  value: number[];

  /**
   * Every component/bound that was exceeded, in component order.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Preserves one receipt for every applied component correction.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Emits constraint findings in component order.
   */
  violations: IAutoMovieClampViolation[];
}
