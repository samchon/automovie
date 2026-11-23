import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieBlendColumn } from "./IAutoMovieBlendColumn";
import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidIntersection } from "./IAutoMovieSolidIntersection";
import type { IAutoMovieSolidRail } from "./IAutoMovieSolidRail";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Kept-side rail joins between a periodic part and a host surface atlas.
 *
 * @evidence contracts/development/design.md#principled-representation The original trace and positive millimetre chord laws determine paired rails and dimensionless-cross-share ribbons.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidJoin owns rail caching and column readers consumed by blend publication and body clipping.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Sampled admission does not certify continuous unfolding; sources, width laws and exposed cached records must remain stable.
 * @evidence contracts/development/common.md#meaningful-documentation Names retained input ownership, rail cache lifetime and the scope of geometric admission.
 */
export namespace IAutoMovieSolidJoin {
  /**
   * A composed contact and its readers; t is the curve's radian parameter.
   *
   * @evidence contracts/development/design.md#principled-representation The curve, keep side and analytic boundary readers describe one composed contact under regular source-jet premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One result separates its captured curve and four readers from later blend publication.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The G2 literal declares boundary matching; the record proves no continuous unfolding, manifold mesh or mutation safety.
   * @evidence contracts/development/common.md#meaningful-documentation Readers distinguish rail failure, fresh column data, borrowed chart loops and live chord laws.
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
   *
   * @evidence contracts/development/design.md#principled-representation The actual rail identifies the two analytic surface ribbons; the host rail's oriented chart cross product declares the blend's outward side independently of its storage origin.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One value record keeps rail identity, both boundary 2-jets and their host outward direction together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No mesh-derived normal or tube-centre guess is stored. This type alone does not validate finiteness or prove unfolding.
   * @evidence contracts/development/common.md#meaningful-documentation Members state host/part order, blend shares and the unnormalized analytic outward meaning.
   */
  export interface IColumn extends IAutoMovieBlendColumn {
    /** The rails it runs between. */
    rail: IAutoMovieSolidRail.IRail;

    /** World direction cross(host.u,host.v)*host.orientation at the host rail; unnormalized, with magnitude inherited from that chart's units. */
    outward: AutoMovieVector3Tuple;
  }

  /**
   * Borrowed surfaces, trace request and width laws for one kept-side join.
   *
   * @evidence contracts/development/design.md#principled-representation Names the periodic part, host atlas, trace seed/parameter and original mm chord or fixed-station width inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One request shares authored geometry and optional pretraced curve without a consumer-local join implementation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Supplied curves bypass trace diagnostics/provenance checks; when tracing internally, SolidJoin copies diagnostics and rejects even a nonnull curve if that list is nonempty.
   * @evidence contracts/development/common.md#meaningful-documentation Members state radian parameters, mm lengths, optional defaults and the original curve-match requirement.
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
       * The retained callback is read repeatedly and must remain stable;
       * exceptions propagate. Rail results may be cached while widths reads
       * this law again, so changing the law invalidates the join's consistency.
       *
       */
      host(t: number): number;
    };
  }

  /**
   * The nullable contact and its ordered observed diagnostics.
   *
   * @evidence contracts/development/design.md#principled-representation Pairs the original nullable join with diagnostics from the path actually executed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record separates reported rejection from a published contact and its retained readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It does not recover skipped supplied-curve diagnostics, certify all premises or convert thrown callbacks to results.
   * @evidence contracts/development/common.md#meaningful-documentation States null on a reported failed check and ownership of the returned diagnostic list.
   */
  export interface IResult {
    /** The join, or null when a check fails. */
    join: IAutoMovieSolidJoin.IJoin | null;

    /** Diagnostics observed by this execution path, in order. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
