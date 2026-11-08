import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalTracking as Tracking } from "../../../../packages/engine/src/physics/AutoMoviePhysicalTracking";

/** Physical tracking behavior.
 *
 * Scenarios:
 * 1. Exercise actual public inputs and compare physical quantities.
 */
export function test_physical_layers_tracking(): void {
  const axes: P.IAxis[] = [
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
  const tracked: Tracking.IResult = Tracking.torque(
    { x: 0, y: 0, z: 0, w: 1 },
    { x: Math.sin(0.25), y: 0, z: 0, w: Math.cos(0.25) },
    { x: 0, y: 0, z: 0 },
    axes,
    { x: 1, y: 1, z: 1 },
    1 / 120,
    1,
  );
  const limp: Tracking.IResult = Tracking.torque(
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
