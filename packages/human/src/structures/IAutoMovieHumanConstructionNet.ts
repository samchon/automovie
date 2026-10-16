/**
 * The construction net of one generated part in the person's rest model frame, metres: its available authored source curves, junction rings and actual generating cage. A procedural part may have no sweep curves; its cage still participates in inspection.
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

  /** Available authored construction curves and junction rings, sampled into polylines. */
  curves: IAutoMovieHumanConstructionNet.ICurve[];

  /** Generating controls at the inspected assembly and refinement level, or the authored coarse cage when inspected before generation. */
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
   * - `relief`: a muscle belly, furrow or bony landmark laid on the subdivided skin as a displacement: its centre line along its course and its border where it stands at half its height, on the part's surface before the relief.
   */
  export type Kind =
    | "spine"
    | "station"
    | "guide"
    | "feature"
    | "curve"
    | "ring"
    | "relief";

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
