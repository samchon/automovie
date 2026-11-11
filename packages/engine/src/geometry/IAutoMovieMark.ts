/**
 * One located finding or construction line, as plain data an inspection draws over a picture: a curve a form was built from, a defect a measurement found, a joint, a contact force, a path.
 *
 * The producer owns the meaning and the instrument owns only the drawing. A producer names the mark by `path`, groups it under `kind` with the legend `label` and default `color` of that kind, and gives its geometry as one `shape` of a closed set. Adding a kind of finding changes its producer only, because the instrument reads no kind it was told about in advance.
 *
 * Coordinates are metres. With `anchor` null they are world coordinates; with an anchor they are the local coordinates of the scene object at that path, so the mark moves with that object.
 *
 * @evidence contracts/development/design.md#principled-representation A mark is an identity, a class, a legend entry, a geometry and an anomaly bit. Identity is a path under the inspection path grammar, so one pattern selects objects and marks alike. The geometry is a closed union discriminated by `type`, so a points mark cannot carry vectors and an arrows mark cannot omit them. Coordinates are flat xyz triples in metres in one frame, world or the anchor's local frame; their count being a multiple of three, the even count of `segments` and the matched lengths of `arrows` are checked by the drawing owner at runtime. Colours are sRGB hex integers. That two kinds never share a colour is a property of a picture, enforced when one is drawn.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the engine's geometry module beside `IAutoMovieConstructionCurve` and `IAutoMovieMeshDefect`, so engine and content packages produce marks without importing a renderer. Its producers are the engine's mark functions and the renderer's measured kinds; its consumer is the renderer's inspection, which reads every member: `path` for selection and labels, `kind` for the request's kind patterns and the colour law, `label` and `color` for the legend, `shape` for the geometry, `flagged` for the flag colour and `anchor` for placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a subject, a body part or a measurement: kinds are strings the producer chooses. `anchor` is a path rather than a scene object, so the record stays plain data a producer without a scene can write; two scene objects sharing a path are told apart by the first in scene order. No member is optional: an unanchored mark states `null`.
 * @evidence contracts/development/common.md#meaningful-documentation States what a mark is, who owns its meaning, the unit and frame of its coordinates, what each member is for, and what an absent anchor means.
 */
export interface IAutoMovieMark {
  /** Identity of the mark under the inspection path grammar, such as `hero/torso/section/3` or `hero/leftHand/contact`. It extends the path of the object the mark belongs to, so a pattern selecting that object selects the mark too. Several marks may share a path. */
  path: string;

  /** Class of the mark, which a request's `marks` patterns select and a legend lists once, such as `curve/section`, `defect/open`, `joint` or `contact`. Every mark of one kind has one label and one colour. */
  kind: string;

  /** Legend text of the kind, such as `section curve`. */
  label: string;

  /** Default colour of the kind as sRGB hex, which a request may replace for one picture. */
  color: number;

  /** The geometry, in metres. */
  shape: IAutoMovieMark.Shape;

  /** Whether the finding is an anomaly. A flagged mark is drawn in the instrument's flag colour and counted under a flag entry of the legend. */
  flagged: boolean;

  /** Path of the scene object whose local frame `shape` is in and whose world transform the mark follows, or `null` when `shape` is in world coordinates. */
  anchor: string | null;
}
export namespace IAutoMovieMark {
  /**
   * The closed set of geometries a mark can take.
   *
   * @evidence contracts/development/design.md#principled-representation Four primitive geometries cover every located finding: a place, a line through places, unconnected pieces of line, and a quantity with a direction at a place. A union discriminated by `type` makes each one's members required and the others' absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned with `IAutoMovieMark`; the renderer's inspection draws each member and nothing else, so a producer chooses among these instead of adding a drawing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is a domain object such as a bone or a ring; those are polylines, segments and points.
   * @evidence contracts/development/common.md#meaningful-documentation Names the four geometries and what each stands for.
   */
  export type Shape = IPoints | IPolyline | ISegments | IArrows;

  /**
   * Places, each drawn as a dot of a fixed size on screen.
   *
   * @evidence contracts/development/design.md#principled-representation Flat xyz triples in metres; at least one triple is checked where the mark is drawn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant and the coordinates.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No per-point size or colour: one mark is one kind's colour.
   * @evidence contracts/development/common.md#meaningful-documentation States the layout and unit of the coordinates.
   */
  export interface IPoints {
    /** Discriminant. */
    type: "points";

    /** Flat xyz in metres, one triple per place. */
    points: number[];
  }

  /**
   * A line through places in order.
   *
   * @evidence contracts/development/design.md#principled-representation Flat xyz triples in metres with closure stated instead of a repeated end point; at least two triples are checked where the mark is drawn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant, the coordinates and the closure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed line is a flag, not a repeated first point that a consumer would have to detect.
   * @evidence contracts/development/common.md#meaningful-documentation States the layout, unit and closure convention.
   */
  export interface IPolyline {
    /** Discriminant. */
    type: "polyline";

    /** Flat xyz in metres, at least two triples, without a repeated closing point. */
    points: number[];

    /** Whether the last place joins the first. */
    closed: boolean;
  }

  /**
   * Unconnected pieces of line, such as the edges of a mesh or the bones of a skeleton.
   *
   * @evidence contracts/development/design.md#principled-representation Flat xyz triples in metres taken in pairs; an even number of triples is checked where the mark is drawn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant and the coordinates.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Pieces share one flat list instead of a list of pairs, so a mark of many edges is one array.
   * @evidence contracts/development/common.md#meaningful-documentation States the pairing, layout and unit.
   */
  export interface ISegments {
    /** Flat xyz in metres, two triples per piece: its start, then its end. */
    points: number[];

    /** Discriminant. */
    type: "segments";
  }

  /**
   * Quantities with a direction at places, such as a contact force, each drawn as a shaft from its origin with a head at the origin plus its vector.
   *
   * @evidence contracts/development/design.md#principled-representation An origin and a displacement in metres per arrow; the producer converts its quantity to metres by a scale it states. Equal lengths that are multiples of three are checked where the mark is drawn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant, the origins and the vectors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The vector is a displacement, not a unit direction and a magnitude, so a producer's scale is applied once, by the producer.
   * @evidence contracts/development/common.md#meaningful-documentation States the pairing of origins and vectors, the unit and how an arrow is drawn.
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
