import type { IAutoMovieHumanSectionPlane } from "../../common/measure/IAutoMovieHumanSectionPlane";
import type { IAutoMovieHumanSectionReading } from "../../common/measure/IAutoMovieHumanSectionReading";

/**
 * One person measurement read on a final skin: the value and, for a girth,
 * the closed section it was read from and the plane that cut it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMeasurementReading {
  /** The measured value, metres. */
  metres: number;

  /** The closed section loop a girth was read from; absent for stature. */
  section?: IAutoMovieHumanSectionReading;

  /** The plane that cut the skin for a girth; absent for stature. */
  plane?: IAutoMovieHumanSectionPlane;
}
