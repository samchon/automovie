import {
  AutoMoviePhysicalBalance as Balance,
  physicalBalanceBracing,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Bounded effort survives prediction/step failure while the body can still stand.
 *
 * Scenarios:
 * 1. Capture correction points into the actual polygon and obeys its travel cap.
 * 2. A failed step keeps effort above the recovery height; collapse withdraws it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalBalance`, `physicalBalanceBracing` on in-memory inputs and asserts the returned observations through 1x TestValidator.predicate, 1x TestValidator.equals; 2 numbered scenarios (first: Capture correction points into the actual polygon and obeys its travel cap.; last: A failed step keeps effort above the recovery height; collapse withdraws it.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (2 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 2 numbered scenarios (first: Capture correction points into the actual polygon and obeys its travel cap.; last: A failed step keeps effort above the recovery height; collapse withdraws it.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_bracing`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Capture correction points into the actual polygon and obeys its travel cap.).
 */
export function test_physical_bracing(): void {
  const point: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
  const assessment: Balance.IResult = {
    state: "unrecoverable",
    capturePoint: point,
    outside: 1.5,
    polygon: [
      { x: -0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: 0.5 },
      { x: -0.5, y: 0, z: 0.5 },
    ],
  };
  const common: Omit<Parameters<typeof physicalBalanceBracing>[0], "center"> = {
    assessment,
    floor: 0,
    minimumCenterHeight: 0.4,
    maximumRootShift: 0.2,
    exhausted: true,
  };
  const standing: ReturnType<typeof physicalBalanceBracing> =
    physicalBalanceBracing({ ...common, center: { x: 0, y: 1, z: 0 } });
  const fallen: ReturnType<typeof physicalBalanceBracing> =
    physicalBalanceBracing({ ...common, center: { x: 0, y: 0.3, z: 0 } });
  TestValidator.predicate(
    "standing effort and bounded physical correction",
    standing.rootStrength === 1 &&
      Math.abs(standing.shift.x + 0.2) < 1e-12 &&
      standing.shift.y === 0 &&
      Math.abs(standing.shift.z) < 1e-12,
  );
  TestValidator.equals(
    "only measured collapse after exhausted recovery withdraws",
    fallen.rootStrength,
    0,
  );
}
