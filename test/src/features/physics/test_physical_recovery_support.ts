import { TestValidator } from "@nestia/e2e";

import type { advancePhysicalBalance as Balance } from "../../../../packages/engine/src/physics/advancePhysicalBalance";
import { samplePhysicalRecoverySupport } from "../../../../packages/engine/src/physics/samplePhysicalRecoverySupport";

/** Actual recovery ownership drives support promises causally, independently of an authored calendar.
 *
 * Scenarios:
 * 1. A late confirmed landing ends the swing only at its actual arrival.
 * 2. Future landings do not move earlier goals; adopted body and endpoint offsets remain distinct.
 * 3. An authored handoff ends endpoint ownership, and a failed attempt has a measured end.
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
