import { AutoMovieEngineMotionSampling, AutoMovieEngineMotionTrajectory } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createValidMotion } from "../../internal/fixtures";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** The path's ends. */
const START: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
const END: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * `followPathMotion` walks a looping gait along waypoints at a speed, so its
 * duration is the path's length over the speed; it needs two or more waypoints
 * with a direction between them. `sampleTimes` of an instant is that instant.
 *
 * The gait is the shared valid looping fixture (`createValidMotion`).
 *
 * Scenarios:
 *
 * 1. One metre at one metre a second lasts one second.
 * 2. One waypoint and coincident waypoints are refused.
 * 3. A zero duration samples only its own instant.
 */
export function test_engine_motion_follow_path_motion(): void {
  const walk = (
    waypoints: IAutoMovieVector3[],
  ): ReturnType<typeof AutoMovieEngineMotionTrajectory.followPathMotion> =>
    AutoMovieEngineMotionTrajectory.followPathMotion({
      id: "path",
      gait: { ...createValidMotion(), loop: true },
      waypoints,
      speed: 1,
    });

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

  // 3. An instant.
  const zero: number[] = AutoMovieEngineMotionSampling.sampleTimes(0, 24);
  TestValidator.predicate(
    "a zero duration samples its own instant",
    zero.length > 0 && zero.every((t: number): boolean => t === 0),
  );
}
