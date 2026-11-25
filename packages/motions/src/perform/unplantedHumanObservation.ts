import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * Keep an observational demand only when no later planted-goal refit will read
 * a digit result omitted by that demand.
 *
 * @param limbs The current raw goals before later planted fitting.
 * @param requested The caller's exact observed bones; absence keeps complete
 *   evaluation.
 * @returns The same borrowed demand when no plant exists, otherwise none.
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
