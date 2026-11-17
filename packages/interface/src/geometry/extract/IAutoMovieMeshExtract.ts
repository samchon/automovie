import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Mesh slicing and Hermite reduction records used to author construction profiles.
 *
 * Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length. Mesh indexing, finite samples and orthonormal frames are caller premises; outline flags broken cuts, reducers check minimum sample counts, and profileCurve checks station order and loop size.
 *
 * @evidence contracts/development/design.md#principled-representation Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMeshExtract produces these records; AutoMovieMeshCourse and profileCurve consume section loops and fitted knots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Mesh indexing, finite samples and orthonormal frames are caller premises; outline flags broken cuts, reducers check minimum sample counts, and profileCurve checks station order and loop size.
 * @evidence contracts/development/common.md#meaningful-documentation Mesh slicing and Hermite reduction records used to author construction profiles. Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.
 */
export namespace IAutoMovieMeshExtract {
  /**
   * A triangle mesh in millimetres: flat xyz positions, three indices per triangle.
   *
   * @evidence contracts/development/design.md#principled-representation The indexed triangle list every mesh producer here emits.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two flat arrays, borrowed, so a loader's typed arrays pass without copying.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no admission; indices in range are a producer premise.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the unit and the array layout.
   */
  export interface IMesh {
    /** Flat positions, three numbers per vertex, millimetres. */
    positions: ArrayLike<number>;

    /** Flat triangle indices, three per triangle. */
    indices: ArrayLike<number>;
  }

  /**
   * An orthonormal frame: origin and three unit axes.
   *
   * @evidence contracts/development/design.md#principled-representation Sections are cut normal to one axis; the next two axes in cyclic order span the section plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An origin and an axis triple, the whole of a rigid frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Orthonormality is a producer premise and is not re-checked.
   * @evidence contracts/development/common.md#meaningful-documentation States the in-plane axis convention at outline.
   */
  export interface IFrame {
    /**
     * Section-frame origin in the input mesh's coordinate frame, millimetres.
     */
    origin: AutoMovieVector3Tuple;

    /**
     * Three orthonormal unit directions expressed in the mesh frame; outline assumes rather than validates orthonormality.
     */
    axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];
  }

  /**
   * One extreme point of a section along an in-plane direction.
   *
   * @evidence contracts/development/design.md#principled-representation The support point of the section polygon, which is always one of its vertices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The point and its reach, nothing derived further.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reports the cut's own vertex; no smoothing.
   * @evidence contracts/development/common.md#meaningful-documentation States what the reach is measured from.
   */
  export interface IExtreme {
    /**
     * Extreme crossing in the input mesh's frame, in millimetres; several extreme directions may share the same returned point tuple.
     */
    point: AutoMovieVector3Tuple;

    /** Its reach along the direction from the station's axis point, millimetres. */
    reach: number;
  }

  /**
   * One chained piece of a section: the crossings of consecutive triangles in order.
   *
   * @evidence contracts/development/design.md#principled-representation Crossings are chained through the mesh edges they lie on, which two adjacent triangles share on a manifold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface In-plane coordinates ready for reduceLoop, with a closed flag.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An open chain stays open; no gap is bridged.
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinates' axes and origin.
   */
  export interface ILoop {
    /**
     * The chain's points as `[a, b]` millimetres about the station's axis
     * point, `a` and `b` the section's in-plane axes (see {@link ISection.extremes});
     * coincident consecutive crossings are merged, a closed loop's last point
     * is not repeated.
     */
    points: [number, number][];

    /** Whether the chain closes on itself; an open chain is a hole, gap or broken slice. */
    closed: boolean;
  }

  /**
   * The section at one station.
   *
   * Section arrays transfer to the caller, but extrema may share point tuples and outer boundaries may reuse loop points. Flags also include bridged gap lengths and chains still unclosed after bridging; an empty cut has empty arrays, null extremes and no flags.
   *
   * @evidence contracts/development/design.md#principled-representation Holds the exact cut's crossing count, chained loops, eight extremes and flags.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record per station, in station order.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Flags report artifacts; nothing is excluded on the caller's behalf.
   * @evidence contracts/development/common.md#meaningful-documentation States the direction names and every flag.
   */
  export interface ISection {
    /** The station along the frame axis, millimetres from the origin. */
    station: number;

    /** Intersection points found (zero when the plane misses the mesh). */
    count: number;

    /** The cut's chained pieces, closed loops and open chains alike, each oriented by the triangles' winding. */
    loops: IAutoMovieMeshExtract.ILoop[];

    /**
     * The cut's outer boundaries, largest enclosed area first: the closed
     * pieces after open chains were joined end to end across gaps up to the
     * bridge (each bridged gap flagged), less every piece enclosed by another
     * (eyes, teeth, a mouth bag). Disjoint bodies (two legs) give one each; a
     * reference with holes and slits still gives its outer contour here.
     */
    outer: IAutoMovieMeshExtract.ILoop[];

    /**
     * Extremes along `+a`, `-a`, `+b`, `-b` (a and b the two in-plane frame
     * axes after the station axis in cyclic order: for axis 1 they are axes 2
     * and 0), and the quarter diagonals `(+a+b)`, `(+a-b)`, `(-a+b)`, `(-a-b)`
     * over the square root of two; null when the plane misses.
     */
    extremes: Record<
      "+a" | "-a" | "+b" | "-b" | "+a+b" | "+a-b" | "-a+b" | "-a-b",
      IAutoMovieMeshExtract.IExtreme
    > | null;

    /**
     * Why this sample cannot be trusted as it stands, empty when sound: "open"
     * when the cut leaves dangling crossings (a hole, a gap or a broken slice
     * of the mesh; the flag names the dangling crossings and broken chains),
     * "jump <direction>" when an extreme leaves the mean of its two
     * neighbouring stations' by more than the tolerance (a spike or saw
     * tooth). A flagged sample is to be checked in the viewer or excluded.
     */
    flags: string[];
  }

  /**
   * One knot of a reduced run: station, value and slope.
   *
   * @evidence contracts/development/design.md#principled-representation A cubic Hermite knot; consecutive knots define one span through hermite.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dense index beside the knot's data lets a caller trace it to its sample and flags.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The value is the dense sample's own; the slope is fitted.
   * @evidence contracts/development/common.md#meaningful-documentation States which members are measured and which fitted.
   */
  export interface IKnot {
    /** Index of the dense point it sits on, in the caller's array (excluded samples counted). */
    index: number;

    /**
     * Station in the input run's station unit (millimetres for section measurements); retained in original order.
     */
    s: number;

    /**
     * Original dense scalar value in the input value unit; knot removal changes slopes, not this sample.
     */
    value: number;

    /** Slope d value / d station, fitted to the dense samples of its two spans; zero at a prominent extremum. */
    slope: number;
  }

  /**
   * One knot of a reduced loop: point, tangent and chord parameter.
   *
   * @evidence contracts/development/design.md#principled-representation A planar cubic Hermite knot on the dense loop's chord-length parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dense index and parameter beside the point and tangent.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is the dense sample's own; the tangent is fitted.
   * @evidence contracts/development/common.md#meaningful-documentation States the parameter and which members are fitted.
   */
  export interface ILoopKnot {
    /** Index of the dense point it sits on, in the caller's array (excluded samples counted). */
    index: number;

    /**
     * Cumulative chord length in the loop's length unit, millimetres for extracted sections; excluded samples do not contribute.
     */
    t: number;

    /**
     * Copied dense [a,b] sample in the loop's plane and length unit, millimetres for extracted sections.
     */
    point: [number, number];

    /** Tangent d point / d t, fitted to the dense samples of its two spans; its axis component is zero at an axis extreme. */
    tangent: [number, number];
  }

  /**
   * One station's reduced closed loop, as `AutoMovieMeshExtract.reduceLoop` returns it, at
   * its station: the input of `AutoMovieMeshExtract.profileCurve`.
   *
   * profileCurve borrows this record during preparation and copies coordinates into its closure. At least two stations in increasing order are required; finite coordinates and consistent positive loop periods remain caller obligations.
   *
   * @evidence contracts/development/design.md#principled-representation Pairs a periodic Hermite knot loop with the station of the plane it lies in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The reduceLoop result is taken as it is, so a modeler's corrected knots pass in the same shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no admission; profileCurve checks the station order and knot count.
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinates the points are in.
   */
  export interface IStationLoop {
    /** The station, millimetres along the frame axis. */
    station: number;

    /** The loop's knots (points in the section's `[a, b]` millimetres about the station's axis point) and its chord length. */
    loop: {
      /**
       * Periodic Hermite knots in section [a,b] millimetres; profileCurve requires at least three, normalizes winding and copies their coordinates.
       */
      knots: readonly IAutoMovieMeshExtract.ILoopKnot[];

      /**
       * Positive finite period in millimetres, including the closing chord; consistent increasing knot parameters are caller premises, not separately admitted by profileCurve.
       */
      length: number;
    };
  }

  /**
   * Greedily reduced value-and-slope knots that hold a dense run within the
   * tolerance. Every sample starts as a knot with its central-difference
   * slope; knots are then removed one at a time, always the one whose removal
   * deviates least, while that deviation stays within the tolerance. On each
   * removal the two neighbouring knots' slopes are refitted by least squares
   * to the dense samples of the three spans they shape (knot removal with a
   * least-squares approximation, Lyche and Morken, Knot removal for
   * parametric B-spline curves and surfaces, CAGD 4, 1987), so facet noise in
   * the samples does not enter the slopes, and the deviation is the largest
   * over those spans' samples. Knot values stay the samples' own.
   *
   * Never removed: the ends, the pinned indices, and the prominent features: a
   * local extremum whose topographic prominence exceeds twice the tolerance
   * (its slope is held at zero, so the curve's extremum is the sample's), and
   * an inflection (sign change of the divided second difference) between two
   * bends whose sagittas exceed twice the tolerance after the weaker wiggles
   * merge away. Twice the tolerance is the noise threshold because a curve
   * through the middle of a bump that high stays within the tolerance of both
   * its top and its foot without a knot of its own.
   *
   * The reducer borrows its inputs and returns mutable copies. Increasing finite stations, finite values and a meaningful nonnegative tolerance remain caller premises; only the retained sample count is checked. Greedy removal does not prove a globally minimal knot count.
   *
   * @evidence contracts/development/design.md#principled-representation Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMeshExtract produces these records; AutoMovieMeshCourse and profileCurve consume section loops and fitted knots.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Mesh indexing, finite samples and orthonormal frames are caller premises; outline flags broken cuts, reducers check minimum sample counts, and profileCurve checks station order and loop size.
   * @evidence contracts/development/common.md#meaningful-documentation Mesh slicing and Hermite reduction records used to author construction profiles. Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.
   */
  export type IReduceResult = {
    /**
     * New mutable knots in retained input order, with at least both endpoints; index still addresses the original dense array including excluded samples.
     */
    knots: IAutoMovieMeshExtract.IKnot[];

    /**
     * Largest absolute scalar residual at retained dense stations, in the input value unit; excluded samples and between-sample extrema are not measured.
     */
    error: number;
  };

  /**
   * The loop variant for top silhouettes and section loops: the dense closed
   * loop is parameterised by cumulative chord length, every point starts as a
   * knot with its periodic central-difference tangent, and knots are removed
   * as in `AutoMovieMeshExtract.reduce`, the deviation being the Euclidean distance of a
   * dense point from its span and both tangent components refitted. Never
   * removed: the extremes along both axes (their axis component of tangent
   * held at zero, so the curve's extreme is the sample's), the pinned indices
   * and the prominent inflections (sign changes of the turn between bends
   * whose sagittas exceed twice the tolerance after the weaker facet wiggles
   * merge away); at least four knots remain.
   *
   * The result owns its knot records and point/tangent tuples. Finite coordinates, nonzero consecutive retained chords and a meaningful nonnegative tolerance are caller premises; only the minimum retained sample count is checked.
   *
   * @evidence contracts/development/design.md#principled-representation Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMeshExtract produces these records; AutoMovieMeshCourse and profileCurve consume section loops and fitted knots.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Mesh indexing, finite samples and orthonormal frames are caller premises; outline flags broken cuts, reducers check minimum sample counts, and profileCurve checks station order and loop size.
   * @evidence contracts/development/common.md#meaningful-documentation Mesh slicing and Hermite reduction records used to author construction profiles. Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.
   */
  export type IReduceLoopResult = {
    /**
     * New mutable periodic Hermite knots in input loop order, at least four; point and tangent tuples are copied and the closing point is not repeated.
     */
    knots: IAutoMovieMeshExtract.ILoopKnot[];

    /**
     * Sum of the retained dense loop's chord lengths including closure, in its coordinate unit; this is the Hermite period, not fitted-curve arc length.
     */
    length: number;

    /**
     * Largest Euclidean residual at retained dense chord parameters, in the coordinate unit; this is neither a closest-point distance nor a continuous Hausdorff certificate.
     */
    error: number;
  };
}
