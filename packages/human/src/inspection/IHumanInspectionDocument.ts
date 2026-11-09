/**
 * A component document: surface parts with the curves that generate them, as a piece emits them.
 *
 * Coordinates are millimetres in the body frame (forward +X, up +Y, left +Z, floor at y = 0) for
 * `body-mm` parts, or in the part's own frame for `local-mm` parts. Part ids are
 * `human.skin.<chain>/<k>` and curve ids `human.construction.<chain>/<k|axis|g<j>|name>`, the
 * generator's own namespaces, so one id pattern reads the same in a piece and in the whole figure.
 */
export interface IHumanInspectionDocument {
  /** Parts, each carrying the curves of its chain. */
  parts: IHumanInspectionDocument.IPart[];

  /** Producer facts the page shows as given and never certifies. */
  provenance: Record<string, unknown>;
}

export namespace IHumanInspectionDocument {
  /** Three coordinates in the unit their owner states. */
  export type Point = [number, number, number];

  /** A right-handed orthonormal placement in body millimetres. */
  export interface IFrame {
    /** Origin in body millimetres. */
    origin: Point;

    /** Unit forward axis. */
    forward: Point;

    /** Unit up axis. */
    up: Point;

    /** Unit left axis. */
    left: Point;
  }

  /** One generating curve, as ordered points through which the curve passes exactly. */
  export interface ICurve {
    /** Unique id in the `human.construction.` namespace, owned by the part's chain. */
    id: string;

    /** Whether the last point joins the first. */
    closed: boolean;

    /** Points in the part's coordinate space. */
    points: Point[];

    /** Its own default colour `rrggbb` over its kind's, such as a compared part's; `curveColor` still wins. */
    colour?: string;
  }

  /** One emitted surface patch. */
  export interface IPart {
    /** Unique id `human.skin.<chain>/<k>`. */
    id: string;

    /** `body-mm` when the points are already in the body frame, `local-mm` when {@link frame} places them. */
    space: "body-mm" | "local-mm";

    /** Placement of `local-mm` points; the identity frame for `body-mm`. */
    frame: IFrame;

    /** Vertices. */
    points: Point[];

    /** Triangles, counter-clockwise seen from outside. */
    indices: number[];

    /** One unit normal per vertex; absent derives display normals from the triangles. */
    normals?: Point[];

    /** The curves of this part's chain. */
    curves: ICurve[];
  }
}
