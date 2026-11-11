import {
  AutoMovieMotionHumanRange,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A joint amount on its three rungs: a level, a level with a scale, and
 * explicit degrees with their source.
 *
 * The limits are the engine's default ranges: a knee flexion of 150°, a neck
 * flexion and extension of 45°, a hip extension of 30° and an elbow flexion
 * of 150°. The levels are shares of a limit: slight 0.1, light 0.25, half
 * 0.5, deep 0.75.
 *
 * Scenarios:
 * 1. A deep knee flexion is 112.5°, a slight one 15°, a light neck flexion
 *    11.25°, a half elbow flexion 75°, and a slight hip extension -3°, signed
 *    as the clinical angle is.
 * 2. Light scaled by 1.2 is a share of 0.3 and 13.5° of neck flexion.
 * 3. Explicit 12° of the neck is 12 as flexion and -12 as extension.
 * 4. A light lean is a quarter of the reach's lean limit of 45°, 11.25°.
 * 5. A shift of 0.018 statures on a body 1.7 m tall is 0.0306 m.
 * 6. A scale of 2, explicit degrees past the limit (160° of knee flexion),
 *    an explicit amount with an empty source and a motion the joint has no
 *    range in (knee abduction) throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public functions and reads the degrees; a share of the wrong limit, an extension without its sign, or a clamped refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations Every number is the stated share times the stated limit, worked out by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers four joints with three different limits, both signs, each rung, the lean, the shift and one refusal per rule.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit over the engine's range table. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the limits and the levels and lists the 6 scenarios with their numbers.
 */
export function test_motion_compose_range(): void {
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;
  const degrees = AutoMovieMotionHumanRange.degrees;
  const source: string = "provisional: test";

  TestValidator.predicate(
    "levels on four joints",
    near(degrees("leftLowerLeg", "flexion", "deep"), 112.5) &&
      near(degrees("leftLowerLeg", "flexion", "slight"), 15) &&
      near(degrees("neck", "flexion", "light"), 11.25) &&
      near(degrees("leftLowerArm", "flexion", "half"), 75) &&
      near(degrees("leftUpperLeg", "extension", "slight"), -3),
  );
  TestValidator.predicate(
    "a level with a scale",
    near(AutoMovieMotionHumanRange.share("half"), 0.5) &&
      near(AutoMovieMotionHumanRange.share({ level: "light", scale: 1.2 }), 0.3) &&
      near(degrees("neck", "flexion", { level: "light", scale: 1.2 }), 13.5),
  );
  TestValidator.predicate(
    "explicit degrees take the motion's sign",
    near(degrees("neck", "flexion", { degrees: 12, source }), 12) &&
      near(degrees("neck", "extension", { degrees: 12, source }), -12),
  );
  TestValidator.predicate(
    "the lean and the shift",
    near(AutoMovieMotionHumanRange.lean("light"), 11.25) &&
      near(
        AutoMovieMotionHumanRange.shift(
          { measure: { stature: 1.7 } } as unknown as IHumanBody,
          0.018,
        ),
        0.0306,
      ),
  );

  TestValidator.error("a scale past its bound", (): unknown =>
    AutoMovieMotionHumanRange.share({ level: "light", scale: 2 }),
  );
  TestValidator.error("explicit degrees past the limit", (): unknown =>
    degrees("leftLowerLeg", "flexion", { degrees: 160, source }),
  );
  TestValidator.error("explicit degrees without a source", (): unknown =>
    degrees("neck", "flexion", { degrees: 12, source: "" }),
  );
  TestValidator.error("a motion with no range", (): unknown =>
    degrees("leftLowerLeg", "abduction", "light"),
  );
}
