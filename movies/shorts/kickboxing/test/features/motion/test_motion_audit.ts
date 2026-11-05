import assert from "node:assert/strict";

import { FilmRuntime } from "../../../src/film/FilmRuntime";
import { MotionAudit } from "../../../src/film/MotionAudit";

/**
 * The whole three-minute performance keeps its bodies supported, separated and continuous.
 *
 * Samples the same solve the Viewer and export draw, 0–180 s at 10 Hz, and
 * bounds every motion defect class that review rounds have found: feet left
 * behind or sliding off their planted goal, unreached limb goals, speed spikes
 * (pops), trunk or head interpenetration between the fighters, limbs crossing
 * outside an exchange, bodies below the canvas and locked fighting knees.
 *
 * @evidence contracts/testing.md#observable-behavior Runs FilmRuntime.solve and measures FK joints; a regression in footsteps, IK, blocking, reactions or the knockdown shows up as a worse measured value.
 * @evidence contracts/testing.md#independent-cases Thresholds come from the body and the sport, not from the implementation: planted ankles within 3 cm; feet within 0.75 m of the hips (stance length plus a step); trunk joints under 6 m/s and hands/feet under 13 m/s (elite punch and kick speeds); no trunk/head overlap; limb overlap only inside scripted exchanges; nothing more than 1.5 cm below the canvas; fighting knees bent at least 8°.
 */
export function test_motion_audit(): void {
  const report: MotionAudit.Report = MotionAudit.run(
    new FilmRuntime(),
    0,
    180,
    10,
  );
  const describe = (worst: MotionAudit.Worst): string =>
    `${worst.label} ${worst.value.toFixed(3)} at ${worst.seconds.toFixed(2)} s`;
  assert.equal(report.samples, 1801);
  assert.ok(report.plantedFoot.value <= 0.03, describe(report.plantedFoot));
  assert.ok(report.refereeFoot.value <= 0.03, describe(report.refereeFoot));
  assert.ok(report.footSpread.value <= 0.75, describe(report.footSpread));
  assert.ok(report.trunkSpeed.value <= 6, describe(report.trunkSpeed));
  assert.ok(report.limbSpeed.value <= 13, describe(report.limbSpeed));
  assert.ok(report.bodyOverlap.value <= 0, describe(report.bodyOverlap));
  assert.ok(report.limbOverlap.value <= 0, describe(report.limbOverlap));
  assert.ok(report.canvas.value <= 0.015, describe(report.canvas));
  assert.ok(report.straightKnee.value >= 8, describe(report.straightKnee));
}
