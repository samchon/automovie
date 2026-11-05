import assert from "node:assert/strict";

import { Footsteps } from "../../../../src/motion/footwork/Footsteps";
import type { Foot } from "../../../../src/motion/rig/Foot";

/**
 * Footsteps follow a moving stance with alternating, bounded, supported steps.
 *
 * Cases: a long straight walk (both feet must keep up and alternate — the
 * defect where only the lead foot stepped left the rear foot metres behind);
 * a standing stance (no steps at all); a reservation (a reserved foot never
 * swings inside its window and lands at the stance's placement at its end).
 *
 * @evidence contracts/testing.md#observable-behavior Builds real schedules through the public constructor and reads them back with `at` and `steps`.
 * @evidence contracts/testing.md#independent-cases Expected values come from walking geometry: at 1 m/s with 0.3 s steps each foot must land within one stride (≤ 0.9 m) of where the stance wants it, feet must alternate within a walk, and a body that does not move needs no step.
 */
export function test_footsteps(): void {
  const walking = (t: number): Record<Footsteps.Side, Foot.Placement> => {
    const x: number = Math.max(0, Math.min(3, t - 1));
    return {
      left: { ball: [x + 0.1, 0.11], yaw: 0, heel: 0, lift: 0 },
      right: { ball: [x + 0.1, -0.11], yaw: 0, heel: 0, lift: 0 },
    };
  };
  const walk: Footsteps = new Footsteps({
    start: 0,
    end: 6,
    desired: walking,
    heading: (): number => 0,
    busy: [],
    duration: 0.3,
    threshold: 0.1,
    height: 0.06,
    lead: "left",
  });

  // Both feet keep up throughout the walk.
  for (let t: number = 0; t <= 6; t += 0.05)
    for (const side of ["left", "right"] as const) {
      const state: Footsteps.State = walk.at(side, t);
      const want: Foot.Placement = walking(t)[side];
      assert.ok(
        Math.abs(state.placement.ball[0] - want.ball[0]) <= 0.95,
        `${side} foot ${state.placement.ball[0].toFixed(2)} m behind ${want.ball[0].toFixed(2)} m at ${t.toFixed(2)} s`,
      );
    }

  // Feet alternate and every stride is bounded.
  const swings: Footsteps.Step[] = walk.steps.filter(
    (step: Footsteps.Step): boolean => step.start > 1.05 && step.end < 3.9,
  );
  assert.ok(
    swings.length >= 4,
    `only ${swings.length} steps during a 3 m walk`,
  );
  for (let i: number = 1; i < swings.length; i++)
    assert.notEqual(
      swings[i]!.side,
      swings[i - 1]!.side,
      "consecutive steps used the same foot",
    );
  for (const step of walk.steps)
    assert.ok(
      Math.hypot(
        step.to.ball[0] - step.from.ball[0],
        step.to.ball[1] - step.from.ball[1],
      ) <=
        0.9 + 1e-9,
      "stride over 0.9 m",
    );

  // A stance that does not move takes no step.
  const still: Footsteps = new Footsteps({
    start: 0,
    end: 3,
    desired: (): Record<Footsteps.Side, Foot.Placement> => walking(0),
    heading: (): number => 0,
    busy: [],
    duration: 0.3,
    threshold: 0.1,
    height: 0.06,
    lead: "left",
  });
  assert.equal(still.steps.length, 0);

  // A reserved foot does not swing inside its window and lands where the stance wants it.
  const reserved: Footsteps = new Footsteps({
    start: 0,
    end: 6,
    desired: walking,
    heading: (): number => 0,
    busy: [{ side: "right", start: 2, end: 2.6 }],
    duration: 0.3,
    threshold: 0.1,
    height: 0.06,
    lead: "left",
  });
  for (const step of reserved.steps)
    assert.ok(
      step.end <= 2 || step.start >= 2.6,
      "a foot swung during another foot's reservation",
    );
  assert.equal(reserved.at("right", 2.3).phase, "busy");
  assert.ok(
    Math.abs(
      reserved.at("right", 2.65).placement.ball[0] - walking(2.6).right.ball[0],
    ) < 1e-9,
  );
}
