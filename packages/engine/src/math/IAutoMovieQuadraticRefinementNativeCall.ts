/**
 * The one initial native solve in the caller's unchanged QP coordinates.
 * Polishing introduces no additional native call or scaled correction frame.
 * Failed native buffers are diagnostic data and never admitted geometry.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Retains the actual initial native status and diagnostics independently of later original-row candidate admission.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Records caller-coordinate objectives and unsuccessful native buffers without inventing an unused correction frame or side map.
 * @author Samchon
 */
export interface IAutoMovieQuadraticRefinementNativeCall {
  /** Native status; only 1 is Solved. */
  status: number;

  /** Native iterations reported by this call. */
  iterations: number;

  /** Native normalized primal residual, separate from original-row admission. */
  primalResidual: number;

  /** Native normalized dual residual, separate from original stationarity. */
  dualResidual: number;

  /** Original objective unit marker, currently populated as 1. */
  scale: number;

  /** Native primal objective in that solve's objective units. */
  objective: number;

  /** Native dual objective in that solve's objective units. */
  dualObjective: number;

  /** Absolute native objective difference; this is not rowwise complementarity. */
  gap: number;

  /** Objective difference in original units; currently identical to gap. */
  originalGap: number;

  /** Complete caller input row count for this initial native solve. */
  rows: number;

  /** Caller input coordinates; no additional native correction frame exists. */
  coordinates: "original";

  /** Copied initial native primal when its status is not Solved. */
  primal?: number[];

  /** Copied initial native dual when its status is not Solved. */
  dual?: number[];
}
