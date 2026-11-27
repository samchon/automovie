import type { IAutoMovieLoftSectionFrame } from "../construction/IAutoMovieLoftSectionFrame";
import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** Data and callback contracts shared by the MeshCourse operations. */
export namespace IAutoMovieMeshCourse {
  /**
   * One station's section plane: origin on the course, chart axes `u` and `v`
   * in the plane, normal `v x u` along the course (the `AutoMovieEngineLoftFrame` and
   * `AutoMovieEngineViewAxis` convention).
   */
  export interface IPlane extends IAutoMovieLoftSectionFrame {
    /**
     * Station along the course, millimetres (a label; not assumed to be
     * arclength).
     */
    station: number;
  }

  /** One quarter's conic shoulder read off a loop. */
  export interface IQuarter {
    /**
     * `|M->S| / |M->A|`, signed along `M->A`: M the chord midpoint between the
     * quarter's two guide points, A the box corner, S the loop's outermost
     * crossing of the segment from the course point (`t = -1`) through M to A
     * (`t = 1`). A conic quarter needs `0 < rho < 1` (0.5 a parabola, `sqrt(2)
     * - 1` the ellipse on a centred symmetric box); a value at or below zero
     * means the loop is concave there. Null when the loop never meets that
     * segment.
     */
    rho: number | null;

    /** `|M->A|`, millimetres: a shoulder error of `d` moves S by `d` times this. */
    reach: number;
  }

  /** One quarter between two given guides, split at its shoulder bar. */
  export interface IPiece {
    /**
     * The split point: the arc's outermost crossing of the segment from the
     * guides' chord midpoint toward their support lines' corner, chart mm; null
     * when the arc misses it.
     */
    split: [number, number] | null;

    /**
     * The crossed polyline edge's direction there (the polyline's own tangent
     * at the split), radians from `+u` toward `+v`, along the arc from the
     * first guide toward the second; null without a split.
     */
    angle: number | null;

    /**
     * The shoulders of the piece from the first guide to the split and of the
     * piece from the split to the second guide, each read on its own sub-arc
     * (the crossed edge divided at the split); null where its tangent lines do
     * not meet ahead of both ends or its sub-arc misses its segment.
     */
    shoulders: [number | null, number | null];

    /** Each piece's `|M->A|`, mm, null with its shoulder's first cause. */
    reach: [number | null, number | null];
  }

  /**
   * One point of a loop where its tangent is square to a support direction and
   * its outward side faces that direction.
   */
  export interface IFeature {
    /**
     * `crest`: a local maximum of the support; `notch`: a local minimum facing
     * the same direction.
     */
    kind: "crest" | "notch";

    /** The loop point, chart millimetres. */
    point: [number, number];

    /** Its support value (the point along the direction), millimetres. */
    value: number;
  }

  /** A loop's four chart extents and four conic quarters about the course point. */
  export interface IReading {
    /**
     * Signed extents `+u`, `-u`, `+v`, `-v`, millimetres about the course
     * point: the loop's measured envelope.
     */
    extents: [number, number, number, number];

    /**
     * Where each extreme touches its support line, measured off the course
     * point's axis line, millimetres: the `v` of the `+u` and `-u` extremes,
     * the `u` of the `+v` and `-v` extremes. The four-quarter view section
     * touches its box on those axis lines, so a nonzero offset is shape it
     * cannot carry. A loop reaching its extreme value at more than one point
     * reports the first in loop order: a reading of this section alone, not a
     * correspondence with its neighbours.
     */
    touch: [number, number, number, number];

    /**
     * The crests and notches facing `+u`, `-u`, `+v`, `-v`, each list in
     * increasing phase from `-pi`.
     */
    features: [
      IAutoMovieMeshCourse.IFeature[],
      IAutoMovieMeshCourse.IFeature[],
      IAutoMovieMeshCourse.IFeature[],
      IAutoMovieMeshCourse.IFeature[],
    ];

    /**
     * Quarters q0..q3: between `+u`/`+v`, `+v`/`-u`, `-u`/`-v`, `-v`/`+u`, on
     * the axis-line guides.
     */
    quarters: [
      IAutoMovieMeshCourse.IQuarter,
      IAutoMovieMeshCourse.IQuarter,
      IAutoMovieMeshCourse.IQuarter,
      IAutoMovieMeshCourse.IQuarter,
    ];
  }

  /** One station's section. */
  export interface ISection {
    /** The station's plane. */
    plane: IAutoMovieMeshCourse.IPlane;

    /** Outer pieces of the cut after the extraction's bridging. */
    pieces: number;

    /** The outer piece holding the course point, chart millimetres, or null. */
    loop: [number, number][] | null;

    /** Its extents and quarters; null exactly when `loop` is. */
    reading: IAutoMovieMeshCourse.IReading | null;

    /**
     * Its unit Newell normal, world; null without a loop or for a zero-area
     * loop.
     */
    normal: AutoMovieVector3Tuple | null;

    /**
     * Its area centroid in its own plane, world millimetres; null without a
     * loop or for a zero-area loop.
     */
    centroid: AutoMovieVector3Tuple | null;

    /** Its area, square millimetres; null exactly when `loop` is. */
    area: number | null;

    /**
     * The largest distance of a loop point from the course point, millimetres;
     * null exactly when `loop` is.
     */
    reach: number | null;

    /**
     * The cut's own flags (`AutoMovieEngineMeshExtract.outline`: open, bridged,
     * unclosed), in full.
     */
    flags: string[];

    /** The family checks: `jump <name>: <mm>` on the holding loop's values. */
    checks: string[];
  }
}
