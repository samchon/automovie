import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/** Data and callback contracts shared by the MeshCourse operations. */
export namespace IAutoMovieMeshCourse {
  /**
   * One station's section plane: origin on the course, chart axes `u` and
   * `v` in the plane, normal `v x u` along the course (the
   * `AutoMovieLoftFrame` and `AutoMovieViewAxis` convention).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units, the orthonormal premise and the normal's orientation.
   * @evidence contracts/development/design.md#principled-representation A course plane is a station with an origin and two chart axes; the normal is derived, so it cannot disagree with them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly what a cut and its chart readings consume; the loft's own frame type stays with the loft.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Orthonormality remains a producer premise, not re-checked; the station is only a label for ordering and interpolation, not assumed to be arclength.
   */
  export interface IPlane {
    /** Station along the course, millimetres (a label; not assumed to be arclength). */
    station: number;

    /** The course point, millimetres. */
    origin: AutoMovieVector3Tuple;

    /** The chart's first axis, unit. */
    u: AutoMovieVector3Tuple;

    /** The chart's second axis, unit and square to `u`. */
    v: AutoMovieVector3Tuple;
  }

  /**
   * One quarter's conic shoulder read off a loop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States rho's definition, its admissible range and its millimetre scale.
   * @evidence contracts/development/design.md#principled-representation The measured share and the corner reach that turns a share into millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the trace's reduction and its diagnostics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Null is kept for a loop that never meets the segment instead of a default value.
   */
  export interface IQuarter {
    /**
     * `|M->S| / |M->A|`, signed along `M->A`: M the chord midpoint between
     * the quarter's two guide points, A the box corner, S the loop's
     * outermost crossing of the segment from the course point (`t = -1`)
     * through M to A (`t = 1`). A conic quarter needs `0 < rho < 1` (0.5 a
     * parabola, `sqrt(2) - 1` the ellipse on a centred symmetric box); a
     * value at or below zero means the loop is concave there. Null when the
     * loop never meets that segment.
     */
    rho: number | null;

    /** `|M->A|`, millimetres: a shoulder error of `d` moves S by `d` times this. */
    reach: number;
  }

  /**
   * One quarter between two given guides, split at its shoulder bar.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the guides, the arc, the split point, its tangent reading, the two pieces and every null meaning.
   * @evidence contracts/development/design.md#principled-representation The loop's own arc between two guide points (each tangent along its support line) split at that arc's shoulder point, each piece a conic on its two ends and tangent lines with its own shoulder read on its own sub-arc (#3158).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the trace's split runs and receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing crossing or an unmet tangent pair stays null; nothing is clamped.
   */
  export interface IPiece {
    /** The split point: the arc's outermost crossing of the segment from the guides' chord midpoint toward their support lines' corner, chart mm; null when the arc misses it. */
    split: [number, number] | null;

    /** The crossed polyline edge's direction there (the polyline's own tangent at the split), radians from `+u` toward `+v`, along the arc from the first guide toward the second; null without a split. */
    angle: number | null;

    /** The shoulders of the piece from the first guide to the split and of the piece from the split to the second guide, each read on its own sub-arc (the crossed edge divided at the split); null where its tangent lines do not meet ahead of both ends or its sub-arc misses its segment. */
    shoulders: [number | null, number | null];

    /** Each piece's `|M->A|`, mm, null with its shoulder's first cause. */
    reach: [number | null, number | null];
  }

  /**
   * One point of a loop where its tangent is square to a support direction
   * and its outward side faces that direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two kinds, the point's chart and the value's meaning.
   * @evidence contracts/development/design.md#principled-representation A crest (a local maximum of the support, the loop convex there) or a notch (a local minimum facing the same way, the loop concave there), with its point and support value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the trace's receipt and its feature lines.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only features standing out by the walk's tolerance are reported; nothing is smoothed or merged, and no loop point is dropped.
   */
  export interface IFeature {
    /** `crest`: a local maximum of the support; `notch`: a local minimum facing the same direction. */
    kind: "crest" | "notch";

    /** The loop point, chart millimetres. */
    point: [number, number];

    /** Its support value (the point along the direction), millimetres. */
    value: number;
  }

  /**
   * A loop's four chart extents and four conic quarters about the course point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the extents' order and signs, the touch offsets' meaning, the features' order and the quarter order.
   * @evidence contracts/development/design.md#principled-representation The four-quarter view section's own inputs (four support lines and four shoulders) plus the touch offsets and the features that report what those inputs leave out.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the trace or its receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values are the loop's own; nothing is admitted or refused here.
   */
  export interface IReading {
    /** Signed extents `+u`, `-u`, `+v`, `-v`, millimetres about the course point: the loop's measured envelope. */
    extents: [number, number, number, number];

    /**
     * Where each extreme touches its support line, measured off the course
     * point's axis line, millimetres: the `v` of the `+u` and `-u` extremes,
     * the `u` of the `+v` and `-v` extremes. The four-quarter view section
     * touches its box on those axis lines, so a nonzero offset is shape it
     * cannot carry. A loop reaching its extreme value at more than one point
     * reports the first in loop order: a reading of this section alone, not
     * a correspondence with its neighbours.
     */
    touch: [number, number, number, number];

    /** The crests and notches facing `+u`, `-u`, `+v`, `-v`, each list in increasing phase from `-pi`. */
    features: [
      IAutoMovieMeshCourse.IFeature[],
      IAutoMovieMeshCourse.IFeature[],
      IAutoMovieMeshCourse.IFeature[],
      IAutoMovieMeshCourse.IFeature[],
    ];

    /** Quarters q0..q3: between `+u`/`+v`, `+v`/`-u`, `-u`/`-v`, `-v`/`+u`, on the axis-line guides. */
    quarters: [
      IAutoMovieMeshCourse.IQuarter,
      IAutoMovieMeshCourse.IQuarter,
      IAutoMovieMeshCourse.IQuarter,
      IAutoMovieMeshCourse.IQuarter,
    ];
  }

  /**
   * One station's section.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States every member's unit and frame and exactly when each is null.
   * @evidence contracts/development/design.md#principled-representation The cut's own flags beside the holding loop and its in-plane readings; `loop`, `reading`, `area` and `reach` are null together when no loop holds the course point, and `normal` and `centroid` are also null for a zero-area loop, where neither exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member feeds the trace, its diagnostics or its receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No loop reading is defaulted to zero; the nulls are the producer's guarantee, documented rather than encoded as a union because the trace reads them through one guard.
   */
  export interface ISection {
    /** The station's plane. */
    plane: IAutoMovieMeshCourse.IPlane;

    /** Outer pieces of the cut after the extraction's bridging. */
    pieces: number;

    /** The outer piece holding the course point, chart millimetres, or null. */
    loop: [number, number][] | null;

    /** Its extents and quarters; null exactly when `loop` is. */
    reading: IAutoMovieMeshCourse.IReading | null;

    /** Its unit Newell normal, world; null without a loop or for a zero-area loop. */
    normal: AutoMovieVector3Tuple | null;

    /** Its area centroid in its own plane, world millimetres; null without a loop or for a zero-area loop. */
    centroid: AutoMovieVector3Tuple | null;

    /** Its area, square millimetres; null exactly when `loop` is. */
    area: number | null;

    /** The largest distance of a loop point from the course point, millimetres; null exactly when `loop` is. */
    reach: number | null;

    /** The cut's own flags (`AutoMovieMeshExtract.outline`: open, bridged, unclosed), in full. */
    flags: string[];

    /** The family checks: `jump <name>: <mm>` on the holding loop's values. */
    checks: string[];
  }
}
