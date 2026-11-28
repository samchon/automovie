import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
} from "@automovie/interface";
import {
  unplantedHumanObservation
} from "../../../../../packages/motions/src/perform/internal/unplantedHumanObservation";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Demand is preserved for free goals and widened for any planted goal, while an absent request already asks for the full pose.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the observation gate with typed limb goal maps and either no request or a head set. It checks returned object identity when goals are free and undefined when a plant requires the full path.
 * @evidence contracts/development/testing.md#independent-expectations The two demanded cases share the same head set and differ only in the left leg's planted flag. The free case returns that exact set, while the planted case and absent demand each return undefined.
 */
export function test_motions_perform_unplanted_observation(): void {
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
