/**
 * Scalar bounds admitted once for one fixed feasible camera-map fit.
 *
 * @evidence contracts/common.md#principled-implementation Original observation counts, weighted-row widths and full-LS resource formulas define these logical entry and visit bounds before geometry is copied.
 * @evidence contracts/common.md#clear-and-simple-design One named scalar record transfers the admission result from its owner to the camera coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record neither changes ceilings nor admits optional curvature, ranks, actual trials or convergence.
 * @evidence contracts/common.md#meaningful-documentation Widths count physical coordinates, retained counts logical scalar slots, and work fields count prepaid visits; adaptive selects original-design agreement only.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Eight scalars belong to the existing fixed128 shell; no borrowed input, design, factor or history is retained.
 */
export interface IAutoMovieRecoveryFeasibleMapWork {
  /** Original fixed-population observation count. */
  observations: number;

  /** Camera coordinates after the seven-freedom gauge. */
  cameraWidth: number;

  /** Camera and landmark physical coordinate count. */
  width: number;

  /** Whether selected-u objective agreement is enabled. */
  adaptive: boolean;

  /** Visits charged before each adaptive agreement reaction. */
  agreementWork: number;

  /** Base simultaneous logical scalar-entry reservation. */
  retained: number;

  /** Visits charged before each complete actual evaluation. */
  evaluationWork: number;

  /** Visits charged before each original model construction. */
  modelWork: number;
}
