import type { IHumanBodyUnderwearFittingProposal } from "./IHumanBodyUnderwearFittingProposal";
import type { IHumanBodyUnderwearLiftLinearization } from "./IHumanBodyUnderwearLiftLinearization";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";
import type { IHumanBodyUnderwearSurfaceViolation } from "./IHumanBodyUnderwearSurfaceViolation";

/**
 * An original unmet condition or candidate-domain refusal during whole-mesh globalization.
 *
 * The original reading is an observation about that candidate, not an input repair or a permitted geometry. Revised connected proposals still use the same forward evaluator and final acceptance conditions.
 *
 * @evidence contracts/common.md#principled-implementation Original connected candidate coordinates, phase/step and raw forward/derivative/merit failures retain the actual trial's model-domain provenance.
 * @evidence contracts/common.md#clear-and-simple-design Optional proposal/evaluation history stays beside required failure cause and base while final candidate conditions remain evaluator-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unmet trial is an observation, not input repair or permitted geometry; null readings and omitted derivatives never become substituted values.
 * @evidence contracts/common.md#meaningful-documentation Members give owned meter coordinates, dimensionless step/objective, optional historical outputs and unevaluated-domain meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Trial-failure typing performs no whole-mesh globalization or forward condition evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Original trial records describe distinct candidates without implementing evaluator or native-program caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retained trial geometry/history can grow with fitting work; the fitting owner sets that bound and this schema acquires no native handles.
 * @author Samchon
 */
export interface IHumanBodyUnderwearTrialFailure {
  /** Owned original proximal proposal and actual comparison; absent in historical or Phase II records. */
  proposal?: IHumanBodyUnderwearFittingProposal;

  /** Complete actual forward buffers; absent for undefined-domain or historical records. */
  evaluation?: IHumanBodyUnderwearSurfaceEvaluation;

  /** Complete explicitly unavailable trial derivatives; omission means that read did not occur. */
  derivativeFailures?: IHumanBodyUnderwearLiftLinearization["unavailable"];

  /** Owned whole connected candidate coordinates, in posed skin metres. */
  base: number[];

  /** The original objective whose whole-mesh candidate was measured. */
  phase: "feasibility" | "optimization";

  /** Actual dimensionless represented line parameter. */
  step: number;

  /** Original unmet-condition or numerical-domain reason, without a substituted direction. */
  reason: string;

  /** Original actual local failures; empty when the forward domain could not be evaluated. */
  geometryViolations: readonly IHumanBodyUnderwearSurfaceViolation[];

  /** Original field excess in metres, or null when no forward field was available. */
  fieldResidualMetres: number | null;

  /** Original dimensionless relative-edge objective, or null outside the finite candidate domain. */
  edgeObjective: number | null;
}
