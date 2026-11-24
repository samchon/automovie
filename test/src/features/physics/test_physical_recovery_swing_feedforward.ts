import {
  AutoMoviePhysicalBalance,
  samplePhysicalRecoveryGoal,
} from "@automovie/engine";
import type { IAutoMovieSamplePhysicalRecoveryGoal } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The recovery swing's path supplies the acceleration its tracking feeds
 * forward (Khadiv et al. 2017, Section III-C), consistent with its own
 * velocity, and a minimum-jerk transfer peaks at 10 sqrt(3) / 3 d / T^2 (Flash
 * and Hogan 1985):
 *
 * 1. At several clocks inside the swing the acceleration matches the central
 *    difference of the sampled velocity, horizontally and vertically.
 * 2. The horizontal acceleration's peak, at progress 1/2 - sqrt(3)/6, is
 *    `AutoMoviePhysicalBalance.MINIMUM_JERK` d / T^2.
 * 3. The clearance h 16 (p (1 - p))^2 starts and ends at rest, decelerates at -16
 *    h / T^2 at mid-swing, and its acceleration peaks at
 *    `AutoMoviePhysicalBalance.CLEARANCE` h / T^2 at lift-off.
 * 4. Before and after the swing the acceleration is zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the consistency, the closed-form peak and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `samplePhysicalRecoveryGoal` and reads its velocity and acceleration.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the numerical derivative of the sampled velocity and the quintic's closed-form peak.
 * @evidence contracts/development/testing.md#distinguishing-cases Detects a missing or mis-scaled feed-forward, a wrong sign on the clearance's curvature and an acceleration left on outside the swing.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export function test_physical_recovery_swing_feedforward(): void {
  const failures: string[] = [];
  const T: number = 0.3;
  const [dx, dz] = [0.3, 0.1];
  const sample = (
    seconds: number,
  ): IAutoMovieSamplePhysicalRecoveryGoal.IResult =>
    samplePhysicalRecoveryGoal({
      swing: {
        bone: "foot",
        kind: "swing",
        start: 0,
        end: T,
        from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
        to: { point: [dx, dz], yaw: 0, pitch: 0, clearance: 0 },
      },
      point: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      height: 0.05,
      seconds,
    });
  const h: number = 1e-6;
  for (const progress of [0.15, 0.4, 0.5, 0.7, 0.9]) {
    const t: number = progress * T;
    const a = sample(t).acceleration;
    const before = sample(t - h).velocity;
    const after = sample(t + h).velocity;
    for (const axis of ["x", "y", "z"] as const) {
      const expected: number = (after[axis] - before[axis]) / (2 * h);
      if (
        !(
          Math.abs(a[axis] - expected) <=
          1e-4 * Math.max(1, Math.abs(expected))
        )
      )
        failures.push(
          `progress ${progress} ${axis}: ${a[axis]} against ${expected}`,
        );
    }
  }
  const peak: number = (0.5 - Math.sqrt(3) / 6) * T;
  const expected: number =
    (AutoMoviePhysicalBalance.MINIMUM_JERK * Math.hypot(dx, dz)) / (T * T);
  const a = sample(peak).acceleration;
  const actual: number = Math.hypot(a.x, a.z);
  if (!(Math.abs(actual - expected) <= 1e-9 * expected))
    failures.push(`peak ${actual} against ${expected}`);
  // The clearance leaves and meets the floor at rest, and its acceleration
  // peaks at lift-off and touchdown.
  for (const seconds of [1e-6, T - 1e-6]) {
    const vy: number = sample(seconds).velocity.y;
    if (!(Math.abs(vy) < 1e-4))
      failures.push(`vertical speed ${vy} at ${seconds}, not at rest`);
  }
  const middle: number = sample(T / 2).acceleration.y;
  if (!(Math.abs(middle + (16 * 0.05) / (T * T)) < 1e-9))
    failures.push(`mid-swing vertical acceleration ${middle}, not -16 h / T^2`);
  const start: number = sample(1e-9).acceleration.y;
  const peakUp: number = (AutoMoviePhysicalBalance.CLEARANCE * 0.05) / (T * T);
  if (!(Math.abs(start - peakUp) <= 1e-6 * peakUp))
    failures.push(
      `lift-off vertical acceleration ${start}, not CLEARANCE h / T^2`,
    );
  for (const seconds of [-0.1, T + 0.1]) {
    const outside = sample(seconds).acceleration;
    if (outside.x !== 0 || outside.y !== 0 || outside.z !== 0)
      failures.push(
        `acceleration ${JSON.stringify(outside)} outside the swing at ${seconds}`,
      );
  }
  TestValidator.equals("recovery swing feed-forward", failures, []);
}
