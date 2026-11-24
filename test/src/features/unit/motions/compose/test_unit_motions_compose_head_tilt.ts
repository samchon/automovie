import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanHead } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { linearMotionClock } from "../../../internal/synthetic/linearMotionClock";

/** The carrier's posture: a walking stride's head already turned 5 degrees. */
const CARRIER: IAutoMovieMotionHumanPosture = {
  root: { x: 0.1, y: 0.9, z: 0.4 },
  yaw: 10,
  pitch: 0,
  roll: 0,
  joints: { neck: [0, 0, 5], hips: [2, 0, 0] },
  limbs: {},
};

/**
 * `AutoMovieMotionHumanHead.tilt` rolls the head to one side over the cervical
 * joints and back, on whatever posture the carrier gives it.
 *
 * A 3 s clock rises from `start` to `full` at 1 s and falls from `relax` at 2 s
 * to `end`; the head rolls -20 degrees.
 *
 * Scenarios:
 *
 * 1. Over the hold, the neck's and the head's added roll sum to the authored
 *    angle, with no added flexion or twist.
 * 2. At the start and the end the carrier's head returns unchanged.
 * 3. The carrier's root, heading and other joints are never touched.
 */
export function test_unit_motions_compose_head_tilt(): void {
  const clock: IAutoMovieMotionClock = linearMotionClock(3, [
    { name: "full", seconds: 1 },
    { name: "relax", seconds: 2 },
  ]);
  const tilt: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanHead.tilt(
    clock,
    ["start", "full"],
    ["relax", "end"],
    -20,
  );
  const cervical = (
    posture: IAutoMovieMotionHumanPosture,
    axis: 0 | 1 | 2,
  ): number =>
    (posture.joints.neck?.[axis] ?? 0) + (posture.joints.head?.[axis] ?? 0);

  // 1. The hold.
  const held: IAutoMovieMotionHumanPosture = tilt.write(CARRIER, 1.5);
  TestValidator.predicate(
    "the roll reaches its angle over the hold",
    nclose(cervical(held, 1), -20, 1e-9) &&
      nclose(cervical(held, 0), 0, 1e-9) &&
      nclose(cervical(held, 2), 5, 1e-9),
  );

  // 2. The ends.
  TestValidator.predicate(
    "the carrier's head returns at both ends",
    [0, 3].every((seconds: number): boolean => {
      const shown: IAutoMovieMotionHumanPosture = tilt.write(CARRIER, seconds);
      return (
        nclose(cervical(shown, 0), 0, 1e-9) &&
        nclose(cervical(shown, 1), 0, 1e-9) &&
        nclose(cervical(shown, 2), 5, 1e-9)
      );
    }),
  );

  // 3. The rest of the carrier.
  TestValidator.equals(
    "the carrier's root, heading and hips",
    [held.root, held.yaw, held.joints.hips],
    [CARRIER.root, CARRIER.yaw, CARRIER.joints.hips],
  );
}
