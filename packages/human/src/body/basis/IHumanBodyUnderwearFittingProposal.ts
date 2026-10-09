import type { IHumanBodyUnderwearSurfaceViolation } from "./IHumanBodyUnderwearSurfaceViolation";

/**
 * One original Phase I proximal proposal and its actual model-agreement state.
 *
 * Normalized native point/relative-edge coordinates remain distinct from the
 * metre base emitted after pin restoration and floating conversion. All merits
 * use the original dimensionless logical L1 population. Progress omits buffers;
 * final refusals retain them. Numerical curvature changes no physical input.
 *
 * @evidence contracts/common.md#principled-implementation Distinguishes full affine prediction, actual supported merit and original physical feasibility.
 * @evidence contracts/common.md#clear-and-simple-design One local proposal owns its numerical comparison and candidate identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No slack sum, native objective or failure count substitutes for the original merit.
 * @evidence contracts/common.md#meaningful-documentation States metric units, unavailable values and separate forward coordinates.
 * @evidence contracts/modeling.md#spatial-conventions Base coordinates retain posed metres; native point displacements are divided by rho and relative-edge auxiliaries by their original edge scale, so the L1 merit and proximal metric are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This numerical proposal defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authored input.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Only the unchanged forward owner can admit geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing cut incidence and pins remain owned by the fitter.
 * @evidenceExclude contracts/modeling.md#rendered-observation A proposal establishes no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Original anatomical admission remains authoritative.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Numerical curvature is not an authoring control.
 * @author Samchon
 */
export interface IHumanBodyUnderwearFittingProposal {
  /** Actual metre base after the existing pin restoration and native conversion. */
  base: number[];
  /** Raw native normalized point and relative-edge coordinates, excluding slacks. */
  normalizedCoordinates: number[];
  /** Positive numerical coefficient on the same normalized point/edge metric. */
  coefficient: number;
  /** Squared norm of raw native D coordinates minus the same model center. */
  metricSquared: number;
  /** Full affine group-max merit at the current raw normalized center. */
  affineCurrentMerit: number;
  /** Full affine group-max merit at the raw native proposal, excluding regularization. */
  affineMerit: number;
  /** Full affine proposal merit plus coefficient*metricSquared/2. */
  regularizedMerit: number;
  /** affineCurrentMerit minus regularizedMerit; not a native certificate. */
  predictedReduction: number;
  /** Original actual normalized L1 merit at the accepted current state. */
  currentMerit: number;
  /** Original actual trial merit, null outside the complete supported model domain. */
  actualMerit: number | null;
  /** currentMerit minus actualMerit, or null when actual merit is unavailable. */
  actualReduction: number | null;
  /** Whether the original forward candidate satisfies its existing model domain. */
  domainQualified: boolean;
  /** Number of explicitly unavailable trial derivatives; null before that read. */
  derivativeUnavailable: number | null;
  /** Actual line parameter; Phase I evaluates each newly optimized proposal in full. */
  step: number;
  /** Proposed next material-local coefficient: halved above the first problem-derived positive floor after acceptance, or increased after rejection. A failureReason prevents adoption of an unsuccessful attempt. */
  nextCoefficient?: number;
  /** Exact owned terminal model failure; absent on ordinary rejection or acceptance. */
  failureReason?: string;
  /** Original bounded condition-class counts, never a merit or acceptance proxy. */
  geometryFailureCounts: Partial<Record<IHumanBodyUnderwearSurfaceViolation["condition"], number>>;
  /** Scalar disposition after the original complete forward/analytic reads. */
  decision: "pending" | "accepted-feasible" | "accepted-agreement" |
    "rejected-domain" | "rejected-derivative" | "rejected-agreement" | "failed-model";
}
