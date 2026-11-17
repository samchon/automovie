import type {
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidIntersectionTrace } from "./AutoMovieSolidIntersectionTrace";

/**
 * The curve where an attached part's surface meets its host's: the
 * surface-surface intersection of the solid merge and diff, traced by a
 * declared parameter `t` over one turn.
 *
 * The part `A(s, phi)` has a periodic phase `phi` (a limb, a digit, a muscle
 * head, a cutter); the host `B(y, theta)` is any surface. A point of the
 * curve solves four equations in the four unknowns `x = (s, phi, y, theta)`:
 *
 * ```text
 * F(x) = A(s, phi) - B(y, theta) = 0      (three, the meeting)
 * g(x, t) = 0                               (one, the parameter)
 * ```
 *
 * by Newton's method with the Jacobian `J = [A_s, A_phi, -B_y, -B_theta; grad g]`
 * (Patrikalakis, Maekawa and Cho, Shape Interrogation for CAD and
 * Manufacturing, ch. 5). Three parameters:
 *
 * - `phase`: `g = phi - t`, the part's phase. Each phase's station line
 *   crosses the host once near the curve: a limb, a digit, the neck.
 * - `angle`: `g = (A - c) . m(t)`, the angle `t` about an axis through the
 *   footprint's centre `c` with normal `n`, `m(t) = -sin t e1 + cos t e2` square
 *   to the half plane of direction `d(t) = cos t e1 + sin t e2` (`e1` the
 *   reference square to `n`, `e2 = n x e1`). A part lying along its host
 *   (a groove, a muscle head, a crease, a nail fold), whose station lines run
 *   along the host and cross it twice or never, is traced so, since every
 *   half plane about its footprint's centre meets the curve once.
 * - `arc`: requested normalized arclength, for a long thin part along its host
 *   (a lid, a lip, a helix rim, a groove) whose half planes about any one
 *   centre cross its curve twice; the loop is first walked by
 *   pseudo-arclength continuation (Allgower and Georg, Numerical
 *   Continuation Methods, 1990, ch. 2). The current equal-chord spline
 *   guide approximates this request rather than certifying exact arclength.
 *
 * Differentiating `F(x(t)) = 0` and `g(x(t), t) = 0` gives its local implicit
 * jet by the implicit function theorem, with no difference of traced points:
 *
 * ```text
 * J x'  = -(0, 0, 0, g_t)
 * J x'' = -(Q_A - Q_B, Q_g)
 * Q_A = A_ss s'^2 + 2 A_sphi s' phi' + A_phiphi phi'^2,  Q_B the same in B
 * Q_g = Q_A . m + 2 P' . m' + (P - c) . m''  (angle; 0 for phase)
 * C'  = A_s s' + A_phi phi',   C'' = Q_A + A_s s'' + A_phi phi''
 * ```
 *
 * with `P = A`, `m' = -d`, `m'' = -m`, `g_t = -(P - c) . d` (angle) or `-1`
 * (phase); each line collects every second-order term of the chain rule
 * except the one linear in `x''`.
 *
 * Tracing is continuation in `t` from a seed (a landmark's feet on both
 * surfaces, refined here by Newton): each step predicts by the second-order
 * Taylor step of that jet and corrects by Newton, and a step whose correction
 * fails, or lands farther from its prediction than a quarter of the step's own
 * length (a jump to another branch), is halved. After one turn of `t`, a
 * chart displacement scaled by the starting surface speeds checks closure
 * within ten tolerances after whole-period phase shifts. This finite
 * observation does not certify a globally closed, unique branch.
 *
 * Under regular surface charts, `J` is singular where the curve does not cross the parameter's
 * level sets: at a tangential contact (normals parallel), or where the curve
 * turns along the part's stations (phase) or along the half plane (angle).
 * A failed solve or an observed grazing sample is reported; contacts between
 * the finite observations are not excluded by that check.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the equations, the parameter kinds, the trace's checks and the curve's readings.
 * @evidence contracts/development/design.md#principled-representation Represents The curve where an attached part's surface meets its host's: the surface-surface intersection of the solid merge and diff, traced by a declared parameter `t` over one turn: companion namespace of 11 members (`IPoint`, `Parameter`, `ICurve`, `IInput`, `IResult`, `trace`, ...); units and frames named in its text: local, second, world, radian, radians. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidIntersection` in packages/engine/src/geometry/construction/AutoMovieSolidIntersection.ts; its surface is the 11 members listed and the text shows 27 other files naming it, mostly packages/engine (16), test (11), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidIntersection {
  /**
   * Trace the closed curve from its seed.
   *
   * @param input The two surfaces, the seed, the parameter and the trace's limits.
   * @returns The curve and its diagnostics.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the original continuation/publication statements with the same input and unchanged public walk controls.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The stable public namespace retains types/constants while the trace and walk owners hold the execution responsibilities.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no numerical, solver, count, domain, callback or diagnostic policy.
   * @evidence contracts/development/common.md#meaningful-documentation Preserves the original public signature and distinguishes local observations from a global geometric certificate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Includes C output targets, original continuation accepted-substep work and optional bounded reference walks rather than only wrapper cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same accepted points and law feed the original reader; no retracing or detached snapshot is introduced.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Successful curves retain original captures; the façade acquires no additional resource or cache.
   */
  export function trace(
    input: IAutoMovieSolidIntersection.IInput,
  ): IAutoMovieSolidIntersection.IResult {
    return AutoMovieSolidIntersectionTrace.create(
      input,
      WALK_STEPS,
      WALK_POINTS,
      CLOSING_STEPS,
    );
  }

  /**
   * Where a surface's `u` lies past its declared domain, if it does.
   *
   * @param surface The surface.
   * @param u Its first chart parameter.
   * @returns A description with the numbers, or null inside the domain or without one.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the identical optional-u-domain comparison and original outside description.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preserves the public range reader alongside its moved implementation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not clamp, widen a domain or change exception behavior.
   * @evidence contracts/development/common.md#meaningful-documentation States null inside or absent, and the original string outside.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar/property work in the implementation owner, with no jet query.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the current domain on every call rather than caching its identity.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only null or a string and retains no source.
   */
  export function beyond(
    surface: IAutoMovieSolidSurface,
    u: number,
  ): string | null {
    return AutoMovieSolidIntersectionTrace.beyond(surface, u);
  }

  /** Steps one walk may take per traced point before it is lost. */
  export const WALK_STEPS: number = 64;

  /** Resampled points of the arclength spline per traced point. */
  export const WALK_POINTS: number = 4;

  /** Secant steps that close the equal-chord walk's last chord onto the others. */
  export const CLOSING_STEPS: number = 6;

  /**
   * A host as an atlas: itself, or a single surface as the atlas of one face
   * whose region is all of its chart.
   *
   * @param host The host.
   * @returns The atlas.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates original host normalization, reusing an existing atlas or wrapping one surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Maintains the public host-union adapter used by Join and other solid callers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no domain admission or boundary fallback; one-face kept/across remain true/null.
   * @evidence contracts/development/common.md#meaningful-documentation States existing-atlas identity and fixed single-surface wrapper semantics.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and fixed wrapper allocation for a surface.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work An already supplied atlas is returned by identity, without another snapshot.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The wrapper borrows the source surface and belongs to the caller; no global adapter cache is retained.
   */
  export function atlas(
    host: IAutoMovieSolidSurface | IAutoMovieSolidAtlas,
  ): IAutoMovieSolidAtlas {
    return AutoMovieSolidIntersectionTrace.atlas(host);
  }
}
