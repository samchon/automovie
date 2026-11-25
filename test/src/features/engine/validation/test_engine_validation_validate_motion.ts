import { validateMotion } from "@automovie/engine";
import type {
  AutoMovieViolationKind,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../internal/createSkeleton";
import { createValidMotion } from "../../internal/createValidMotion";
import { hasViolation } from "../../internal/hasViolation";
import { joint } from "../../internal/joint";
import { keyframe } from "../../internal/keyframe";
import { makeExpression } from "../../internal/makeExpression";
import { makePose } from "../../internal/makePose";

/**
 * `validateMotion` admits a clip on its rig and names the clock, easing,
 * identity or key content that fails.
 *
 * Fixture: the valid two-key elbow clip on the standard skeleton.
 *
 * Scenarios:
 *
 * 1. Clock: keys at 0 and 1 of a 1 s clip pass; no key and one key fail at
 *    `$input.keyframes`, duration 0 at `$input.duration`, a key at 2 at
 *    `[1].time`, a repeated 0.5 at `[2].time` (temporal).
 * 2. Easing: linear with Bezier controls, and cubic without them, are type
 *    findings at `.bezier`; cubic X -1 or 2 (either X control) a range finding;
 *    X in [0, 1] with Y -2 and 3 passes.
 * 3. Identity: loop true and false pass; another rig is a type finding at
 *    `$input.skeleton`.
 * 4. Keys: another pose rig (type, `[0].pose.skeleton`), elbow flexion 175 (rom,
 *    `[1].pose`), jaw weight 1.5 (range, `[1].expression`) and a shoulder
 *    turning 170 degrees in 0.1 s (temporal, `.pose`) fail; a joint first
 *    introduced by the second key passes.
 */
export function test_engine_validation_validate_motion(): void {
  const motion: IAutoMovieMotion = createValidMotion();
  const skeleton = createSkeleton();
  const validate = (change: Partial<IAutoMovieMotion>): IAutoMovieValidation =>
    validateMotion({ skeleton, motion: { ...motion, ...change } });
  const refused = (
    label: string,
    change: Partial<IAutoMovieMotion>,
    kind: AutoMovieViolationKind,
    path: string,
  ): void => {
    const result: IAutoMovieValidation = validate(change);
    TestValidator.predicate(
      label,
      !result.success && hasViolation(result, kind, path),
    );
  };
  const clock = (
    duration: number,
    times: number[],
  ): Partial<IAutoMovieMotion> => ({
    duration,
    keyframes: times.map((time: number) => keyframe(time, makePose([]))),
  });
  const eased = (
    patch: Partial<IAutoMovieKeyframe>,
  ): Partial<IAutoMovieMotion> => ({
    keyframes: [{ ...motion.keyframes[0]!, ...patch }, motion.keyframes[1]!],
  });

  // 1.
  TestValidator.equals("endpoints", validate(clock(1, [0, 1])).success, true);
  for (const [duration, times, path] of [
    [1, [], "$input.keyframes"],
    [1, [0], "$input.keyframes"],
    [0, [0, 1], "$input.duration"],
    [1, [0, 2], "$input.keyframes[1].time"],
    [1, [0, 0.5, 0.5], "$input.keyframes[2].time"],
  ] satisfies [number, number[], string][])
    refused(
      `clock ${duration}/${times}`,
      clock(duration, times),
      "temporal",
      path,
    );

  // 2.
  refused(
    "linear controls",
    eased({ easing: "linear", bezier: [0, 0, 1, 1] }),
    "type",
    ".bezier",
  );
  refused(
    "cubic without controls",
    eased({ easing: "cubicBezier", bezier: null }),
    "type",
    ".bezier",
  );
  for (const index of [0, 2])
    for (const outside of [-1, 2]) {
      const bezier: [number, number, number, number] = [0, 0, 1, 1];
      bezier[index] = outside;
      refused(
        `x ${index} = ${outside}`,
        eased({ easing: "cubicBezier", bezier }),
        "range",
        ".bezier",
      );
    }
  TestValidator.equals(
    "y overshoot",
    validate(eased({ easing: "cubicBezier", bezier: [0, -2, 1, 3] })).success,
    true,
  );

  // 3.
  for (const loop of [true, false])
    TestValidator.equals(`loop ${loop}`, validate({ loop }).success, true);
  refused(
    "other rig",
    { skeleton: skeleton.id + "-other" },
    "type",
    "$input.skeleton",
  );

  // 4.
  const origin: IAutoMovieKeyframe = keyframe(
    0,
    makePose([joint("leftLowerArm", { flexion: 0 })]),
  );
  for (const [keyframes, kind, path] of [
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
  ] satisfies [IAutoMovieKeyframe[], AutoMovieViolationKind, string][])
    TestValidator.predicate(
      path,
      hasViolation(validate({ keyframes }), kind, path),
    );
  TestValidator.equals(
    "new joint",
    validate({
      keyframes: [
        origin,
        keyframe(
          1,
          makePose([
            joint("leftLowerArm", { flexion: 30 }),
            joint("leftUpperArm", { flexion: 20 }),
          ]),
        ),
      ],
    }).success,
    true,
  );
}
