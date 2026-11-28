import { AutoMovieEnginePhysics } from "@automovie/engine";
import type { IAutoMoviePhysicalRecoveryState } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Actual recovery ownership drives support promises causally, independently of
 * an authored calendar.
 *
 * Scenarios:
 *
 * 1. A late confirmed landing ends the swing only at its actual arrival.
 * 2. Future landings do not move earlier goals; adopted body and endpoint offsets
 *    remain distinct.
 * 3. An authored handoff ends endpoint ownership, and a failed attempt has a
 *    measured end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual landing, authored ownership handoff and timeout on the physical rather than planned clock.
 * @evidence contracts/development/testing.md#behavioral-verification Samples support before and after a later confirmed landing, then reads separate adopted offsets, authored takeover and failed recovery.
 * @evidence contracts/development/testing.md#independent-expectations The declared arrival instant controls support transition. Body and endpoint offsets remain distinct, and future receipts cannot retroactively move a prior goal.
 */
export function test_engine_physics_sample_physical_recovery_support(): void {
  const state: IAutoMoviePhysicalRecoveryState = {
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
    AutoMovieEnginePhysics.samplePhysicalRecoverySupport(state, "first", 0.8).active &&
      AutoMovieEnginePhysics.samplePhysicalRecoverySupport(state, "first", 0.8).offset.x === 0,
  );
  TestValidator.predicate(
    "completed landing retains endpoint and body goal adjustments",
    !AutoMovieEnginePhysics.samplePhysicalRecoverySupport(state, "first", 1.1).active &&
      AutoMovieEnginePhysics.samplePhysicalRecoverySupport(state, "first", 1.1).offset.x === 0.2 &&
      AutoMovieEnginePhysics.samplePhysicalRecoverySupport(state, "second", 1.1).offset.x === 0.1,
  );
  TestValidator.predicate(
    "authored handoff and actual timeout end their ownership",
    AutoMovieEnginePhysics.samplePhysicalRecoverySupport(state, "first", 1.3).offset.x === 0.1 &&
      AutoMovieEnginePhysics.samplePhysicalRecoverySupport(state, "second", 2.5).active &&
      !AutoMovieEnginePhysics.samplePhysicalRecoverySupport(state, "second", 2.6).active,
  );
}
