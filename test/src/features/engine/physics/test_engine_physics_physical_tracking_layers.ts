import { AutoMovieEnginePhysicalTracking as Tracking } from "@automovie/engine";
import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalTracking,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A one-axis tracking demand reaches its torque bound at full strength and withdraws all x effort at zero strength.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Checks that a one-axis tracking demand saturates at its torque cap and withdraws active effort at zero strength.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the tracking torque operation for a 0.5 rad x target with identical axes, rates and inertia at strengths 1 and 0.
 * @evidence contracts/development/testing.md#independent-expectations Positive signed error demands positive x torque within 2 N·m and carries the x saturation flag. Zero strength makes x torque zero.
 */
export function test_engine_physics_physical_tracking_layers(): void {
  const axes: IAutoMoviePhysicalJointAxis[] = [
    {
      axis: "x",
      minimum: -1,
      maximum: 1,
      stiffness: 100,
      damping: 10,
      maximumTorque: 2,
      channel: "rotation.x",
    },
  ];
  const tracked: IAutoMoviePhysicalTracking.IResult = Tracking.torque(
    { x: 0, y: 0, z: 0, w: 1 },
    { x: Math.sin(0.25), y: 0, z: 0, w: Math.cos(0.25) },
    { x: 0, y: 0, z: 0 },
    axes,
    { x: 1, y: 1, z: 1 },
    1 / 120,
    1,
  );
  const limp: IAutoMoviePhysicalTracking.IResult = Tracking.torque(
    { x: 0, y: 0, z: 0, w: 1 },
    { x: Math.sin(0.25), y: 0, z: 0, w: Math.cos(0.25) },
    { x: 0, y: 0, z: 0 },
    axes,
    { x: 1, y: 1, z: 1 },
    1 / 120,
    0,
  );
  TestValidator.predicate(
    "torque is bounded and withdrawal is physical",
    (): boolean =>
      tracked.torque.x > 0 &&
      tracked.torque.x <= 2 &&
      tracked.saturated.includes("x") &&
      limp.torque.x === 0,
  );
}
