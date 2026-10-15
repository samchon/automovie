import typia, { IValidation } from "typia";

import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";

/**
 * Admit an appearance by its static type and bounds.
 *
 * Appearance has no bound that depends on the person yet; a hair length is admitted whatever the stature, because hair can reach any length the cards can draw. Unknown properties are refused so a misspelt field is not silently ignored. The input is never mutated; on success the result holds a private copy.
 *
 * @param input Candidate appearance, of any shape
 * @returns The admitted copy, or every finding with the original input
 */
export function validateAutoMovieHumanAppearance(
  input: unknown,
): IValidation<IAutoMovieHumanAppearance> {
  const typed: IValidation<IAutoMovieHumanAppearance> =
    typia.validateEquals<IAutoMovieHumanAppearance>(input);
  if (typed.success === false) return typed;
  return { success: true, data: structuredClone(typed.data) };
}
