import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * Keep an observational demand only when no later planted-goal refit will
 * read a digit result omitted by that demand.
 *
 * @param limbs The current raw goals before later planted fitting.
 * @param requested The caller's exact observed bones; absence keeps complete evaluation.
 * @returns The same borrowed demand when no plant exists, otherwise none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the post-digit planted-fit dependency and borrowed demand ownership.
 * @evidence contracts/development/implementation.md#principled-implementation A later arm plant may read actual solved finger geometry, so any planted goal conservatively retains full digit fitting. Without later plants, ordinary per-joint fades/clamps cannot change an ancestor body's frame through a digit result.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared gate serves the base displayed posture and each overlay leaf, preventing a released overlay goal from hiding a base plant that final fitting still consumes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The gate changes no goal or tolerance and catches nothing: a goal record that cannot be read fails here as it would at its admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms Complete requests return in constant time; observational requests scan at most the current four goal entries without FK or solving.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both displayed and overlay stages share one conservative dependency rule; no result is retained across raw goal objects or queries.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state or handle and returns only the caller's borrowed set or undefined.
 */
export function unplantedHumanObservation(
  limbs: IAutoMovieMotionHumanPosture["limbs"],
  requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
): ReadonlySet<AutoMovieHumanoidBone> | undefined {
  if (requested === undefined) return undefined;
  for (const goal of Object.values(limbs))
    if (goal?.planted === true) return undefined;
  return requested;
}
