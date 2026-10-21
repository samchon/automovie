import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveFamily } from "./HumanCurveFamily";

/** Analytic coordinates from four caller-owned signed affine planes.
 * The chart owns no plane selection, canonical orientation, boundary or shape.
 * Quotient differentiation and the inverse function theorem preserve the
 * supplied surface jet; see docs/techniques/plane-pencil-chart.md.
 *
 * @evidence contracts/common.md#principled-implementation Affine quotient Hessians and the inverse function theorem require finite nonzero denominators and a resolvable surface-chart Jacobian.
 * @evidence contracts/common.md#clear-and-simple-design Two stateless operations separate world chart evaluation from surface-jet pullback; callers own all geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source selection, fitting, sampling, projection, coordinate correction or specimen cases occur.
 * @evidence contracts/common.md#meaningful-documentation Members specify signed-plane convention, world frame, derivative units, authority ownership and rejection conditions.
 * @evidence contracts/performance.md#efficient-algorithms Each operation uses fixed-size vector and matrix arithmetic with constant work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Pullback evaluates both chart quotients once and reuses their derivatives for the inverse and mixed derivative.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No cache, task or resource is retained; returned records belong to the caller and borrow the explicitly named original authority.
 */
export namespace HumanPlanePencilChart {
  /** World vector or derivative triple, in the supplied registered frame. */
  export type Vector = HumanCurve.Vector;

  /** Row-major matrix; each operation documents its row and column units. */
  export type Matrix2 = [[number, number], [number, number]];

  /** World XYZ Hessian, with rows and columns in the same supplied frame. */
  export type Matrix3 = [Vector, Vector, Vector];

  /** Signed affine value n dot P - coordinateMm, in mm.
   * The dimensionless normal must be finite and nonzero. Its sign and scale
   * are caller decisions; this helper neither normalizes nor reverses it.
   */
  export interface Plane {
    /** Signed world normal, with its original dimensionless magnitude. */
    normal: Vector;

    /** Signed plane coordinate in mm, using precisely this normal's scale. */
    coordinateMm: number;
  }

  /** Four independently signed planes selected by the shared boundary owner. */
  export interface Planes {
    /** Numerator h and first contribution to the denominator of u. */
    hip: Plane;

    /** Contribution t to u's denominator h+t. */
    thigh: Plane;

    /** Its negated signed value -a is v's numerator. */
    across: Plane;

    /** Contribution f to v's denominator -a+f. */
    forward: Plane;
  }

  /** One dimensionless chart coordinate and its exact world derivatives. */
  export interface CoordinateJet {
    /** Original quotient value; it is neither clamped nor domain-selected. */
    value: number;

    /** Gradient with respect to world XYZ, in inverse mm. */
    gradient: Vector;

    /** Symmetric world XYZ Hessian, in inverse mm squared. */
    hessian: Matrix3;

    /** Signed affine denominator at the evaluated point, in mm. */
    denominatorMm: number;
  }

  /** Both quotients evaluated at one unchanged world position. */
  export interface ChartJet {
    /** u=h/(h+t), including its world gradient and Hessian. */
    u: CoordinateJet;

    /** v=-a/(-a+f), including its world gradient and Hessian. */
    v: CoordinateJet;

    /** Signed [h,t,a,f] in mm before forming either quotient. */
    signedPlaneValuesMm: [number, number, number, number];
  }

  /** Local inversion diagnostics; these do not establish global embedding. */
  export interface Diagnostics {
    /** d(u,v)/d(s,phi), rows u/v and columns physical s mm / phi radians. */
    jacobian: Matrix2;

    /** det d(u,v)/d(s,phi), in inverse mm per radian. */
    determinant: number;

    /** Signed determinant divided by the sum of absolute determinant products. */
    relativeDeterminant: number;

    /** max absolute entry of J*inverse(J)-identity, dimensionless. */
    inverseResidual: number;

    /** Residuals grad(q) dot Suv + Su^T Hess(q) Sv for q=u,v. */
    mixedChartResidual: [number, number];
  }

  /** Exact local reparameterization S(u,v)=F(s(u,v),phi(u,v)). */
  export interface SurfaceJet {
    /** Borrowed original authority, untouched and never refitted or sampled. */
    authorityJet: HumanCurveFamily.Jet;

    /** Borrowed original world position, in mm. */
    positionMm: Vector;

    /** World dS/du, mm per dimensionless u. */
    derivativeU: Vector;

    /** World dS/dv, mm per dimensionless v. */
    derivativeV: Vector;

    /** World d²S/(du dv), mm per dimensionless u and v. */
    mixedDerivativeUV: Vector;

    /** Rows s(mm)/phi(radians), columns u/v; no phase rescaling is inferred. */
    inverseJacobian: Matrix2;

    /** [d²s/(du dv),d²phi/(du dv)], respectively mm and radians. */
    inverseMixedDerivative: [number, number];

    /** Chart values and world first/second derivatives at this position. */
    chart: ChartJet;

    /** Local determinant and algebraic roundoff residuals. */
    diagnostics: Diagnostics;
  }

  /** Evaluate both affine quotients without choosing their interior domain.
   * Finite input vectors and nonzero normals are required. Zero denominators,
   * overflow and nonrepresentable derivatives throw before any result returns.
   * Negative denominators and quotients outside [0,1] are preserved for the
   * caller to interpret. Fixed-size arithmetic costs O(1) work and storage.
   */
  export function evaluate(planes: Planes, pointMm: Vector): ChartJet {
    requireVector(pointMm, "Chart position");
    const ordered: Plane[] = [planes.hip, planes.thigh, planes.across, planes.forward];
    for (const plane of ordered) {
      requireVector(plane.normal, "Signed plane normal");
      if (!(Math.hypot(...plane.normal) > 0) || !Number.isFinite(plane.coordinateMm))
        throw new Error("Signed planes require nonzero normals and finite coordinates");
    }
    const values: [number, number, number, number] = ordered.map(
      (plane: Plane): number => dot(plane.normal, pointMm) - plane.coordinateMm,
    ) as [number, number, number, number];
    if (!values.every(Number.isFinite)) throw new Error("Signed plane values are not finite");
    const u: CoordinateJet = quotient(values[0], planes.hip.normal, values[0] + values[1], add(planes.hip.normal, planes.thigh.normal));
    const v: CoordinateJet = quotient(-values[2], scale(planes.across.normal, -1), -values[2] + values[3], add(scale(planes.across.normal, -1), planes.forward.normal));
    return { u, v, signedPlaneValuesMm: values };
  }

  /** Reparameterize the full analytic surface second jet at its own position.
   * Both optional pure second derivatives in HumanCurveFamily.Jet are required;
   * omission throws rather than replacing them with finite differences. The
   * inverse and mixed inverse follow the inverse function theorem. An exactly
   * singular or roundoff-unresolved Jacobian and every nonfinite intermediate
   * throw; no plane, shape or authority is changed. Work and storage are O(1).
   */
  export function pullback(planes: Planes, authority: HumanCurveFamily.Jet): SurfaceJet {
    const fs: Vector = authority.longitudinalDerivative;
    const fp: Vector = authority.phaseDerivativeMmPerRadian;
    const fsp: Vector = authority.longitudinalPhaseDerivativePerRadian;
    const fss: Vector | undefined = authority.longitudinalSecondDerivative;
    const fpp: Vector | undefined = authority.phaseSecondDerivativeMmPerRadianSquared;
    if (fss === undefined || fpp === undefined)
      throw new Error("Plane-pencil pullback requires both analytic pure second derivatives");
    for (const value of [fs, fp, fsp, fss, fpp]) requireVector(value, "Surface derivative");
    const chart: ChartJet = evaluate(planes, authority.positionMm);
    const a: number = dot(chart.u.gradient, fs), b: number = dot(chart.u.gradient, fp);
    const c: number = dot(chart.v.gradient, fs), d: number = dot(chart.v.gradient, fp);
    const inverse: { matrix: Matrix2; determinant: number; relative: number } = invert(a, b, c, d);
    const k: Matrix2 = inverse.matrix;
    const su: Vector = combine(fs, k[0][0], fp, k[1][0]);
    const sv: Vector = combine(fs, k[0][1], fp, k[1][1]);
    // First form the actual F second derivative along the two inverse tangents.
    const quadratic: Vector = add(
      combine(fss, k[0][0] * k[0][1], fsp, k[0][0] * k[1][1] + k[1][0] * k[0][1]),
      scale(fpp, k[1][0] * k[1][1]),
    );
    // Differentiating q(F(x(u,v))) gives J*x_uv + g*Q + Su^T Hq Sv = 0.
    const ru: number = dot(chart.u.gradient, quadratic) + bilinear(chart.u.hessian, su, sv);
    const rv: number = dot(chart.v.gradient, quadratic) + bilinear(chart.v.hessian, su, sv);
    const mixed: [number, number] = [-(k[0][0] * ru + k[0][1] * rv), -(k[1][0] * ru + k[1][1] * rv)];
    const suv: Vector = add(quadratic, combine(fs, mixed[0], fp, mixed[1]));
    for (const value of [su, sv, quadratic, suv]) requireVector(value, "Pulled-back derivative");
    if (!mixed.every(Number.isFinite)) throw new Error("Inverse mixed derivative is not finite");
    const residual: number = Math.max(
      Math.abs(a * k[0][0] + b * k[1][0] - 1), Math.abs(a * k[0][1] + b * k[1][1]),
      Math.abs(c * k[0][0] + d * k[1][0]), Math.abs(c * k[0][1] + d * k[1][1] - 1),
    );
    const mixedResidual: [number, number] = [
      dot(chart.u.gradient, suv) + bilinear(chart.u.hessian, su, sv),
      dot(chart.v.gradient, suv) + bilinear(chart.v.hessian, su, sv),
    ];
    if (![residual, ...mixedResidual].every(Number.isFinite)) throw new Error("Pullback diagnostics are not finite");
    return {
      authorityJet: authority, positionMm: authority.positionMm, derivativeU: su, derivativeV: sv,
      mixedDerivativeUV: suv, inverseJacobian: k, inverseMixedDerivative: mixed, chart,
      diagnostics: { jacobian: [[a, b], [c, d]], determinant: inverse.determinant, relativeDeterminant: inverse.relative, inverseResidual: residual, mixedChartResidual: mixedResidual },
    };
  }

  /** For affine N,D, grad(q)=(grad(N)-q grad(D))/D and Hess(q)
   * =-(grad(q) outer grad(D)+grad(D) outer grad(q))/D. No cubic is introduced.
   */
  function quotient(numerator: number, numeratorNormal: Vector, denominator: number, denominatorNormal: Vector): CoordinateJet {
    if (!Number.isFinite(denominator) || denominator === 0)
      throw new Error("Plane-pencil quotient denominator is zero or nonfinite");
    const value: number = numerator / denominator;
    const gradient: Vector = combine(numeratorNormal, 1 / denominator, denominatorNormal, -value / denominator);
    const hessian: Matrix3 = [0, 1, 2].map((i: number): Vector => [0, 1, 2].map(
      (j: number): number => -(gradient[i]! * denominatorNormal[j]! + denominatorNormal[i]! * gradient[j]!) / denominator,
    ) as Vector) as Matrix3;
    if (!Number.isFinite(value)) throw new Error("Plane-pencil quotient is not finite");
    requireVector(gradient, "Chart gradient");
    for (const row of hessian) requireVector(row, "Chart Hessian");
    return { value, gradient, hessian, denominatorMm: denominator };
  }

  /** Row scaling bounds determinant-product roundoff without changing the
   * inverse. Reject cancellation within 32 eps times its two product magnitudes;
   * this is numeric resolution admission, not a geometric minimum-area law.
   */
  function invert(a: number, b: number, c: number, d: number): { matrix: Matrix2; determinant: number; relative: number } {
    if (![a, b, c, d].every(Number.isFinite)) throw new Error("Surface-chart Jacobian is not finite");
    const r: number = Math.max(Math.abs(a), Math.abs(b)), s: number = Math.max(Math.abs(c), Math.abs(d));
    if (!(r > 0 && s > 0)) throw new Error("Surface-chart Jacobian has a zero row");
    const ar: number = a / r, br: number = b / r, cs: number = c / s, ds: number = d / s;
    const positive: number = ar * ds, negative: number = br * cs;
    const normalized: number = positive - negative;
    const magnitude: number = Math.abs(positive) + Math.abs(negative);
    if (!(Math.abs(normalized) > 32 * Number.EPSILON * magnitude))
      throw new Error("Surface-chart Jacobian is singular or unresolved in binary64 arithmetic");
    const determinant: number = normalized * r * s;
    const matrix: Matrix2 = [[(ds / normalized) / r, (-br / normalized) / s], [(-cs / normalized) / r, (ar / normalized) / s]];
    if (!Number.isFinite(determinant) || determinant === 0 || !matrix.flat().every(Number.isFinite))
      throw new Error("Surface-chart inverse or determinant is not representable");
    return { matrix, determinant, relative: normalized / magnitude };
  }

  /** Strict finite triples are admitted without copying, scaling or repair. */
  function requireVector(value: Vector, name: string): void {
    if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite))
      throw new Error(name + " must be a finite world triple");
  }

  /** Fixed-size scalar product in the unchanged world frame. */
  function dot(a: Vector, b: Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /** Exact matrix bilinear form, with its caller's derivative units. */
  function bilinear(matrix: Matrix3, a: Vector, b: Vector): number {
    return a[0] * dot(matrix[0], b) + a[1] * dot(matrix[1], b) + a[2] * dot(matrix[2], b);
  }

  /** Add two derivative vectors without changing their common units. */
  function add(a: Vector, b: Vector): Vector { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }

  /** Scalar multiplication preserves the supplied vector direction. */
  function scale(a: Vector, factor: number): Vector { return [a[0] * factor, a[1] * factor, a[2] * factor]; }

  /** Fixed linear combination; no normalization or tangent replacement. */
  function combine(a: Vector, x: number, b: Vector, y: number): Vector {
    return [a[0] * x + b[0] * y, a[1] * x + b[1] * y, a[2] * x + b[2] * y];
  }
}
