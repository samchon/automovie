import { AutoMovieEngineMotionSampling, AutoMovieEngineMotionTrajectory } from "@automovie/engine";
import type { IAutoMovieFollowPathMotion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createValidMotion } from "../../internal/fixtures";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** The path's ends. */
const START: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
const END: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * `followPathMotion` walks a looping gait along a path of distinct waypoints.
 * One whole gait cycle exactly matches the requested speed in this fixture.
 *
 * The gait is the shared valid looping fixture (`createValidMotion`).
 *
 * Scenarios:
 *
 * 1. One metre at one metre a second lasts one second.
 * 2. One waypoint and coincident waypoints are refused.
 * 3. The zero-duration sampling list is nonempty and contains only time zero.
 * 4. Non-finite speed, gait duration and turn width each raise their own
 *    diagnostic. Finite inputs that overflow the baked duration also fail.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names path duration, insufficient or stationary paths, the zero-duration sampling check, and invalid path timing.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `followPathMotion` on a looping fixture with a valid path, a one-point path, and coincident waypoints. Independently calls `sampleTimes` for a zero-duration clip. Direct calls also check per-input and derived-clock refusals.
 * @evidence contracts/development/testing.md#independent-expectations One metre divided by one metre per second is one second. The degenerate paths have no travel direction. At zero duration the returned sampling list must be nonempty and every instant must equal zero. An X span of 1.6e308 m divided by 0.375 m/s and 1e308 s rounds to four cycles, whose full duration exceeds the finite numeric range.
 */
export function test_engine_motion_follow_path_motion(): void {
  const props: IAutoMovieFollowPathMotion.IProps = {
    id: "path",
    gait: { ...createValidMotion(), loop: true },
    waypoints: [START, END],
    speed: 1,
  };
  const bake = AutoMovieEngineMotionTrajectory.followPathMotion;
  const walk = (waypoints: IAutoMovieVector3[]) =>
    bake({ ...props, waypoints });

  // 1. Length over speed.
  TestValidator.predicate(
    "one metre at one metre a second",
    nclose(walk([START, END]).motion.duration, 1),
  );

  // 2. Refusals.
  TestValidator.predicate(
    "no path without two distinct waypoints",
    throwsError((): ReturnType<typeof AutoMovieEngineMotionTrajectory.followPathMotion> => walk([START])) &&
      throwsError(
        (): ReturnType<typeof AutoMovieEngineMotionTrajectory.followPathMotion> => walk([START, START]),
      ),
  );

  for (const invalid of [-Infinity, Infinity, NaN]) {
    TestValidator.predicate(
      `independent path parameters refuse ${invalid}`,
      throwsError(() => bake({ ...props, speed: invalid }), "path speed") &&
        throwsError(
          () => bake({ ...props, gait: { ...props.gait, duration: invalid } }),
          "path gait duration",
        ) &&
        throwsError(
          () => bake({ ...props, turnWindow: invalid }),
          "path turn window",
        ),
    );
  }
  const fast = bake({ ...props, speed: Number.MAX_VALUE, turnWindow: 0 });
  TestValidator.predicate(
    "a finite requested pace and zero corner blend permit a one-cycle walk",
    fast.cycles === 1 && fast.motion.duration === 1,
  );
  TestValidator.predicate(
    "finite authored inputs cannot produce an infinite baked duration",
    throwsError(
      () => bake({
        ...props,
        speed: 0.375,
        gait: { ...props.gait, duration: 1e308 },
        waypoints: [START, { x: 1.6e308, y: 0, z: 0 }],
      }),
      "path duration must be finite",
    ),
  );

  // 3. An instant.
  const zero: number[] = AutoMovieEngineMotionSampling.sampleTimes(0, 24);
  TestValidator.predicate(
    "a zero duration samples its own instant",
    zero.length > 0 && zero.every((t: number): boolean => t === 0),
  );
}
