import assert from "node:assert/strict";

import { RingFootwork } from "../../../../src/laws/kickboxing/RingFootwork";
import { StepPattern } from "../../../../src/laws/kickboxing/StepPattern";

/**
 * Footwork moves relative to the opponent and the ropes, and steps alternate.
 *
 * Scenarios: circling keeps the distance to the opponent and turns toward the
 * mover's own left; giving ground goes back on a 45-degree diagonal toward the
 * lead side; the presser's lateral cut is half the receiver's; a pivot turns
 * at most a quarter circle; every result stays inside the ropes by the
 * margin; the rope zone is the margin plus two steps; steps alternate with
 * the side of travel leading, never both feet in the air, and both end on
 * the movement's end.
 */
export function test_ring_footwork(): void {
  const ring: RingFootwork.IRing = { half: 3, margin: 0.4, step: 0.23 };
  const a: RingFootwork.IPoint = { x: -0.6, z: 0 };
  const b: RingFootwork.IPoint = { x: 0.6, z: 0 };
  const circled = RingFootwork.move({ movement: "circle", steps: 4 }, a, b, ring);
  assert.ok(Math.abs(Math.hypot(circled.x - b.x, circled.z - b.z) - 1.2) < 1e-9);
  // Facing +x, the own left is +z.
  assert.ok(circled.z > 0);
  const given = RingFootwork.move({ movement: "give", steps: 2 }, b, a, ring);
  assert.ok(Math.abs(Math.atan2(Math.abs(given.z - b.z), given.x - b.x) - Math.PI / 4) < 1e-9);
  const pressed = RingFootwork.move({ movement: "press", steps: 2 }, a, b, ring);
  assert.ok(Math.abs(Math.abs(pressed.z - a.z) - 0.5 * Math.abs(given.z - b.z)) < 1e-9);
  const pivoted = RingFootwork.move({ movement: "pivot", steps: 40 }, a, b, ring);
  const turn = Math.acos(((pivoted.x - b.x) * (a.x - b.x) + (pivoted.z - b.z) * (a.z - b.z)) / (1.2 * 1.2));
  assert.ok(turn <= Math.PI / 2 + 1e-9);
  const far = RingFootwork.move({ movement: "give", steps: 100 }, b, a, ring);
  assert.ok(Math.max(Math.abs(far.x), Math.abs(far.z)) <= 3 - 0.4 + 1e-12);
  assert.ok(RingFootwork.onRopes({ x: 3 - 0.4 - 0.4, z: 0 }, ring));
  assert.ok(!RingFootwork.onRopes({ x: 0, z: 0 }, ring));
  const start = RingFootwork.along("circle", a, circled, b, 0);
  assert.ok(Math.hypot(start.x - a.x, start.z - a.z) < 1e-12);
  for (const steps of [2, 3, 4, 7])
    for (let k = 0; k <= 100; k++) {
      const share = k / 100;
      const left = StepPattern.foot({ steps, first: "left", share }, "left");
      const right = StepPattern.foot({ steps, first: "left", share }, "right");
      const airborne = (f: StepPattern.IFoot): boolean => StepPattern.lift(f.swing) > 0;
      assert.ok(!(airborne(left) && airborne(right)), `both feet up at ${steps}:${share}`);
      if (k === 0) assert.ok(left.swing >= 0 && right.to === 0);
      if (k === 100) assert.ok(left.to === 1 && right.to === 1, `${steps} steps end apart`);
    }
  assert.equal(StepPattern.leading({ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 1, z: 0 }), "left");
  assert.equal(StepPattern.leading({ x: 0, z: 0 }, { x: -1, z: 0 }, { x: 1, z: 0 }), "right");
  assert.equal(StepPattern.leading({ x: 0, z: 0 }, { x: 0, z: -1 }, { x: 1, z: 0 }), "right");
}
