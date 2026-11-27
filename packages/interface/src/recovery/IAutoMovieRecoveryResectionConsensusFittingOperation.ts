import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryResectionConsensus,
  IAutoMovieRecoveryResectionTrace,
} from "..";

/**
 * Bounded robust camera resection from corresponding world points and pixel
 * centres. intrinsic and inverse are paired row-major 3 by 3 camera charts;
 * point coordinates retain the established map scale. Policy supplies
 * residual/rank thresholds and budget bounds proposals and refinement.
 * checkpoint runs synchronously around proposals and refinements; optional
 * onProposal runs exactly once before each six-point draw and defaults to no
 * notification. Optional onTrace receives owned snapshots after actual
 * proposal/final-refit steps outside numerical catches; omission allocates no
 * trace, and retained history/callback work belong to the caller. Callback
 * exceptions terminate; a returned refusal retains evidence without inventing a
 * pose.
 */
export namespace IAutoMovieRecoveryResectionConsensusFittingOperation {
  /**
   * Bounded robust camera resection from corresponding world points and pixel
   * centres. intrinsic and inverse are paired row-major 3 by 3 camera charts;
   * point coordinates retain the established map scale. Policy supplies
   * residual/rank thresholds and budget bounds proposals and refinement.
   * checkpoint runs synchronously around proposals and refinements; optional
   * onProposal runs exactly once before each six-point draw and defaults to no
   * notification. Optional onTrace receives owned snapshots after actual
   * proposal/final-refit steps outside numerical catches; omission allocates no
   * trace, and retained history/callback work belong to the caller. Callback
   * exceptions terminate; a returned refusal retains evidence without inventing
   * a pose.
   */
  export type Operation = (
    points: readonly (readonly [number, number, number])[],
    pixels: readonly (readonly [number, number])[],
    intrinsic: readonly number[],
    inverse: readonly number[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
    budget: IAutoMovieRecoveryCameraMapBudget,
    checkpoint: () => void,
    onProposal?: () => void,
    onTrace?: (event: IAutoMovieRecoveryResectionTrace) => void,
  ) => IAutoMovieRecoveryResectionConsensus;
}
