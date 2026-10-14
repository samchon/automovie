import type { IHumanBodyUnderwearLiftDerivativeFailure } from "./IHumanBodyUnderwearLiftDerivativeFailure";

/**
 * Analytic sparse derivatives of the actual returned unit normals.
 *
 * @evidence contracts/common.md#principled-implementation Per-vertex Cartesian derivative maps describe actual transported unit normals while located unavailable causes remain explicit.
 * @evidence contracts/common.md#clear-and-simple-design One result separates usable sparse normal derivatives from failures consumed by the fitting owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable derivatives cannot freeze a failed normal or silently substitute an acceptance direction.
 * @evidence contracts/common.md#meaningful-documentation Members give coordinate-index mapping, XYZ inverse-meter derivatives and preserved normal-failure locations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Normal-result typing performs no unit-normal differentiation or sparse-map construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Per-candidate derivative output stores no cross-state normal-linearization cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema describes sparse maps but acquires no evaluator closure or native fitting task.
 * @author Samchon
 */
export interface IHumanBodyUnderwearNormalLinearization {
  /** One Cartesian-index to XYZ derivative map per candidate vertex; values have inverse-metre units. */
  derivatives: Map<number, number[]>[];

  /** Located normal derivative failures retained without freezing a failed normal. */
  unavailable: IHumanBodyUnderwearLiftDerivativeFailure[];
}
