import assert from "node:assert/strict";

import { createPersonParameters } from "../../../../src/assets/person/createPersonParameters";
import { FilmBodyRig as BodyRig } from "../../../../src/motion/rig/FilmBodyRig";
import { FilmVector as Vec3 } from "../../../../src/motion/rig/FilmVector";
import { Foot } from "../../../../src/motion/rig/Foot";

/**
 * The limb solver reaches reachable goals in a turned, lowered fighting stance and stays bounded otherwise.
 *
 * @evidence contracts/testing.md#observable-behavior Solves a real Human body through the public BodyRig and measures the returned pose with the same body's public FK.
 * @evidence contracts/testing.md#independent-cases Goals are placed by stance geometry inside the measured leg and arm lengths (feet under a lowered, 30°-turned pelvis; a guard glove beside the face), so a correct solver must reach them within 1.5 cm; a glove goal 1 m beyond the shoulder is unreachable and must return a finite, clamped pose with a reported error, not throw. Repeating the solve must give the identical pose (seek determinism).
 */
export function test_body_rig(): void {
  const rig: BodyRig = new BodyRig(createPersonParameters(1800, true));
  const yaw: number = 0.55;
  const root: BodyRig.Placement = {
    position: [0, -0.08, 0],
    rotation: [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)],
  };
  const world = (x: number, y: number, z: number): Vec3.Value =>
    Vec3.rotateY([x, y, z], 0);
  const lead: Foot.Goals = Foot.goals(
    { ball: [0.34, 0.11], yaw: 0.3, heel: 0.12, lift: 0 },
    rig.footVector,
  );
  const rear: Foot.Goals = Foot.goals(
    { ball: [-0.24, -0.19], yaw: 0.85, heel: 0.42, lift: 0 },
    rig.footVector,
  );
  const request: BodyRig.Request = {
    root,
    pose: {
      pelvis: { tilt: 4 },
      spine: { thoracic: { flexion: 10, rotation: 10 } },
    },
    legs: {
      left: {
        point: lead.ankle,
        aim: { bone: "ball", point: lead.ball, weight: 0.7 },
      },
      right: {
        point: rear.ankle,
        aim: { bone: "ball", point: rear.ball, weight: 0.7 },
      },
    },
    arms: {
      left: { point: world(0.3, 1.5, 0.08) },
      right: { point: world(0.15, 1.48, -0.12) },
    },
  };
  const result: BodyRig.Result = rig.solve(request);
  assert.ok(
    result.error <= 0.015,
    `reachable stance goals missed by ${result.error.toFixed(3)} m`,
  );
  assert.deepEqual(rig.solve(request).pose, result.pose);

  // Every knee stays flexed in a lowered stance.
  for (const side of ["left", "right"] as const)
    assert.ok(
      (result.pose.legs?.[side]?.knee?.flexion ?? 0) > 5,
      `${side} knee locked`,
    );

  const far: BodyRig.Result = rig.solve({
    ...request,
    arms: { left: { point: world(1.4, 1.5, 0.1) } },
  });
  assert.ok(
    Number.isFinite(far.error) && far.error > 0.3,
    "an unreachable glove goal must report its residual",
  );
}
