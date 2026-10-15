/**
 * The construction net of one lofted part, for inspecting how its surface was built: the curves the loft passed its surface through and the control cage it sampled, in the model frame of the person at rest, metres.
 *
 * It is a debug output, never part of the model: a viewer draws it over or instead of the surface so form can be judged together with the construction that produced it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConstructionNet {
  /** Part, such as `trunk`, `arm` or `hand`. */
  part: string;

  /** Side of a bilateral part, or null on the midline. */
  side: "left" | "right" | null;

  /** Every construction curve, sampled into polylines. */
  curves: IAutoMovieHumanConstructionNet.ICurve[];

  /** The part's control cage, the quads one subdivision smooths into its surface. */
  cage: IAutoMovieHumanConstructionNet.ICage;
}
export namespace IAutoMovieHumanConstructionNet {
  /**
   * What a construction curve is:
   *
   * - `spine`: the path a sweep runs along.
   * - `station`: a cross-section a sweep passes through.
   * - `guide`: a line along a sweep at a fixed turn, which bends its sections between stations.
   * - `feature`: a crease or ridge carried along a sweep's surface.
   * - `curve`: a network curve between nodes, which patches and bridges span.
   * - `ring`: an opening a junction joins to the neighbouring part.
   */
  export type Kind = "spine" | "station" | "guide" | "feature" | "curve" | "ring";

  /**
   * One construction curve as a polyline.
   *
   * @author Samchon
   */
  export interface ICurve {
    /** What the curve is. */
    kind: Kind;

    /** Name of the sweep, curve or ring it belongs to. */
    name: string;

    /** Whether the last point joins the first. */
    closed: boolean;

    /** Points, metres, flattened as x, y, z. */
    points: number[];
  }

  /**
   * A control cage as edges.
   *
   * @author Samchon
   */
  export interface ICage {
    /** Vertex positions, metres, flattened as x, y, z. */
    positions: number[];

    /** Edges as pairs of vertex indices, flattened, each edge once. */
    edges: number[];
  }
}
