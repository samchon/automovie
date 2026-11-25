import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
} from "@automovie/interface";
import { unplantedHumanObservation } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A goal at a height, planted or not. */
function goal(planted: boolean): IAutoMovieHumanLimbGoal {
  return {
    point: { x: 0.1, y: 0.08, z: 0.2 },
    bend: { x: 0.1, y: 0.5, z: 0.5 },
    planted,
  };
}

/**
 * `unplantedHumanObservation` decides whether a partial observation, a read of
 * a few bones only, may skip the rest of the pose: it keeps the caller's demand
 * only when no limb goal is planted, since a planted goal's later refit reads
 * results the demand would omit, and a missing demand stays the complete
 * evaluation.
 *
 * Scenarios:
 *
 * 1. No demand: none, the complete evaluation.
 * 2. A demand of the head over goals that are all free: the same set, not a copy.
 * 3. The same demand with one foot planted: none, so the full pose is evaluated.
 */
export function test_unit_motions_perform_unplanted_observation(): void {
  const head: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(["head"]);

  // 1. No demand.
  TestValidator.equals(
    "no demand stays complete",
    unplantedHumanObservation({ leftLeg: goal(false) }, undefined),
    undefined,
  );

  // 2. Free goals.
  TestValidator.predicate(
    "free goals keep the demand itself",
    unplantedHumanObservation(
      { leftLeg: goal(false), rightArm: goal(false) },
      head,
    ) === head,
  );

  // 3. A planted goal.
  TestValidator.equals(
    "a planted goal drops the demand",
    unplantedHumanObservation(
      { leftLeg: goal(true), rightArm: goal(false) },
      head,
    ),
    undefined,
  );
}
