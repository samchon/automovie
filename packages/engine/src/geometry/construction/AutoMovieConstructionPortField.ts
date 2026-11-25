import type { IAutoMovieConstructionPortField } from "@automovie/interface";

import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";

/**
 * A periodic scalar on a port's clock, read with the two derivatives a band's
 * jets need: a port curve's share between its columns, a curved rail's station,
 * the band's cross speed on each side and its correspondence to the part's
 * phase.
 */
export namespace AutoMovieConstructionPortField {
  /**
   * The periodic cubic spline through values at the clocks `2 pi j / m`: the
   * unique C2 uniform periodic cubic interpolant (the curve
   * `AutoMovieNaturalSpline.periodic` reads by its knot curvatures), here in
   * its B-spline form, read with two derivatives.
   *
   * @param values The values, `m >= 3`.
   * @returns The field.
   */
  export function periodic(
    values: readonly number[],
  ): IAutoMovieConstructionPortField.IField {
    const m: number = values.length;
    const controls: number[] = AutoMovieSplineCurve.interpolate(
      values.map((x: number): [number, number] => [x, 0]),
    );
    const own: number[] = controls.slice(0, m);
    const scale: number = m / (2 * Math.PI);
    let low: number = Infinity;
    let high: number = -Infinity;
    for (let i: number = 0; i < m; ++i) {
      const [c0, c1, c2, c3]: number[] = [-1, 0, 1, 2].map(
        (o: number): number => own[(((i + o) % m) + m) % m]!,
      );

      // The span's derivative in its parameter f, C + B f + A f^2, from the cubic weights' derivatives (`AutoMovieSplineCurve.jet`).
      const C: number = (c2! - c0!) / 2;
      const B: number = c0! - 2 * c1! + c2!;
      const A: number = (-c0! + 3 * c1! - 3 * c2! + c3!) / 2;
      const q = (f: number): number => C + f * (B + f * A);
      const candidates: number[] = [q(0), q(1)];
      if (A !== 0 && -B / (2 * A) > 0 && -B / (2 * A) < 1)
        candidates.push(q(-B / (2 * A)));
      low = Math.min(low, ...candidates);
      high = Math.max(high, ...candidates);
    }
    return {
      at: (psi: number): [number, number, number] => {
        const j: [number, number, number, number, number, number] =
          AutoMovieSplineCurve.jet(controls, m, psi);
        return [j[0], j[2], j[4]];
      },
      bounds: [Math.min(...own), Math.max(...own)],
      slopes: [low * scale, high * scale],
      range: (from: number, to: number): [number, number] => {
        // Span j holds the clocks [j, j + 1) 2 pi / m and combines the controls j - 1 to j + 2 convexly.
        const first: number = Math.floor(Math.min(from, to) * scale);
        const last: number = Math.floor(Math.max(from, to) * scale);
        if (!(last - first < m - 1))
          return [Math.min(...own), Math.max(...own)];
        let least: number = Infinity;
        let most: number = -Infinity;
        for (let j: number = first - 1; j <= last + 2; ++j) {
          const control: number = own[((j % m) + m) % m]!;
          least = Math.min(least, control);
          most = Math.max(most, control);
        }
        return [least, most];
      },
    };
  }

  /**
   * One constant field.
   *
   * @param value The value.
   * @returns The field: the value, no derivative.
   */
  export function constant(
    value: number,
  ): IAutoMovieConstructionPortField.IField {
    return {
      at: (): [number, number, number] => [value, 0, 0],
      bounds: [value, value],
      slopes: [0, 0],
      range: (): [number, number] => [value, value],
    };
  }
}
