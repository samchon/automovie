import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryKnots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * The smoothness of an arms' knotted trajectory: each segment's integral of
 * the squared jerk of every free coordinate, `∫ (d³x/dt³)² dt`, the cost the
 * minimum-jerk model minimises (Flash and Hogan 1985, J. Neurosci.
 * 5(7):1688), in closed form over the quintic that joins two knots' position,
 * velocity and acceleration (`HumanArmTrajectoryKnots`): with `c = (p0, h v0,
 * h² a0, p1, h v1, h² a1)` over a segment of `h` seconds it is `c' J c / h⁵`,
 * `J` the basis' third derivatives' Gram matrix (`GRAM`).
 *
 * Each arm's sum is made scale-free by the dimensionless squared jerk's
 * normalisation, `D⁵ / A²` for a movement of `D` seconds and amplitude `A`
 * (Hogan and Sternad 2009, "Sensitivity of smoothness measures to movement
 * duration, amplitude, and arrests", J. Mot. Behav. 41(6):529), times the
 * smoothness weight the waypoints' accelerations take
 * (`HumanArmTrajectoryTerms.ACCELERATION`), so no new constant enters. `D` is
 * the knots' span; `A` is fixed for one solve from its start, the Euclidean
 * norm of the arm's free coordinates' ranges over the frame grid (`amplitudes`).
 * An arm whose amplitude is zero has nothing to smooth: it takes no term, and
 * its knots' velocities and accelerations are held (the optimiser pins them).
 */
export namespace HumanArmTrajectoryJerk {
  /**
   * Each arm's amplitude, the Euclidean norm of its free coordinates' ranges
   * over a course read on the frame grid.
   *
   * @param c The knots' context.
   * @param frames Each arm's coordinates at each frame.
   * @returns Each arm's amplitude, coordinate units.
   */
  export function amplitudes(
    c: M.IContext,
    frames: readonly (readonly (readonly number[])[])[],
  ): number[] {
    return frames.map(
      (arm: readonly (readonly number[])[], a: number): number =>
        Math.hypot(
          ...c.free[a]!.map((d: number): number => {
            let low: number = Infinity;
            let high: number = -Infinity;
            for (const row of arm) {
              low = Math.min(low, row[d]!);
              high = Math.max(high, row[d]!);
            }
            return high - low;
          }),
        ),
    );
  }

  /**
   * Each arm's weight: the dimensionless normalisation times the smoothness
   * weight; zero for an arm with no amplitude.
   *
   * @param c The knots' context.
   * @param amplitude Each arm's amplitude.
   * @returns Each arm's weight.
   */
  export function weights(
    c: M.IContext,
    amplitude: readonly number[],
  ): number[] {
    const duration: number = c.times[c.n - 1]! - c.times[0]!;
    return amplitude.map((A: number): number =>
      A > 0 ? (T.ACCELERATION * duration ** 5) / (A * A) : 0,
    );
  }

  /**
   * The cost of a knotted trajectory.
   *
   * @param c The knots' context.
   * @param x Each arm's coordinates at each knot.
   * @param rates Their velocities and accelerations.
   * @param weight Each arm's weight (`weights`).
   * @returns The weighted sum of every segment's squared jerk integral.
   */
  export function cost(
    c: M.IContext,
    x: readonly (readonly (readonly number[])[])[],
    rates: Knots.IRates,
    weight: readonly number[],
  ): number {
    let sum: number = 0;
    c.free.forEach((free: readonly number[], a: number): void => {
      if (weight[a] === 0) return;
      for (let i: number = 0; i + 1 < c.n; ++i) {
        const h: number = c.times[i + 1]! - c.times[i]!;
        for (const d of free) {
          const v: number[] = local(x, rates, a, i, d, h);
          sum += (weight[a]! * quadratic(v)) / h ** 5;
        }
      }
    });
    return sum;
  }

  /**
   * Add the cost's curvature and its gradient at an iterate to a convex model
   * in the knots' steps (`HumanArmTrajectoryKnots.reduce`'s layout, each
   * knot's velocity and acceleration in its own time scale), widening its band
   * where a segment's two knots reach beyond it.
   *
   * @param c The knots' context.
   * @param x Each arm's coordinates at each knot.
   * @param rates Their velocities and accelerations.
   * @param weight Each arm's weight.
   * @param model The model, its curvature and linear term added to.
   * @returns The model with the cost.
   */
  export function add(
    c: M.IContext,
    x: readonly (readonly (readonly number[])[])[],
    rates: Knots.IRates,
    weight: readonly number[],
    model: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  ): IAutoMovieMotionHumanQuadraticProgram.IProblem {
    const width: number = c.width;
    const stride: number = 3 * width;
    const band: number = Math.max(model.band, stride + 3 * width - 1);
    const p: Float64Array[] = model.p.map((row: Float64Array): Float64Array => {
      const out: Float64Array = new Float64Array(band + 1);
      out.set(row.subarray(0, Math.min(row.length, band + 1)));
      return out;
    });
    const q: Float64Array = Float64Array.from(model.q);
    c.free.forEach((free: readonly number[], a: number): void => {
      if (weight[a] === 0) return;
      for (let i: number = 0; i + 1 < c.n; ++i) {
        const h: number = c.times[i + 1]! - c.times[i]!;
        const s: number[] = [i, i + 1].map((k: number): number =>
          HumanArmTrajectoryKnots.span(c.times, k),
        );
        // Each of the six local values as its knot's variable times a factor:
        // a velocity variable is `span v`, an acceleration `span² a`.
        const scale: number[] = [
          1,
          h / s[0]!,
          (h * h) / (s[0]! * s[0]!),
          1,
          h / s[1]!,
          (h * h) / (s[1]! * s[1]!),
        ];
        const factor: number = (2 * weight[a]!) / h ** 5;
        free.forEach((d: number, f: number): void => {
          const v: number[] = local(x, rates, a, i, d, h);
          const index: (number | undefined)[] = [0, 1, 2, 3, 4, 5].map(
            (j: number): number | undefined => {
              const k: number = j < 3 ? i : i + 1;
              if (!M.inner(c, k)) return undefined;
              return (k - 1) * stride + (j % 3) * width + c.offset[a]! + f;
            },
          );
          for (let j: number = 0; j < 6; ++j) {
            const row: number | undefined = index[j];
            if (row === undefined) continue;
            let gradient: number = 0;
            for (let l: number = 0; l < 6; ++l) gradient += GRAM[j]![l]! * v[l]!;
            q[row] = q[row]! + factor * scale[j]! * gradient;
            for (let l: number = 0; l < 6; ++l) {
              const column: number | undefined = index[l];
              if (column === undefined || column < row) continue;
              p[row]![column - row] =
                p[row]![column - row]! +
                factor * scale[j]! * scale[l]! * GRAM[j]![l]!;
            }
          }
        });
      }
    });
    return { ...model, band, p, q };
  }
}

/** A segment's six values `(p0, h v0, h² a0, p1, h v1, h² a1)` of one coordinate. */
function local(
  x: readonly (readonly (readonly number[])[])[],
  rates: Knots.IRates,
  a: number,
  i: number,
  d: number,
  h: number,
): number[] {
  return [i, i + 1].flatMap((k: number): number[] => [
    x[a]![k]![d]!,
    h * rates.velocities[a]![k]![d]!,
    h * h * rates.accelerations[a]![k]![d]!,
  ]);
}

/** `c' J c`. */
function quadratic(v: readonly number[]): number {
  let sum: number = 0;
  for (let j: number = 0; j < 6; ++j)
    for (let l: number = 0; l < 6; ++l) sum += v[j]! * GRAM[j]![l]! * v[l]!;
  return sum;
}

/**
 * The quintic Hermite basis' third derivatives' Gram matrix on the unit
 * segment, `∫₀¹ B_j''' B_l''' du`: each third derivative is quadratic, so the
 * three-point Gauss–Legendre rule is exact for their products.
 */
const GRAM: readonly (readonly number[])[] = ((): number[][] => {
  const third = (u: number): number[] => [
    -60 + 360 * u - 360 * u * u,
    -36 + 192 * u - 180 * u * u,
    -9 + 36 * u - 30 * u * u,
    60 - 360 * u + 360 * u * u,
    -24 + 168 * u - 180 * u * u,
    3 - 24 * u + 30 * u * u,
  ];
  const nodes: number[] = [-Math.sqrt(3 / 5), 0, Math.sqrt(3 / 5)].map(
    (x: number): number => (x + 1) / 2,
  );
  const weights: number[] = [5 / 18, 8 / 18, 5 / 18];
  const out: number[][] = Array.from({ length: 6 }, (): number[] =>
    new Array<number>(6).fill(0),
  );
  nodes.forEach((u: number, g: number): void => {
    const b: number[] = third(u);
    for (let j: number = 0; j < 6; ++j)
      for (let l: number = 0; l < 6; ++l)
        out[j]![l] = out[j]![l]! + weights[g]! * b[j]! * b[l]!;
  });
  return out;
})();