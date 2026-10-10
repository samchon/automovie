import type { IAutoMovieHumanPersonGirthMeasurement } from "./IAutoMovieHumanPersonGirthMeasurement";
import type { IAutoMovieHumanPersonStatureMeasurement } from "./IAutoMovieHumanPersonStatureMeasurement";

/**
 * A measurement rule the person evaluates on its whole connected skin: a tape
 * girth across the head/body cut, or the stature of the closed skin.
 *
 * @author Samchon
 */
export type IAutoMovieHumanPersonMeasurement =
  | IAutoMovieHumanPersonGirthMeasurement
  | IAutoMovieHumanPersonStatureMeasurement;
