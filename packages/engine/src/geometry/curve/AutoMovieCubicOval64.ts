import type { IAutoMovieCubicOval64 } from "@automovie/interface";

/**
 * Four-quarter affine cubic-oval sizing in consistent caller units. The
 * quarter-circle handle ratio is 4/3*tan(pi/8); independent anatomical
 * admissibility remains with consumers.
 */
export namespace AutoMovieCubicOval64 {
  /** Symmetric quarter-circle cubic handle/radius ratio. */
  export const rounding: number = (4 / 3) * Math.tan(Math.PI / 8);

  /**
   * Approximate the perimeter of the affine cubic oval with eight-point
   * Gauss-Legendre quadrature. Nonfinite or negative diameters reject.
   */
  export function perimeter(diameterU: number, diameterV: number): number {
    const nodes: readonly number[] = [
      -0.9602898564975363, -0.7966664774136267, -0.525532409916329,
      -0.1834346424956498, 0.1834346424956498, 0.525532409916329,
      0.7966664774136267, 0.9602898564975363,
    ];
    const weights: readonly number[] = [
      0.1012285362903763, 0.2223810344533745, 0.3137066458778873,
      0.362683783378362, 0.362683783378362, 0.3137066458778873,
      0.2223810344533745, 0.1012285362903763,
    ];
    if (
      ![diameterU, diameterV].every(
        (v: number): boolean => v >= 0,
      )
    )
      throw new Error("Nonnegative finite section diameters required");
    const a: number = diameterU / 2,
      b: number = diameterV / 2,
      k: number = rounding;
    // Mapping [-1,1] to [0,1] contributes 1/2; four symmetric quarters give the factor two.
    return (
      2 *
      nodes.reduce((sum: number, x: number, i: number): number => {
        const t: number = (x + 1) / 2,
          s: number = 1 - t;
        const dx: number = 6 * s * t * (k * a - a) - 3 * t * t * k * a;
        const dy: number = 3 * s * s * k * b + 6 * s * t * (b - k * b);
        return sum + weights[i]! * Math.hypot(dx, dy);
      }, 0)
    );
  }

  /**
   * Resolve the other diameter with 64 bisections while preserving the supplied
   * fixed diameter; no aspect bound is imposed here.
   */
  export function otherDiameter(
    circumference: number,
    fixedDiameter: number,
  ): number {
    if (
      !(
        fixedDiameter > 0 &&
        circumference > 2 * fixedDiameter
      )
    )
      throw new Error(
        "Incompatible cubic oval circumference and fixed diameter",
      );
    let lo: number = 0,
      hi: number = circumference / 2;
    for (let i: number = 0; i < 64; i++) {
      const mid: number = (lo + hi) / 2;
      if (perimeter(mid, fixedDiameter) < circumference) lo = mid;
      else hi = mid;
    }
    const result: number = (lo + hi) / 2;
    return result;
  }

  /**
   * Approximate the four-quarter cubic perimeter by composite Simpson
   * quadrature with the retained sqrt(2) handle formula. Positive finite
   * millimetre diameters and an even interval count of at least two are
   * required; default count is 256 per quarter.
   */
  export function perimeterBySimpson(
    breadth: number,
    depth: number,
    intervals: number = 256,
  ): number {
    if (
      breadth <= 0 ||
      depth <= 0 ||
      intervals < 2 ||
      intervals % 2 !== 0
    )
      throw new Error(
        "Positive cubic ellipse dimensions and even quadrature count required",
      );
    const a: number = breadth / 2;
    const b: number = depth / 2;
    const k: number = (4 * (Math.sqrt(2) - 1)) / 3;
    let sum: number = 0;
    for (let i: number = 0; i <= intervals; i++) {
      const t: number = i / intervals;
      const dx: number = 3 * (2 * (1 - t) * t * (k * a - a) - t * t * k * a);
      const dz: number =
        3 * ((1 - t) ** 2 * k * b + 2 * (1 - t) * t * (b - k * b));
      sum +=
        (i === 0 || i === intervals ? 1 : i % 2 ? 4 : 2) * Math.hypot(dx, dz);
    }
    return (4 * sum) / (3 * intervals);
  }

  /**
   * Resolve breadthMm/depthMm at a fixed positive breadth/depth ratio using the
   * same Simpson perimeter. Girth and returned diameters are positive finite
   * millimetre values; breadthOverDepth is a positive finite dimensionless
   * ratio. An unrepresentable positive result throws RangeError.
   */
  export function axesBySimpson(
    girthMm: number,
    breadthOverDepth: number = 1,
  ): IAutoMovieCubicOval64.IAxesBySimpsonResult {
    if (
      girthMm <= 0 ||
      breadthOverDepth <= 0
    )
      throw new Error("Positive girth and independent breadth/depth required");
    // Homogeneity lets the quadrature use a largest diameter of one, so a
    // representable aspect ratio cannot overflow its derivative accumulation.
    const breadth: number = breadthOverDepth >= 1 ? 1 : breadthOverDepth;
    const depth: number = breadthOverDepth >= 1 ? 1 / breadthOverDepth : 1;
    const scale: number = girthMm / perimeterBySimpson(breadth, depth);
    const breadthMm: number = breadth * scale;
    const depthMm: number = depth * scale;
    if (
      ![breadthMm, depthMm].every(
        (value: number): boolean => value > 0,
      )
    )
      throw new RangeError(
        "Cubic oval diameters must be representable positive finite lengths",
      );
    return { breadthMm, depthMm };
  }

  /**
   * Resolve the second diameter from circumference and a fixed first diameter
   * using Simpson quadrature. Inputs are finite millimetre lengths with
   * circumference greater than twice the positive fixed diameter; at most 64
   * bisections stop when the bracket cannot refine in binary64.
   */
  export function otherDiameterBySimpson(
    girthMm: number,
    breadthMm: number,
  ): number {
    if (
      breadthMm <= 0 ||
      girthMm <= 2 * breadthMm
    )
      throw new Error("Girth must exceed the collapsed section perimeter");
    let low: number = 0;
    let high: number = girthMm / 2;
    for (let i: number = 0; i < 64; i++) {
      const mid: number = (low + high) / 2;
      if (mid === low || mid === high) break;
      if (perimeterBySimpson(breadthMm, mid) < girthMm) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }
}
