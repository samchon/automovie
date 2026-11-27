import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Input and result of `measureFeatureEdges`, which finds where a
 * triangle mesh's surface bends sharply, so wear can be placed along edges and
 * grime in creases independently of how finely flat faces are tessellated.
 */
export namespace IAutoMovieMeasureFeatureEdges {
  /** One mesh in its own object space, at bind pose for a skinned mesh. */
  export interface IProps {
    /**
     * Vertex positions in metres, `x, y, z` per vertex. Vertices with exactly
     * equal positions are welded.
     */
    positions: ArrayLike<number>;

    /**
     * Triangle vertex indices, three per triangle; zero-area triangles are
     * skipped.
     */
    indices: ArrayLike<number>;

    /**
     * Distance in metres within which a triangle keeps a feature edge, finite
     * and above zero.
     */
    reach: number;
  }

  /** The mesh's feature edges and, for each input triangle, those within reach. */
  export interface IResult {
    /**
     * Every feature edge: an edge shared by exactly two welded triangles whose
     * face normals differ by more than 30°, in an order fixed by the input.
     */
    edges: IEdge[];

    /**
     * Per input triangle, in input order, the indices into `edges` of the
     * feature edges whose segment lies within `reach` of the triangle, nearest
     * first, ties broken by edge index, at most 16.
     */
    triangles: number[][];

    /** The `reach` the lists were measured with, in metres. */
    reach: number;
  }

  /** One feature edge segment in object space. */
  export interface IEdge {
    /** First end, metres. */
    a: IAutoMovieVector3;

    /** Second end, metres. */
    b: IAutoMovieVector3;

    /**
     * `true` when the edge is convex, an outside corner where paint chips: the
     * second triangle's centroid lies behind the first triangle's plane.
     * `false` for a concave crease where grime gathers.
     */
    convex: boolean;
  }
}
