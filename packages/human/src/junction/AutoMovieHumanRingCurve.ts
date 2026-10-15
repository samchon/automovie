import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";

/**
 * The limit curve of a closed ring of a Catmull-Clark cage, and the inverse of its stencil.
 *
 * In a regular neighbourhood, valence four all round, the limit surface along a ring of control points is the closed uniform cubic B-spline of that ring after the stencil (1, 4, 1) / 6 has averaged each vertex with its two neighbours across the ring (Stam 1998, SIGGRAPH '98, pp. 395-404: on the regular part the surface is a uniform bicubic B-spline). These functions evaluate that curve and solve for control points that put it on a given section.
 *
 * @author Samchon
 */
export namespace AutoMovieHumanRingCurve {
  /** Points per span sampled on a limit curve to measure its length. */
  export const SPAN_SAMPLES: number = 64;

  /**
   * Points on the closed uniform cubic B-spline of a control polygon.
   *
   * @param control Control points in ring order
   * @returns `SPAN_SAMPLES` points per span, in order
   */
  export function spline(control: IAutoMovieVector3[]): IAutoMovieVector3[] {
    const n: number = control.length;
    const points: IAutoMovieVector3[] = [];
    for (let k: number = 0; k < n; ++k)
      for (let i: number = 0; i < SPAN_SAMPLES; ++i) {
        const t: number = i / SPAN_SAMPLES;
        points.push(
          AutoMovieHumanVector.offset(
            AutoMovieHumanVector.of(0, 0, 0),
            [control[(k + n - 1) % n]!, (1 - t) ** 3 / 6],
            [control[k]!, (3 * t ** 3 - 6 * t ** 2 + 4) / 6],
            [control[(k + 1) % n]!, (-3 * t ** 3 + 3 * t ** 2 + 3 * t + 1) / 6],
            [control[(k + 2) % n]!, t ** 3 / 6],
          ),
        );
      }
    return points;
  }

  /**
   * Length of a closed polyline.
   *
   * @param points Points in order, closed from the last to the first
   * @returns The length
   */
  export function perimeter(points: IAutoMovieVector3[]): number {
    return points.reduce(
      (sum: number, p: IAutoMovieVector3, i: number): number =>
        sum +
        AutoMovieHumanVector.distance(p, points[(i + 1) % points.length]!),
      0,
    );
  }

  /**
   * Solve the cyclic system `(c·x[k-1] + 4·x[k] + c·x[k+1]) / 6 = y[k]`.
   *
   * It is the ring stencil seen along rays that meet at angle `θ`, `c = cos θ`: control radii `x` whose limit points reach radii `y`. The system is circulant, so it is solved by its discrete Fourier transform, with eigenvalues `(4 + 2c·cos(2πm/n)) / 6`, all positive for `|c| < 1`.
   *
   * @param y Target radius per ray
   * @param c Cosine of the angle between neighbouring rays
   * @returns Control radius per ray
   */
  export function unstencil(y: number[], c: number): number[] {
    const n: number = y.length;
    return y.map((_: number, k: number): number => {
      let sum: number = 0;
      for (let m: number = 0; m < n; ++m) {
        let re: number = 0;
        for (let j: number = 0; j < n; ++j)
          re += y[j]! * Math.cos((2 * Math.PI * m * (j - k)) / n);
        sum += re / ((4 + 2 * c * Math.cos((2 * Math.PI * m) / n)) / 6);
      }
      return sum / n;
    });
  }
}
