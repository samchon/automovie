import type { IHumanBodyUnderwearFittingProposal } from "./IHumanBodyUnderwearFittingProposal";
import type { IHumanBodyUnderwearLiftLinearization } from "./IHumanBodyUnderwearLiftLinearization";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";
import type { IHumanBodyUnderwearSurfaceViolation } from "./IHumanBodyUnderwearSurfaceViolation";

/**
 * An original unmet condition or candidate-domain refusal during whole-mesh globalization.
 *
 * The original reading is an observation about that candidate, not an input
 * repair or a permitted geometry. Revised connected proposals still use the same forward
 * evaluator and final acceptance conditions.
 *
 * @evidence contracts/common.md#principled-implementation Keeps an undefined candidate evaluation distinct from the original input and from actual feasible geometry while globalization revises its connected proposal.
 * @evidence contracts/common.md#clear-and-simple-design One located refusal accompanies the existing connected fitter's backtracking state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains candidate coordinates and original reason instead of supplying fallback geometry or replacing a failed normal.
 * @evidence contracts/common.md#meaningful-documentation Documents actual candidate ownership, phase, line parameter and the unchanged forward failure.
 * @evidence contracts/modeling.md#spatial-conventions Candidate XYZ coordinates are posed-frame metres and the line parameter is dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A failed numerical candidate defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Failed coordinates are never emitted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing cut incidence is unchanged.
 * @evidenceExclude contracts/modeling.md#rendered-observation A refusal establishes no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Retains existing anatomical admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal candidate coordinates are not an authoring surface.
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
