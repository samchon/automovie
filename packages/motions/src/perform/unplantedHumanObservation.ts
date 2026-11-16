import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Keep an observational demand only when no later planted-goal refit will
 * read a digit result omitted by that demand. Unknown goal reads keep the
 * original complete path and its normal admission/failure order.
 *
 * @param limbs The current raw goals before later planted fitting.
 * @param requested The caller's exact observed bones; absence keeps complete evaluation.
 * @returns The same borrowed demand when no plant exists, otherwise none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the post-digit planted-fit dependency, conservative failure policy and borrowed demand ownership.
 * @evidence contracts/development/implementation.md#principled-implementation A later arm plant may read actual solved finger geometry, so any planted goal conservatively retains full digit fitting. Without later plants, ordinary per-joint fades/clamps cannot change an ancestor body's frame through a digit result.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared gate serves the base displayed posture and each overlay leaf, preventing a released overlay goal from hiding a base plant that final fitting still consumes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The gate changes no goal or tolerance and catches no numerical fit error; an unknown property read simply declines optimization so the original owner performs admission and reports failures.
 * @evidence contracts/development/implementation.md#efficient-algorithms Complete requests return in constant time; observational requests scan at most the current four goal entries without FK or solving.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both displayed and overlay stages share one conservative dependency rule; no result is retained across raw goal objects or queries.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state or handle and returns only the caller's borrowed set or undefined.
 */
export function unplantedHumanObservation(
  limbs: IHumanPosture["limbs"],
  requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
): ReadonlySet<AutoMovieHumanoidBone> | undefined {
  if (requested === undefined) return undefined;
  try {
    for (const goal of Object.values(limbs))
      if (goal?.planted === true) return undefined;
    return requested;
  } catch {
    return undefined;
  }
}
