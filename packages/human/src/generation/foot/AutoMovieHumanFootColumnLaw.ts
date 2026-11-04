/**
 * A column region's plan place as a smooth law of its height: the ankle's
 * column, the malleoli's borders and the tendon rise nearly upright, their
 * place along and across the foot turning slowly with height.
 *
 * The region's knots are reference medians read one share of the stations at
 * a time, each with its own scatter of about a millimetre in plan. Carried
 * through the guide's interpolating spline, that scatter became the guide's
 * shape: on a climb of a few centimetres, steps of a millimetre back and forth
 * turned the guide into hooks and S bends, which the sections bounded by it
 * carried as ripples. The law is the least-squares quadratic of each plan
 * coordinate over the knots' heights, the lowest order that holds a column's
 * lean and its turn toward the malleolus; the guide then reads the region's
 * knots at their own heights on the law, so it keeps every knot and its
 * station, and its place is as smooth as the column.
 */
export namespace AutoMovieHumanFootColumnLaw {
  /** A column's place along and across the foot, each a law of height. */
  export interface IPlan {
    /** Along the foot at a height, foot lengths. */
    along: (height: number) => number;

    /** Across the foot at a height, foot breadths. */
    across: (height: number) => number;
  }

  /**
   * A column's plan law from its knots.
   *
   * @param heights The knots' heights.
   * @param along The knots' places along the foot.
   * @param across The knots' places across the foot.
   */
  export function plan(heights: readonly number[], along: readonly number[], across: readonly number[]): IPlan {
    return { along: fit(heights, along), across: fit(heights, across) };
  }

  /**
   * The least-squares quadratic of values over heights, read at any height;
   * a line through two knots and a constant through one.
   *
   * @param heights The knots' heights.
   * @param values The knots' values at those heights.
   * @returns The law at a height.
   */
  export function fit(heights: readonly number[], values: readonly number[]): (height: number) => number {
    const n: number = heights.length;
    const mean: number = heights.reduce((s: number, h: number): number => s + h, 0) / n;
    const level: number = values.reduce((s: number, v: number): number => s + v, 0) / n;
    if (n === 1) return (): number => level;

    // Normal equations about the mean height, which keeps them well
    // conditioned: the moments s_k of the heights and t_k of the values.
    const s: number[] = [0, 0, 0, 0, 0];
    const t: number[] = [0, 0, 0];
    heights.forEach((h: number, i: number): void => {
      const x: number = h - mean;
      for (let k: number = 0; k <= 4; k++) s[k]! += x ** k;
      for (let k: number = 0; k <= 2; k++) t[k]! += values[i]! * x ** k;
    });
    const slope: number = s[2]! > 0 ? t[1]! / s[2]! : 0;
    const det: number =
      s[0]! * (s[2]! * s[4]! - s[3]! * s[3]!) - s[1]! * (s[1]! * s[4]! - s[3]! * s[2]!) + s[2]! * (s[1]! * s[3]! - s[2]! * s[2]!);
    if (n === 2 || !(Math.abs(det) > SINGULAR * s[0]! * s[2]! * s[4]!)) return (h: number): number => level + slope * (h - mean);

    // Cramer's rule for the three coefficients.
    const c0: number =
      (t[0]! * (s[2]! * s[4]! - s[3]! * s[3]!) - s[1]! * (t[1]! * s[4]! - s[3]! * t[2]!) + s[2]! * (t[1]! * s[3]! - s[2]! * t[2]!)) / det;
    const c1: number =
      (s[0]! * (t[1]! * s[4]! - s[3]! * t[2]!) - t[0]! * (s[1]! * s[4]! - s[3]! * s[2]!) + s[2]! * (s[1]! * t[2]! - t[1]! * s[2]!)) / det;
    const c2: number =
      (s[0]! * (s[2]! * t[2]! - t[1]! * s[3]!) - s[1]! * (s[1]! * t[2]! - t[1]! * s[2]!) + t[0]! * (s[1]! * s[3]! - s[2]! * s[2]!)) / det;

    return (h: number): number => {
      const x: number = h - mean;

      return c0 + c1 * x + c2 * x * x;
    };
  }
}

/**
 * Relative size of the normal equations' determinant below which the knots'
 * heights hold no curvature (all but two coincide), and the law is their line.
 */
const SINGULAR: number = 1e-9;
