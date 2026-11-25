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
}
