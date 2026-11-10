import { AutoMoviePhysicalTracking as Tracking } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Physical tracking behavior.
 *
 * Scenarios:
 * 1. Exercise actual public inputs and compare physical quantities.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalTracking` on in-memory inputs and asserts the returned observations through 1x TestValidator.predicate; 1 numbered scenario (first: Exercise actual public inputs and compare physical quantities.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (1 assertion site compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 1 numbered scenario (first: Exercise actual public inputs and compare physical quantities.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_layers_tracking`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, each sentence naming the input and the behavior it pins (first: Exercise actual public inputs and compare physical quantities.).
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
