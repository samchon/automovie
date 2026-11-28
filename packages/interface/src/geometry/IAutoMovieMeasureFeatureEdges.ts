import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Triangle-mesh inputs and shared feature edges for surface wear and crease
 * shading.
 */
export namespace IAutoMovieMeasureFeatureEdges {
  /**
   * Packed triangle geometry and finite positive reach for a mesh in
   * object-space metres.
   *
   * Supply geometry whose normal and segment-distance arithmetic remain
   * representable at the authored scale. The positions and indices are borrowed
   * for synchronous measurement.
   */
  export interface IProps {
    /**
     * Borrowed finite packed XYZ positions in metres with three coordinates per
     * vertex. Exact coordinate equality welds vertices.
     */
    positions: ArrayLike<number>;

    /**
     * Borrowed zero-based safe in-range vertex ordinals in groups of three.
     * Zero-area triangles contribute no feature-edge incidence.
     */
    indices: ArrayLike<number>;

    /**
     * Positive finite retention distance in metres. A segment at exactly this
     * distance remains eligible for a triangle list.
     */
    reach: number;
  }

  /**
   * Feature segment table and bounded edge lists keyed by original triangle
   * ordinal.
   */
  export interface IResult {
    /**
     * Measured segments in first-contributing-triangle and side order. Boundary
     * edges and edges with more than two uses are excluded.
     */
    edges: IEdge[];

    /**
     * Per-source-triangle lists of at most sixteen edge ordinals, nearest
     * first, with segment ordinal breaking ties. The outer array retains
     * degenerate source triangles' slots.
     */
    triangles: number[][];

    /**
     * The supplied reach in metres, reused as the distance cap by the CPU and
     * shader readers.
     */
    reach: number;
  }

  /**
   * One oriented pair of mesh feature endpoints and its convex or concave
   * classification.
   */
  export interface IEdge {
    /**
     * Object-space metre position of the first endpoint in the first
     * contributing triangle's side order.
     */
    a: IAutoMovieVector3;

    /**
     * Object-space metre position of the second endpoint in the first
     * contributing triangle's side order.
     */
    b: IAutoMovieVector3;

    /**
     * True when the second face's centroid lies behind the first face along the
     * first face normal's opposite direction. Other admitted bends are
     * concave.
     */
    convex: boolean;
  }
}
