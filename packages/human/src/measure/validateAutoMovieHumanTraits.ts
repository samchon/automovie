import typia, { IValidation } from "typia";

import { IAutoMovieHumanTraits } from "../structures/IAutoMovieHumanTraits";

/**
 * Admit beginner traits by their static type and bounds.
 *
 * Traits have no dependent bound of their own: whether a stature is reachable at an age is a question for the converter's data, and the identity it produces is admitted in full afterwards. A property the traits do not declare is not checked and is carried along. The input is never mutated; on success the result holds a private copy.
 *
 * @param input Candidate traits, of any shape
 * @returns The admitted copy, or every finding with the original input
 */
export function validateAutoMovieHumanTraits(
  input: unknown,
): IValidation<IAutoMovieHumanTraits> {
  const typed: IValidation<IAutoMovieHumanTraits> =
    typia.validate<IAutoMovieHumanTraits>(input);
  if (typed.success === false) return typed;
  return { success: true, data: structuredClone(typed.data) };
}
