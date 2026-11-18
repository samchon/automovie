import { followPathMotion, sampleTimes, windowSampleTimes } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanAuditMotion } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { createValidMotion } from "../internal/fixtures";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * An endpoint-inclusive clock terminates on a fractional last step.
 *
 * Scenarios:
 * 1. Evaluate the operation at the interior and the limiting case.
 *
 * @evidence contracts/development/testing.md#behavioral-verification An endpoint-inclusive clock terminates on a fractional last step.
 * @evidence contracts/development/testing.md#independent-expectations A tenth of a second contains two full 24 Hz steps and a final clipped step; zero span has no positive increment.
 * @evidence contracts/development/testing.md#distinguishing-cases The boundary outcome distinguishes physical change from normalization.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_clock_termination(): void {
  const gait = { ...createValidMotion(), loop: true };
  const walk = (waypoints: IAutoMovieVector3[]) =>
    followPathMotion({ id: "path", gait, waypoints, speed: 1 });
  const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const end: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  TestValidator.predicate(
    "one waypoint cannot supply a path",
    throwsError(() => walk([start])),
  );
  TestValidator.predicate(
    "nonfinite waypoint cannot supply an interval",
    throwsError(() => walk([start, { ...end, x: NaN }])),
  );
  TestValidator.predicate(
    "coincident endpoints have no direction",
    throwsError(() => walk([start, start])),
  );
  TestValidator.predicate(
    "one metre at one metre per second",
    nclose(walk([start, end]).motion.duration, 1),
  );
  const times: number[] = windowSampleTimes(3, 3.1, 24);
  TestValidator.predicate(
    "actual terminal instant",
    times.length === 4 &&
      nclose(times[3]!, 3.1, 0) &&
      times.every(
        (time: number, i: number): boolean => i === 0 || time > times[i - 1]!,
      ),
  );
  const zero: number[] = sampleTimes(0, 24);
  TestValidator.predicate(
    "zero duration stays at its endpoint",
    zero.length > 0 && zero.every((time: number): boolean => time === 0),
  );
  TestValidator.predicate(
    "nonadvancing rate refused",
    throwsError(() => AutoMovieMotionHumanAuditMotion.grid(0, 1, 0)),
  );
}
