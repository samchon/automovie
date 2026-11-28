import type { IAutoMovieLoftSectionFrame } from "../construction/IAutoMovieLoftSectionFrame";
import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Section-plane inputs and measured loop outputs for course-guided
 * construction. `cut` reads packed millimetre geometry using the supplied plane
 * frames. `read` takes a closed chart loop holding the chart origin; supply at
 * least three points and omit the repeated closing point.
 */
export namespace IAutoMovieMeshCourse {
  /** A cross-section frame with an explicit station label in millimetres. */
  export interface IPlane extends IAutoMovieLoftSectionFrame {
    /**
     * An authored millimetre station label. Course comparisons interpolate by
     * these labels, and each plane's origin independently locates the cut.
     */
    station: number;
  }

  /**
   * Signed conic shoulder ratio and its millimetre distance scale, read from a
   * closed section loop.
   */
  export interface IQuarter {
    /**
     * Signed radial crossing parameter with 0 at the guide chord midpoint and 1
     * at its box corner. An absent crossing gives null.
     *
     * A centre-to-chord crossing gives a negative ratio. A conic fitting
     * consumer needs an admitted ratio strictly between zero and one.
     */
    rho: number | null;

    /**
     * Millimetre distance from the guide chord midpoint to its box corner.
     * Multiplying the ratio by this value produces its signed physical
     * displacement.
     */
    reach: number;
  }

  /**
   * Two conic candidate intervals separated at a measured shoulder crossing of
   * the source polyline.
   */
  export interface IPiece {
    /**
     * Outermost measured shoulder crossing in chart millimetres. A missed
     * segment gives null.
     */
    split: [number, number] | null;

    /**
     * Forward direction of the crossed polyline edge in radians from +U toward
     * +V. It is null when the split is absent.
     */
    angle: number | null;

    /**
     * First-arc then second-arc conic ratios. Either may be null when that
     * sub-arc has no admitted shoulder crossing.
     */
    shoulders: [number | null, number | null];

    /**
     * First-arc then second-arc distance scales in millimetres. A sub-arc can
     * have a finite scale and no crossing ratio.
     *
     * A sub-arc whose support lines fail to meet ahead of its ends has null
     * reach. If the lines meet and the arc misses the shoulder segment, reach
     * is available while the shoulder ratio is null.
     */
    reach: [number | null, number | null];
  }

  /** One facing crest or notch of a polygonal loop in a support direction. */
  export interface IFeature {
    /**
     * Crest marks a support maximum. Notch marks a support minimum facing the
     * same direction.
     */
    kind: "crest" | "notch";

    /** Measured polygon vertex in chart millimetres. */
    point: [number, number];

    /**
     * Projection of the chart point onto the given unit support direction, in
     * millimetres.
     */
    value: number;
  }

  /**
   * Four support limits, axial contact offsets, facing features and shoulder
   * readings of a closed loop holding the chart origin.
   */
  export interface IReading {
    /**
     * Coordinates of the maximum U, minimum U, maximum V and minimum V vertices
     * in that order, in millimetres.
     */
    extents: [number, number, number, number];

    /**
     * Perpendicular coordinate of each selected extent vertex, in millimetres.
     * The first loop vertex wins an exact tie.
     */
    touch: [number, number, number, number];

    /**
     * Facing feature lists for +U, ?U, +V and ?V, with each list ordered by
     * increasing phase from ??.
     */
    features: [
      IAutoMovieMeshCourse.IFeature[],
      IAutoMovieMeshCourse.IFeature[],
      IAutoMovieMeshCourse.IFeature[],
      IAutoMovieMeshCourse.IFeature[],
    ];

    /**
     * Conic shoulder readings from the successive axis-guide pairs +U/+V,
     * +V/?U, ?U/?V and ?V/+U.
     */
    quarters: [
      IAutoMovieMeshCourse.IQuarter,
      IAutoMovieMeshCourse.IQuarter,
      IAutoMovieMeshCourse.IQuarter,
      IAutoMovieMeshCourse.IQuarter,
    ];
  }

  /**
   * Course-plane section with a selected enclosing loop and independent cut and
   * cross-station qualifications.
   */
  export interface ISection {
    /**
     * The original input plane in caller order. Its station label and
     * coordinate tuples remain shared with the caller.
     */
    plane: IAutoMovieMeshCourse.IPlane;

    /**
     * Count of admitted closed outer envelopes after bridge processing,
     * including bodies that miss chart origin.
     */
    pieces: number;

    /**
     * First outer contour holding chart origin, in chart millimetres, or null
     * if no contour holds it.
     */
    loop: [number, number][] | null;

    /**
     * Extents, touches, features and quarters of the holding loop. Null means
     * no holding loop.
     */
    reading: IAutoMovieMeshCourse.IReading | null;

    /**
     * Unit Newell normal in the input mesh frame. It is null when no loop
     * exists or the Newell vector has zero length.
     */
    normal: AutoMovieVector3Tuple | null;

    /**
     * Area centroid of the lifted holding loop in input-frame millimetres. It
     * may be null for missing or degenerate area.
     */
    centroid: AutoMovieVector3Tuple | null;

    /**
     * Half the lifted Newell vector's length, in square millimetres. A missing
     * holding loop gives null.
     */
    area: number | null;

    /**
     * Largest radial distance of a holding-loop vertex from the course point,
     * in millimetres. It is null for a missing loop.
     */
    reach: number | null;

    /** Original slice diagnostics for open, bridged or unclosed chains. */
    flags: string[];

    /**
     * Interior-plane jumps of the selected loop's extents or measured shoulder
     * displacements from a line between adjacent station labels.
     *
     * Checks compare signed extrema or `rho * reach` against station-weighted
     * linear interpolation. Use distinct neighbouring station labels to give
     * that comparison a nonzero interpolation span.
     */
    checks: string[];
  }
}
