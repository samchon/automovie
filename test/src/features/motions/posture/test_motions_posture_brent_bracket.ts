import {
  minimizeHumanBrent
} from "../../../../../packages/motions/src/posture/internal/minimizeHumanBrent";
import { TestValidator } from "@nestia/e2e";

/** The absolute tolerance `t` the searches are run to. */
const T: number = 1e-5;

/**
 * How near the parabola's vertex is found: the rounding of one parabolic step,
 * which on an exact parabola lands on the vertex once three points are known.
 */
const VERTEX: number = 1e-12;

/** Brent's tolerance at a point: `√ε |x| + t`. */
function tolerance(x: number, t: number): number {
  return Math.sqrt(Number.EPSILON) * Math.abs(x) + t;
}

/**
 * `minimizeHumanBrent` is Brent's `localmin` (Brent 1973, ch. 5): golden
 * section safeguarding parabolic interpolation inside a shrinking bracket, no
 * point evaluated within `tol = √ε |x| + t` of another, the result the minimum
 * within `3 tol` on a unimodal function and a local minimum on any other.
 *
 * Scenarios:
 *
 * 1. On `(x − 0.3)²` over [0, 1] the parabolic step is exact: the vertex within
 *    1e-12; every evaluation lies in [0, 1], and no two are nearer than `t`.
 * 2. The tolerance is relative too: `(x − c)⁴`, c a quarter past 10⁶, over the
 *    unit interval from 10⁶ at `t` = 1e-6 is found within `3 tol` of c, tol ≈
 *    1.5e-2 there.
 * 3. A function least at the bracket's upper end, `−x` over [2, 5], returns a
 *    point within `3 tol` of 5 and not past it.
 * 4. On `sin x` over [0, 4π], with two minima, it returns one of them, 3π/2 or
 *    7π/2, within `3 tol`.
 */
export function test_motions_posture_brent_bracket(): void {
  // 1. The parabola.
  const seen: number[] = [];
  const vertex: minimizeHumanBrent.IMinimum = minimizeHumanBrent(
    (x: number): number => {
      seen.push(x);
      return (x - 0.3) * (x - 0.3);
    },
    0,
    1,
    T,
  );
  TestValidator.predicate(
    "the vertex exactly, inside the bracket, the evaluations apart",
    Math.abs(vertex.at - 0.3) <= VERTEX &&
      seen.every((x: number): boolean => x >= 0 && x <= 1) &&
      seen.every((x: number, i: number): boolean =>
        seen.slice(i + 1).every((y: number): boolean => Math.abs(x - y) >= T),
      ),
  );

  // 2. The relative tolerance.
  const c: number = 1e6 + 0.25;
  const far: minimizeHumanBrent.IMinimum = minimizeHumanBrent(
    (x: number): number => (x - c) ** 4,
    1e6,
    1e6 + 1,
    1e-6,
  );
  TestValidator.predicate(
    "within three tolerances far from zero",
    Math.abs(far.at - c) <= 3 * tolerance(far.at, 1e-6),
  );

  // 3. The upper end.
  const edge: minimizeHumanBrent.IMinimum = minimizeHumanBrent(
    (x: number): number => -x,
    2,
    5,
    T,
  );
  TestValidator.predicate(
    "the least end, not past it",
    edge.at <= 5 && 5 - edge.at <= 3 * tolerance(edge.at, T),
  );

  // 4. Two minima.
  const wave: minimizeHumanBrent.IMinimum = minimizeHumanBrent(
    Math.sin,
    0,
    4 * Math.PI,
    T,
  );
  TestValidator.predicate(
    "one of the local minima",
    [1.5 * Math.PI, 3.5 * Math.PI].some(
      (m: number): boolean =>
        Math.abs(wave.at - m) <= 3 * tolerance(wave.at, T),
    ),
  );
}
