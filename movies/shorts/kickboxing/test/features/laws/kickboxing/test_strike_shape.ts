import { Vector3 } from "@automovie/engine";
import assert from "node:assert/strict";

import { DefenseShape } from "../../../../src/laws/kickboxing/DefenseShape";
import { KickboxingTechnique } from "../../../../src/laws/kickboxing/KickboxingTechnique";
import { KickboxingTiming } from "../../../../src/laws/kickboxing/KickboxingTiming";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { StrikeShape } from "../../../../src/laws/kickboxing/StrikeShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * Strike and defense shapes bend toward the receiver's region and keep the
 * kick guard.
 *
 * Scenarios: at contact a punch's glove centre lies a glove radius minus
 * the landing depth short of the target along the shoulder-to-target line,
 * so the knuckles press into the region; the stance step is half the stance
 * length and the stance drop grows with knee flexion; through a round kick's
 * chamber, impact and recoil, on both sides, the kicking-side glove reaches
 * forward at the head line while the other stays at the guard's cheek; the
 * Brazilian kick's shin descends onto the target; strikes and answers return
 * to nothing after their recovery; a slip moves the head outside the punch.
 */
export function test_strike_shape(): void {
  const { a } = polygonCast();
  const measure = a.body.measure;
  const guard = StanceShape.guard(measure);
  const rest = StanceShape.feet(measure);
  assert.equal(StanceShape.step(measure), StanceShape.length(measure) / 2);
  assert.ok(StanceShape.drop(measure, 30) > StanceShape.drop(measure, 10));
  const target = { x: measure.armReach * 0.9, y: measure.head - guard.drop, z: 0 };
  const cross = KickboxingTechnique.table.cross;
  const at = StrikeShape.posture({ measure, guard, rest, spec: cross, seconds: KickboxingTiming.JAB_DELIVERY, target })!;
  const shoulder = { x: 0, y: measure.shoulder - guard.drop, z: -measure.shoulderHalfWidth };
  const direction = Vector3.normalize(Vector3.subtract(target, shoulder));
  const expected = Vector3.subtract(target, Vector3.scale(direction, measure.gloveRadius - StrikeShape.LANDING_DEPTH));
  assert.ok(Vector3.length(Vector3.subtract(at.hands.right.point, expected)) < 1e-9);
  assert.equal(StrikeShape.posture({ measure, guard, rest, spec: cross, seconds: 2, target }), null);
  for (const name of ["body-kick", "switch-kick", "brazilian-kick", "low-kick"] as const) {
    const spec = KickboxingTechnique.table[name];
    const side = spec.side;
    const other = KickboxingTechnique.opposite(side);
    for (const seconds of [KickboxingTiming.KICK_CHAMBER, KickboxingTiming.KICK_IMPACT, KickboxingTiming.KICK_IMPACT + 0.3]) {
      const p = StrikeShape.posture({ measure, guard, rest, spec, seconds, target: { x: 0.8, y: 1.2, z: 0 } })!;
      assert.ok(p.hands[side].point.x > guard.hands[side].point.x, `${name} ${side} glove forward at ${seconds}`);
      assert.ok(Math.abs(p.hands[side].point.y - (measure.head - guard.drop)) < measure.headRadius, `${name} head line`);
      assert.ok(Vector3.length(Vector3.subtract(p.hands[other].point, guard.hands[other].point)) < measure.headRadius, `${name} cheek`);
    }
  }
  const brazilian = StrikeShape.posture({ measure, guard, rest, spec: KickboxingTechnique.table["brazilian-kick"], seconds: KickboxingTiming.KICK_IMPACT, target: { x: 0.8, y: 1.55, z: 0 } })!;
  assert.ok(brazilian.feet.right!.knee!.y > 1.55, "knee above the target before the descent");
  const slip = DefenseShape.posture({ measure, guard, rest, answer: "slip", attack: "jab", lead: 0.4, seconds: 0.4, scale: 1 })!;
  assert.ok(slip.shift.left < 0, "outside a jab is the receiver's right");
  assert.equal(DefenseShape.posture({ measure, guard, rest, answer: "slip", attack: "jab", lead: 0.4, seconds: 2, scale: 1 }), null);
}
