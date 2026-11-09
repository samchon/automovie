import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
const { dot, norm, sub } = AutoMovieSolidVector;

/**
 * A stationary surface foot of a world point, found locally by Newton on squared distance from the supplied chart guess. A converged stationary point is not a global nearest-point certificate.
 *
 * The operators place their seeds and trim margins from landmarks, which are
 * world points; the foot turns each into chart parameters on the surface that
 * owns it. At the foot the residual `r = S - q` is normal to the surface, so
 * the stationary conditions are `r . S_u = 0` and `r . S_v = 0`; their
 * Jacobian is `[[S_u . S_u + r . S_uu, S_u . S_v + r . S_uv], [., S_v . S_v + r . S_vv]]`,
 * the Hessian of `|r|^2 / 2`. Where that Hessian is not positive definite (a
 * point farther from the surface than its radius of curvature, on the concave
 * side) the step falls back to Gauss-Newton, the Hessian without its `r` terms,
 * which gives a descent direction when the metric is positive definite. A step's linearized world length is capped by the current separation (or tolerance), but the actual trial distance is not reevaluated for descent. Regional guesses and a regular local minimum remain caller premises; these local steps do not certify the globally nearest foot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the residual, the tolerance and the failure.
 * @evidence contracts/development/design.md#principled-representation Represents A stationary surface foot of a world point, found locally by Newton on squared distance from the supplied chart guess: companion namespace of 3 members (`IFoot`, `STEPS`, `of`); units and frames named in its text: world, local, newton. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidFoot` in packages/engine/src/geometry/construction/AutoMovieSolidFoot.ts; its surface is the 3 members listed and the text shows 4 other files naming it, mostly packages/engine (3), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidFoot {
  /**
   * A locally accepted stationary foot and its world separation from the target.
   *
   * @evidence contracts/development/design.md#principled-representation Chart parameters identify the surface point whose two normalized tangential residuals passed the local solve's criterion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two chart scalars, the evaluated world point and distance expose the result without duplicating a surface.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Acceptance certifies finite owned-chart membership and local stationarity, not a global minimum, a positive-definite Hessian or constrained boundary optimum.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes chart coordinates from mm world point/distance and labels the result as local.
   */
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Solves the two tangential stationarity equations by Newton, using the metric Gauss-Newton system when the full Hessian is not positive definite and bounding the chart step's linearized world length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One local iterate owns residual, Hessian selection, relative small-system solve and step scaling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only owned finite trials are evaluated; at most twenty scalar feasibility halvings preserve the actual map. Normalized tangential stationarity still does not exclude maxima/other basins or certify a constrained boundary optimum; no post-step distance-descent claim is made.
   * @evidence contracts/development/common.md#meaningful-documentation Gives mm target/tolerance, the two normalized residual tests, regional-guess premise, step/iteration behavior and nullable failure.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 60 fixed-size jet/system evaluations and twenty scalar domain halvings per update, with constant iterate storage; callback cost and local conditioning remain relevant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One current jet supplies both residuals, Hessian/metric terms and the accepted point; repeated calls do not share a prepared search.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The iterate and temporary vectors/matrices are call-local on success or null; only a small foot record with the jet's point reference escapes.
   */
  export function of(
    surface: IAutoMovieSolidSurface,
    q: Readonly<Vec3>,
    guess: readonly [number, number],
    tolerance: number,
  ): IFoot | null {
    let u: number = guess[0];
    let v: number = guess[1];

    for (let step: number = 0; step < STEPS; step++) {
      const j: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
        surface,
        u,
        v,
      );
      if (j === null) return null;
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
      const delta: [number, number] | null = AutoMovieSolidVector.solve2(
        a,
        b,
        b,
        d,
        [-gu, -gv],
      );
      if (delta === null) return null;

      // Bound the step: its world length under the first fundamental form at
      // most the current distance.
      const length: number = Math.sqrt(
        Math.max(
          0,
          E * delta[0] ** 2 + 2 * F * delta[0] * delta[1] + G * delta[1] ** 2,
        ),
      );
      const bound: number = Math.max(norm(r), tolerance);
      let k: number = length > bound && length > 0 ? bound / length : 1;
      let trial: number = 0;
      while (
        !AutoMovieSolidDomain.contains(
          surface,
          u + k * delta[0],
          v + k * delta[1],
        ) &&
        trial++ < 20
      )
        k /= 2;
      if (
        !AutoMovieSolidDomain.contains(
          surface,
          u + k * delta[0],
          v + k * delta[1],
        )
      )
        return null;
      u += k * delta[0];
      v += k * delta[1];
    }
    return null;
  }
}
