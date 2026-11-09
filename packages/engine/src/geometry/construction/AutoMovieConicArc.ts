import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";

/** The unchanged nearest-end inverse and physical normalization, without geometry. */
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

/**
 * The positive rational quadratic from (a,0) through corner (a,b) to (0,b), with middle weight w=r/(1-r). It is evaluated as that conic, without a polar polynomial approximation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States source weight, endpoints, angle units, derivatives and the difference between exact conic formulas and binary64 observations.
 * @evidence contracts/development/design.md#principled-representation Represents The positive rational quadratic from (a,0) through corner (a,b) to (0,b), with middle weight w=r/(1-r): companion namespace of 13 members (`IRay`, `curvature`, `parameter`, `guide`, `interiorGuide`, `radius`, ...); units and frames named in its text: rational, second, local, radians. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConicArc` in packages/engine/src/geometry/construction/AutoMovieConicArc.ts; its surface is the 13 members listed and the text shows 10 other files naming it, mostly packages/engine (6), test (4), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieConicArc {
  /**
   * One numeric ray location shared with source derivative readers.
   *
   * @evidence contracts/development/design.md#principled-representation One selected native/projective clock and its geometric reading identify the actual source point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Quadratic and G2 adapters share one location record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A descriptor does not claim source derivatives or retain a source callback.
   * @evidence contracts/development/common.md#meaningful-documentation Point and tangent use the original quarter chart; radial derivatives increase polar angle; reverse identifies the chosen end chart.
   */
  export interface IRay {
    /** Physical point in the original quarter chart. */
    point: readonly [number, number];

    /** Unit tangent in increasing original polar direction. */
    tangent: readonly [number, number];

    /** Actual radial phase jet. */
    radial: AutoMoviePolarSector.Jet;

    /** Logarithm of positive geometric curvature. */
    logCurvature: number;

    /** Selected first-half quadratic parameter, or null for a cubic. */
    native: number | null;

    /** Selected cubic log odds, or null at an endpoint or quadratic. */
    clock: number | null;

    /** Explicit endpoint identity; a null clock never implies an interior parameter. */
    position: "first" | "interior" | "last";

    /** Selected chart was reflected from the original quarter. */
    reverse: boolean;
  }

  /**
   * Endpoint geometric curvature at extent a across extent b.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The rational quadratic's endpoint curvature is a/(2w^2 b^2), with w=r/(1-r).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One formula is shared by guide ownership and curvature corrections.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the declared extents/shoulder, without fitting or a fallback curvature.
   * @evidence contracts/development/common.md#meaningful-documentation States the geometric rather than radial curvature and inverse-length unit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A scalar formula has no effectful work to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains nothing.
   */
  export function curvature(a: number, b: number, r: number): number {
    return AutoMovieConicArcField.curvature(
      AutoMovieConicFieldJet.NUMBER,
      a,
      b,
      r,
    );
  }

  /**
   * Native parameter of a ray at angle phi in [0,pi/2].
   *
   * @evidence contracts/development/implementation.md#principled-implementation Solves B*u^2+2w(B-A)u-A=0 for nonnegative u=t/(1-t), A=a*sin(phi), B=b*cos(phi), reflecting the smaller ratio to avoid cancellation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed form replaces an iterative ray inversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Endpoints are their exact source identities; no interior angle or radius is clamped.
   * @evidence contracts/development/common.md#meaningful-documentation States admitted quadrant and dimensionless result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two trigonometric reads and constant scalar arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure ray inversion schedules no effectful work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or result state.
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
    const w: number = AutoMovieConicArcField.weight(
      AutoMovieConicFieldJet.NUMBER,
      r,
    );
    return A <= B ? half(A / B, w) : 1 - half(B / A, w);
  }

  /**
   * Native conic point as a polar guide, including its analytic first/second angle derivatives.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Differentiates the rational numerator/denominator twice, then applies rho_t and phi_t chain rules; normalized extents reduce unit-scale overflow.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preserves the former conic-guide API through one formula owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses no neighbour differences or sampled interpolant; unrepresentable arithmetic remains nonfinite for section admission.
   * @evidence contracts/development/common.md#meaningful-documentation States native parameter, angular offset and the radial jet meaning.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant quotient/chain-rule arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The internal guide formula consumes the same normalized point that a ray location uses for its physical point and tangent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary fixed-size pairs and the returned guide belong to this query.
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
    const geometry: AutoMovieConicArcField.IGeometry<number> =
      AutoMovieConicArcField.evaluate(
        AutoMovieConicFieldJet.NUMBER,
        A,
        B,
        w,
        t,
      );
    return interiorGuide(A, B, w, t, start, scale, geometry.point);
  }

  /** Read the existing polar quotient arithmetic from an already evaluated normalized interior point. */
  function interiorGuide(
    A: number,
    B: number,
    w: number,
    t: number,
    start: number,
    scale: number,
    C: readonly [number, number],
  ): AutoMoviePolarSector.IGuide {
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
   * Exact-conic polar radius and two derivatives on one quarter, with reflected native evaluation near its second endpoint.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the rational arc at its closed-form ray intersection; reflection changes only the sign of the first polar derivative.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One radius owner serves sections and their local correction bounds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No polar polynomial replaces the conic, and no aspect or specimen branch changes its shape.
   * @evidence contracts/development/common.md#meaningful-documentation States local angle and radial derivative order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant ray and native-guide work; no iteration or source sampling grid.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares native guide arithmetic instead of maintaining another conic formula.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a three-number jet and retains no query state.
   */
  export function radius(
    a: number,
    b: number,
    r: number,
    phi: number,
  ): AutoMoviePolarSector.Jet {
    return locate(a, b, r, phi)?.radial ?? [NaN, NaN, NaN];
  }

  /**
   * Cartesian-to-polar analytic chain rule on a regular positive ray.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Differentiates rho=|C| and phi=atan2(y,x) twice and divides by the positive native angular speed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standalone conversion supports explicit native-jet inspection; production G2 rays use projective geometric readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A nonpositive/nonfinite angular speed produces a nonfinite jet rather than a replacement derivative.
   * @evidence contracts/development/common.md#meaningful-documentation The input is [x,y,x_t,y_t,x_tt,y_tt]; the output differentiates radius in radians.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion schedules no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns three numbers and retains no native curve.
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
   * @evidence contracts/development/implementation.md#principled-implementation Uses x_t=-2at(s+wt)/D^2 and y_t=2bs(t+ws)/D^2, avoiding a polar singular turn in arclength quadrature.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One native speed serves actual conic lengths.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Computes the declared rational curve without a sampled replacement or aspect exemption.
   * @evidence contracts/development/common.md#meaningful-documentation Extents use one length unit, r is the shoulder and t is the original unit parameter.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic and one hypot.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure speed query schedules no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no source.
   */
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

  /** Stable positive quadratic root in a ratio no greater than one; the result is the first-half native parameter. */
  function half(ratio: number, w: number): number {
    const q: number = w * (1 - ratio);
    const u: number = ratio / (q + Math.hypot(q, Math.sqrt(ratio)));
    return u / (1 + u);
  }

  /**
   * Locate a rational-quadratic ray once for numeric and source readers.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The cancellation-avoiding native inverse selects the nearest endpoint; positive rational velocity fixes tangent and curvature.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the existing phase jet and the identical fixed native clock.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampled curve or clock derivative supplies source partials.
   * @evidence contracts/development/common.md#meaningful-documentation Local phi is in[0,pi/2]; invalid numerical geometry returns null.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant inverse and native geometry arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One normalized point/tangent evaluation serves the guide and physical geometry; the source reader consumes its descriptor without another ray solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fixed-size numeric data escapes.
   */
  export function locate(
    a: number,
    b: number,
    r: number,
    phi: number,
  ): IRay | null {
    const selected: Inverse | null = inverse(a, b, r, phi);
    if (selected === null) return null;
    const { t, reverse, first, second, scale, x, y, w }: Inverse = selected;
    const normalized: AutoMovieConicArcField.IGeometry<number> =
      AutoMovieConicArcField.evaluate(
        AutoMovieConicFieldJet.NUMBER,
        x,
        y,
        w,
        t,
      );
    const guideValue: AutoMoviePolarSector.IGuide =
      t === 0
        ? guide(first, second, r, t)
        : interiorGuide(x, y, w, t, 0, scale, normalized.point);
    const geometry: AutoMovieConicArcField.IGeometry<number> =
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
    const radial: AutoMoviePolarSector.Jet = [
      guideValue.value,
      reverse ? -guideValue.slope : guideValue.slope,
      guideValue.curvature,
    ];
    if (
      ![...geometry.point, ...geometry.tangent, ...radial, logCurvature].every(
        Number.isFinite,
      )
    )
      return null;
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

  /**
   * Same inverse and physical point, without tangent or polar derivatives.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Shares the stable reflected quadratic inverse and ArcField point arithmetic with locate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One value capability omits full-ray geometry after selecting the same native clock.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves physical normalization and sign/swap; does not substitute a guide coordinate or promise uncomputed derivatives.
   * @evidence contracts/development/common.md#meaningful-documentation Angles use radians and returned coordinates use source lengths; nonfinite points or invalid angles return null.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant inverse and point work, without velocity, polar2 or logarithmic curvature.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same inverse and generic point owner as the full reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One local inverse record and a fresh coordinate pair have no retained cache.
   */
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
    if (![x, y].every(Number.isFinite)) return null;
    return selected.reverse ? [y, x] : [x, y];
  }

  /**
   * Radius value in the identical native inverse and normalization as locate.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the same normalized rational point and computes hypot(point)*scale, or the exact nearest guide extent, as the full radial reader.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Separates a scalar value from unused tangent and polar derivatives.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No physical-point renormalization, sampled approximation or invalid inverse fallback changes the original value arithmetic.
   * @evidence contracts/development/common.md#meaningful-documentation Returns source length or NaN for an invalid query/value; it makes no phase-derivative availability claim.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant original inverse, rational point and norm work omit velocity and curvature work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure query retains no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only a scalar escapes the call.
   */
  export function value(a: number, b: number, r: number, phi: number): number {
    const selected: Inverse | null = inverse(a, b, r, phi);
    if (selected === null) return NaN;
    if (selected.t === 0)
      return Number.isFinite(selected.first) && selected.first > 0
        ? selected.first
        : NaN;
    const point: readonly [number, number] = AutoMovieConicArcField.point(
      AutoMovieConicFieldJet.NUMBER,
      selected.x,
      selected.y,
      selected.w,
      selected.t,
    );
    const value: number = Math.hypot(...point) * selected.scale;
    return Number.isFinite(value) && value > 0 ? value : NaN;
  }

  /** Preserve every inverse and normalization operation used by locate. */
  function inverse(
    a: number,
    b: number,
    r: number,
    phi: number,
  ): Inverse | null {
    if (!(Number.isFinite(phi) && phi >= 0 && phi <= Math.PI / 2)) return null;

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
