import assert from "node:assert/strict";

import { RopeLens } from "../../../../src/interactions/cinematography/RopeLens";

/**
 * A framing held inside the ropes.
 *
 * Scenarios: a framing inside the ropes keeps its floor position and sits
 * at its elevation above the target; a framing beyond the ropes is stopped
 * at the rope limit and rises until it is as far from the target as the
 * framing wanted; the rise stops at the operator's overhead reach; it never
 * drops below the elevation's height.
 */
export function test_rope_lens(): void {
  const overhead: number = 2.2;
  const elevation: number = (10 * Math.PI) / 180;
  const target = { x: 0, y: 1, z: 0 };
  const near = (x: number, y: number): void =>
    assert.ok(Math.abs(x - y) < 1e-12, `${x} != ${y}`);

  const inside = RopeLens.hold(
    { position: { x: 2, y: 1.4, z: 1 }, target },
    3,
    elevation,
    overhead,
  );
  assert.equal(inside.clamped, false);
  near(inside.position.x, 2);
  near(inside.position.z, 1);
  near(inside.position.y, 1 + Math.hypot(2, 1) * Math.tan(elevation));

  const framing = { position: { x: 5, y: 2, z: 0 }, target };
  const held = RopeLens.hold(framing, 3, elevation, 10);
  assert.equal(held.clamped, true);
  near(held.position.x, 3);
  near(
    Math.hypot(held.position.x, held.position.y - target.y, held.position.z),
    Math.hypot(5, 1),
  );
  near(RopeLens.hold(framing, 3, elevation, overhead).position.y, overhead);

  const steep: number = (80 * Math.PI) / 180;
  const raised = RopeLens.hold(framing, 3, steep, overhead);
  near(raised.position.y, 1 + 3 * Math.tan(steep));
}
