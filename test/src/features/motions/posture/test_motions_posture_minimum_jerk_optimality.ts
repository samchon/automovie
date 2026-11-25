import {
  HumanMinimumJerkSpline,
  HumanQuinticSegment,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** Relative rounding of the block elimination and one quintic's derivatives. */
const ROUNDING: number = 1e-9;

/** The rest-to-rest quintic's peak rate over a unit move and duration, 15/8. */
const PEAK: number = 15 / 8;

/** A perturbation of one interior derivative, its units per second (squared). */
const NUDGE: number = 0.05;

/**
 * Three-point Gauss-Legendre nodes on [0, 1] and their weights: exact to degree
 * 5.
 */
const NODES: readonly number[] = [
  0.5 - Math.sqrt(3 / 5) / 2,
  0.5,
  0.5 + Math.sqrt(3 / 5) / 2,
];
const WEIGHTS: readonly number[] = [5 / 18, 8 / 18, 5 / 18];

/** Whether two values agree to the relative rounding. */
function agree(a: number, b: number): boolean {
  return Math.abs(a - b) <= ROUNDING * (1 + Math.abs(a) + Math.abs(b));
}

/** A segment's snap at a share of it: the fourth derivative of `Σ b_i τ^i` by t. */
function snap(
  segment: HumanQuinticSegment.ISegment,
  u: number,
  c: number,
): number {
  const b: readonly number[] = segment.coefficients[c]!;
  return (24 * b[4]! + 120 * b[5]! * u) / segment.duration ** 4;
}

/** The quintics through points with their velocities and accelerations. */
function join(
  times: readonly number[],
  x: readonly (readonly number[])[],
  derived: HumanMinimumJerkSpline.IDerivatives,
  period?: number,
): HumanQuinticSegment.ISegment[] {
  const count: number = period === undefined ? times.length - 1 : times.length;
  return Array.from(
    { length: count },
    (_: unknown, j: number): HumanQuinticSegment.ISegment => {
      const k: number = (j + 1) % times.length;
      return HumanQuinticSegment.prepare(
        {
          position: x[j]!,
          velocity: derived.velocities[j]!,
          acceleration: derived.accelerations[j]!,
        },
        {
          position: x[k]!,
          velocity: derived.velocities[k]!,
          acceleration: derived.accelerations[k]!,
        },
        (k === 0 ? times[0]! + period! : times[k]!) - times[j]!,
      );
    },
  );
}

/** Whether jerk and snap carry from one segment's end into the next's start. */
function continuous(
  left: HumanQuinticSegment.ISegment,
  right: HumanQuinticSegment.ISegment,
): boolean {
  const end: HumanQuinticSegment.IState = HumanQuinticSegment.state(
    left,
    left.duration,
  );
  const start: HumanQuinticSegment.IState = HumanQuinticSegment.state(right, 0);
  return end.jerk.every(
    (j: number, c: number): boolean =>
      agree(j, start.jerk[c]!) &&
      agree(end.velocity[c]!, start.velocity[c]!) &&
      agree(end.acceleration[c]!, start.acceleration[c]!) &&
      agree(snap(left, 1, c), snap(right, 0, c)),
  );
}

/** The integrated squared jerk of the quintics, every coordinate summed. */
function cost(segments: readonly HumanQuinticSegment.ISegment[]): number {
  return segments.reduce(
    (sum: number, segment: HumanQuinticSegment.ISegment): number =>
      sum +
      NODES.reduce(
        (inner: number, u: number, k: number): number =>
          inner +
          WEIGHTS[k]! *
            segment.duration *
            HumanQuinticSegment.state(
              segment,
              u * segment.duration,
            ).jerk.reduce((s: number, j: number): number => s + j * j, 0),
        0,
      ),
    0,
  );
}

/**
 * `HumanMinimumJerkSpline` is the minimum-jerk path through via points (Flash
 * and Hogan 1985): a quintic per interval, the Euler-Lagrange equation x⁽⁶⁾ =
 * 0, whose jerk and snap are continuous at every interior via point, at rest at
 * both ends; `cyclic` joins the last point to the first across a period.
 *
 * Four via points in the plane at 0, 0.7, 1.5 and 2.6 s, not on one quintic.
 *
 * Scenarios:
 *
 * 1. At each interior point velocity, acceleration, jerk and snap carry across:
 *    the optimality conditions the block-tridiagonal solve imposes.
 * 2. The integrated squared jerk, exact by Gauss-Legendre on the quartic
 *    integrand, is least at the solved derivatives: nudging an interior
 *    velocity or acceleration either way raises it by the same amount, the
 *    quadratic's gradient being zero there.
 * 3. The periodic path through 0, 1 and 0.5 at 0, 0.4 and 1.1 s over a 1.6 s
 *    period carries velocity, acceleration, jerk and snap across every point,
 *    the first one across the period included.
 * 4. A rest-to-rest piece from 0 to 1 over 1.3 s does not overshoot: its position
 *    rises monotonically within [0, 1], its rate `30 τ² (1 − τ)² / T` never
 *    negative and never past its middle's 15/8 / T.
 */
export function test_motions_posture_minimum_jerk_optimality(): void {
  const times: number[] = [0, 0.7, 1.5, 2.6];
  const x: number[][] = [
    [0, 0],
    [1, -0.5],
    [0.3, 2],
    [2, 1],
  ];
  const derived: HumanMinimumJerkSpline.IDerivatives =
    HumanMinimumJerkSpline.derivatives(times, x);
  const segments: HumanQuinticSegment.ISegment[] = join(times, x, derived);

  // 1. Continuity at the interior points.
  TestValidator.predicate(
    "jerk and snap carry across each via point",
    continuous(segments[0]!, segments[1]!) &&
      continuous(segments[1]!, segments[2]!),
  );

  // 2. The least integrated squared jerk.
  const least: number = cost(segments);
  const nudged = (
    field: "velocities" | "accelerations",
    sign: number,
  ): number => {
    const moved: HumanMinimumJerkSpline.IDerivatives = {
      velocities: derived.velocities.map((v: number[]): number[] => [...v]),
      accelerations: derived.accelerations.map((a: number[]): number[] => [
        ...a,
      ]),
    };
    moved[field][1]![0] = moved[field][1]![0]! + sign * NUDGE;
    return cost(join(times, x, moved));
  };
  const fields: readonly ("velocities" | "accelerations")[] = [
    "velocities",
    "accelerations",
  ];
  TestValidator.predicate(
    "nudging an interior derivative raises the cost evenly",
    fields.every((field: "velocities" | "accelerations"): boolean => {
      const up: number = nudged(field, 1);
      const down: number = nudged(field, -1);
      return up > least && down > least && agree(up - least, down - least);
    }),
  );

  // 3. The periodic path.
  const loop: number[] = [0, 0.4, 1.1];
  const values: number[][] = [[0], [1], [0.5]];
  const cyclic: HumanQuinticSegment.ISegment[] = join(
    loop,
    values,
    HumanMinimumJerkSpline.cyclic(loop, values, 1.6),
    1.6,
  );
  TestValidator.predicate(
    "the periodic path carries across every point",
    cyclic.every((segment: HumanQuinticSegment.ISegment, j: number): boolean =>
      continuous(segment, cyclic[(j + 1) % cyclic.length]!),
    ),
  );

  // 4. No overshoot between two knots at rest.
  const piece: HumanQuinticSegment.ISegment = HumanQuinticSegment.prepare(
    { position: [0], velocity: [0], acceleration: [0] },
    { position: [1], velocity: [0], acceleration: [0] },
    1.3,
  );
  const scan: HumanQuinticSegment.IState[] = Array.from(
    { length: 131 },
    (_: unknown, i: number): HumanQuinticSegment.IState =>
      HumanQuinticSegment.state(piece, i / 100),
  );
  TestValidator.predicate(
    "a rest-to-rest piece neither overshoots nor outruns its peak",
    scan.every(
      (s: HumanQuinticSegment.IState, i: number): boolean =>
        s.position[0]! >= -ROUNDING &&
        s.position[0]! <= 1 + ROUNDING &&
        s.velocity[0]! >= -ROUNDING &&
        s.velocity[0]! <= PEAK / 1.3 + ROUNDING &&
        (i === 0 || s.position[0]! >= scan[i - 1]!.position[0]! - ROUNDING),
    ),
  );
}
