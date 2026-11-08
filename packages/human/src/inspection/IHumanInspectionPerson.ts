import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";

/** One person the viewer can show: typed public inputs and their calibration by the current source. */
export interface IHumanInspectionPerson {
  /** Export name of the typed example, such as `f1`. */
  alias: string;

  /** The typed public inputs. */
  parameters: IAutoMovieHumanParameters;

  /**
   * The current source's calibration of {@link parameters}, in calibration millimetres.
   *
   * Computed on the first call and kept for the page's lifetime; a failure throws from every call.
   */
  calibration(): IAutoMovieHumanBodyCalibration;
}
