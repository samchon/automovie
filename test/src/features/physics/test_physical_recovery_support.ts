import {
  type advancePhysicalBalance as Balance,
  samplePhysicalRecoverySupport,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** Actual recovery ownership drives support promises causally, independently of an authored calendar.
 *
 * Scenarios:
 * 1. A late confirmed landing ends the swing only at its actual arrival.
 * 2. Future landings do not move earlier goals; adopted body and endpoint offsets remain distinct.
 * 3. An authored handoff ends endpoint ownership, and a failed attempt has a measured end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `advancePhysicalBalance`, `samplePhysicalRecoverySupport` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate; 3 numbered scenarios (first: A late confirmed landing ends the swing only at its actual arrival.; last: An authored handoff ends endpoint ownership, and a failed attempt has a measured end.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (3 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A late confirmed landing ends the swing only at its actual arrival.; last: An authored handoff ends endpoint ownership, and a failed attempt has a measured end.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_recovery_support`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A late confirmed landing ends the swing only at its actual arrival.).
 */
export function test_physical_recovery_support(): void {
  const state: Balance.IState = {
    last: "supported",
    offsets: {},
    steps: [
      {
        bone: "first",
        kind: "swing",
        start: 0.3,
        end: 0.6,
        from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
        to: { point: [0.2, 0], yaw: 0, pitch: 0, clearance: 0 },
        resolved: { seconds: 1, status: "landed" },
      },
      {
        bone: "second",
        kind: "swing",
        start: 2,
        end: 2.3,
        from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
        to: { point: [0.2, 0], yaw: 0, pitch: 0, clearance: 0 },
        resolved: { seconds: 2.6, status: "failed" },
      },
    ],
    landings: [
      {
        bone: "first",
        seconds: 1,
        position: { x: 0.2, y: 0, z: 0 },
        offset: { x: 0.2, y: 0, z: 0 },
        rootOffset: { x: 0.1, y: 0, z: 0 },
      },
    ],
    handoffs: [{ bone: "first", seconds: 1.2 }],
  };
  TestValidator.predicate(
    "planned time cannot invent an early landing",
    samplePhysicalRecoverySupport(state, "first", 0.8).active &&
      samplePhysicalRecoverySupport(state, "first", 0.8).offset.x === 0,
  );
  TestValidator.predicate(
    "completed landing retains endpoint and body goal adjustments",
    !samplePhysicalRecoverySupport(state, "first", 1.1).active &&
      samplePhysicalRecoverySupport(state, "first", 1.1).offset.x === 0.2 &&
      samplePhysicalRecoverySupport(state, "second", 1.1).offset.x === 0.1,
  );
  TestValidator.predicate(
    "authored handoff and actual timeout end their ownership",
    samplePhysicalRecoverySupport(state, "first", 1.3).offset.x === 0.1 &&
      samplePhysicalRecoverySupport(state, "second", 2.5).active &&
      !samplePhysicalRecoverySupport(state, "second", 2.6).active,
  );
}
