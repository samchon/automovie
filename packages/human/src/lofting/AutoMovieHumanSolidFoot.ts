import { AutoMovieHumanSolidVector } from "./AutoMovieHumanSolidVector";
import type { IAutoMovieHumanSolidSurface } from "./IAutoMovieHumanSolidSurface";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
const { dot, norm, sub } = AutoMovieHumanSolidVector;

/**
 * The foot of a world point on a solid surface: the chart point whose surface
 * point is nearest, found by Newton's method on the squared distance.
 *
 * The operators place their seeds and trim margins from landmarks, which are
 * world points; the foot turns each into chart parameters on the surface that
 * owns it. At the foot the residual `r = S - q` is normal to the surface, so
 * the stationary conditions are `r . S_u = 0` and `r . S_v = 0`; their
 * Jacobian is `[[S_u . S_u + r . S_uu, S_u . S_v + r . S_uv], [., S_v . S_v + r . S_vv]]`,
 * the Hessian of `|r|^2 / 2`. Where that Hessian is not positive definite (a
 * point farther from the surface than its radius of curvature, on the concave
 * side) the step falls back to Gauss-Newton, the Hessian without its `r` terms,
 * which always descends. Each step moves the surface point no farther than the point's current
 * distance from the world point, so a start in the wrong basin cannot jump
 * across the part, while a Newton step near the foot, shorter than the
 * residual, is never cut. Quadratic convergence near the foot; a start farther than the
 * point's distance from the surface's medial axis can reach a local foot on
 * the other side, which the caller avoids by seeding from the landmark's own
 * region.
 */
export namespace AutoMovieHumanSolidFoot {
  /** A foot point. */
  export interface IFoot {
    /** Chart parameters. */
    u: number;

    /** Chart parameters. */
    v: number;

    /** The surface point there, mm. */
    point: Vec3;

    /** Distance from the world point, mm. */
    distance: number;
  }

  /** Newton steps before the search gives up. */
  export const STEPS: number = 60;

  /**
   * The foot of a world point.
   *
   * @param surface The surface.
   * @param q The world point, mm.
   * @param guess Chart point to start from, `[u, v]`, in the landmark's region.
   * @param tolerance Largest tangential residual `|r . S_u| / |S_u|` and
   *   `|r . S_v| / |S_v|` accepted, mm.
   * @returns The foot, or null when Newton does not converge within
   *   {@link STEPS} or the chart degenerates (a vanishing derivative).
   */
  export function of(
    surface: IAutoMovieHumanSolidSurface,
    q: Readonly<Vec3>,
    guess: readonly [number, number],
    tolerance: number,
  ): IFoot | null {
    let u: number = guess[0];
    let v: number = guess[1];

    for (let step: number = 0; step < STEPS; step++) {
      const j: IAutoMovieHumanSolidSurface.IJet = surface.jet(u, v);
      const r: Vec3 = sub(j.p, q);
      const lu: number = norm(j.u);
      const lv: number = norm(j.v);
      if (!(lu > 0 && lv > 0)) return null;
      const gu: number = dot(r, j.u);
      const gv: number = dot(r, j.v);
      if (Math.abs(gu) / lu <= tolerance && Math.abs(gv) / lv <= tolerance)
        return { u, v, point: j.p, distance: norm(r) };

      // Newton on the full Hessian where it is positive definite, otherwise
      // Gauss-Newton on the first fundamental form.
      const E: number = dot(j.u, j.u);
      const F: number = dot(j.u, j.v);
      const G: number = dot(j.v, j.v);
      let a: number = E + dot(r, j.uu);
      let b: number = F + dot(r, j.uv);
      let d: number = G + dot(r, j.vv);
      if (!(a > 0 && a * d - b * b > 0)) {
        a = E;
        b = F;
        d = G;
      }
      const delta: [number, number] | null = AutoMovieHumanSolidVector.solve2(a, b, b, d, [-gu, -gv]);
      if (delta === null) return null;

      // Bound the step: its world length under the first fundamental form at
      // most the current distance.
      const length: number = Math.sqrt(Math.max(0, E * delta[0] ** 2 + 2 * F * delta[0] * delta[1] + G * delta[1] ** 2));
      const bound: number = Math.max(norm(r), tolerance);
      const k: number = length > bound && length > 0 ? bound / length : 1;
      u += k * delta[0];
      v += k * delta[1];
    }
    return null;
  }
}
