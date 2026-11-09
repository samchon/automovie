import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieSolidIntersectionTrace } from "./AutoMovieSolidIntersectionTrace";
import type { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World coordinate type retained by the original public point/parameter API. */
type Vec3 = AutoMovieSolidVector.Vec3;
/** Original four chart-coordinate rate components. */
type Vec4 = [number, number, number, number];

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
   * One point of the curve with both preimages and their parameter jets.
   *
   * @evidence contracts/development/design.md#principled-representation Stores a local surface meeting and its implicit first/second rates under the original nonsingular-Jacobian premise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Named world and chart fields keep both preimages and the same parameter jet together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record certifies no global branch uniqueness, finite arithmetic or continuous transversality.
   * @evidence contracts/development/common.md#meaningful-documentation Fields give mm world vectors, chart units, radian parameter rates and host-face identity.
   */
  export interface IPoint {
    /** The parameter in radians: part phase, footprint angle, or the current normalized arc-guide phase. */
    t: number;

    /** The part's phase, radians, unwrapped along the traced curve. */
    phi: number;

    /** The part's station, its `u`. */
    s: number;

    /** The host face the point lies on: 0 for a single surface (`IAutoMovieSolidAtlas`). */
    face: number;

    /** The host's `u`, on that face. */
    y: number;

    /** The host's `v`, unwrapped along the traced curve. */
    theta: number;

    /** The curve's point, mm. */
    point: Vec3;

    /** `dC / dt`, mm per radian. */
    tangent: Vec3;

    /** `d^2 C / dt^2`. */
    second: Vec3;

    /** `[s', phi', y', theta']` per radian of `t`. */
    rate: Vec4;

    /** `[s'', phi'', y'', theta'']`. */
    rate2: Vec4;

    /** Angle between the two surfaces' tangent planes, radians in `[0, pi / 2]`: zero at a tangential contact. */
    angle: number;
  }

  /**
   * The curve's parameter.
   *
   * @evidence contracts/development/design.md#principled-representation The closed phase/angle/arc request selects the trace's fourth equation while retaining each mode's declared geometric requirement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only angle stores a centre/normal/reference; phase and requested arc need no extra authored geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Current arc construction is a reference-guide approximation to requested arclength, not a proof that this requirement is satisfied.
   * @evidence contracts/development/common.md#meaningful-documentation Documents centre mm, direction data and mode-dependent parameter meaning.
   */
  export type Parameter =
    | { kind: "phase" }
    | {
        kind: "angle";

        /** The footprint's centre, mm. */
        centre: Vec3;

        /** The axis's direction, the host's outward normal there. */
        normal: Vec3;

        /** The direction of `t = 0`; its part along `normal` is removed. */
        reference: Vec3;
      }
    | {
        /**
         * Requested arclength over the whole loop times a turn, for a
         * long thin part lying along its host (a lid, a lip, a helix rim, a
         * groove), whose half planes about one centre cross its curve twice.
         * The loop is walked first by pseudo-arclength continuation (each
         * step on the plane square to the curve's tangent at the predicted
         * point), then walked again in equal chords of its length, and the
         * current parameter uses its foot on the periodic cubic B-spline
         * guide: `(P - Q(t)) . Q'(t) = 0`. Equal chords and this guide do not
         * establish exact arclength of the intersection.
         */
        kind: "arc";
      };

  /**
   * A traced closed loop.
   *
   * @evidence contracts/development/design.md#principled-representation Represents the original one-turn observations plus the reader that corrects from their nearest stored parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record keeps parameter/winding metadata and its original shared point array with the callable reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite samples do not certify a global intersection, exact arc length or every intermediate domain/grazing condition.
   * @evidence contracts/development/common.md#meaningful-documentation States periodic shifts, source identities and the reader's local corrected result.
   */
  export interface ICurve {
    /** The part's surface name. */
    part: string;

    /** The host's surface name. */
    host: string;

    /** The parameter it is traced by. */
    parameter: Parameter;

    /** The traced points at uniform `t` from the seed, one turn, the start not repeated. */
    points: IPoint[];

    /** Whole turns the host's `v` makes over one turn of `t`; 0 for a loop that encloses a region of the host's chart. */
    winding: number;

    /** Whole turns the part's phase makes over one turn of `t`; 0 for a loop that encloses a region of the part's chart (a part lying along its host). */
    partWinding: number;

    /**
     * The curve at any parameter, corrected by Newton from the nearest
     * traced point.
     *
     * @param t The parameter, radians, any real value.
     * @returns The point, its phases on the branch of the traced point it
     *   starts from, or null where Newton fails there.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Corrects from the original nearest stored parameter and restores host/part winding shifts for a finite real t.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One captured arrow reader preserves the same points array, surfaces and law.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no finite-query guard, global branch certificate or intermediate domain repair; original failure/throw behavior remains.
     * @evidence contracts/development/common.md#meaningful-documentation States finite parameter input, periodic shift and nullable local correction.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant index selection plus original advance/solve costs; accepted substeps have no newly imposed bound.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses original traced points instead of retracing and does not memoize query outputs.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the original shifted point representation and captures only its curve's existing source dependencies.
     */
    at(t: number): IPoint | null;
  }

  /**
   * What a trace needs.
   *
   * @evidence contracts/development/design.md#principled-representation Names the periodic part, host union, seed, declared parameter and original trace limits.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One borrowed request separates source surfaces from curve output.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Valid face indices, finite regular callback data and finite integral counts are premises; current tracing checks count>=8 without adding those missing admissions.
   * @evidence contracts/development/common.md#meaningful-documentation Members state parameter units, optional phase default, gap tolerance and sampled grazing threshold.
   */
  export interface IInput {
    /** The attached part, `v` periodic. */
    part: IAutoMovieSolidSurface;

    /** The host. */
    host: IAutoMovieSolidSurface | IAutoMovieSolidAtlas;

    /** The seed: the part's phase and `[s, y, theta]` near the curve there. */
    seed: { phi: number; s: number; y: number; theta: number; face?: number };

    /** The parameter; absent, the part's phase. */
    parameter?: Parameter;

    /** Traced points over one turn, at least 8. */
    count: number;

    /** Intended mm meeting tolerance; the existing solver combines position and unscaled law residuals in one norm. */
    tolerance: number;

    /** Least angle between the tangent planes, radians, under which a contact is reported as tangential. */
    grazing: number;
  }

  /**
   * A trace's result: the curve, or null with the diagnostics that say why.
   *
   * @evidence contracts/development/design.md#principled-representation Carries the original nullable curve with ordered diagnostics, including possible grazing observations beside a nonnull curve.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Separates returned rejection from retained curve data without encoding thrown callbacks as results.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A result does not prove an empty diagnostic list or convert throws into recoverable nulls.
   * @evidence contracts/development/common.md#meaningful-documentation Fields distinguish curve ownership, failure and diagnostics.
   */
  export interface IResult {
    /** The curve; null when the seed finds no meeting or the loop does not close. */
    curve: ICurve | null;

    /** Observed rejection and grazing diagnostics, in their original order. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

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
  export function trace(input: IInput): IResult {
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
