import assert from "node:assert/strict";

import { CelebrationShape } from "../../../../src/laws/kickboxing/CelebrationShape";
import { DefenseShape } from "../../../../src/laws/kickboxing/DefenseShape";
import { KickboxingRange } from "../../../../src/laws/kickboxing/KickboxingRange";
import { KickboxingTiming } from "../../../../src/laws/kickboxing/KickboxingTiming";
import { KneeSupport } from "../../../../src/laws/kickboxing/KneeSupport";
import { KnockdownShape } from "../../../../src/laws/kickboxing/KnockdownShape";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { StepPattern } from "../../../../src/laws/kickboxing/StepPattern";
import { StrikeShape } from "../../../../src/laws/kickboxing/StrikeShape";
import { RefereeShape } from "../../../../src/laws/officiating/RefereeShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The bout's reaction, range and walking laws on hand-placed inputs.
 *
 * Scenarios: a straight lands from farther than a hook, which lands with
 * the elbow bent; a limb's floor run vanishes when the rise exceeds its
 * reach; a limb's joint line stands its radius off the struck surface; a
 * landed teep folds the receiver and drives his hips back while a parried
 * one is swept aside in front of the stomach; the walking movements walk
 * and their feet stand one step apart about the origin; a stepping foot
 * keeps the stance's knee bend; the raise goes up only after its start;
 * the raised arm is above the head and the relaxed gloves below the
 * shoulders; the attempt to rise unrolls and draws the knee.
 */
export function test_bout_reactions(): void {
  const cast = polygonCast();
  const a = cast.a.body.measure;
  const b = cast.b.body.measure;

  // Range on the bodies, bent-elbow punches shorter than straights.
  const cross: number = KickboxingRange.of(a, b, "cross");
  const hook: number = KickboxingRange.of(a, b, "hook");
  assert.ok(cross > hook, `cross ${cross} <= hook ${hook}`);
  assert.ok(cross > a.front.body + b.front.head, "bodies apart at a cross");
  assert.ok(Math.abs(KickboxingRange.run(0.5, 0.3) - 0.4) < 1e-12);
  assert.equal(KickboxingRange.run(0.3, 0.5), 0);

  // The joint line stands a limb radius off the struck point.
  const hip = { x: 0, y: 0.9, z: 0.1 };
  const target = { x: 0.8, y: 1.2, z: -0.1 };
  const line = StrikeShape.standoff(hip, target, a.shinRadius);
  assert.ok(
    Math.abs(
      Math.hypot(target.x - line.x, target.z - line.z) - a.shinRadius,
    ) < 1e-12,
  );

  // A landed teep folds and drives back; a parried teep is swept aside.
  const guard = StanceShape.guard(b);
  const rest = StanceShape.feet(b);
  const answer = (answer: "take" | "parry") =>
    DefenseShape.posture({
      measure: b,
      guard,
      rest,
      answer,
      attack: "teep",
      lead: 0.5,
      seconds: answer === "take" ? 0.5 : 0.45,
      scale: 1,
      onset: 0,
      ready: 0.4,
      coverage: 1,
    })!;
  const taken = answer("take");
  assert.ok(taken.shift.forward < 0, "pushed back");
  assert.ok(taken.thoracic.flexion > guard.thoracic.flexion, "folded");
  const parried = answer("parry").hands.right.point;
  assert.ok(parried.x > guard.hands.right.point.x, "glove forward");
  assert.ok(parried.y < b.shoulder - guard.drop, "at the stomach line");

  // A slip carries the head 15 to 25 cm off the line: the hips' shift plus
  // the trunk's side-bend over them.
  const slip: number = DefenseShape.slip(b);
  assert.ok(slip >= 0.15 && slip <= 0.25, `slip ${slip}`);
  const slipped = DefenseShape.posture({
    measure: b,
    guard,
    rest,
    answer: "slip",
    attack: "cross",
    lead: 0.5,
    seconds: 0.45,
    scale: 1,
    onset: 0,
    ready: 0.4,
    coverage: 1,
  })!;
  const bend: number =
    ((Math.abs(slipped.thoracic.lateralFlexion) +
      Math.abs(slipped.lumbar.lateralFlexion)) *
      Math.PI) /
    180;
  assert.ok(
    Math.abs(
      Math.abs(slipped.shift.left) + (b.head - b.hip) * Math.sin(bend) - slip,
    ) < 1e-9,
  );

  // Walking movements walk; the walking feet stand a step apart.
  assert.ok(KickboxingTiming.walking("walk"));
  assert.ok(KickboxingTiming.walking("corner"));
  assert.ok(!KickboxingTiming.walking("approach"));
  const n: number = 8;
  for (let k: number = 1; k < n - 2; k++) {
    const share: number = (k + 1) / n - 1e-9;
    const left = StepPattern.foot(
      { steps: n, first: "left", share, walking: true },
      "left",
    );
    const right = StepPattern.foot(
      { steps: n, first: "left", share, walking: true },
      "right",
    );
    const ahead: number = Math.abs(left.to - right.to);
    assert.ok(Math.abs(ahead - 1 / n) < 1e-6, `step ${k}: ${ahead}`);
  }

  // A stepping foot at the step's clearance still bends its knee.
  const stepping = KneeSupport.legs(
    a,
    {
      left: { x: 0.3, y: a.ankle * (1 + StepPattern.LIFT_SHARE), z: 0.1 },
      right: { x: -0.3, y: a.ankle, z: -0.1 },
    },
    { forward: 0, left: 0 },
  );
  assert.equal(stepping.length, 2);

  // The raise waits for its start, goes up, holds and comes down.
  assert.equal(RefereeShape.raise(-0.2), 0);
  assert.equal(RefereeShape.raise(0.5), 1);
  assert.equal(RefereeShape.raise(1), 0);

  // The winner's raised arm is over his head; relaxed gloves hang low.
  const own = StanceShape.guard(a);
  // The held arm is up; the free glove goes up with it for about a second
  // from the raise, then is back where it was.
  const lifting = CelebrationShape.raised(a, own, 0.5);
  assert.ok(lifting.hands.right.point.y > a.head);
  assert.ok(lifting.hands.left.point.y > a.head, "free glove up");
  const after = CelebrationShape.raised(a, own, 1.5);
  assert.deepEqual(after.hands.left.point, own.hands.left.point);
  assert.deepEqual(
    CelebrationShape.raised(a, own, -0.5).hands.left.point,
    own.hands.left.point,
  );
  const relaxed = CelebrationShape.relax(a, own);
  assert.equal(relaxed.yaw, 0);
  assert.ok(relaxed.hands.left.point.y < a.shoulder);
  assert.ok(relaxed.hands.right.point.y < a.shoulder);

  // The attempt to rise unrolls the lying body and draws the top knee up.
  const lying = KnockdownShape.lying(b, guard);
  const pushed = KnockdownShape.attempt(b, lying, rest, 0.5, 1);
  assert.ok(pushed.roll < lying.roll, "shoulders up off the canvas");
  assert.ok(
    pushed.feet.left!.knee!.x > lying.feet.left!.knee!.x,
    "knee drawn up",
  );
}
