import { validateMotion } from "@automovie/engine";
import type {
  AutoMovieViolationKind,
  IAutoMovieKeyframe,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeExpression } from "../internal/makeExpression";
import { makePose } from "../internal/makePose";

/**
 * Key admission identifies the local pose, expression or inter-key speed that fails.
 *
 * Scenarios:
 * 1. A key must match the clip rig, joint range and expression weight domain.
 * 2. An existing joint moving too fast fails. A newly introduced joint has no prior speed.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads violation kind and nested path.
 * @evidence contracts/development/testing.md#independent-expectations The authored angles, duration and weight determine each boundary.
 * @evidence contracts/development/testing.md#distinguishing-cases Existing and new joints distinguish defined and undefined velocities.
 * @evidence contracts/development/testing.md#execution-ownership Calls the validator directly on one rig.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each family of delegated checks.
 */
export function test_validation_motion_clip_key_content(): void {
  const motion = createValidMotion();
  const skeleton = createSkeleton();
  const origin = keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })]));
  const cases: Array<[IAutoMovieKeyframe[], AutoMovieViolationKind, string]> = [
    [
      [
        { ...origin, pose: { ...origin.pose, skeleton: "other" } },
        motion.keyframes[1]!,
      ],
      "type",
      "$input.keyframes[0].pose.skeleton",
    ],
    [
      [
        origin,
        keyframe(1, makePose([joint("leftLowerArm", { flexion: 175 })])),
      ],
      "rom",
      "keyframes[1].pose",
    ],
    [
      [
        origin,
        keyframe(
          1,
          origin.pose,
          "linear",
          makeExpression("happy", 0.5, [{ channel: "jawOpen", weight: 1.5 }]),
        ),
      ],
      "range",
      "keyframes[1].expression",
    ],
    [
      [
        keyframe(0, makePose([joint("leftUpperArm", { flexion: 0 })])),
        keyframe(0.1, makePose([joint("leftUpperArm", { flexion: 170 })])),
      ],
      "temporal",
      ".pose",
    ],
  ];
  for (const [keyframes, kind, path] of cases)
    TestValidator.predicate(
      path,
      hasViolation(
        validateMotion({ skeleton, motion: { ...motion, keyframes } }),
        kind,
        path,
      ),
    );
  const newcomer = keyframe(
    1,
    makePose([
      joint("leftLowerArm", { flexion: 30 }),
      joint("leftUpperArm", { flexion: 20 }),
    ]),
  );
  TestValidator.equals(
    "a new channel has no previous velocity",
    validateMotion({
      skeleton,
      motion: { ...motion, keyframes: [origin, newcomer] },
    }).success,
    true,
  );
}
