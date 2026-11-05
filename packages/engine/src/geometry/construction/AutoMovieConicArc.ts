import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";

/**
 * The positive rational quadratic from (a,0) through corner (a,b) to (0,b), with middle weight w=r/(1-r). It is evaluated as that conic, without a polar polynomial approximation.
 *
 * @evidence contracts/common.md#principled-implementation Uses the rational quadratic and its analytic native-to-polar chain rule. The positive ray intersection is solved by a cancellation-avoiding quadratic in t/(1-t), with reflected evaluation near the other endpoint.
 * @evidence contracts/common.md#clear-and-simple-design One owner provides native guides, exact polar readings and conservative real-arithmetic bounds required by local curvature correction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No aspect-specific shape, sampled fitting or reversed triangle is used; finite representability remains a caller admission premise.
 * @evidence contracts/common.md#meaningful-documentation States source weight, endpoints, angle units, derivatives and the difference between exact conic formulas and binary64 observations.
 * @evidence contracts/performance.md#efficient-algorithms Native/ray evaluation and bounds take constant arithmetic, with no iterative ray search.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure scalar geometry schedules no effectful work; the section owner retains its prepared rational ends.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All temporary pairs and returned fixed-size readings are invocation-local; no global data is retained.
 */
export namespace AutoMovieConicArc {
  /**
   * Endpoint geometric curvature at extent a across extent b.
   *
   * @evidence contracts/common.md#principled-implementation The rational quadratic's endpoint curvature is a/(2w^2 b^2), with w=r/(1-r).
   * @evidence contracts/common.md#clear-and-simple-design One formula is shared by guide ownership and curvature corrections.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the declared extents/shoulder, without fitting or a fallback curvature.
   * @evidence contracts/common.md#meaningful-documentation States the geometric rather than radial curvature and inverse-length unit.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar formula has no effectful work to share.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one number and retains nothing.
   */
  export function curvature(a: number, b: number, r: number): number {
    const w: number = r / (1 - r);
    return a / (2 * w * w * b * b);
  }

  /**
   * Native parameter of a ray at angle phi in [0,pi/2].
   *
   * @evidence contracts/common.md#principled-implementation Solves B*u^2+2w(B-A)u-A=0 for nonnegative u=t/(1-t), A=a*sin(phi), B=b*cos(phi), reflecting the smaller ratio to avoid cancellation.
   * @evidence contracts/common.md#clear-and-simple-design One closed form replaces an iterative ray inversion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoints are their exact source identities; no interior angle or radius is clamped.
   * @evidence contracts/common.md#meaningful-documentation States admitted quadrant and dimensionless result.
   * @evidence contracts/performance.md#efficient-algorithms Two trigonometric reads and constant scalar arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure ray inversion schedules no effectful work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no input or result state.
   */
  export function parameter(
    a: number,
    b: number,
    r: number,
    phi: number,
  ): number {
    if (phi === 0) return 0;
    if (phi === Math.PI / 2) return 1;
    const A: number = a * Math.sin(phi);
    const B: number = b * Math.cos(phi);
    const w: number = r / (1 - r);
    return A <= B ? half(A / B, w) : 1 - half(B / A, w);
  }

  /**
   * Native conic point as a polar guide, including its analytic first/second angle derivatives.
   *
   * @evidence contracts/common.md#principled-implementation Differentiates the rational numerator/denominator twice, then applies rho_t and phi_t chain rules; normalized extents reduce unit-scale overflow.
   * @evidence contracts/common.md#clear-and-simple-design Preserves the former conic-guide API through one formula owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no neighbour differences or sampled interpolant; unrepresentable arithmetic remains nonfinite for section admission.
   * @evidence contracts/common.md#meaningful-documentation States native parameter, angular offset and the radial jet meaning.
   * @evidence contracts/performance.md#efficient-algorithms Constant quotient/chain-rule arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One pure point reading has no effectful work to coordinate.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary fixed-size pairs and the returned guide belong to this query.
   */
  export function guide(
    a: number,
    b: number,
    r: number,
    t: number,
    start: number = 0,
  ): AutoMoviePolarSector.IGuide {
    const scale: number = Math.max(a, b);
    const A: number = a / scale;
    const B: number = b / scale;
    const w: number = r / (1 - r);
    if (t === 0)
      return {
        angle: start,
        value: a,
        slope: 0,
        curvature: (A - (A * A * A) / (2 * w * w * B * B)) * scale,
      };
    if (t === 1)
      return {
        angle: start + Math.PI / 2,
        value: b,
        slope: 0,
        curvature: (B - (B * B * B) / (2 * w * w * A * A)) * scale,
      };
    const s: number = 1 - t;
    const D: number = s * s + 2 * w * t * s + t * t;
    const D1: number = -2 * s + 2 * w * (1 - 2 * t) + 2 * t;
    const D2: number = 4 - 4 * w;
    const C: [number, number] = point(A, B, w, t);
    const N1: [number, number] = [
      -2 * s * A + 2 * w * (1 - 2 * t) * A,
      2 * w * (1 - 2 * t) * B + 2 * t * B,
    ];
    const N2: [number, number] = [2 * A - 4 * w * A, 2 * B - 4 * w * B];
    const C1: [number, number] = [
      (N1[0] - C[0] * D1) / D,
      (N1[1] - C[1] * D1) / D,
    ];
    const C2: [number, number] = [
      (N2[0] - 2 * C1[0] * D1 - C[0] * D2) / D,
      (N2[1] - 2 * C1[1] * D1 - C[1] * D2) / D,
    ];
    const rho: number = Math.hypot(...C);
    const rt: number = (C[0] * C1[0] + C[1] * C1[1]) / rho;
    const pt: number = (C[0] * C1[1] - C[1] * C1[0]) / (rho * rho);
    const rtt: number =
      (C1[0] * C1[0] + C1[1] * C1[1] + C[0] * C2[0] + C[1] * C2[1] - rt * rt) /
      rho;
    const ptt: number =
      (C[0] * C2[1] - C[1] * C2[0]) / (rho * rho) - (2 * pt * rt) / rho;
    return {
      angle: start + Math.atan2(C[1], C[0]),
      value: rho * scale,
      slope: (rt / pt) * scale,
      curvature: ((rtt * pt - rt * ptt) / (pt * pt * pt)) * scale,
    };
  }

  /**
   * Exact-conic polar radius and two derivatives on one quarter, with reflected native evaluation near its second endpoint.
   *
   * @evidence contracts/common.md#principled-implementation Reads the rational arc at its closed-form ray intersection; reflection changes only the sign of the first polar derivative.
   * @evidence contracts/common.md#clear-and-simple-design One radius owner serves sections and their local correction bounds.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No polar polynomial replaces the conic, and no aspect or specimen branch changes its shape.
   * @evidence contracts/common.md#meaningful-documentation States local angle and radial derivative order.
   * @evidence contracts/performance.md#efficient-algorithms Constant ray and native-guide work; no iteration or source sampling grid.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares native guide arithmetic instead of maintaining another conic formula.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a three-number jet and retains no query state.
   */
  export function radius(
    a: number,
    b: number,
    r: number,
    phi: number,
  ): AutoMoviePolarSector.Jet {
    if (phi === Math.PI / 2) {
      const endpoint: AutoMoviePolarSector.IGuide = guide(b, a, r, 0);
      return [endpoint.value, 0, endpoint.curvature];
    }
    const A: number = a * Math.sin(phi);
    const B: number = b * Math.cos(phi);
    const w: number = r / (1 - r);
    const forward: boolean = A <= B;
    const g: AutoMoviePolarSector.IGuide = forward
      ? guide(a, b, r, half(A / B, w))
      : guide(b, a, r, half(B / A, w));
    return [g.value, forward ? g.slope : -g.slope, g.curvature];
  }

  /**
   * Cartesian-to-polar analytic chain rule on a regular positive ray.
   *
   * @evidence contracts/common.md#principled-implementation Differentiates rho=|C| and phi=atan2(y,x) twice and divides by the positive native angular speed.
   * @evidence contracts/common.md#clear-and-simple-design One conversion serves quadratic conics and rational cubic G2 ends.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonpositive/nonfinite angular speed produces a nonfinite jet rather than a replacement derivative.
   * @evidence contracts/common.md#meaningful-documentation The input is [x,y,x_t,y_t,x_tt,y_tt]; the output differentiates radius in radians.
   * @evidence contracts/performance.md#efficient-algorithms Constant scalar arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure conversion schedules no work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns three numbers and retains no native curve.
   */
  export function polar(
    c: readonly [number, number, number, number, number, number],
  ): AutoMoviePolarSector.Jet {
    const scale: number = Math.hypot(c[0], c[1]);
    if (!(Number.isFinite(scale) && scale > 0)) return [NaN, NaN, NaN];
    const normalized: readonly [
      number,
      number,
      number,
      number,
      number,
      number,
    ] = c.map((value: number): number => value / scale) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const rho: number = Math.hypot(normalized[0], normalized[1]);
    const rt: number =
      (normalized[0] * normalized[2] + normalized[1] * normalized[3]) / rho;
    const pt: number =
      (normalized[0] * normalized[3] - normalized[1] * normalized[2]) /
      (rho * rho);
    if (!(Number.isFinite(pt) && pt > 0)) return [NaN, NaN, NaN];
    const rtt: number =
      (normalized[2] ** 2 +
        normalized[3] ** 2 +
        normalized[0] * normalized[4] +
        normalized[1] * normalized[5] -
        rt * rt) /
      rho;
    const ptt: number =
      (normalized[0] * normalized[5] - normalized[1] * normalized[4]) /
        (rho * rho) -
      (2 * pt * rt) / rho;
    return [
      rho * scale,
      (rt / pt) * scale,
      ((rtt * pt - rt * ptt) / (pt * pt * pt)) * scale,
    ];
  }

  /**
   * Native rational-quadratic speed, in source length per unit parameter.
   *
   * @evidence contracts/common.md#principled-implementation Uses x_t=-2at(s+wt)/D^2 and y_t=2bs(t+ws)/D^2, avoiding a polar singular turn in arclength quadrature.
   * @evidence contracts/common.md#clear-and-simple-design One native speed serves actual conic lengths.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Computes the declared rational curve without a sampled replacement or aspect exemption.
   * @evidence contracts/common.md#meaningful-documentation Extents use one length unit, r is the shoulder and t is the original unit parameter.
   * @evidence contracts/performance.md#efficient-algorithms Constant scalar arithmetic and one hypot.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure speed query schedules no work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one number and retains no source.
   */
  export function speed(a: number, b: number, r: number, t: number): number {
    const s: number = 1 - t;
    const w: number = r / (1 - r);
    const D: number = s * s + 2 * w * t * s + t * t;
    return Math.hypot(
      (2 * a * t * (s + w * t)) / D / D,
      (2 * b * s * (t + w * s)) / D / D,
    );
  }

  /** Stable positive quadratic root in a ratio no greater than one; the result is the first-half native parameter. */
  function half(ratio: number, w: number): number {
    const q: number = w * (1 - ratio);
    const u: number = ratio / (q + Math.hypot(q, Math.sqrt(ratio)));
    return u / (1 + u);
  }

  /** Positive native rational point; callers own the finite positive extents, weight and unit parameter premise. */
  function point(a: number, b: number, w: number, t: number): [number, number] {
    const s: number = 1 - t;
    const D: number = s * s + 2 * w * t * s + t * t;
    return [
      (a * (s * s + 2 * w * t * s)) / D,
      (b * (2 * w * t * s + t * t)) / D,
    ];
  }
}
