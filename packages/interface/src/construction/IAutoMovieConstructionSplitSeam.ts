import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Shared world-space seam geometry between split bands.
 *
 * @evidence contracts/development/design.md#principled-representation Fork phases and physical station locate original endpoints; a built seam uses a dimensionless arc-length share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SplitSeam creates straight or cubic seams that both adjoining SplitBand inputs read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A refusal string reports unusable endpoints, plane or knots; a constructed spline is not a proof of nonintersection or regularity everywhere.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes input chart coordinates, world geometry and the normalized reader variable.
 */
export namespace IAutoMovieConstructionSplitSeam {
  /**
   * One reading of the seam.
   *
   * @evidence contracts/development/design.md#principled-representation A point and its unit tangent fix a column's start and the seam's direction there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SplitBand reads the point for its loop column and the tangent for the fork's ribbon turn.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer normalizes the spline derivative or uses its chord-direction fallback; this pair does not establish regularity of the whole seam.
   * @evidence contracts/development/common.md#meaningful-documentation States units and orientation.
   */
  export interface IPoint {
    /** The seam's point, mm. */
    point: AutoMovieVector3Tuple;

    /** Its unit tangent, toward the seam's second end. */
    tangent: AutoMovieVector3Tuple;

    /** Curvature vector in inverse millimetres, the second derivative in seam arclength. */
    bend: AutoMovieVector3Tuple;
  }

  /**
   * The built seam. Treat its endpoint, normal and shared tangent vectors as
   * immutable while adjoining bands consume it; these arrays are not frozen,
   * and the reader closes over endpoint data exposed by the record.
   *
   * @evidence contracts/development/design.md#principled-representation Its ends, plane normal and arclength reading are all a band needs to place its chord columns and rule them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Ends, one normal, one length and one reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Curved length uses eight-point quadrature per span and reading uses 52 bisections; these are numerical arc-length estimates, and a zero tangent falls back to the chord direction.
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and orientation.
   */
  export interface ISeam {
    /** The first end (host phase `a`) and the second (phase `b`), mm. */
    ends: [AutoMovieVector3Tuple, AutoMovieVector3Tuple];

    /** The seam plane's unit normal, `e1 x e2` (`e1` along the chord from the first end, `e2` the end normal square to it); unoriented toward either band. */
    normal: AutoMovieVector3Tuple;

    /** Length in millimetres: exact chord length for straight seams, per-span quadrature estimate for curved seams. */
    length: number;

    /**
     * Point and unit tangent at an arc-length share, numerically inverted for
     * curved seams. Finite values outside [0,1] clamp to an end; finite input
     * remains a caller premise. The point is fresh; a straight seam's tangent
     * and a curved seam's fallback tangent are retained shared vectors.
     *
     * @param t The share of the length from the first end, in `[0, 1]`.
     */
    at(t: number): IAutoMovieConstructionSplitSeam.IPoint;
  }

  /**
   * Borrowed geometry and authored plane knots for one curved split seam.
   * The builder reads endpoint jets synchronously, copies their positions and
   * retains its solved spline data; it does not mutate the input. A geometric
   * admission failure returns a reason string; source callback throws propagate.
   *
   * @evidence contracts/development/design.md#principled-representation Physical station and ordered radian forks locate a world-millimetre chord; interior knot pairs use its orthonormal seam plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SplitSeam.create consumes each field to construct the clamped planar cubic and its arc-length reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Knot finiteness, along-chord bounds and distinct neighbors are checked; an empty knot list is allowed and no global spline topology certificate is produced.
   * @evidence contracts/development/common.md#meaningful-documentation States coordinate interpretation, input lifetime, empty knots and refusal/throw behavior.
   */
  export type ICreateInput = {
    /** Borrowed host surface supplying both fork positions and endpoint tangent planes in world millimetres. */
    host: IAutoMovieSolidSurface;

    /** Physical host station of both forks, millimetres. */
    station: number;

    /** Sign of host station motion leaving its kept end; orients the seam endpoint tangents. */
    into: 1 | -1;

    /** First and second host phases of the forks, radians, in the order the returned seam traverses them. */
    seam: [number, number];

    /** Host end's outward direction; its projection perpendicular to the chord fixes the default seam plane and its outward side. */
    normal: AutoMovieVector3Tuple;

    /** Interior [along-chord, outward-depth] positions in millimetres; empty is allowed. Along lies in [0,chordLength], depth is any finite value, and neighbors including the implicit endpoints must differ. Traversal order is retained even when along decreases. */
    knots: readonly (readonly [number, number])[];

    /** Optional world direction replacing normal for the seam plane; projected perpendicular to the chord and oriented toward normal. An unusable projection returns a refusal string. */
    heading?: AutoMovieVector3Tuple;
  };

  /**
   * The straight chord between the seam's forks read as a seam, in the same plane a curved one stands in, for a split into more than two
   * whose seam declares no profile.
   *
   * @evidence contracts/development/design.md#principled-representation A station and ordered fork phases supply the chord; normal fixes its plane without interior spline knots.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SplitSeam.straight returns the same ISeam reader used by curved fan seams.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Coincident ends or an unusable projected normal return a string; callbacks and numeric source validity retain their original failure behavior.
   * @evidence contracts/development/common.md#meaningful-documentation Defines borrowed input geometry and the straight-seam refusal cases.
   */
  export type IStraightInput = {
    /** Borrowed host surface supplying the straight seam's fork positions in world millimetres. */
    host: IAutoMovieSolidSurface;

    /** Physical host station at which both fork positions are read, millimetres. */
    station: number;

    /** Ordered first and second fork phases on the host, radians. */
    seam: [number, number];

    /** Host end direction used with the chord to establish the straight seam's plane; a collapsed chord or unusable plane yields a refusal string. */
    normal: AutoMovieVector3Tuple;

    /** Optional plane direction in world coordinates, projected square to the chord and oriented by the end normal. */
    heading?: AutoMovieVector3Tuple;
  };
}
