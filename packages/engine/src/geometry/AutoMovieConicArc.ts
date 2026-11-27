import type {
  IAutoMovieConicArc,
  IAutoMovieConicArcField,
  IAutoMoviePolarSector,
} from "@automovie/interface";

import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";

/**
 * The positive rational quadratic from (a,0) through corner (a,b) to (0,b),
 * with middle weight w=r/(1-r). It is evaluated as that conic, without a polar
 * polynomial approximation.
 */
export namespace AutoMovieConicArc {
  /** Endpoint geometric curvature at extent a across extent b. */
  export function curvature(a: number, b: number, r: number): number {
    return AutoMovieConicArcField.curvature(
      AutoMovieConicFieldJet.NUMBER,
      a,
      b,
      r,
    );
  }

  /** Native parameter of a ray at angle phi in [0,pi/2]. */
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
    const w: number = AutoMovieConicArcField.weight(
      AutoMovieConicFieldJet.NUMBER,
      r,
    );
    return A <= B ? half(A / B, w) : 1 - half(B / A, w);
  }

  /**
   * Native conic point as a polar guide, including its analytic first/second
   * angle derivatives.
   */
  export function guide(
    a: number,
    b: number,
    r: number,
    t: number,
    start: number = 0,
  ): IAutoMoviePolarSector.IGuide {
    const scale: number = Math.max(a, b);
    const A: number = a / scale;
    const B: number = b / scale;
    const w: number = AutoMovieConicArcField.weight(
      AutoMovieConicFieldJet.NUMBER,
      r,
    );
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
    const geometry: IAutoMovieConicArcField.IGeometry<number> =
      AutoMovieConicArcField.evaluate(
        AutoMovieConicFieldJet.NUMBER,
        A,
        B,
        w,
        t,
      );
    return interiorGuide(A, B, w, t, start, scale, geometry.point);
  }

  /**
   * Exact-conic polar radius and two derivatives on one quarter, with reflected
   * native evaluation near its second endpoint.
   */
  export function radius(
    a: number,
    b: number,
    r: number,
    phi: number,
  ): IAutoMoviePolarSector.Jet {
    return locate(a, b, r, phi)?.radial ?? [NaN, NaN, NaN];
  }

  /** Cartesian-to-polar analytic chain rule on a regular positive ray. */
  export function polar(
    c: readonly [number, number, number, number, number, number],
  ): IAutoMoviePolarSector.Jet {
    const scale: number = Math.hypot(c[0], c[1]);
    if (!(scale > 0)) return [NaN, NaN, NaN];
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
    if (!(pt > 0)) return [NaN, NaN, NaN];
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

  /** Native rational-quadratic speed, in source length per unit parameter. */
  export function speed(a: number, b: number, r: number, t: number): number {
    const velocity: readonly [number, number] = AutoMovieConicArcField.velocity(
      AutoMovieConicFieldJet.NUMBER,
      a,
      b,
      AutoMovieConicArcField.weight(AutoMovieConicFieldJet.NUMBER, r),
      t,
    );
    return Math.hypot(...velocity);
  }

  /** Locate a rational-quadratic ray once for numeric and source readers. */
  export function locate(
    a: number,
    b: number,
    r: number,
    phi: number,
  ): IAutoMovieConicArc.IRay | null {
    const selected: Inverse | null = inverse(a, b, r, phi);
    if (selected === null) return null;
    const { t, reverse, first, second, scale, x, y, w }: Inverse = selected;
    const normalized: IAutoMovieConicArcField.IGeometry<number> =
      AutoMovieConicArcField.evaluate(
        AutoMovieConicFieldJet.NUMBER,
        x,
        y,
        w,
        t,
      );
    const guideValue: IAutoMoviePolarSector.IGuide =
      t === 0
        ? guide(first, second, r, t)
        : interiorGuide(x, y, w, t, 0, scale, normalized.point);
    const geometry: IAutoMovieConicArcField.IGeometry<number> =
      AutoMovieConicArcField.orient(
        AutoMovieConicFieldJet.NUMBER,
        {
          point: [normalized.point[0] * scale, normalized.point[1] * scale],
          tangent: normalized.tangent,
        },
        reverse,
      );
    const u: number = 1 - t;
    const denominator: number = u * u + 2 * w * t * u + t * t;
    const v: number = Math.hypot(x * t * (u + w * t), y * u * (t + w * u));
    const logCurvature: number =
      Math.log(x) +
      Math.log(y) +
      Math.log(w) +
      3 * Math.log(denominator) -
      Math.log(2) -
      3 * Math.log(v) -
      Math.log(scale);
    const radial: IAutoMoviePolarSector.Jet = [
      guideValue.value,
      reverse ? -guideValue.slope : guideValue.slope,
      guideValue.curvature,
    ];
    return {
      ...geometry,
      radial,
      logCurvature,
      native: t,
      clock: null,
      position: t === 0 ? "first" : "interior",
      reverse,
    };
  }

  /** Same inverse and physical point, without tangent or polar derivatives. */
  export function point(
    a: number,
    b: number,
    r: number,
    phi: number,
  ): readonly [number, number] | null {
    const selected: Inverse | null = inverse(a, b, r, phi);
    if (selected === null) return null;
    const local: readonly [number, number] = AutoMovieConicArcField.point(
      AutoMovieConicFieldJet.NUMBER,
      selected.x,
      selected.y,
      selected.w,
      selected.t,
    );
    const x: number = local[0] * selected.scale;
    const y: number = local[1] * selected.scale;
    return selected.reverse ? [y, x] : [x, y];
  }

  /** Radius value in the identical native inverse and normalization as locate. */
  export function value(a: number, b: number, r: number, phi: number): number {
    const selected: Inverse | null = inverse(a, b, r, phi);
    if (selected === null) return NaN;
    if (selected.t === 0) return selected.first > 0 ? selected.first : NaN;
    const point: readonly [number, number] = AutoMovieConicArcField.point(
      AutoMovieConicFieldJet.NUMBER,
      selected.x,
      selected.y,
      selected.w,
      selected.t,
    );
    const value: number = Math.hypot(...point) * selected.scale;
    return value > 0 ? value : NaN;
  }

  /**
   * Read the existing polar quotient arithmetic from an already evaluated
   * normalized interior point.
   */
  function interiorGuide(
    A: number,
    B: number,
    w: number,
    t: number,
    start: number,
    scale: number,
    C: readonly [number, number],
  ): IAutoMoviePolarSector.IGuide {
    const s: number = 1 - t;
    const D: number = s * s + 2 * w * t * s + t * t;
    const D1: number = -2 * s + 2 * w * (1 - 2 * t) + 2 * t;
    const D2: number = 4 - 4 * w;
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
   * Stable positive quadratic root in a ratio no greater than one; the result
   * is the first-half native parameter.
   */
  function half(ratio: number, w: number): number {
    const q: number = w * (1 - ratio);
    const u: number = ratio / (q + Math.hypot(q, Math.sqrt(ratio)));
    return u / (1 + u);
  }

  /** Preserve every inverse and normalization operation used by locate. */
  function inverse(
    a: number,
    b: number,
    r: number,
    phi: number,
  ): Inverse | null {
    if (!(phi >= 0 && phi <= Math.PI / 2)) return null;

    const A: number = a * Math.sin(phi);
    const B: number = b * Math.cos(phi);
    const w: number = AutoMovieConicArcField.weight(
      AutoMovieConicFieldJet.NUMBER,
      r,
    );
    const reverse: boolean = phi === Math.PI / 2 || A > B;
    const t: number =
      phi === Math.PI / 2 ? 0 : half(reverse ? B / A : A / B, w);
    const first: number = reverse ? b : a;
    const second: number = reverse ? a : b;
    const scale: number = Math.max(first, second);
    const x: number = first / scale;
    const y: number = second / scale;
    return { t, reverse, first, second, scale, x, y, w };
  }
}

/**
 * The unchanged nearest-end inverse and physical normalization, without
 * geometry.
 */
interface Inverse {
  /** Selected native clock. */ t: number;
  /** Selected chart reflection. */ reverse: boolean;
  /** First physical extent. */ first: number;
  /** Second physical extent. */ second: number;
  /** Physical normalization scale. */ scale: number;
  /** First normalized extent. */ x: number;
  /** Second normalized extent. */ y: number;
  /** Positive rational weight. */ w: number;
}
