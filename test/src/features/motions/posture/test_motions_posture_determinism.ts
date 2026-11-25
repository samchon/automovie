import {
  HumanKnot,
  HumanPathParameterization,
  minimizeHumanBrent,
  prepareHumanAdaptiveKnots,
  prepareHumanKnotCourse,
  prepareHumanSampledCourse,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The instants read, in ascending order. */
const ASCENDING: readonly number[] = Array.from(
  { length: 61 },
  (_: unknown, i: number): number => i / 20,
);

/** The same instants in a scrambled order: a stride coprime to their count. */
const SCRAMBLED: readonly number[] = ASCENDING.map(
  (_: number, i: number): number => ASCENDING[(i * 37) % ASCENDING.length]!,
);

/** A curve through knots with a hold, timed optimally. */
function course(): prepareHumanKnotCourse.ICourse {
  return prepareHumanKnotCourse(
    [
      [0, 0],
      [1, 0.5],
      [1.5, -0.2],
    ].map(
      (position: number[], k: number): HumanKnot.IKnot => ({
        position,
        dwell: k === 1 ? 0.3 : 0,
      }),
    ),
    {
      kind: "optimal",
      segments: [
        { velocity: 1, acceleration: 2 },
        { velocity: 0.8, acceleration: 1 },
      ],
      precision: 1e-4,
      overshoot: 0.01,
    },
  );
}

/** A sampled course of a smooth value with a mark and a break. */
function sampled(): (seconds: number) => number[] {
  return prepareHumanSampledCourse({
    from: 0,
    to: 3,
    marks: [0.9],
    breaks: [2.1],
    sample: (t: number): number[] => [Math.sin(2 * t), Math.cos(t)],
    tolerance: { kind: "absolute", absolute: 1e-4 },
    step: 1e-3,
  });
}

/** A map of reads at the instants, in the given order, keyed by instant. */
function reads(
  read: (seconds: number) => readonly number[],
  order: readonly number[],
): Map<number, readonly number[]> {
  return new Map(
    order.map((t: number): [number, readonly number[]] => [t, read(t)]),
  );
}

/** Whether two read maps hold bitwise-equal values at every instant. */
function identical(
  a: Map<number, readonly number[]>,
  b: Map<number, readonly number[]>,
): boolean {
  return ASCENDING.every((t: number): boolean =>
    a
      .get(t)!
      .every((v: number, c: number): boolean => Object.is(v, b.get(t)![c])),
  );
}

/**
 * The primitives are deterministic and their readers pure: preparing the same
 * inputs twice gives bitwise-equal answers, and a prepared course read at the
 * same instants in any order gives the same values, so a frame rendered alone,
 * out of order or again shows the same motion.
 *
 * Scenarios:
 *
 * 1. An optimally timed knot course with a hold, prepared twice: equal positions
 *    and velocities at every twentieth of a second over 3 s, read ascending in
 *    one and scrambled in the other.
 * 2. A sampled course with a mark and a break, prepared twice: equal values, read
 *    ascending and scrambled.
 * 3. AutoKnots, TOPP-RA and Brent's search run twice return equal knots, squared
 *    path velocities and minima.
 */
export function test_motions_posture_determinism(): void {
  // 1. The knot course.
  const first: prepareHumanKnotCourse.ICourse = course();
  const again: prepareHumanKnotCourse.ICourse = course();
  TestValidator.predicate(
    "the knot course is pure and repeatable",
    identical(
      reads(first.position, ASCENDING),
      reads(again.position, SCRAMBLED),
    ) &&
      identical(
        reads((t: number): number[] => first.state(t).velocity, SCRAMBLED),
        reads((t: number): number[] => again.state(t).velocity, ASCENDING),
      ) &&
      first.end === again.end,
  );

  // 2. The sampled course.
  TestValidator.predicate(
    "the sampled course is pure and repeatable",
    identical(reads(sampled(), ASCENDING), reads(sampled(), SCRAMBLED)),
  );

  // 3. The solvers.
  const knots = (): prepareHumanAdaptiveKnots.IKnots =>
    prepareHumanAdaptiveKnots({
      from: 0,
      to: 2,
      evaluate: (t: number): number[] => [Math.exp(-t) * Math.sin(5 * t)],
      tolerance: { kind: "absolute", absolute: 1e-4 },
    });
  const grid: number[] = Array.from(
    { length: 21 },
    (_: unknown, i: number): number => i / 20,
  );
  const topp = (): number[] =>
    HumanPathParameterization.parametrize({
      path: {
        gridpoints: grid,
        first: grid.map((s: number): number[] => [Math.cos(s), Math.sin(s)]),
        second: grid.map((s: number): number[] => [-Math.sin(s), Math.cos(s)]),
      },
      velocities: [],
      accelerations: [{ lower: [-1, -1], upper: [1, 1] }],
      start: 0,
      end: 0,
    }).parametrization;
  const brent = (): minimizeHumanBrent.IMinimum =>
    minimizeHumanBrent(
      (x: number): number => Math.cosh(x - 0.4) + 0.1 * x * x * x,
      -1,
      2,
      1e-8,
    );
  const equal = (a: readonly number[], b: readonly number[]): boolean =>
    a.length === b.length &&
    a.every((x: number, i: number): boolean => Object.is(x, b[i]));
  TestValidator.predicate(
    "the solvers repeat bitwise",
    equal(knots().times, knots().times) &&
      equal(topp(), topp()) &&
      Object.is(brent().at, brent().at),
  );
}
