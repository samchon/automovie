import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCourse,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCourse
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanCourse";
import {
  HumanBalance
} from "../../../../../packages/motions/src/everyday/internal/HumanBalance";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** A one-second course at half film frames has 48 knot intervals. */
const INTERVALS: number = 48;

/** Clamping reads the same knot or the same cubic input, preserving its bits. */
const CLAMP_TOLERANCE: number = 0;

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
 * 3. Clipping inside an interval retains both cubic neighbours and holds the value
 *    at the cut afterwards, without evaluating the target on reads.
 * 4. Halfway between knots the course is the Catmull-Rom cubic of its knots.
 * 5. A target ramping at 0.3 m/s is held at each step's midpoint in the exact
 *    recurrence `c ← T + (c − T) e^(−ω Δt)`.
 * 6. With hips that carry the centre 1.1 times as far, each correction reduces the
 *    remaining centre error tenfold.
 * 7. An instant-long course holds its starting position at every read.
 */
export async function test_motions_compose_human_course(): Promise<void> {
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
  const omega: number = Math.sqrt(9.80665 / (1.34 * body.measure.hipHeight));
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
  const dt: number = 1 / INTERVALS;
  const decay: number = Math.exp(-omega * dt);
  /**
   * Rounding envelope in metres for the fixture. The translated coordinates
   * stay below 2 m, allowing 64 rounded arithmetic terms per segment and knot
   * for rest placement, mass reduction, recurrence and interpolation.
   */
  const courseRounding: number =
    2 *
    Number.EPSILON *
    64 *
    (body.massModel.segments.length + 1) *
    (INTERVALS + 1);
  const expected = (t: number): number =>
    0.3 - k + (k - 0.3) * Math.exp(-omega * t);

  // 1. The knots.
  TestValidator.predicate(
    "the hips at the filtered centre at every knot",
    Array.from(
      { length: INTERVALS + 1 },
      (_: unknown, i: number): number => i / INTERVALS,
    ).every((t: number): boolean =>
      nclose(course(t), expected(t), courseRounding),
    ),
  );

  // 2. Outside the span.
  TestValidator.predicate(
    "held outside the span",
    nclose(course(2), course(1), CLAMP_TOLERANCE) &&
      nclose(course(-1), 0, CLAMP_TOLERANCE),
  );

  // 3. Solved through a second.
  const cut: number = (24 + 0.5) / INTERVALS;
  const preparedTargets: number[] = [];
  const through: (seconds: number) => number = AutoMovieMotionHumanCourse.solve(
    {
      ...props,
      target: (seconds: number): number => {
        preparedTargets.push(seconds);
        return 0.3;
      },
    },
    cut,
  );
  TestValidator.predicate(
    "the clipped course retains both neighbours and does no work on reads",
    nclose(through(0.8), through(cut), CLAMP_TOLERANCE) &&
      nclose(through(cut), course(cut), CLAMP_TOLERANCE) &&
      nclose(through(-1), course(-1), CLAMP_TOLERANCE) &&
      preparedTargets.length === 26,
  );

  // 4. Between knots, the Catmull-Rom cubic at s = ½: (a + b)/2 + (ma − mb)/8.
  const knot = (i: number): number =>
    expected(Math.min(INTERVALS, Math.max(0, i)) / INTERVALS);
  TestValidator.predicate(
    "the cubic between knots",
    [0, 7, INTERVALS - 1].every((i: number): boolean => {
      const ma: number = (knot(i + 1) - knot(i - 1)) / 2;
      const mb: number = (knot(i + 2) - knot(i)) / 2;
      return nclose(
        course((i + 0.5) / INTERVALS),
        (knot(i) + knot(i + 1)) / 2 + (ma - mb) / 8,
        courseRounding,
      );
    }),
  );

  // 5. A ramp target, held at each step's midpoint.
  const ramp: (seconds: number) => number = AutoMovieMotionHumanCourse.solve({
    ...props,
    target: (seconds: number): number => 0.3 * seconds,
  });
  let c: number = k;
  const ramped: boolean[] = [];
  for (let i: number = 1; i <= INTERVALS; ++i) {
    const target: number = 0.3 * (i * dt - dt / 2);
    c = target + (c - target) * decay;
    ramped.push(nclose(ramp(i * dt), c - k, courseRounding));
  }
  TestValidator.predicate(
    "the target held at each step's midpoint",
    ramped.every((ok: boolean): boolean => ok),
  );

  // 6. An independently bounded centre error at every corrected knot.
  const gain: number = 1.1;
  const slope: number = gain - 1;
  /**
   * Two corrections contract the error by `slope²`. The carried prediction adds
   * at most `slope·|T − k|·(1 − decay)` of centre error each step. Summing that
   * geometric series and allowing binary64 rounding bounds every knot.
   */
  const correctionTolerance: number =
    (slope ** 3 * Math.abs(0.3 - k) * (1 - decay)) / (1 - slope ** 2) +
    courseRounding;
  const geared: (seconds: number) => number = AutoMovieMotionHumanCourse.solve({
    ...props,
    posture: (seconds: number, along: number): IAutoMovieMotionHumanPosture =>
      posture(seconds, gain * along),
  });
  TestValidator.predicate(
    "the corrections settle the centre on its filter",
    Array.from(
      { length: INTERVALS },
      (_: unknown, i: number): number => (i + 1) / INTERVALS,
    ).every((t: number): boolean =>
      nclose(gain * geared(t), expected(t), correctionTolerance),
    ),
  );

  // 7. A course with no positive time interval.
  const held: (seconds: number) => number = AutoMovieMotionHumanCourse.solve({
    ...props,
    from: 1,
    to: 1,
    start: 0.125,
  });
  TestValidator.predicate(
    "a zero-span course holds where it starts",
    [0, 1, 2].every((seconds: number): boolean =>
      nclose(held(seconds), 0.125, courseRounding),
    ),
  );
}
