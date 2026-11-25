import type { IAutoMovieBlockingCoverage } from "../authoring/IAutoMovieBlockingCoverage";
import type { IAutoMovieCamera } from "../scene/IAutoMovieCamera";

/**
 * One blocking coverage intent that passed the coverage gate, with the staged
 * camera it plays from.
 *
 * `gatePerformShotCamera` records one per intent whose camera is staged, is not
 * the live camera, is not already covered by an earlier intent, and whose
 * framing, move and subject are usable; `performShot` compiles each into one
 * alternate take on `shot.coverage`, in blocking order.
 */
export interface IAutoMoviePerformShotCoverageJob {
  /** The blocking's coverage intent. */
  intent: IAutoMovieBlockingCoverage;

  /** The staged camera the intent names. */
  camera: IAutoMovieCamera;
}
