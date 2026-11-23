import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { AutoMovieSolidChartVector4 } from "./AutoMovieSolidChartVector4";
import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Intersection trace requests and periodic curve readers over two owned surfaces.
 *
 * @evidence contracts/development/design.md#principled-representation World millimetre values accompany both chart preimages and their derivatives under a phase, angle or approximate arc-guide parameter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IntersectionTrace, Walk and TraceSolve share these records; joins consume the same corrected curve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A finite sampled closed loop does not establish all-parameter regularity, unique branch selection or exact arclength.
 * @evidence contracts/development/common.md#meaningful-documentation Names world/chart units, parameter modes and the limits of sampled admission.
 */
export namespace IAutoMovieSolidIntersection {
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

    /** The part's periodic v coordinate in its actual chart units, radians for a loft; unwrapped along the trace. */
    phi: number;

    /** The part's u coordinate in its chart units, usually physical station millimetres. */
    s: number;

    /** The host face the point lies on: 0 for a single surface (`IAutoMovieSolidAtlas`). */
    face: number;

    /** The host face's u coordinate in its own chart units, usually physical station millimetres. */
    y: number;

    /** The host face's v coordinate in its own chart units; unwrapped when that chart is periodic. */
    theta: number;

    /** The curve's point, mm. */
    point: AutoMovieVector3Tuple;

    /** `dC / dt`, mm per radian. */
    tangent: AutoMovieVector3Tuple;

    /** Second world derivative d²C/dt² in millimetres per squared trace-parameter unit. */
    second: AutoMovieVector3Tuple;

    /** `[s', phi', y', theta']` per radian of `t`. */
    rate: AutoMovieSolidChartVector4;

    /** Second preimage derivatives [s'',phi'',y'',theta''] in each chart component's units per squared trace-parameter unit. */
    rate2: AutoMovieSolidChartVector4;

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
    | {
        /** Uses the part's v directly as t; the current one-turn trace advances t by 2pi, so this mode requires a compatible radian chart. */
        kind: "phase";
      }
    | {
        /** Uses the rotating plane about centre as t in radians; the seed and continuation choose its local branch. */
        kind: "angle";

        /** The footprint's centre, mm. */
        centre: AutoMovieVector3Tuple;

        /** The axis's direction, the host's outward normal there. */
        normal: AutoMovieVector3Tuple;

        /** The direction of `t = 0`; its part along `normal` is removed. */
        reference: AutoMovieVector3Tuple;
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
    parameter: IAutoMovieSolidIntersection.Parameter;

    /** Mutable points at uniform t from the seed over one 2pi turn, without a repeated start. The at closure retains this same array, so readers must not mutate it. */
    points: IAutoMovieSolidIntersection.IPoint[];

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
     * @evidence contracts/development/common.md#meaningful-documentation States finite parameter input, periodic shift and nullable local correction.
     */
    at(t: number): IAutoMovieSolidIntersection.IPoint | null;
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
    seed: {
      /** Initial part v in its original periodic chart units; phase mode uses it as the starting radian parameter. */
      phi: number;

      /** Initial part u, usually station millimetres. */
      s: number;

      /** Initial host u on the selected face, in that face's chart units. */
      y: number;

      /** Initial host v on the selected face, in that face's chart units. */
      theta: number;

      /** Zero-based host atlas face index, default 0; callers must supply a valid index. */
      face?: number;
    };

    /** The parameter; absent, the part's phase. */
    parameter?: IAutoMovieSolidIntersection.Parameter;

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
    curve: IAutoMovieSolidIntersection.ICurve | null;

    /** Observed rejection and grazing diagnostics, in their original order. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
