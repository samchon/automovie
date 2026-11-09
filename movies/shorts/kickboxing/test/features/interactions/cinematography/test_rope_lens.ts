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
 * ropes steps back to the nearest rope side; the wide camera's lens stands
 * at least the law's height over the top rope and sees a fighter whole over
 * it; an apron handheld sees his upper body through a gap between two ropes
 * and never sits at a rope's height.
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
    [],
    "between",
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
    [],
    "between",
  );
  near(inside.position.x, 3);
  near(inside.position.z, 1.5);

  const framing = { position: { x: 5, y: 2, z: 0 }, target };
  const held = RopeLens.hold(framing, apron, elevation, 10, [], "between");
  assert.equal(held.clamped, true);
  near(held.position.x, 3.6);
  near(
    Math.hypot(held.position.x, held.position.y - target.y, held.position.z),
    Math.hypot(5, 1),
  );
  near(
    RopeLens.hold(framing, apron, elevation, overhead, [], "between").position
      .y,
    overhead,
  );
  const steep: number = (80 * Math.PI) / 180;
  near(
    RopeLens.hold(framing, apron, steep, overhead, [], "between").position.y,
    1 + 3.6 * Math.tan(steep),
  );

  // The wide camera looks down over the top rope: at least the law's height
  // above it, within its reach.
  const roped = { ...apron, ropes: [0.4, 0.7, 1, 1.3] };
  const frame = {
    position: { x: 3.3, y: 1.2, z: 0 },
    target: { x: 0, y: 0.9, z: 0 },
  };
  near(
    RopeLens.hold(frame, roped, elevation, 4, [], "over").position.y,
    1.3 + RopeLens.OVER_TOP,
  );
  near(
    RopeLens.hold(frame, roped, elevation, overhead, [], "over").position.y,
    overhead,
  );
  // The ropes occlude the subjects: over the top rope, a fighter near the
  // ropes is seen whole from his near foot up, clear of the rope's gap.
  const fighter = { center: { x: 2.4, y: 1.1, z: 0 }, radius: 0.3 };
  const whole = RopeLens.clear(
    { x: 3.3, z: 0 },
    1.2,
    [fighter],
    roped,
    4,
    "over",
  );
  const footShare: number = RopeLens.ropeCrossing(
    { x: 3.3, z: 0 },
    { x: 2.7, z: 0 },
    3,
  );
  near(whole, (1.3 + RopeLens.ROPE_GAP) / (1 - footShare));
  // An apron handheld shoots between the ropes: the sightlines to the head
  // and sphere centre cross the rope line between two ropes.
  const gap = RopeLens.clear(
    { x: 3.3, z: 0 },
    1.2,
    [fighter],
    roped,
    2.2,
    "between",
  );
  const c: number = RopeLens.ropeCrossing({ x: 3.3, z: 0 }, { x: 2.4, z: 0 }, 3);
  const at = (h: number): number => gap * (1 - c) + h * c;
  const ropes: number[] = roped.ropes;
  assert.ok(
    ropes.some(
      (r, k) =>
        k + 1 < ropes.length &&
        at(1.1) >= r - 1e-9 &&
        at(1.4) <= ropes[k + 1]! + 1e-9,
    ),
    `gap ${gap}`,
  );
  near(gap, 1.2);
  // A handheld never sits at a rope's height, where the rope fills the
  // frame: wanting the top rope, it drops into the gap under it, the law's
  // gap from the rope.
  for (const wanted of [0.4, 0.7, 1, 1.3, 1.9]) {
    const y: number = RopeLens.clear(
      { x: 3, z: 0 },
      wanted,
      [],
      roped,
      2.2,
      "between",
    );
    for (const rope of roped.ropes)
      assert.ok(
        Math.abs(y - rope) >= RopeLens.ROPE_GAP - 1e-9,
        `${y} against the ${rope} m rope`,
      );
  }
  near(
    RopeLens.clear({ x: 3, z: 0 }, 1.3, [], roped, 2.2, "between"),
    1.3 - RopeLens.ROPE_GAP,
  );
  // No ropes keep the wanted height.
  near(
    RopeLens.clear({ x: 3.3, z: 0 }, 1.2, [fighter], apron, 2.2, "between"),
    1.2,
  );
  near(RopeLens.onApron({ x: 1, y: 2, z: -2.5 }, apron).z, -3);
  near(RopeLens.onApron({ x: 1, y: 2, z: -2.5 }, apron).x, 1);
  near(RopeLens.onApron({ x: 3.1, y: 2, z: 0 }, apron).x, 3.1);
}
