import type { IAutoMovieConstructionPortField } from "@automovie/interface";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";

/**
 * A periodic scalar on a port's clock, read with the two derivatives a band's jets need: a port curve's share between its columns, a
 * curved rail's station, the band's cross speed on each side and its correspondence to the part's phase.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the fields carry and why they need derivatives.
 * @evidence contracts/development/design.md#principled-representation One C2 periodic law, the uniform periodic cubic spline, joins every per-column value of a port, the same law the curved rail already declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The field record and its two constructors.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled bound, no clamp.
 */
export namespace AutoMovieConstructionPortField {
  /**
   * The periodic cubic spline through values at the clocks `2 pi j / m`: the unique C2 uniform periodic cubic interpolant (the curve
   * `AutoMovieNaturalSpline.periodic` reads by its knot curvatures), here in its B-spline form, read with two derivatives.
   *
   * @param values The values, `m >= 3`.
   * @returns The field.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The B-spline controls interpolate the values to rounding (`AutoMovieSplineCurve.interpolate`); every value is a convex combination of four controls, and on each span the first derivative is a quadratic in the span parameter, whose extremes lie at its ends or its vertex.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation, one bound pass, one reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampled bound and no clamp.
   * @evidence contracts/development/common.md#meaningful-documentation States the curve, its units and its bounds.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(m) to prepare, constant per reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The controls serve every reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the 2m controls.
   */
  export function periodic(values: readonly number[]): IAutoMovieConstructionPortField.IField {
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
        if (!(last - first < m - 1)) return [Math.min(...own), Math.max(...own)];
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation A straight rail's station or a plain ellipse's share is one number at every clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/common.md#meaningful-documentation States the reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure record coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one number.
   */
  export function constant(value: number): IAutoMovieConstructionPortField.IField {
    return {
      at: (): [number, number, number] => [value, 0, 0],
      bounds: [value, value],
      slopes: [0, 0],
      range: (): [number, number] => [value, value],
    };
  }
}
