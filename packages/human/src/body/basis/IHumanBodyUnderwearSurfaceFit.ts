import type { IHumanBodyUnderwearFitObservation } from "./IHumanBodyUnderwearFitObservation";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";

/**
 * A connected material result qualified by its actual final forward calculation.
 *
 * @evidence contracts/common.md#principled-implementation Base positions accompany the actual accepted forward buffers and native/nonlinear observations for one connected material fit.
 * @evidence contracts/common.md#clear-and-simple-design The emitter consumes the same evaluation rather than recomputing a potentially different normal lift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Local fitting qualification claims no global optimum, anatomical acceptance or rendered garment fit.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish internal base positions, actual emitted evaluation and original solver/condition observations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fit-result typing performs no connected restoration or final forward evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The carried completed evaluation enables consumer reuse without implementing cross-fit result equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Output buffers/history have consumer-owned lifetime; the schema acquires no native task or solver handle.
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceFit {
  /** Base material positions, retaining the existing internal result meaning. */
  positions: number[];

  /** Actual buffers accepted by the fitter and consumed without recomputation. */
  evaluation: IHumanBodyUnderwearSurfaceEvaluation;

  /** Native solver and original actual conditions; no global optimum is claimed. */
  observations: IHumanBodyUnderwearFitObservation[];
}
