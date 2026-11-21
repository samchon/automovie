import type {
  IAutoMoviePhysicalCoupledTargetFit,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";

/**
 * One group of borrowed, already admitted bodies at a sampled step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Relates the group identity to the bodies whose targets that step owns.
 * @evidence contracts/development/design.md#principled-representation The bodies and corresponding member ids share ordinal order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the actual admitted body records for both frame producers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Groups are created only from explicit authored declarations.
 */
export interface IPhysicalCoupledTargetGroup
  extends IAutoMoviePhysicalCoupledTargetFit.IInterval {
  /**
   * The admitted input's own body records, borrowed in the same ordinal order
   * as `members`. Producers check them by identity against the live input.
   */
  readonly bodies: readonly IAutoMoviePhysicalSimulationInput.IBody[];
}
