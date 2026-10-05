import type { IAutoMovieHumanPersonGirthMeasurement } from "./IAutoMovieHumanPersonGirthMeasurement";
import type { IAutoMovieHumanPersonStatureMeasurement } from "./IAutoMovieHumanPersonStatureMeasurement";

/**
 * A measurement rule the person evaluates on its whole connected skin: a tape
 * girth across the head/body cut, or the stature of the closed skin.
 *
 * @evidence contracts/common.md#principled-implementation Each kind names its own instrument's data, discriminated by `kind`.
 * @evidence contracts/common.md#clear-and-simple-design A union of the two rule kinds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No kind carries fields another kind's instrument reads.
 * @evidence contracts/common.md#meaningful-documentation States the two kinds.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The rule defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The rule defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The rule emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Each kind states its units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The rule builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The rule is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each kind carries its own source range.
 * @evidenceExclude contracts/anatomy.md#permitted-range The rule admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The rule converts no input.
 * @author Samchon
 */
export type IAutoMovieHumanPersonMeasurement =
  | IAutoMovieHumanPersonGirthMeasurement
  | IAutoMovieHumanPersonStatureMeasurement;
