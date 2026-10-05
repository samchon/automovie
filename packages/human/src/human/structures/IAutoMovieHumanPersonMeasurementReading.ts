import type { IAutoMovieHumanSectionPlane } from "../../common/measure/IAutoMovieHumanSectionPlane";
import type { IAutoMovieHumanSectionReading } from "../../common/measure/IAutoMovieHumanSectionReading";

/**
 * One person measurement read on a final skin: the value and, for a girth,
 * the closed section it was read from and the plane that cut it.
 *
 * @evidence contracts/common.md#principled-implementation The value, its section and its plane travel together so an observer reads the same cut.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No derived summary replaces the section reading.
 * @evidence contracts/common.md#meaningful-documentation States what each field holds.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the model frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reading defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reading carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reading emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reading builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The reading is not displayed by itself.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule owns the measurement's definition and source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reading admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reading converts no input.
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
