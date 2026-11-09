import assert from "node:assert/strict";

import { KneeSupport } from "../../../../src/laws/kickboxing/KneeSupport";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * A standing figure never locks both knees.
 *
 * Scenarios: planted feet carry weight and a lifted foot does not; with
 * both knees held, the root sinks until the longer-reaching leg keeps the
 * least bend and the other bends more; with one knee held, the shorter
 * leg keeps it; a wider step needs a deeper sink; a figure in the air needs
 * none; the guard already keeps both knees at the stance's flexion, above
 * the stance minimum.
 */
export function test_knee_support(): void {
  const measure = polygonCast().a.body.measure;
  const shift = { forward: 0, left: 0 };
  const legs = KneeSupport.legs(
    measure,
    {
      left: { x: 0.3, y: measure.ankle, z: measure.hipHalfWidth },
      right: { x: -0.1, y: measure.ankle, z: -measure.hipHalfWidth },
    },
    shift,
  );
  assert.equal(legs.length, 2);
  assert.equal(
    KneeSupport.legs(
      measure,
      {
        left: { x: 0.3, y: measure.ankle + 0.05, z: measure.hipHalfWidth },
        right: null,
      },
      shift,
    ).length,
    0,
  );
  const near = (x: number, y: number): void =>
    assert.ok(Math.abs(x - y) < 1e-9, `${x} != ${y}`);
  const both: number = KneeSupport.drop(
    measure,
    legs,
    KneeSupport.STANCE,
    "both",
  );
  const hip: number = measure.hip - both;
  const bends: number[] = legs.map((l) => KneeSupport.flexion(measure, l, hip));
  near(Math.min(...bends), KneeSupport.STANCE);
  assert.ok(Math.max(...bends) > KneeSupport.STANCE);
  const one: number = KneeSupport.drop(
    measure,
    legs,
    KneeSupport.UPRIGHT,
    "one",
  );
  near(
    Math.max(
      ...legs.map((l) => KneeSupport.flexion(measure, l, measure.hip - one)),
    ),
    KneeSupport.UPRIGHT,
  );
  assert.ok(
    KneeSupport.drop(
      measure,
      [{ run: 0.5, ankle: measure.ankle }],
      KneeSupport.STANCE,
      "both",
    ) >
      KneeSupport.drop(
        measure,
        [{ run: 0.2, ankle: measure.ankle }],
        KneeSupport.STANCE,
        "both",
      ),
  );
  assert.equal(KneeSupport.drop(measure, [], KneeSupport.STANCE, "both"), 0);
  const guard = StanceShape.guard(measure);
  // The stance feet into the root frame the stance turn rotates.
  const c: number = Math.cos(-StanceShape.TURN);
  const s: number = Math.sin(-StanceShape.TURN);
  const feet = StanceShape.feet(measure);
  const root = (p: { x: number; y: number; z: number }) => ({
    x: p.x * c + p.z * s,
    y: p.y,
    z: -p.x * s + p.z * c,
  });
  const stance = KneeSupport.legs(
    measure,
    { left: root(feet.left), right: root(feet.right) },
    guard.shift,
  );
  assert.ok(
    KneeSupport.drop(measure, stance, KneeSupport.STANCE, "both") <=
      guard.drop + 1e-9,
  );
}
