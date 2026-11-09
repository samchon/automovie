import assert from "node:assert/strict";

import { RopeLens } from "../../../../src/interactions/cinematography/RopeLens";

/**
 * A framing held on the apron.
 *
 * Scenarios: a framing whose lens already stands on the apron keeps its
 * floor position and sits at its elevation above the target; one inside the
 * ropes backs out along its sightline to the rope line; one beyond the
 * canvas stops at the edge and rises until it is as far from the target as
 * the framing wanted, but no higher than the operator's overhead reach, and
 * never below the elevation's height; a followed point carried inside the
 * ropes steps back to the nearest rope side; the lens rises until its
 * sightline to the floor under the target clears the top rope.
 */
export function test_rope_lens(): void {
  const apron = { half: 3, canvasHalf: 3.6, ropes: [] as number[] };
  const overhead: number = 2.2;
  const elevation: number = (10 * Math.PI) / 180;
  const target = { x: 0, y: 1, z: 0 };
  const near = (x: number, y: number): void =>
    assert.ok(Math.abs(x - y) < 1e-12, `${x} != ${y}`);

  const onIt = RopeLens.hold(
    { position: { x: 3.1, y: 1.4, z: 1 }, target },
    apron,
    elevation,
    overhead,
  );
  assert.equal(onIt.clamped, false);
  near(onIt.position.x, 3.1);
  near(onIt.position.z, 1);
  near(onIt.position.y, 1 + Math.hypot(3.1, 1) * Math.tan(elevation));

  const inside = RopeLens.hold(
    { position: { x: 2, y: 1.4, z: 1 }, target },
    apron,
    elevation,
    overhead,
  );
  near(inside.position.x, 3);
  near(inside.position.z, 1.5);

  const framing = { position: { x: 5, y: 2, z: 0 }, target };
  const held = RopeLens.hold(framing, apron, elevation, 10);
  assert.equal(held.clamped, true);
  near(held.position.x, 3.6);
  near(
    Math.hypot(held.position.x, held.position.y - target.y, held.position.z),
    Math.hypot(5, 1),
  );
  near(RopeLens.hold(framing, apron, elevation, overhead).position.y, overhead);
  const steep: number = (80 * Math.PI) / 180;
  near(
    RopeLens.hold(framing, apron, steep, overhead).position.y,
    1 + 3.6 * Math.tan(steep),
  );

  // Over the top rope: the floor sightline to the target clears the rope.
  const roped = { ...apron, ropes: [0.4, 0.7, 1, 1.3] };
  const over = RopeLens.hold(
    { position: { x: 3.3, y: 1.2, z: 0 }, target: { x: 0, y: 0.9, z: 0 } },
    roped,
    elevation,
    overhead,
  );
  const share: number = RopeLens.ropeCrossing(over.position, { x: 0, z: 0 }, 3);
  near(share, 0.3 / 3.3);
  assert.ok(over.position.y * (1 - share) >= 1.3 - 1e-9);
  near(RopeLens.onApron({ x: 1, y: 2, z: -2.5 }, apron).z, -3);
  near(RopeLens.onApron({ x: 1, y: 2, z: -2.5 }, apron).x, 1);
  near(RopeLens.onApron({ x: 3.1, y: 2, z: 0 }, apron).x, 3.1);
}
