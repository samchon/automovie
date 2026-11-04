import assert from "node:assert/strict";

import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { FootworkMotion } from "../../../../src/motion/defense/FootworkMotion";

/**
 * Supported yaw changes only the currently unloaded sole and accumulates across phrases.
 * Scenarios: 1. First swing, two-foot load and following swing. 2. Six small turns reach exactly ninety degrees. 3. Arbitrary seek and input/output ownership.
 * @evidence contracts/testing.md#observable-behavior Runs the actual portable footwork sampler. Independent planar rotation and quaternion expectations detect skating planted anchors, rotating a loaded sole, moving both feet airborne, losing cumulative orientation or history-dependent endpoints. Both positive loads require planted phases and all shares sum to one. These pure kinematic tests do not establish actual Human ROM, ground geometry, balance or moving Viewer acceptance.
 * @evidence contracts/testing.md#independent-cases Each sole turns about the supplied entry midpoint and only during its unloaded swing; the body takes half the angle in each swing. Six explicitly supplied pi/12 turns sum to pi/2, whose planar rotation exchanges X and Z with the right-handed Y sign. The unchanged host's physical checks own actual feasibility.
 */
export function test_footwork_turn_support_and_seek(): void {
  const feet: Record<MotionAction.Side, MotionAction.Vec3> = {
    left: [0.16, 0, 0.12],
    right: [-0.16, 0, -0.12],
  };
  const angle: number = Math.PI / 12;
  const phrase: FootworkMotion.Step = {
    start: 0,
    unload: 0.1,
    swing: 0.2,
    load: 0.1,
    follow: 0.2,
    settle: 0.2,
    first: "left",
    displacement: [0, 0, 0],
    clearance: 0.04,
    turnRadians: angle,
  };
  const route: FootworkMotion = new FootworkMotion("turner", feet, [phrase]);
  const rotatedLeft: MotionAction.Vec3 = [
    Math.cos(angle) * 0.16 + Math.sin(angle) * 0.12,
    0,
    -Math.sin(angle) * 0.16 + Math.cos(angle) * 0.12,
  ];
  const first: FootworkMotion.Sample = route.sample(0.2);
  assert.equal(first.feet.left.phase, "swing");
  near(first.feet.left.load, 0);
  vector(first.feet.right.target, feet.right);
  rotation(first.feet.right.orientation, 0);
  rotation(first.feet.left.orientation, angle / 2);
  rotation(first.rootRotation, angle / 4);
  near(first.feet.left.target[0], (0.16 + rotatedLeft[0]) / 2);
  near(first.feet.left.target[2], (0.12 + rotatedLeft[2]) / 2);
  near(first.feet.left.target[1], 0.04);

  const loading: FootworkMotion.Sample = route.sample(0.35);
  assert.equal(loading.feet.left.phase, "planted");
  assert.equal(loading.feet.right.phase, "planted");
  vector(loading.feet.left.target, rotatedLeft);
  vector(loading.feet.right.target, feet.right);
  rotation(loading.feet.left.orientation, angle);
  rotation(loading.feet.right.orientation, 0);
  rotation(loading.rootRotation, angle / 2);
  const follow: FootworkMotion.Sample = route.sample(0.5);
  assert.equal(follow.feet.right.phase, "swing");
  vector(follow.feet.left.target, rotatedLeft);
  rotation(follow.feet.left.orientation, angle);
  rotation(follow.feet.right.orientation, angle / 2);
  rotation(follow.rootRotation, angle * 0.75);

  const steps: FootworkMotion.Step[] = Array.from(
    { length: 6 },
    (_: unknown, index: number): FootworkMotion.Step => ({
      ...phrase,
      start: index * 0.8,
      first: index % 2 === 0 ? "left" : "right",
      displacement: [0, 0, 0],
    }),
  );
  const complete: FootworkMotion = new FootworkMotion("six-turns", feet, steps);
  const ending: FootworkMotion.Sample = complete.sample(complete.duration);
  rotation(ending.rootRotation, Math.PI / 2);
  for (const side of ["left", "right"] as const) {
    rotation(ending.feet[side].orientation, Math.PI / 2);
    vector(ending.feet[side].target, [feet[side][2], 0, -feet[side][0]]);
    vector(ending.feet[side].offset!, [
      feet[side][2] - feet[side][0],
      0,
      -feet[side][0] - feet[side][2],
    ]);
  }
  vector(ending.rootOffset, [0, 0, 0]);
  near(ending.support.left, 0.5);
  near(ending.support.right, 0.5);
  for (let index: number = 0; index <= 600; index++) {
    const sample: FootworkMotion.Sample = complete.sample(index / 120);
    near(sample.support.left + sample.support.right, 1);
    assert.ok(
      !(
        sample.feet.left.phase === "swing" &&
        sample.feet.right.phase === "swing"
      ),
    );
    for (const side of ["left", "right"] as const) {
      if (sample.feet[side].phase === "swing") {
        near(sample.support[side], 0);
        assert.ok(sample.feet[side].target[1] >= 0);
      } else near(sample.feet[side].target[1], 0);
      if (sample.support[side] > 0)
        assert.equal(sample.feet[side].phase, "planted");
    }
  }
  const expected: string = JSON.stringify(complete.sample(1.1));
  complete.sample(4.8);
  complete.sample(-1);
  complete.sample(2.3);
  assert.equal(JSON.stringify(complete.sample(1.1)), expected);
  phrase.turnRadians = -angle;
  phrase.displacement[0] = 999;
  feet.left[0] = 999;
  ending.feet.left.target[0] = 999;
  ending.rootRotation![1] = 999;
  rotation(complete.sample(complete.duration).rootRotation, Math.PI / 2);
  vector(route.sample(0.2).feet.right.target, [-0.16, 0, -0.12]);
}

/**
 * Zero-turn compatibility and closed angle admission keep existing translational routes intact.
 * Scenarios: 1. Omitted and explicit zero turns. 2. Signed turns with translation. 3. Invalid angles and stationary no-op refusal.
 * @evidence contracts/testing.md#observable-behavior Calls the real constructor and sampler with omitted, zero, signed and invalid angles. The known .3m translation endpoint remains unchanged and added quaternion fields are absent for identity. A translated quarter-turn uses independently computed midpoint rotation. Caller-supplied invalid turns refuse before sampling; no host or foreign function is substituted.
 * @evidence contracts/testing.md#independent-cases Right-handed Y rotation maps (x,z) to (z,-x) at pi/2 and (-z,x) at -pi/2. Principal turn inputs are closed [-pi,pi], while zero travel plus zero turn is not a step. Existing test_footwork owns the complete translation-phase oracle; these cases own the new optional input and output semantics.
 */
export function test_footwork_turn_zero_and_bounds(): void {
  const feet: Record<MotionAction.Side, MotionAction.Vec3> = {
    left: [0.15, 0, 0.15],
    right: [-0.15, 0, -0.15],
  };
  const phrase: FootworkMotion.Step = {
    start: 1,
    unload: 0.1,
    swing: 0.2,
    load: 0.1,
    follow: 0.2,
    settle: 0.1,
    first: "left",
    displacement: [0.3, 0, 0],
    clearance: 0.05,
  };
  const implicit: FootworkMotion = new FootworkMotion("same", feet, [phrase]);
  const zero: FootworkMotion = new FootworkMotion("same", feet, [
    { ...phrase, turnRadians: 0 },
  ]);
  for (const seconds of [-1, 1, 1.05, 1.2, 1.35, 1.5, 1.65, 1.7, 20]) {
    const sample: FootworkMotion.Sample = implicit.sample(seconds);
    assert.deepEqual(sample, zero.sample(seconds));
    assert.equal(sample.rootRotation, undefined);
    for (const side of ["left", "right"] as const)
      assert.equal(sample.feet[side].orientation, undefined);
  }
  vector(zero.sample(2).rootOffset, [0.3, 0, 0]);
  for (const turn of [Math.PI / 2, -Math.PI / 2, Math.PI, -Math.PI]) {
    const turning: FootworkMotion = new FootworkMotion("signed", feet, [
      { ...phrase, turnRadians: turn },
    ]);
    const sample: FootworkMotion.Sample = turning.sample(2);
    rotation(sample.rootRotation, turn);
    vector(sample.rootOffset, [0.3, 0, 0]);
    for (const side of ["left", "right"] as const)
      vector(sample.feet[side].target, [
        0.3 + Math.cos(turn) * feet[side][0] + Math.sin(turn) * feet[side][2],
        0,
        -Math.sin(turn) * feet[side][0] + Math.cos(turn) * feet[side][2],
      ]);
  }
  for (const turn of [
    NaN,
    Infinity,
    -Infinity,
    Math.PI + 0.001,
    -Math.PI - 0.001,
  ])
    assert.throws(
      (): FootworkMotion =>
        new FootworkMotion("invalid", feet, [{ ...phrase, turnRadians: turn }]),
    );
  assert.throws(
    (): FootworkMotion =>
      new FootworkMotion("no-op", feet, [
        { ...phrase, displacement: [0, 0, 0], turnRadians: 0 },
      ]),
  );
  assert.throws((): FootworkMotion.Sample => zero.sample(Infinity));
}

/**
 * Adjacent phrases consume one authoritative end rather than multiplying a second nominal period.
 * Scenarios: 1. Nine phase-chained phrases at the actual unit and film scales. 2. Both exact public landing boundaries are planted. 3. A genuine overlap and the former multiplied starts still refuse. 4. Original variation and malformed phase clocks.
 * @evidence contracts/testing.md#observable-behavior Builds actual FootworkMotion routes with each next start taken from its public end operation and observes exact stored duration, admitted joins, unchanged stride endpoints and load ownership. Sampling both public landing instants must already yield planted feet, catching a second origin subtraction that recreates ULP boundary errors. It also submits genuinely overlapping steps, preserving strict refusal. This portable test checks clocks and route requests, not actual Human support or a browser.
 * @evidence contracts/testing.md#independent-cases The unchanged .08/.24/.08/.24/.10 phases total .74 seconds and nine .025m translations total .225m. IEEE-754 multiplication gives a smaller boundary than the ordered previous end at scale1 index6 and scale.85 index3; these original caller inputs remain invalid until their clocks are actually chained. One millisecond of explicit overlap is independently invalid. Timing variation bounds come from its existing contract and must be applied once.
 */
export function test_footwork_authoritative_phase_end(): void {
  const feet: Record<MotionAction.Side, MotionAction.Vec3> = {
    left: [0.15, 0, 0.15],
    right: [-0.15, 0, -0.15],
  };
  for (const scale of [1, 0.85]) {
    const steps: FootworkMotion.Step[] = [];
    let cursor: number = 0;
    for (let index: number = 0; index < 9; index++) {
      const step: FootworkMotion.Step = {
        start: cursor,
        unload: 0.08 * scale,
        swing: 0.24 * scale,
        load: 0.08 * scale,
        follow: 0.24 * scale,
        settle: 0.1 * scale,
        first: "left",
        displacement: [0.025, 0, 0],
        clearance: 0.04,
      };
      steps.push(step);
      cursor = FootworkMotion.end(step);
    }
    const route: FootworkMotion = new FootworkMotion("chained", feet, steps);
    assert.equal(route.duration, cursor);
    near(route.duration, 9 * 0.74 * scale);
    vector(route.sample(route.duration).rootOffset, [0.225, 0, 0]);
    for (const step of steps) {
      const boundary: FootworkMotion.Sample = route.sample(step.start);
      assert.equal(boundary.phase, "unloading");
      assert.equal(boundary.feet.left.phase, "planted");
      assert.equal(boundary.feet.right.phase, "planted");
      near(boundary.support.left, 0.5);
      near(boundary.support.right, 0.5);
      const firstLanding: number = FootworkMotion.end(step, "first-landing");
      const secondLanding: number = FootworkMotion.end(step, "second-landing");
      const first: FootworkMotion.Sample = route.sample(firstLanding);
      const second: FootworkMotion.Sample = route.sample(secondLanding);
      assert.equal(first.phase, "loading");
      assert.equal(second.phase, "settling");
      for (const side of ["left", "right"] as const) {
        assert.equal(first.feet[side].phase, "planted");
        assert.equal(second.feet[side].phase, "planted");
        near(first.feet[side].target[1], 0);
        near(second.feet[side].target[1], 0);
      }
      near(first.support.left, 0);
      near(first.support.right, 1);
      near(second.support.left, 1);
      near(second.support.right, 0);
      assert.equal(
        route.sample(firstLanding - 0.000001).feet.left.phase,
        "swing",
      );
      assert.equal(
        route.sample(secondLanding - 0.000001).feet.right.phase,
        "swing",
      );
    }
    assert.equal(route.sample(route.duration).phase, "planted");
    assert.throws(
      (): FootworkMotion =>
        new FootworkMotion("real-overlap", feet, [
          steps[0]!,
          { ...steps[1]!, start: FootworkMotion.end(steps[0]!) - 0.001 },
        ]),
    );
    assert.throws(
      (): FootworkMotion =>
        new FootworkMotion(
          "multiplied-boundaries",
          feet,
          steps.map(
            (
              step: FootworkMotion.Step,
              index: number,
            ): FootworkMotion.Step => ({
              ...step,
              start: index * 0.74 * scale,
            }),
          ),
        ),
    );
  }
  const varied: FootworkMotion.Step = {
    start: 2,
    unload: 0.08,
    swing: 0.24,
    load: 0.08,
    follow: 0.24,
    settle: 0.1,
    first: "left",
    displacement: [0.1, 0, 0],
    clearance: 0.04,
    variation: {
      seed: 37,
      timingFraction: 0.05,
      amplitudeFraction: 0,
      aimMetres: 0,
    },
  };
  const variedEnd: number = FootworkMotion.end(varied);
  assert.ok(variedEnd >= 2 + 0.74 * 0.95 && variedEnd <= 2 + 0.74 * 1.05);
  assert.equal(
    new FootworkMotion("varied-clock", feet, [varied]).duration,
    variedEnd,
  );
  for (const invalid of [NaN, Infinity, -1, 0])
    assert.throws((): number =>
      FootworkMotion.end({ ...varied, variation: undefined, swing: invalid }),
    );
  assert.throws((): number => FootworkMotion.end({ ...varied, start: -1 }));
}

/**
 * Direct displacement preserves the original anchor and source motion independently of point rounding.
 * Scenarios: 1. Exact zero during initial and stationary phases. 2. A nonzero binary displacement below the initial point's spacing. 3. Complete cumulative travel, height and result ownership.
 * @evidence contracts/testing.md#observable-behavior Executes the real route sampler and inspects its published foot displacement alongside the unchanged point output. A stationary foot must retain exact positive zeros. A tiny finite displacement must survive even when adding it to the original point rounds back to that point, which distinguishes direct trajectory accumulation from target-minus-initial reconstruction. This pure test establishes request precision, not actual rendered motion or Human support.
 * @evidence contracts/testing.md#independent-cases The binary increment 2^-60 and its half are exactly representable and smaller than the spacing at the supplied .15-metre coordinate. The configured halfway swing contributes half that increment and .04m height; the original foot stays fixed. Two .25m phrases independently require .5m cumulative offsets. Existing turning cases verify the same displacement field against a ninety-degree planar rotation.
 */
export function test_footwork_direct_displacement(): void {
  const feet: Record<MotionAction.Side, MotionAction.Vec3> = {
    left: [0.15, 0, 0.15],
    right: [-0.15, 0, -0.15],
  };
  const increment: number = 2 ** -60;
  const phrase: FootworkMotion.Step = {
    start: 0,
    unload: 0.1,
    swing: 0.2,
    load: 0.1,
    follow: 0.2,
    settle: 0.1,
    first: "left",
    displacement: [increment, 0, 0],
    clearance: 0.04,
  };
  const route: FootworkMotion = new FootworkMotion("direct-offset", feet, [
    phrase,
  ]);
  for (const seconds of [-1, 0, 0.05]) {
    const sample: FootworkMotion.Sample = route.sample(seconds);
    for (const side of ["left", "right"] as const) {
      assert.ok(sample.feet[side].offset);
      for (const component of sample.feet[side].offset!)
        assert.ok(Object.is(component, 0));
    }
  }
  const middle: FootworkMotion.Sample = route.sample(0.2);
  assert.ok(Object.is(middle.feet.left.offset![0], increment / 2));
  assert.ok(Object.is(middle.feet.left.offset![2], 0));
  near(middle.feet.left.offset![1], 0.04);
  assert.ok(Object.is(middle.feet.left.target[0], feet.left[0]));
  for (const component of middle.feet.right.offset!)
    assert.ok(Object.is(component, 0));
  const landing: FootworkMotion.Sample = route.sample(
    FootworkMotion.end(phrase, "first-landing"),
  );
  assert.ok(Object.is(landing.feet.left.offset![0], increment));
  for (const component of landing.feet.right.offset!)
    assert.ok(Object.is(component, 0));
  const complete: FootworkMotion.Sample = route.sample(route.duration);
  for (const side of ["left", "right"] as const) {
    assert.ok(Object.is(complete.feet[side].offset![0], increment));
    assert.ok(Object.is(complete.feet[side].offset![1], 0));
    assert.ok(Object.is(complete.feet[side].offset![2], 0));
  }
  middle.feet.left.offset![0] = 999;
  assert.ok(Object.is(middle.feet.left.target[0], feet.left[0]));
  assert.ok(Object.is(route.sample(0.2).feet.left.offset![0], increment / 2));
  const first: FootworkMotion.Step = { ...phrase, displacement: [0.25, 0, 0] };
  const following: FootworkMotion.Step = {
    ...first,
    start: FootworkMotion.end(first),
  };
  const repeated: FootworkMotion = new FootworkMotion(
    "accumulated-offset",
    feet,
    [first, following],
  );
  for (const side of ["left", "right"] as const)
    vector(repeated.sample(repeated.duration).feet[side].offset!, [0.5, 0, 0]);
  const before: string = JSON.stringify(repeated.sample(following.start + 0.2));
  repeated.sample(repeated.duration);
  repeated.sample(0);
  assert.equal(JSON.stringify(repeated.sample(following.start + 0.2)), before);
}

/** Compare the pure scalar construction well below the authored metre/radian scale. */
function near(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-10,
    `${actual} differs from ${expected}`,
  );
}

/** Check independently specified planar coordinates without output snapshots. */
function vector(actual: MotionAction.Vec3, expected: MotionAction.Vec3): void {
  for (const axis of [0, 1, 2] as const) near(actual[axis], expected[axis]);
}

/** Inspect the actual x/y/z/w delta against the independently supplied yaw angle. */
function rotation(
  actual: FootworkMotion.Sample["rootRotation"],
  radians: number,
): void {
  const quaternion: NonNullable<FootworkMotion.Sample["rootRotation"]> =
    actual ?? [0, 0, 0, 1];
  near(quaternion[0], 0);
  near(quaternion[1], Math.sin(radians / 2));
  near(quaternion[2], 0);
  near(quaternion[3], Math.cos(radians / 2));
  near(Math.hypot(...quaternion), 1);
}
