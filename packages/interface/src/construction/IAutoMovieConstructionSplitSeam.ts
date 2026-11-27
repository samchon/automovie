import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieConstructionSplit } from "./IAutoMovieConstructionSplit";

/** Shared world-space seam geometry between split bands. */
export namespace IAutoMovieConstructionSplitSeam {
  /** One reading of the seam. */
  export interface IPoint {
    /** The seam's point, mm. */
    point: AutoMovieVector3Tuple;

    /** Its unit tangent, toward the seam's second end. */
    tangent: AutoMovieVector3Tuple;

    /**
     * Curvature vector in inverse millimetres, the second derivative in seam
     * arclength.
     */
    bend: AutoMovieVector3Tuple;
  }

  /**
   * The built seam. Treat its endpoint, normal and shared tangent vectors as
   * immutable while adjoining bands consume it; these arrays are not frozen,
   * and the reader closes over endpoint data exposed by the record.
   */
  export interface ISeam {
    /** The first end (host phase `a`) and the second (phase `b`), mm. */
    ends: [AutoMovieVector3Tuple, AutoMovieVector3Tuple];

    /**
     * The seam plane's unit normal, `e1 x e2` (`e1` along the chord from the
     * first end, `e2` the end normal square to it); unoriented toward either
     * band.
     */
    normal: AutoMovieVector3Tuple;

    /**
     * Length in millimetres: exact chord length for straight seams, per-span
     * quadrature estimate for curved seams.
     */
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

  /** An interior control point in the seam plane. */
  export interface IProfileKnotMm {
    /** Distance from the first fork along the chord, in millimetres. */
    readonly alongMm: number;

    /** Distance outward from the host end, in millimetres. */
    readonly depthMm: number;
  }

  /**
   * Borrowed geometry and authored plane knots for one curved split seam. The
   * builder reads endpoint jets synchronously, copies their positions and
   * retains its solved spline data; it does not mutate the input. A geometric
   * admission failure returns a reason string; source callback throws
   * propagate.
   */
  export type ICreateInput = {
    /**
     * Borrowed host surface supplying both fork positions and endpoint tangent
     * planes in world millimetres.
     */
    host: IAutoMovieSolidSurface;

    /** Physical host station of both forks, millimetres. */
    station: number;

    /**
     * Sign of host station motion leaving its kept end; orients the seam
     * endpoint tangents.
     */
    into: 1 | -1;

    /**
     * First and second host phases of the forks, radians, in the order the
     * returned seam traverses them.
     */
    seam: IAutoMovieConstructionSplit.ISeamPhases;

    /**
     * Host end's outward direction; its projection perpendicular to the chord
     * fixes the default seam plane and its outward side.
     */
    normal: AutoMovieVector3Tuple;

    /**
     * Interior [along-chord, outward-depth] positions in millimetres; empty is
     * allowed. Along lies in [0,chordLength], depth is any finite value, and
     * neighbors including the implicit endpoints must differ. Traversal order
     * is retained even when along decreases.
     */
    knots: readonly IProfileKnotMm[];

    /**
     * Optional world direction replacing normal for the seam plane; projected
     * perpendicular to the chord and oriented toward normal. An unusable
     * projection returns a refusal string.
     */
    heading?: AutoMovieVector3Tuple;
  };

  /**
   * The straight chord between the seam's forks read as a seam, in the same
   * plane a curved one stands in, for a split into more than two whose seam
   * declares no profile.
   */
  export type IStraightInput = {
    /**
     * Borrowed host surface supplying the straight seam's fork positions in
     * world millimetres.
     */
    host: IAutoMovieSolidSurface;

    /** Physical host station at which both fork positions are read, millimetres. */
    station: number;

    /** Ordered first and second fork phases on the host, radians. */
    seam: IAutoMovieConstructionSplit.ISeamPhases;

    /**
     * Host end direction used with the chord to establish the straight seam's
     * plane; a collapsed chord or unusable plane yields a refusal string.
     */
    normal: AutoMovieVector3Tuple;

    /**
     * Optional plane direction in world coordinates, projected square to the
     * chord and oriented by the end normal.
     */
    heading?: AutoMovieVector3Tuple;
  };
}
