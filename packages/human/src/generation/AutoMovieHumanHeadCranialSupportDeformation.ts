import { AutoMovieHumanHeadCranialImplicitSection as I } from "./AutoMovieHumanHeadCranialImplicitSection";
import { AutoMovieHumanHeadCranialVaultField as V } from "./AutoMovieHumanHeadCranialVaultField";

/** Direct support deformation from an actual source point and its analytic jet. */
export namespace AutoMovieHumanHeadCranialSupportDeformation {
  /** Failed geometry retains the actual source point and its measurements. */
  export type Result =
    | { ok: true; point: V.Local; normal: V.Local; curvature: number; sourceResidual: number }
    | { ok: false; point: V.Local; reason: string; sourceCurvature: number; sourceResidual: number };

  /** Exact ray result, with its independent numerical intersection residual. */
  export type RayResult =
    | (Extract<Result, { ok: true }> & { radius: number; angularResidual: number; iterations: number })
    | Extract<Result, { ok: false }>;

  /**
   * Apply delta*sin(2phi)^2 to the source support directly. The existing
   * source curve's parameter remains a curve parameter; the output need not
   * lie on the original polar ray. Consumers needing an exact ray must solve
   * it on this changed curve, rather than treating displacement as a radius.
   * This evaluator performs no hull, quadrature or landmark search.
   */
  export function apply(point: V.Local, jet: I.Jet, coefficient: number, spatialC2: boolean): Result {
    const gx: number = jet.gradient[0];
    const gz: number = jet.gradient[1];
    const norm: number = Math.hypot(gx, gz);
    const curvature: number = -(jet.hessian[0] * gz * gz - 2 * jet.hessian[1] * gx * gz + jet.hessian[2] * gx * gx) / norm ** 3;
    return deform(point, [-gx / norm, -gz / norm], curvature, Math.abs(jet.value), coefficient, spatialC2);
  }

  /**
   * Find the changed curve's intersection with the original consumer ray.
   * The callback reads actual source points and analytic differentials. The
   * support displacement is sampled on that source parameter, but its tangent
   * is scaled by 1+delta*(b+b'')*kappa. Bounded Newton therefore uses the exact
   * transformed tangent, with bisection whenever a step leaves the bracket.
   */
  export function radial(source: (theta: number) => I.PolarJet, originXi: number, theta: number, coefficient: number, spatialC2: boolean): RayResult {
    const two: number = Math.PI * 2;
    const target: number = theta >= 0 && theta <= two ? theta : ((theta % two) + two) % two;
    let lo: number = target <= Math.PI ? 0 : Math.PI;
    let hi: number = target <= Math.PI ? Math.PI : two;
    let parameter: number = target;
    let last: I.PolarJet = source(parameter);
    for (let iteration: number = 1; iteration <= 64; iteration++) {
      const changed: Result = deform(last.point, last.normal, last.curvature, last.residual, coefficient, spatialC2);
      if (!changed.ok) return changed;
      const dx: number = changed.point[0] - originXi;
      const z: number = changed.point[1];
      const squared: number = dx * dx + z * z;
      let angle: number = Math.atan2(z, dx);
      if (target > Math.PI && angle < 0) angle += two;
      const error: number = angle - target;
      if (Math.abs(error) < 1e-12)
        return { ...changed, radius: Math.sqrt(squared), angularResidual: Math.abs(error), iterations: iteration };
      if (error < 0) lo = parameter;
      else hi = parameter;
      const phi: number = Math.atan2(last.normal[1], last.normal[0]);
      const scale: number = 1 + coefficient * (0.5 + 7.5 * Math.cos(4 * phi)) * last.curvature;
      const tx: number = -last.normal[1] * last.speed * scale;
      const tz: number = last.normal[0] * last.speed * scale;
      const derivative: number = (dx * tz - z * tx) / squared;
      const next: number = parameter - error / derivative;
      parameter = next > lo && next < hi && Number.isFinite(next) ? next : (lo + hi) / 2;
      last = source(parameter);
    }
    return { ok: false, point: last.point, reason: "The exact changed-curve ray intersection did not converge; the original source point was retained.", sourceCurvature: last.curvature, sourceResidual: last.residual };
  }

  /** Actual geometric transformation, shared by point and exact-ray consumers. */
  function deform(point: V.Local, normal: V.Local, curvature: number, sourceResidual: number, coefficient: number, spatialC2: boolean): Result {
    if (!(spatialC2 && normal.every(Number.isFinite) && Number.isFinite(curvature) && curvature > 0 && Number.isFinite(coefficient) && Number.isFinite(sourceResidual)))
      return { ok: false, point, reason: "The actual source point has no healthy C2 convex differential; its skin was retained.", sourceCurvature: curvature, sourceResidual };
    const nx: number = normal[0];
    const nz: number = normal[1];
    const phi: number = Math.atan2(nz, nx);
    const f: number = Math.sin(2 * phi) ** 2;
    const derivative: number = 2 * Math.sin(4 * phi);
    const radiusScale: number = 1 + coefficient * (0.5 + 7.5 * Math.cos(4 * phi)) * curvature;
    if (!(radiusScale > 0))
      return { ok: false, point, reason: "The requested physical support coefficient would reverse local curvature; neither coefficient nor skin was clamped.", sourceCurvature: curvature, sourceResidual };
    return { ok: true, point: [point[0] + coefficient * (f * nx - derivative * nz), point[1] + coefficient * (f * nz + derivative * nx)], normal: [nx, nz], curvature: curvature / radiusScale, sourceResidual };
  }
}
