import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieBlendColumn } from "./IAutoMovieBlendColumn";
import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidIntersection } from "./IAutoMovieSolidIntersection";
import type { IAutoMovieSolidRail } from "./IAutoMovieSolidRail";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Kept-side rail joins between a periodic part and a host surface atlas.
 */
export namespace IAutoMovieSolidJoin {
  /**
   * A composed contact and its readers; t is the curve's radian parameter.
   */
  export interface IJoin {
    /** The intersection curve. */
    curve: IAutoMovieSolidIntersection.ICurve;

    /** Which side of the host the part keeps. */
    keep: IAutoMovieSolidRail.Keep;

    /**
     * Declared G2 boundary continuity under regular compatible source/width
     * jets; sampled admission and later publication do not certify the whole skin.
     */
    continuity: "G2";

    /**
     * Read the rails at finite curve parameter t in radians, or null on a local solve failure.
     */
    rail(t: number): IAutoMovieSolidRail.IRail | null;

    /**
     * Solve the rails at radian parameter t again, reporting the quantities read and the failed premise (`AutoMovieSolidRail.explain`);
     * null when the curve has no point at t.
     */
    explain(t: number): IAutoMovieSolidRail.IExplanation | null;

    /**
     * Read host-first and part-last boundary ribbons at radian parameter t; null means no rail.
     */
    column(t: number): IAutoMovieSolidJoin.IColumn | null;

    /**
     * Sample the host chart loop at count uniform radian parameters from the seed, or null on a failed rail.
     */
    loop(count: number): [number, number][] | null;

    /**
     * Read current chord laws at radian t, in mm; part is null for a fixed station.
     */
    widths(t: number): {
      /** Current host chord-law value in millimetres, read without a new finite/positive admission check. */
      host: number;

      /** Current part chord-law value in millimetres, or null when its rail uses an absolute station. */
      part: number | null;
    };
  }

  /**
   * The blend's two edge ribbons and outward source at one curve parameter.
   */
  export interface IColumn extends IAutoMovieBlendColumn {
    /** The rails it runs between. */
    rail: IAutoMovieSolidRail.IRail;

    /** World direction cross(host.u,host.v)*host.orientation at the host rail; unnormalized, with magnitude inherited from that chart's units. */
    outward: AutoMovieVector3Tuple;
  }

  /**
   * Borrowed surfaces, trace request and width laws for one kept-side join.
   */
  export interface IInput {
    /** The attached part or cutter, `v` periodic. */
    part: IAutoMovieSolidSurface;

    /** The host or base: one surface, or an atlas of the faces of a solid already merged (`IAutoMovieSolidAtlas`). */
    host: IAutoMovieSolidSurface | IAutoMovieSolidAtlas;

    /** The intersection's seed, from the landmarks that locate the contact. */
    seed: IAutoMovieSolidIntersection.IInput["seed"];

    /**
     * The curve parameter, defaulting to phase. Phase uses a station rail;
     * both angle and arc use the original square rail direction in the part's
     * chart. Width laws use that same curve parameter in radians.
     */
    parameter?: IAutoMovieSolidIntersection.Parameter;

    /** Traced points over one turn, at least 8. */
    count: number;

    /** Intended mm meeting tolerance; the existing solver also includes the unscaled law residual. */
    tolerance: number;

    /** Least angle between the tangent planes along the curve, radians. */
    grazing: number;

    /** The curve already traced from this seed on these surfaces with this parameter, count and tolerance, when the caller traced it to read a width law from it; absent, the join traces it. */
    curve?: IAutoMovieSolidIntersection.ICurve;

    /**
     * The rails' sides at a curve point from a declared loop (`IAutoMovieSolidRail.IToward`), for a supplied curve that is tangential over
     * part of its turn, where the normals cannot tell them; null where the loop cannot either, which leaves no rail there. Absent, the
     * sides come from the two surfaces' normals and the kept side.
     */
    toward?: (point: IAutoMovieSolidIntersection.IPoint) => IAutoMovieSolidRail.IToward | null;

    /** Width laws in the curve's parameter: chords from the curve to each rail, mm, positive. */
    width: {
      /**
       * On the part: a chord per parameter, or `{ station }` (phase parameter only), the part's rail at
       * one station for every phase, where a lofted part's first own section
       * stands, beyond the curve's farthest reach along the part.
       */
      part:
        | ((t: number) => number)
        | {
            /** Absolute part u-coordinate, usually station millimetres; it must lie beyond each traced point toward the kept side and is only accepted in station mode. */
            station: number;
          };

      /**
       * Positive finite chord in millimetres at trace parameter t in radians.
       * The same stable law supplies prepared trace columns, independent rail
       * reads and declared widths. Callback exceptions propagate.
       *
       */
      host(t: number): number;
    };
  }

  /**
   * The nullable contact and its ordered observed diagnostics.
   */
  export interface IResult {
    /** The join, or null when a check fails. */
    join: IAutoMovieSolidJoin.IJoin | null;

    /** Diagnostics observed by this execution path, in order. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
