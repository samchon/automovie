import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanHand } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A hand's direction on its three rungs: an axis, a share between two axes,
 * and explicit components with their source.
 *
 * World axes for a performer heading 0°: x to the left, y up, z forward. A
 * heading of 90° turns forward to +X.
 *
 * Scenarios:
 * 1. At heading 0, `out` is (1, 0, 0) for the left hand and (-1, 0, 0) for
 *    the right; `up` is (0, 1, 0) and `forward` (0, 0, 1) for both.
 * 2. At heading 90, `forward` is (1, 0, 0).
 * 3. Half way between `up` and `forward` is (0, 0.7071, 0.7071), a unit
 *    vector.
 * 4. Explicit components (out 3, up 0, forward 4) of the right hand are
 *    (-0.6, 0, 0.8).
 * 5. A direction between `up` and `down`, a share of 1.5, explicit
 *    components of zero and an explicit direction with an empty source
 *    throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver and reads the vector; an `out` that does not mirror, a heading that is not applied, or a result that is not a unit vector fails.
 * @evidence contracts/development/testing.md#independent-expectations Every vector is worked out by hand from the stated axes and heading.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both sides, two headings, each rung, and one refusal per rule.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit with no body. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the axes and lists the 5 scenarios with their vectors.
 */
export function test_motion_compose_direction(): void {
  const at = (got: IAutoMovieVector3, x: number, y: number, z: number): boolean =>
    Math.abs(got.x - x) <= 1e-9 &&
    Math.abs(got.y - y) <= 1e-9 &&
    Math.abs(got.z - z) <= 1e-9;

  TestValidator.predicate(
    "the axes at heading 0",
    at(HumanHand.direction("left", 0, "out"), 1, 0, 0) &&
      at(HumanHand.direction("right", 0, "out"), -1, 0, 0) &&
      at(HumanHand.direction("left", 0, "up"), 0, 1, 0) &&
      at(HumanHand.direction("right", 0, "up"), 0, 1, 0) &&
      at(HumanHand.direction("left", 0, "forward"), 0, 0, 1) &&
      at(HumanHand.direction("right", 0, "forward"), 0, 0, 1),
  );
  TestValidator.predicate(
    "forward at heading 90",
    at(HumanHand.direction("left", 90, "forward"), 1, 0, 0),
  );
  TestValidator.predicate(
    "half way between two axes",
    at(
      HumanHand.direction("left", 0, {
        between: ["up", "forward"],
        share: 0.5,
      }),
      0,
      Math.SQRT1_2,
      Math.SQRT1_2,
    ),
  );
  TestValidator.predicate(
    "explicit components",
    at(
      HumanHand.direction("right", 0, {
        explicit: { out: 3, up: 0, forward: 4 },
        source: "provisional: test",
      }),
      -0.6,
      0,
      0.8,
    ),
  );

  TestValidator.error("between opposite axes", (): unknown =>
    HumanHand.direction("left", 0, { between: ["up", "down"], share: 0.5 }),
  );
  TestValidator.error("a between share past 1", (): unknown =>
    HumanHand.direction("left", 0, { between: ["up", "forward"], share: 1.5 }),
  );
  TestValidator.error("explicit components of zero", (): unknown =>
    HumanHand.direction("left", 0, {
      explicit: { out: 0, up: 0, forward: 0 },
      source: "provisional: test",
    }),
  );
  TestValidator.error("an explicit direction without a source", (): unknown =>
    HumanHand.direction("left", 0, {
      explicit: { out: 1, up: 0, forward: 0 },
      source: "",
    }),
  );
}
