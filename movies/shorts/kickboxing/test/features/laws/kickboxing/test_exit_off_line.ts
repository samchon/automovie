import assert from "node:assert/strict";

import { RingFootwork } from "../../../../src/laws/kickboxing/RingFootwork";

/**
 * The exit steps off the opponent's line toward the finishing side.
 *
 * Scenarios: an exit lands at its range from the opponent; after a lead
 * finish it lands one step to the mover's left of the line, after a rear
 * finish one step to his right; without a side it goes straight back; an
 * attacker whose opponent is nearer the ropes keeps the line, holding the
 * cut-off.
 */
export function test_exit_off_line(): void {
  const ring: RingFootwork.IRing = { half: 3, margin: 0.5, step: 0.25 };
  const mover = { x: -0.4, z: 0 };
  const opponent = { x: 0.4, z: 0 };
  const range: number = 1.4;
  const exit = (side?: "left" | "right") =>
    RingFootwork.move(
      { movement: "separate", steps: 2, range, ...(side ? { side } : {}) },
      mover,
      opponent,
      ring,
    );
  const near = (x: number, y: number): void =>
    assert.ok(Math.abs(x - y) < 1e-9, `${x} != ${y}`);
  const straight = exit();
  near(straight.x, opponent.x - range);
  near(straight.z, 0);
  // Facing +x, the mover's own left is +z.
  const lead = exit("left");
  const rear = exit("right");
  for (const p of [lead, rear])
    near(Math.hypot(p.x - opponent.x, p.z - opponent.z), range);
  assert.ok(lead.z > 0 && rear.z < 0);
  near(Math.hypot(lead.x - straight.x, lead.z - straight.z), ring.step);
  near(Math.hypot(rear.x - straight.x, rear.z - straight.z), ring.step);
  // Cutting off the ring: with the opponent nearer the ropes than himself,
  // the attacker keeps the line even after a lead finish.
  const pinned = { x: 1.9, z: 0 };
  const presser = { x: 1.1, z: 0 };
  const held = RingFootwork.move(
    { movement: "separate", steps: 2, range, side: "left" },
    presser,
    pinned,
    ring,
  );
  near(held.z, 0);
  near(held.x, pinned.x - range);
}
