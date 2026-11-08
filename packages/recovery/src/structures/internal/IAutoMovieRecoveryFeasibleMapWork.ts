/**
 * Scalar bounds admitted once for one fixed feasible camera-map fit.
 *
 * @evidence contracts/development/design.md#principled-representation Original observation counts, weighted-row widths and full-LS resource formulas define these logical entry and visit bounds before geometry is copied.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named scalar record transfers the admission result from its owner to the camera coordinator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This record neither changes ceilings nor admits optional curvature, ranks, actual trials or convergence.
 * @evidence contracts/development/common.md#meaningful-documentation Widths count physical coordinates, retained counts logical scalar slots, and work fields count prepaid visits; adaptive selects original-design agreement only.
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

  /** Base numerical arrays plus64 simultaneous current-radius chart slots. */
  retained: number;

  /** Visits charged before each complete actual evaluation. */
  evaluationWork: number;

  /** Visits charged before each model, including512 fixed chart differential visits. */
  modelWork: number;
}
