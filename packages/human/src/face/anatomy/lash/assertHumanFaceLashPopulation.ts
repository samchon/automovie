import type { IAutoMovieHumanFaceLowerLashPopulation } from "./IAutoMovieHumanFaceLowerLashPopulation";
import type { IAutoMovieHumanFaceUpperLashPopulation } from "./IAutoMovieHumanFaceUpperLashPopulation";
import { assertHumanFaceLowerLashProfile } from "./assertHumanFaceLowerLashProfile";
import { assertPortraitEyelashProfile } from "./assertPortraitEyelashProfile";

/**
 * Admit the attached lash population without inferring any missing count.
 * Zero still requires a valid retained profile, so adding strands later never
 * exposes an invalid hidden input. [0,1024] is a rendering resource budget;
 * the generator separately admits the resulting shaft/tissue geometry.
 */
export function assertHumanFaceLashPopulation(
  input:
    | IAutoMovieHumanFaceUpperLashPopulation
    | IAutoMovieHumanFaceLowerLashPopulation,
  row: "upper" | "lower",
): void {
  if (input.strandCount === undefined)
    throw new Error(
      `The ${row} lash population requires an explicit strandCount; source cards do not supply follicles.`,
    );
  if (
    !Number.isSafeInteger(input.strandCount) ||
    input.strandCount < 0 ||
    input.strandCount > 1024
  )
    throw new Error(
      `The ${row} lash strandCount must be an integer in the rendering budget [0,1024].`,
    );
  if (row === "upper") assertPortraitEyelashProfile(input);
  else assertHumanFaceLowerLashProfile(input);
}
