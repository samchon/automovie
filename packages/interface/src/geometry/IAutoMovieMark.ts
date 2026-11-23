/**
 * One located finding or construction line, as plain data an inspection draws
 * over a picture: a curve a form was built from, a defect a measurement found,
 * a joint, a contact force, a path.
 *
 * The producer owns the meaning and the instrument owns only the drawing. A
 * producer names the mark by `path`, groups it under `kind` with the legend
 * `label` and default `color` of that kind, and gives its geometry as one
 * `shape` of a closed set. Adding a kind of finding changes its producer only,
 * because the instrument reads no kind it was told about in advance.
 *
 * Coordinates are metres. With `anchor` null they are world coordinates; with
 * an anchor they are the local coordinates of the scene object at that path, so
 * the mark moves with that object.
 */
export interface IAutoMovieMark {
  /**
   * Identity of the mark under the inspection path grammar, such as
   * `hero/torso/section/3` or `hero/leftHand/contact`. It extends the path of
   * the object the mark belongs to, so a pattern selecting that object selects
   * the mark too. Several marks may share a path.
   */
  path: string;

  /**
   * Class of the mark, which a request's `marks` patterns select and a legend
   * lists once, such as `curve/section`, `defect/open`, `joint` or `contact`.
   * Every mark of one kind has one label and one colour.
   */
  kind: string;

  /** Legend text of the kind, such as `section curve`. */
  label: string;

  /**
   * Default colour of the kind as sRGB hex, which a request may replace for one
   * picture.
   */
  color: number;

  /** The geometry, in metres. */
  shape: IAutoMovieMark.Shape;

  /**
   * Whether the finding is an anomaly. A flagged mark is drawn in the
   * instrument's flag colour and counted under a flag entry of the legend.
   */
  flagged: boolean;

  /**
   * Path of the scene object whose local frame `shape` is in and whose world
   * transform the mark follows, or `null` when `shape` is in world
   * coordinates.
   */
  anchor: string | null;
}

/** Data and callback contracts shared by the Mark operations. */
export namespace IAutoMovieMark {
  /** The closed set of geometries a mark can take. */
  export type Shape =
    | IAutoMovieMark.IPoints
    | IAutoMovieMark.IPolyline
    | IAutoMovieMark.ISegments
    | IAutoMovieMark.IArrows;

  /** Places, each drawn as a dot of a fixed size on screen. */
  export interface IPoints {
    /** Discriminant. */
    type: "points";

    /** Flat xyz in metres, one triple per place. */
    points: number[];
  }

  /** A line through places in order. */
  export interface IPolyline {
    /** Discriminant. */
    type: "polyline";

    /**
     * Flat xyz in metres, at least two triples, without a repeated closing
     * point.
     */
    points: number[];

    /** Whether the last place joins the first. */
    closed: boolean;
  }

  /**
   * Unconnected pieces of line, such as the edges of a mesh or the bones of a
   * skeleton.
   */
  export interface ISegments {
    /** Flat xyz in metres, two triples per piece: its start, then its end. */
    points: number[];

    /** Discriminant. */
    type: "segments";
  }

  /**
   * Quantities with a direction at places, such as a contact force, each drawn
   * as a shaft from its origin with a head at the origin plus its vector.
   */
  export interface IArrows {
    /** Discriminant. */
    type: "arrows";

    /** Flat xyz in metres, one triple per arrow: where it starts. */
    origins: number[];

    /** Flat xyz in metres, one triple per arrow: from its origin to its tip. */
    vectors: number[];
  }
}
