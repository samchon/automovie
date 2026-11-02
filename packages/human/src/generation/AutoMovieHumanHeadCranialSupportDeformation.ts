import { AutoMovieHumanHeadCranialImplicitSection as I } from "./AutoMovieHumanHeadCranialImplicitSection";
import { AutoMovieHumanHeadCranialVaultField as V } from "./AutoMovieHumanHeadCranialVaultField";

/** Exact source support deformation with observable work on every exit. */
export namespace AutoMovieHumanHeadCranialSupportDeformation {
  /** Point result retains the original skin on an unaccepted differential. */
  export type Result =
    | { ok: true; point: V.Local; normal: V.Local; curvature: number; sourceResidual: number }
    | { ok: false; point: V.Local; reason: string; sourceCurvature: number; sourceResidual: number };
  /** Actual ray work is preserved on both accepted and failed results. */
  export interface IWork {
    /** Number of actual outer iterations, including the exhausted budget. */
    iterations: number;
    /** Number of actual source callback requests. */
    sourceQueries: number;
    /** Final observed angular residual in radians. */
    angularResidual: number;
  }
  /** Exact ray result and its actual work, whether it succeeds or fails. */
  export type RayResult = (Extract<Result, { ok: true }> & IWork & { radius: number }) | (Extract<Result, { ok: false }> & IWork);

  /** Apply the unchanged support law directly to an actual analytic source jet. */
  export function apply(point: V.Local, jet: I.Jet, coefficient: number, spatialC2: boolean): Result {
    const gx: number = jet.gradient[0];
    const gz: number = jet.gradient[1];
    const norm: number = Math.hypot(gx, gz);
    const curvature: number = -(jet.hessian[0] * gz * gz - 2 * jet.hessian[1] * gx * gz + jet.hessian[2] * gx * gx) / norm ** 3;
    return deform(point, [-gx / norm, -gz / norm], curvature, Math.abs(jet.value), coefficient, spatialC2);
  }

  /**
   * Preserve the exact 1e-12 rad criterion. Bounded Newton uses the actual
   * transformed tangent. A failed 64th iteration returns its real work and
   * does not request an unused 65th source sample.
   */
  export function radial(source: (theta: number) => I.PolarJet, originXi: number, theta: number, coefficient: number, spatialC2: boolean): RayResult {
    const two: number = Math.PI * 2;
    const target: number = theta >= 0 && theta <= two ? theta : ((theta % two) + two) % two;
    let lo: number = target <= Math.PI ? 0 : Math.PI;
    let hi: number = target <= Math.PI ? Math.PI : two;
    let parameter: number = target;
    let sourceQueries: number = 1;
    let last: I.PolarJet = source(parameter);
    let angularResidual: number = NaN;
    for (let iteration: number = 1; iteration <= 64; iteration++) {
      const changed: Result = deform(last.point, last.normal, last.curvature, last.residual, coefficient, spatialC2);
      if (!changed.ok) return { ...changed, iterations: iteration, sourceQueries, angularResidual };
      const dx: number = changed.point[0] - originXi;
      const z: number = changed.point[1];
      const squared: number = dx * dx + z * z;
      let angle: number = Math.atan2(z, dx);
      if (target > Math.PI && angle < 0) angle += two;
      const error: number = angle - target;
      angularResidual = Math.abs(error);
      if (angularResidual < 1e-12) return { ...changed, radius: Math.sqrt(squared), angularResidual, iterations: iteration, sourceQueries };
      if (iteration === 64) break;
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
      sourceQueries++;
    }
    return { ok: false, point: last.point, reason: "The exact changed-curve ray intersection did not converge; the original source point was retained.", sourceCurvature: last.curvature, sourceResidual: last.residual, iterations: 64, sourceQueries, angularResidual };
  }

  /**
   * The physical support equation is unchanged. Finite zero curvature is a
   * regular C2 flat point in this polar-source parameter: its tangent scale
   * is exactly one and no inverse curvature is taken. Negative curvature and
   * reversed transformed tangents remain rejected without changing skin.
   */
  function deform(point: V.Local, normal: V.Local, curvature: number, sourceResidual: number, coefficient: number, spatialC2: boolean): Result {
    if (!(spatialC2 && normal.every(Number.isFinite) && Number.isFinite(curvature) && curvature >= 0 && Number.isFinite(coefficient) && Number.isFinite(sourceResidual)))
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
