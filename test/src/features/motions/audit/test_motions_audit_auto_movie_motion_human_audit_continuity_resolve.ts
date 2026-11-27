import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditContinuity";
import { TestValidator } from "@nestia/e2e";

/** The step's size, metres. */
const STEP: number = 0.2;

/**
 * What the hand's steady 1 m/s adds over the finest interval, metres: `1 / (8 *
 * 4^5)` s of travel, rounded up.
 */
const FINEST: number = 2e-4;

/**
 * `AutoMovieMotionHumanAuditContinuity.resolve` quarters one interval five
 * times toward the part that holds a step, and reads the displacement still
 * there: a step keeps its size, a smooth path leaves nothing at the limit.
 *
 * Scenarios, the head moving along z at 1 m/s, the interval 1 to 1.125 s at a 5
 * mm limit:
 *
 * 1. A 0.2 m step at 1.03 s is resolved to 0.2 m, plus at most the steady travel
 *    over the last interval, on the head, from an instant within the interval
 *    before the step.
 * 2. Without the step the path is continuous: zero at `none`.
 */
export function test_motions_audit_auto_movie_motion_human_audit_continuity_resolve(): void {
  const motion = (step: number): IAutoMovieMotionHumanAuditMotion => ({
    duration: 2,
    segments: () => [],
    bones: (_subject: string, t: number) =>
      new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
        [
          "head",
          {
            bone: "head",
            localRotation: AutoMovieEngineQuaternion.identity(),
            worldPosition: { x: 0, y: 1.6, z: t + (t >= 1.03 ? step : 0) },
            worldRotation: AutoMovieEngineQuaternion.identity(),
          },
        ],
      ]),
  });
  const stepped: IAutoMovieMotionHumanAuditMeasure =
    AutoMovieMotionHumanAuditContinuity.resolve(
      motion(STEP),
      "a",
      1,
      1.125,
      0.005,
    );
  TestValidator.predicate(
    "a step",
    stepped.value >= STEP &&
      stepped.value <= STEP + FINEST &&
      stepped.where === "head" &&
      stepped.seconds >= 1 &&
      stepped.seconds <= 1.03,
  );
  TestValidator.equals(
    "a continuous path",
    AutoMovieMotionHumanAuditContinuity.resolve(
      motion(0),
      "a",
      1,
      1.125,
      0.005,
    ),
    { value: 0, seconds: 1, where: "none" },
  );
}
