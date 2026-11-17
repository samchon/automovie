import type { IAutoMovieRecoveryCameraMapBudget, IAutoMovieRecoveryCameraMapPolicy, IAutoMovieRecoveryFeasibleJointOptions, IAutoMovieRecoveryFeasibleReportCapacity, IAutoMovieRecoveryMapJointResult, IAutoMovieRecoveryMapLandmark, IAutoMovieRecoveryMapPose } from "../../index";

/**
 * Joint sparse-map refinement retains the fixed observation population and gauge. Coordinates use the initial reconstruction scale, with supplied pixel intrinsics. Checkpoints and work charges run synchronously; either callback may throw to terminate without a result. Omitted charge performs no accounting callback, and omitted feasible options retain ordinary refinement. With feasible refinement, reportCapacity borrows an already admitted reporting scope; omission admits the direct reporting envelope, while ordinary refinement ignores it. Numerical rank, depth, pixel residual and budget admission remain the recovery solver's responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for refineRecoveryCameraMap.
 * @evidence contracts/development/design.md#principled-representation Joint sparse-map refinement retains the fixed observation population and gauge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface refineRecoveryCameraMap and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by refineRecoveryCameraMap; the type does not certify input validity.
 */
export namespace IAutoMovieRecoveryCameraMapRefinementOperation {
/**
 * Joint sparse-map refinement retains the fixed observation population and gauge. Coordinates use the initial reconstruction scale, with supplied pixel intrinsics. Checkpoints and work charges run synchronously; either callback may throw to terminate without a result. Omitted charge performs no accounting callback, and omitted feasible options retain ordinary refinement. With feasible refinement, reportCapacity borrows an already admitted reporting scope; omission admits the direct reporting envelope, while ordinary refinement ignores it. Numerical rank, depth, pixel residual and budget admission remain the recovery solver's responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for refineRecoveryCameraMap.
 * @evidence contracts/development/design.md#principled-representation Joint sparse-map refinement retains the fixed observation population and gauge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface refineRecoveryCameraMap and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by refineRecoveryCameraMap; the type does not certify input validity.
 */
export type Operation = (initialPoses: readonly IAutoMovieRecoveryMapPose[],
initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[],
intrinsics: readonly (readonly number[])[],
policy: IAutoMovieRecoveryCameraMapPolicy,
budget: IAutoMovieRecoveryCameraMapBudget,
checkpoint: () => void,
charge?: (work: number) => void,
feasible?: IAutoMovieRecoveryFeasibleJointOptions,
reportCapacity?: IAutoMovieRecoveryFeasibleReportCapacity) => IAutoMovieRecoveryMapJointResult;
}
