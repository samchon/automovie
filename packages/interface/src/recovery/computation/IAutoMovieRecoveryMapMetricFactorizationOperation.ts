import type { IAutoMovieRecoveryCameraMapBudget, IAutoMovieRecoveryMapJointBlock, IAutoMovieRecoveryMapMetricFit } from "../../index";

/**
 * Factor the damped sparse-map metric while independently checking original point and reduced-camera ranks. minimumRatio is the dimensionless original-design threshold and damping is finite and nonnegative. The budget bounds factor work and storage. The returned factor actions retain this admitted block population; they do not compute a least-squares step or establish nonlinear geometric acceptance. Invalid admission or unresolved rank throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for factorRecoveryMapMetric.
 * @evidence contracts/development/design.md#principled-representation Factor the damped sparse-map metric while independently checking original point and reduced-camera ranks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface factorRecoveryMapMetric and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by factorRecoveryMapMetric; the type does not certify input validity.
 */
export namespace IAutoMovieRecoveryMapMetricFactorizationOperation {
/**
 * Factor the damped sparse-map metric while independently checking original point and reduced-camera ranks. minimumRatio is the dimensionless original-design threshold and damping is finite and nonnegative. The budget bounds factor work and storage. The returned factor actions retain this admitted block population; they do not compute a least-squares step or establish nonlinear geometric acceptance. Invalid admission or unresolved rank throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for factorRecoveryMapMetric.
 * @evidence contracts/development/design.md#principled-representation Factor the damped sparse-map metric while independently checking original point and reduced-camera ranks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface factorRecoveryMapMetric and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by factorRecoveryMapMetric; the type does not certify input validity.
 */
export type Operation = (blocks: readonly IAutoMovieRecoveryMapJointBlock[],
minimumRatio: number,
damping: number,
budget: IAutoMovieRecoveryCameraMapBudget) => IAutoMovieRecoveryMapMetricFit;
}
