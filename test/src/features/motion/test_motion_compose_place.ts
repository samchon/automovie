import {
  AutoMovieMotionHumanTarget,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A hand's place on its three rungs: three names, names with a nudge or a
 * share between two places, and an explicit record with its source.
 *
 * The body is a stub 1.7 m tall with an upper arm of 0.3 m, a forearm of 0.25
 * m, a half shoulder width of 0.2 m, a shoulder height of 1.4 m, a hip height
 * of 0.9 m and a thigh of 0.4 m.
 *
 * Scenarios:
 * 1. Shoulder height, shoulder lateral and far distance is a height of
 *    1.4 / 1.7 statures, a range of 0.8 arms and a lateral of 1 half shoulder
 *    width for the left hand and -1 for the right.
 * 2. Knee height is the hip height less the thigh, 0.5 / 1.7 statures.
 * 3. A nudge of 0.1 arm lengths on every axis adds 0.1 to the range,
 *    0.055 / 1.7 to the height and 0.055 / 0.2 = 0.275 to the lateral.
 * 4. Half way between the close and the far distance at one height and
 *    lateral is a range of 0.45.
 * 5. An explicit record with a source is returned as written.
 * 6. A nudge of 0.3, a between share of 1.5 and an explicit record with an
 *    empty source throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver and reads the share record; a lateral that does not mirror, a nudge left in arm lengths on the height or lateral axis, or an accepted empty source fails.
 * @evidence contracts/development/testing.md#independent-expectations Every number is a quotient of the stub's stated measures worked out by hand, not read from the share tables.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both sides, a derived height, each rung, and one refusal per bound.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on a stub of the measures the resolver reads. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the stub and lists the 6 scenarios with their numbers.
 */
export function test_motion_compose_place(): void {
  const body: IHumanBody = {
    measure: {
      stature: 1.7,
      upperArm: 0.3,
      forearm: 0.25,
      shoulderHalfWidth: 0.2,
      shoulderHeight: 1.4,
      hipHeight: 0.9,
      thigh: 0.4,
    },
  } as unknown as IHumanBody;
  const near = (got: number | undefined, expected: number): boolean =>
    got !== undefined && Math.abs(got - expected) <= 1e-9;
  const grid: AutoMovieMotionHumanTarget.IGrid = {
    height: "shoulder",
    lateral: "shoulder",
    distance: "far",
  };

  const left = AutoMovieMotionHumanTarget.place(body, "left", grid);
  const right = AutoMovieMotionHumanTarget.place(body, "right", grid);
  TestValidator.predicate(
    "three names on both sides",
    near(left.height, 1.4 / 1.7) &&
      near(left.range, 0.8) &&
      near(left.lateral, 1) &&
      near(right.height, 1.4 / 1.7) &&
      near(right.lateral, -1),
  );
  TestValidator.predicate(
    "the knee height",
    near(
      AutoMovieMotionHumanTarget.place(body, "left", {
        ...grid,
        height: "knee",
      }).height,
      0.5 / 1.7,
    ),
  );

  const nudged = AutoMovieMotionHumanTarget.place(body, "left", {
    at: grid,
    nudge: { out: 0.1, up: 0.1, forward: 0.1 },
  });
  TestValidator.predicate(
    "a nudge in arm lengths",
    near(nudged.range, 0.9) &&
      near(nudged.height, (1.4 + 0.055) / 1.7) &&
      near(nudged.lateral, 1.275),
  );
  TestValidator.predicate(
    "half way between two places",
    near(
      AutoMovieMotionHumanTarget.place(body, "left", {
        between: [{ ...grid, distance: "close" }, grid],
        share: 0.5,
      }).range,
      0.45,
    ),
  );

  const explicit: AutoMovieMotionHumanTarget.IDefault = {
    height: 0.6,
    range: 0.7,
    lateral: 0.2,
    facing: "up",
  };
  TestValidator.equals(
    "an explicit record",
    AutoMovieMotionHumanTarget.place(body, "left", {
      explicit,
      source: "provisional: test",
    }),
    explicit,
  );

  TestValidator.error("a nudge past its bound", (): unknown =>
    AutoMovieMotionHumanTarget.place(body, "left", {
      at: grid,
      nudge: { forward: 0.3 },
    }),
  );
  TestValidator.error("a between share past 1", (): unknown =>
    AutoMovieMotionHumanTarget.place(body, "left", {
      between: [{ ...grid, distance: "close" }, grid],
      share: 1.5,
    }),
  );
  TestValidator.error("an explicit record without a source", (): unknown =>
    AutoMovieMotionHumanTarget.place(body, "left", { explicit, source: " " }),
  );
}
