import type { IAutoMovieMotionHumanAidWalk } from "@automovie/interface";

import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";

/**
 * Read the one opening action that owns a placed aid's native route.
 * Both the site player and the example source use the same action.
 *
 * @param object The placed aid.
 * @param performers The composition's performers.
 * @returns The parameters of the aid's opening action, when it has a route.
 * @throws {Error} If the named performer does not open with this aid.
 */
export function playgroundAidWalkAction(
  object: IPlaygroundComposition.IObject,
  performers: readonly IPlaygroundComposition.IPerformer[],
): IAutoMovieMotionHumanAidWalk | undefined {
  if (object.aidWalk === undefined) return undefined;
  const action = performers.find(
    ({ subject }) => subject === object.aidWalk!.subject,
  )?.actions[0];
  if (action?.name !== "aidWalk" || action.params.prop !== object.subject)
    throw new Error(
      "The performer for " +
        object.subject +
        " must open with its aidWalk action.",
    );
  return action.params as unknown as IAutoMovieMotionHumanAidWalk;
}
