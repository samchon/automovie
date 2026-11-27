import type {
  IAutoMoviePhysicalCoupledTargetFit,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";

/*
 * One group of borrowed, already admitted bodies at a sampled step.
 */
export interface IPhysicalCoupledTargetGroup
  extends IAutoMoviePhysicalCoupledTargetFit.IInterval {
  /*
   * The admitted input's own body records, borrowed in the same ordinal order
   * as `members`. Producers check them by identity against the live input.
   */
  readonly bodies: readonly IAutoMoviePhysicalSimulationInput.IBody[];
}
