import type { IAutoMovieHumanFaceLowerLashPopulation } from "./IAutoMovieHumanFaceLowerLashPopulation";
import type { IAutoMovieHumanFaceUpperLashPopulation } from "./IAutoMovieHumanFaceUpperLashPopulation";
import { assertHumanFaceLowerLashProfile } from "./assertHumanFaceLowerLashProfile";
import { assertPortraitEyelashProfile } from "./assertPortraitEyelashProfile";

/**
 * Admit the attached lash population without inferring any missing count. Zero still requires a valid retained profile, so adding strands later never exposes an invalid hidden input. [0,1024] is a rendering resource budget; the generator separately admits the resulting shaft/tissue geometry.
 *
 * @evidence contracts/common.md#principled-implementation Explicit safe-integer count admission precedes the retained upper or lower profile validator.
 * @evidence contracts/common.md#clear-and-simple-design Population count remains separate from source card area and geometry admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero still requires a valid profile, and the 1024 ceiling is an allocation budget rather than a measured follicle limit.
 * @evidence contracts/common.md#meaningful-documentation Errors name the row and missing/out-of-range count; the caller's record is unchanged.
 * @evidence contracts/performance.md#efficient-algorithms Fixed count checks delegate seven scalar profile checks, independent of emitted shaft count.
 * @evidence contracts/performance.md#reuse-equivalent-work Upper/lower geometric validators reuse their authoritative parameter tables.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No strand or texture is allocated and no input reference is retained after return.
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
