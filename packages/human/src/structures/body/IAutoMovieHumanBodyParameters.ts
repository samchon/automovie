import { IAutoMovieHumanBodyControls } from "./IAutoMovieHumanBodyControls";
import { IAutoMovieHumanBodyDimensions } from "./IAutoMovieHumanBodyDimensions";
import { IAutoMovieHumanBodyHeightDiagnostics } from "./IAutoMovieHumanBodyHeightDiagnostics";

/** Primary body parameter record. All lengths use mm; shape controls are unitless.
 * Authored values, independent measurements and diagnostics remain distinct.
 * Unknowns are null. No clinical measurement converter or geometric generator
 * is currently supplied.
 */
export interface IAutoMovieHumanBodyParameters {
  /** Named authored control values and their pins. */
  controls: IAutoMovieHumanBodyControls;

  /** Independent actual measurements, never inferred from target values. */
  measurements: IAutoMovieHumanBodyDimensions;

  /** Independently measured floor-relative heights. */
  diagnostics: IAutoMovieHumanBodyHeightDiagnostics;
}
