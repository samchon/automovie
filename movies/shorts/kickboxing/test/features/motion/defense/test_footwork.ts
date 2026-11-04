import assert from "node:assert/strict";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { FootworkMotion } from "../../../../src/motion/defense/FootworkMotion";

/**
 * Pin independent stance restoration and support transfer before each swing.
 *
 * Scenarios:
 * 1. A forward left-first phrase transfers support, lifts, lands, loads and follows.
 * 2. Every airborne foot has zero requested load and its planted counterpart stays fixed.
 * 3. A separate backward/lateral actor and nonchronological seeks remain independent.
 * 4. Caller/result mutation cannot change a retained route; malformed/overlapping phases refuse.
 *
 * @evidence contracts/testing.md#observable-behavior Exercises the real pure route sampler. Assertions detect paired motion, double swing, unsupported load, support-anchor skating, absent load intervals and history-dependent seeking. Portable tests do not prove displayed Human balance or floor contact.
 * @evidence contracts/testing.md#independent-cases IBA p.36 supplies direction-side-first and following-foot order. Positive configured load intervals require both feet available before the second swing; an airborne foot cannot carry ground support. Exact endpoints follow the supplied .3m displacement, not an output snapshot. Actual FK and moving Viewer review own anatomical feasibility.
 */
export function test_footwork(): void {
  const feet: Record<MotionAction.Side, MotionAction.Vec3> = { left: [.15, 0, .15], right: [-.15, 0, -.15] };
  const phrase: FootworkMotion.Step = { start: 1, unload: .1, swing: .2, load: .1, follow: .2, settle: .1, first: "left", displacement: [.3, 0, 0], clearance: .05 };
  const route: FootworkMotion = new FootworkMotion("alpha", feet, [phrase]);
  near(route.duration, 1.7);
  const other: FootworkMotion = new FootworkMotion("omega", feet, [{ ...phrase, start: 2, first: "right", displacement: [0, 0, -.2] }]);
  for (const time of [1.05, 1.35, 1.65]) {
    const transferring: FootworkMotion.Sample = route.sample(time);
    for (const side of ["left", "right"] as const) {
      assert.equal(transferring.feet[side].phase, "planted", "Unload, load and settle retain both available plants regardless of root shift");
      assert.ok(transferring.support[side] > 0 && transferring.support[side] < 1);
      near(transferring.feet[side].load, transferring.support[side]);
    }
  }
  const firstSwing: FootworkMotion.Sample = route.sample(1.2);
  assert.equal(firstSwing.feet.left.phase, "swing");
  assert.equal(firstSwing.feet.right.phase, "planted");
  near(firstSwing.support.left, 0);
  near(firstSwing.support.right, 1);
  vector(firstSwing.feet.right.target, [-.15, 0, -.15]);
  vector(firstSwing.rootOffset, [-.15, 0, -.15]);
  assert.ok(firstSwing.feet.left.target[1] > .049);
  const load: FootworkMotion.Sample = route.sample(1.35);
  assert.equal(load.feet.left.phase, "planted");
  assert.equal(load.feet.right.phase, "planted");
  vector(load.feet.left.target, [.45, 0, .15]);
  near(load.support.left, .5);
  const follow: FootworkMotion.Sample = route.sample(1.5);
  assert.equal(follow.feet.right.phase, "swing");
  vector(follow.feet.left.target, [.45, 0, .15]);
  near(follow.support.right, 0);
  for (let index: number = 0; index <= 200; index++) {
    const sample: FootworkMotion.Sample = route.sample(index / 100);
    assert.ok(!(sample.feet.left.phase === "swing" && sample.feet.right.phase === "swing"));
    near(sample.support.left + sample.support.right, 1);
    for (const side of ["left", "right"] as const) {
      if (sample.feet[side].phase === "swing") { near(sample.feet[side].load, 0); assert.ok(sample.feet[side].target[1] >= 0); }
      else near(sample.feet[side].target[1], 0);
      if (sample.support[side] > 0) assert.equal(sample.feet[side].phase, "planted");
    }
  }
  const finish: FootworkMotion.Sample = route.sample(1.7);
  vector(finish.rootOffset, [.3, 0, 0]);
  vector(finish.feet.left.target, [.45, 0, .15]);
  vector(finish.feet.right.target, [.15, 0, -.15]);
  vector(other.sample(1.2).rootOffset, [0, 0, 0]);
  vector(other.sample(3).rootOffset, [0, 0, -.2]);
  route.sample(25);
  vector(route.sample(1.2).feet.left.target, firstSwing.feet.left.target);
  phrase.displacement[0] = 999;
  feet.left[0] = 999;
  firstSwing.feet.right.target[0] = 999;
  vector(route.sample(3).rootOffset, [.3, 0, 0]);
  vector(route.sample(1.2).feet.right.target, [-.15, 0, -.15]);
  vector(route.sample(-10).rootOffset, [0, 0, 0]);
  const initial: Record<MotionAction.Side, MotionAction.Vec3> = { left: [.15, 0, .15], right: [-.15, 0, -.15] };
  const clean: FootworkMotion.Step = { ...phrase, displacement: [.3, 0, 0] };
  assert.throws((): FootworkMotion => new FootworkMotion("alpha", initial, [{ ...clean, first: "right" }]));
  assert.throws((): FootworkMotion => new FootworkMotion("alpha", initial, [{ ...clean, load: 0 }]));
  assert.throws((): FootworkMotion => new FootworkMotion("alpha", initial, [{ ...clean, displacement: [.3, .01, 0] }]));
  assert.throws((): FootworkMotion => new FootworkMotion("alpha", initial, [clean, { ...clean, start: 1.6 }]));
  assert.throws((): FootworkMotion => new FootworkMotion("alpha", initial, [{ ...clean, swing: Number.NaN }]));
  assert.throws((): FootworkMotion.Sample => route.sample(Number.NaN));
  const late: FootworkMotion = new FootworkMotion("late", initial, [{ ...clean, start: 20 }]);
  vector(late.sample(30).rootOffset, [.3, 0, 0]);
  const variation: MotionAction.Variation = { seed: 37, timingFraction: .05, aimMetres: .01, amplitudeFraction: .03 };
  const varied: FootworkMotion = new FootworkMotion("varied", initial, [{ ...clean, variation }]);
  const repeated: FootworkMotion = new FootworkMotion("independent-same-seed", initial, [{ ...clean, variation }]);
  vector(varied.sample(3).rootOffset, repeated.sample(3).rootOffset);
  const end: MotionAction.Vec3 = varied.sample(3).rootOffset;
  assert.ok(varied.duration >= 1 + .7 * .95 && varied.duration <= 1 + .7 * 1.05);
  vector(varied.sample(varied.duration).rootOffset, end);
  assert.ok(Math.hypot(end[0] - .3, end[1], end[2]) <= .01900001);
  const different: FootworkMotion = new FootworkMotion("different", initial, [{ ...clean, variation: { ...variation, seed: 38 } }]);
  assert.ok(Math.hypot(...different.sample(3).rootOffset.map((value: number, axis: number): number => value - end[axis])) > 1e-6);
}

/** Compare metre and load scalars at a precision well below the authored distances. */
function near(actual: number, expected: number): void { assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} differs from ${expected}`); }

/** Compare each independently specified metre component without float snapshots. */
function vector(actual: MotionAction.Vec3, expected: MotionAction.Vec3): void { for (const axis of [0, 1, 2] as const) near(actual[axis], expected[axis]); }
