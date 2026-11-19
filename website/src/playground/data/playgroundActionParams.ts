import type { AutoMovieHumanSex } from "@automovie/interface";

import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";

/**
 * Bind the block start's omitted centre-of-mass category to the cast body's
 * reference anatomy. An explicit category or an action unrelated to the
 * block start retains its authored parameters.
 */
export function playgroundActionParams(
  action: IPlaygroundComposition.IAction,
  sex: AutoMovieHumanSex | undefined,
): Record<string, unknown> {
  if (
    (action.name !== "athletics" && action.name !== "sprintStart") ||
    action.params.sex !== undefined ||
    sex === undefined
  )
    return action.params;

  return { ...action.params, sex };
}
