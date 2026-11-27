import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { humanSettledJoints } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/** The digits and toes, written after the limbs outside the clamp. */
const WRITTEN: RegExp = /(Thumb|Index|Middle|Ring|Little|Toes)/u;

/**
 * `humanSettledJoints` is the set of joints whose range clamp gives back the
 * record it issued, so a displayed pose's final clamp may keep them: a joint
 * with no range or a box range, or a swing cone anchored at zero (each of its
 * axes' ranges holding zero), but neither a swing-twist joint nor a cone
 * anchored off zero, and never a digit or a toe, which later writers set.
 *
 * The body is built whole (`humanFixtureBody`) for its skeleton's ranges.
 *
 * Scenarios, the average man's skeleton:
 *
 * 1. No digit or toe is settled.
 * 2. Every other bone is settled exactly when its range is absent, a box, or a
 *    cone whose flexion and abduction ranges both hold zero, and is not a
 *    swing-twist joint.
 */
export async function test_motions_posture_settled_joints(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const settled: ReadonlySet<AutoMovieHumanoidBone> = humanSettledJoints(
    body.skeleton,
  );
  const holds = (range: { min: number; max: number } | null): boolean =>
    range === null || (range.min <= 0 && range.max >= 0);

  // 1. Digits and toes.
  TestValidator.predicate(
    "no digit or toe",
    [...settled].every(
      (bone: AutoMovieHumanoidBone): boolean => !WRITTEN.test(bone),
    ),
  );

  // 2. The rule.
  TestValidator.predicate(
    "settled by its range",
    body.skeleton.bones
      .filter((bone: IAutoMovieBone): boolean => !WRITTEN.test(bone.bone))
      .every((bone: IAutoMovieBone): boolean => {
        const range: ReturnType<typeof AutoMovieEngineKinematics.getConstraint> = AutoMovieEngineKinematics.getConstraint(
          bone.bone,
          bone.constraint ?? null,
        );
        const expected: boolean =
          range === null ||
          ((range.swingTwist === undefined || range.swingTwist === null) &&
            (range.swingDeg === undefined ||
              range.swingDeg === null ||
              (holds(range.flexion) && holds(range.abduction))));
        return settled.has(bone.bone) === expected;
      }),
  );
}
