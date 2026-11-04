import { AutoMovieHumanStationHermite } from "../lofting/AutoMovieHumanStationHermite";

/**
 * The small numerical rules the trunk's solves share: the bisection of a
 * monotone course and the smoothstep of a fade.
 */
export namespace AutoMovieHumanTrunkSolve {
  /** Bisections of a course's landmark: a landmark within a thousandth of its interval, well under the ISO 20685-1 error of any course. Conventional. */
  export const STEPS: number = 18;

  /**
   * The root of a monotone function over an interval.
   *
   * The function is called once more at the result, last, so a function that
   * stores its argument (a landmark the construction reads back) is left
   * holding the solution.
   *
   * @param lo Lower end of the interval.
   * @param hi Upper end of the interval.
   * @param f Function whose root is wanted, in the unit of its argument's course.
   * @param sign 1 when the function rises over the interval, -1 when it falls.
   * @returns The argument at which the function crosses zero, or an end of the interval when it does not.
   */
  export function bisect(lo: number, hi: number, f: (x: number) => number, sign: 1 | -1): number {
    let a: number = lo;
    let b: number = hi;

    for (let k: number = 0; k < STEPS; k++) {
      const m: number = (a + b) / 2;

      // The root lies above the middle while the signed reading is still below zero.
      if (sign * f(m) < 0) a = m;
      else b = m;
    }
    const x: number = (a + b) / 2;
    f(x);
    return x;
  }

  /**
   * Smoothstep clamped to [0, 1]: flat to the first derivative at both ends.
   *
   * @param x Position over the fade, 0 at its start and 1 at its end.
   * @returns The fade's weight.
   */
  export function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  }

  /**
   * Smootherstep window: 1 up to `from`, falling to 0 at `to`, flat to the
   * second derivative at both ends, so a displacement cut by it leaves no
   * line where it ends.
   *
   * @param z Position, mm.
   * @param from Where the window starts to fall.
   * @param to Where it has ended.
   * @returns The window's weight.
   */
  export function window(z: number, from: number, to: number): number {
    const t: number = Math.min(1, Math.max(0, (z - from) / (to - from)));

    return 1 - t * t * t * (t * (6 * t - 15) + 10);
  }

  /**
   * A function with its first two derivatives by central differences over
   * 0.05 mm: the displacements are smooth closed forms, so the differences
   * carry the derivatives the sector joins need.
   *
   * @param f The function of z.
   * @returns The function returning `[f, f', f'']`.
   */
  export function jet(f: (z: number) => number): (z: number) => [number, number, number] {
    const h: number = 0.05;

    return (z: number): [number, number, number] => {
      const a: number = f(z - h);
      const m: number = f(z);
      const c: number = f(z + h);

      return [m, (c - a) / (2 * h), (a - 2 * m + c) / (h * h)];
    };
  }

  /** A scalar function's value with its first two derivatives. */
  export interface IJet {
    /** The value. */
    value: number;

    /** The first derivative. */
    slope: number;

    /** The second derivative. */
    curvature: number;
  }

  /**
   * The quintic Hermite of a function between two ends that carry their
   * values, slopes and curvatures: the one-variable rule every outline piece
   * of the shoulders is built with, C2 at both ends by construction.
   *
   * @param a The jet at `y0`.
   * @param b The jet at `y1`.
   * @param y0 Start of the interval.
   * @param y1 End of the interval.
   * @param y Position in the interval.
   * @returns The function's jet at `y`.
   */
  export function quintic(a: IJet, b: IJet, y0: number, y1: number, y: number): IJet {
    const H: number = y1 - y0;
    const u: number = (y - y0) / H;
    const ends: number[] = [a.value, a.slope, a.curvature, b.curvature, b.slope, b.value];
    const read = (order: 0 | 1 | 2): number => {
      const w: number[] = AutoMovieHumanStationHermite.weights(u, H, order, true);

      return w.reduce((s: number, weight: number, k: number): number => s + weight * ends[k]!, 0);
    };

    return { value: read(0), slope: read(1), curvature: read(2) };
  }
}