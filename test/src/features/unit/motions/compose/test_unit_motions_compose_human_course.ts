import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCourse,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCourse,
  HumanBalance,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** Rounding of the segmental centre and the exponential, metres. */
const ROUNDING: number = 1e-6;

/**
 * `AutoMovieMotionHumanCourse.solve` courses the hips so the body's
 * extrapolated centre of mass stays on a target (Hof, Gazendam and Sinke 2005):
 * the centre obeys `c' = ω (T − c)`, `ω` the inverted pendulum's eigenfrequency
 * at 1.34 hip heights, integrated exactly over each knot step for a target held
 * there, and at each knot the hips stand where the solved posture's centre is
 * that filtered centre; between knots a Catmull-Rom cubic.
 *
 * The body is built whole (`humanFixtureBody`): its segmental centre of mass is
 * read. The average man stands with his hips a distance along +Z, so his centre
 * lies a fixed offset k ahead of them.
 *
 * Scenarios, the hips starting at 0 and the target held at 0.3 m over 1 s:
 *
 * 1. At every knot the hips are at `0.3 − k + (k − 0.3) e^(−ω t)`: the centre
 *    relaxes to the target with the time constant 1 / ω.
 * 2. Past the span the course holds its last place; before it, its first.
 * 3. Solved through 0.5 s, it holds its value at 0.5 s afterwards.
 * 4. Halfway between knots the course is the Catmull-Rom cubic of its knots.
 * 5. A target ramping at 0.3 m/s is held at each step's midpoint in the exact
 *    recurrence `c ← T + (c − T) e^(−ω Δt)`.
 * 6. With hips that carry the centre 1.1 times as far, the centre stands within
 *    5e-5 m of its filter at every knot after the two corrections.
 */
export async function test_unit_motions_compose_human_course(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture = (_: number, along: number): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 0, z: along },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });
  const k: number = HumanBalance.centre(body, posture(0, 0)).z;
  const omega: number = resolveAutoMovieCenterOfMass.frequency(
    resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
  );
  const props: IAutoMovieMotionHumanCourse.IProps = {
    body,
    yaw: 0,
    posture,
    target: (): number => 0.3,
    from: 0,
    to: 1,
    start: 0,
  };
  const course: (seconds: number) => number =
    AutoMovieMotionHumanCourse.solve(props);
  const count: number = Math.ceil(1 / AutoMovieMotionHumanCourse.STEP);
  const expected = (t: number): number =>
    0.3 - k + (k - 0.3) * Math.exp(-omega * t);

  // 1. The knots.
  TestValidator.predicate(
    "the hips at the filtered centre at every knot",
    Array.from(
      { length: count + 1 },
      (_: unknown, i: number): number => i / count,
    ).every((t: number): boolean => nclose(course(t), expected(t), ROUNDING)),
  );

  // 2. Outside the span.
  TestValidator.predicate(
    "held outside the span",
    nclose(course(2), course(1), 0) && nclose(course(-1), 0, ROUNDING),
  );

  // 3. Solved through a second.
  const through: (seconds: number) => number = AutoMovieMotionHumanCourse.solve(
    props,
    0.5,
  );
  TestValidator.predicate(
    "held after the second it was solved through",
    nclose(through(0.8), through(0.5), 0) &&
      nclose(through(0.5), course(0.5), ROUNDING),
  );

  // 4. Between knots, the Catmull-Rom cubic at s = ½: (a + b)/2 + (ma − mb)/8.
  const knot = (i: number): number =>
    expected(Math.min(count, Math.max(0, i)) / count);
  TestValidator.predicate(
    "the cubic between knots",
    [0, 7, count - 1].every((i: number): boolean => {
      const ma: number = (knot(i + 1) - knot(i - 1)) / 2;
      const mb: number = (knot(i + 2) - knot(i)) / 2;
      return nclose(
        course((i + 0.5) / count),
        (knot(i) + knot(i + 1)) / 2 + (ma - mb) / 8,
        ROUNDING,
      );
    }),
  );

  // 5. A ramp target, held at each step's midpoint.
  const ramp: (seconds: number) => number = AutoMovieMotionHumanCourse.solve({
    ...props,
    target: (seconds: number): number => 0.3 * seconds,
  });
  const dt: number = 1 / count;
  const decay: number = Math.exp(-omega * dt);
  let c: number = k;
  const ramped: boolean[] = [];
  for (let i: number = 1; i <= count; ++i) {
    const target: number = 0.3 * (i * dt - dt / 2);
    c = target + (c - target) * decay;
    ramped.push(nclose(ramp(i * dt), c - k, ROUNDING));
  }
  TestValidator.predicate(
    "the target held at each step's midpoint",
    ramped.every((ok: boolean): boolean => ok),
  );

  // 6. Hips that carry the centre 1.1 times as far: each correction shrinks
  //    the place's error tenfold (the fixed point's slope 1 − 1.1), so two
  //    leave a hundredth of a first guess off by a tenth of a ~2 cm step.
  const geared: (seconds: number) => number = AutoMovieMotionHumanCourse.solve({
    ...props,
    posture: (seconds: number, along: number): IAutoMovieMotionHumanPosture =>
      posture(seconds, 1.1 * along),
  });
  TestValidator.predicate(
    "the corrections settle the centre on its filter",
    Array.from(
      { length: count },
      (_: unknown, i: number): number => (i + 1) / count,
    ).every(
      (t: number): boolean =>
        Math.abs(1.1 * geared(t) + k - (expected(t) + k)) < 5e-5,
    ),
  );
}
