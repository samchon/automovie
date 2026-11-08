import assert from "node:assert/strict";
import * as THREE from "three";

import { sampleWalkingApproach } from "../../../src/sampleWalkingApproach";

/**
 * Protect alternating stance, swing clearance and path endpoints of a real consumer planner.
 * @evidence contracts/testing.md#observable-behavior Samples the actual absolute-time walking planner out of order, measures fixed stance within one step and checks both final foot translations. It catches foot sliding in stance, accumulated time and an unfinished final stance; it does not prove anatomical solver or rendered gait quality.
 * @evidence contracts/testing.md#independent-cases A two-metre straight path, four authored steps and explicit neutral foot offsets independently define the start/end positions. The left foot must remain planted during the first right-foot swing, whose midpoint must clear the ground by five centimetres. Invalid duration, nonintegral steps and nonfinite times must refuse.
 */
export function test_walking_approach(): void {
  const input: Omit<Parameters<typeof sampleWalkingApproach>[0], "seconds"> = {
    begin: 0, end: 4, start: new THREE.Vector3(0, 0, 0), finish: new THREE.Vector3(2, 0, 0),
    yaw: 0, steps: 4, rest: { left: new THREE.Vector3(0, 0, 0.1), right: new THREE.Vector3(0, 0, -0.1) },
  };
  const sample: (seconds: number) => ReturnType<typeof sampleWalkingApproach> = (seconds: number): ReturnType<typeof sampleWalkingApproach> => sampleWalkingApproach({ ...input, seconds });
  assert.deepEqual(sample(-1).root.toArray(), [0, 0, 0]);
  assert.deepEqual(sample(5).root.toArray(), [2, 0, 0]);
  assert.deepEqual(sample(0.25).feet.left.toArray(), sample(0.75).feet.left.toArray());
  assert.ok(Math.abs(sample(0.5).feet.right.y - 0.05) < 1e-12);
  for (const side of ["left", "right"] as const) assert.ok(sample(4).feet[side].distanceTo(input.rest[side].clone().add(input.finish)) < 1e-12);
  const before: ReturnType<typeof sample> = sample(1.25); sample(3.75); sample(0);
  assert.deepEqual(sample(1.25), before);
  assert.throws((): void => { sampleWalkingApproach({ ...input, seconds: NaN }); }, /finite/);
  assert.throws((): void => { sampleWalkingApproach({ ...input, seconds: 0, end: 0 }); }, /duration|bounds/);
  assert.throws((): void => { sampleWalkingApproach({ ...input, seconds: 0, steps: 2.5 }); }, /steps/);
}
