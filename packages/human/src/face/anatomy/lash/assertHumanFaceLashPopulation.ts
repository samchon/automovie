import type { IAutoMovieHumanFaceLowerLashPopulation } from "./IAutoMovieHumanFaceLowerLashPopulation";
import type { IAutoMovieHumanFaceUpperLashPopulation } from "./IAutoMovieHumanFaceUpperLashPopulation";
import { assertHumanFaceLowerLashProfile } from "./assertHumanFaceLowerLashProfile";
import { assertPortraitEyelashProfile } from "./assertPortraitEyelashProfile";

/**
 * Admit the attached lash population without inferring any missing count.
 * Zero still requires a valid retained profile, so adding strands later never
 * exposes an invalid hidden input. [0,1024] is a rendering resource budget;
 * the generator separately admits the resulting shaft/tissue geometry.
 *
 * @evidence contracts/common.md#principled-implementation Discrete count admission and the row's continuous profile admission are separate checks.
 * @evidence contracts/common.md#clear-and-simple-design One count check and one existing row-specific profile owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing count refuses rather than deriving follicles from cards or imposing a default.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the resource envelope, empty population and geometric admission.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The profile owns units and frame.
 * @evidence contracts/modeling.md#parameter-channels Count is admitted without changing it or any retained profile input.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Resource admission supplies no clinical follicle bound.
 * @evidence contracts/anatomy.md#permitted-range Profile and assembled geometry admission remain with their owners; the rendering count budget supplies no physiological qualification.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Reads the population input without adding a shaping field.
 */
export function assertHumanFaceLashPopulation(
  input: IAutoMovieHumanFaceUpperLashPopulation | IAutoMovieHumanFaceLowerLashPopulation,
  row: "upper" | "lower",
): void {
  if (input.strandCount === undefined)
    throw new Error(`The ${row} lash population requires an explicit strandCount; source cards do not supply follicles.`);
  if (!Number.isSafeInteger(input.strandCount) || input.strandCount < 0 || input.strandCount > 1024)
    throw new Error(`The ${row} lash strandCount must be an integer in the rendering budget [0,1024].`);
  if (row === "upper") assertPortraitEyelashProfile(input);
  else assertHumanFaceLowerLashProfile(input);
}
