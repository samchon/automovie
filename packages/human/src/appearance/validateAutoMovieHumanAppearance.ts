import typia, { IValidation } from "typia";

import { resolveAutoMovieHumanSkinAppearance } from "../measure/resolveAutoMovieHumanSkinAppearance";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";

/**
 * Admit an appearance by its static type and bounds.
 *
 * Appearance has no bound that depends on the person yet; a hair length is admitted whatever the stature, because hair can reach any length the cards can draw. A property the appearance does not declare is not checked and is carried along. The input is never mutated; on success the private copy resolves omitted skin mark controls to editable zero-density defaults, preserving the existing rendered finish.
 *
 * @param input Candidate appearance, of any shape
 * @returns The admitted copy, or every finding with the original input
 */
export function validateAutoMovieHumanAppearance(
  input: unknown,
): IValidation<IAutoMovieHumanAppearance> {
  const typed: IValidation<IAutoMovieHumanAppearance> =
    typia.validate<IAutoMovieHumanAppearance>(input);
  if (typed.success === false) return typed;
  const data: IAutoMovieHumanAppearance = structuredClone(typed.data);
  data.skin = resolveAutoMovieHumanSkinAppearance(data.skin);
  return { success: true, data };
}
