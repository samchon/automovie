import type { IHumanBodyUnderwearSurfaceViolation } from "./IHumanBodyUnderwearSurfaceViolation";

/**
 * One original Phase I proximal proposal and its actual model-agreement state.
 *
 * Normalized native point/relative-edge coordinates remain distinct from the
 * metre base emitted after pin restoration and floating conversion. All merits
 * use the original dimensionless logical L1 population. Progress omits buffers;
 * final refusals retain them. Numerical curvature changes no physical input.
 *
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
