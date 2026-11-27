import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** Data and callback contracts shared by the TessellateContourPath64 operations. */
export namespace IAutoMovieTessellateContourPath64 {
  /**
   * Generate an indexed surface from saved physical polygon identities and P/Q
   * paths. P emits (P_i,Q_j,P_next); Q emits (Q_next,P_i,Q_j). Positive XZ
   * rings and increasing Y stations give outward winding on an ordinary
   * exterior slab. This operation validates the path, not its optimization or
   * geometric embedding. Finite positive-area faces survive incidence warnings;
   * collapsed faces are counted.
   */
  export type IInput = {
    /**
     * Nonempty physical-vertex identity domain for all saved polygon vertices;
     * different coordinates are not welded by proximity.
     */
    topologyDomain: string;
    /**
     * Saved closed boundary rings, borrowed for this call; ids are unique and
     * each ring has at least three finite points in positive projected XZ
     * order.
     */
    polygons: readonly {
      /** Nonempty unique polygon identity referenced by pair pId and qId. */
      id: string;
      /**
       * Finite physical cut coordinate in millimetres; each connected pair must
       * increase from p to q.
       */
      stationMm: number;
      /**
       * Ordered finite world-millimetre vertices without a repeated closing
       * point or collapsed edge; winding is positive in the XZ projection.
       */
      pointsMm: readonly Readonly<AutoMovieVector3Tuple>[];
    }[];
    /**
     * Explicit complete P/Q walks to emit; an empty list emits the saved
     * vertices and construction rings without faces.
     */
    pairs: readonly {
      /** Nonempty unique strip identity used in the returned pair report. */
      id: string;
      /** Identity of the lower-station saved boundary advanced by each P step. */
      pId: string;
      /** Identity of the higher-station saved boundary advanced by each Q step. */
      qId: string;
      /**
       * Safe integer vertex ordinal within the p polygon, from zero through its
       * vertex count minus one.
       */
      startP: number;
      /**
       * Safe integer vertex ordinal within the q polygon, from zero through its
       * vertex count minus one.
       */
      startQ: number;
      /**
       * Only P and Q, with exactly one P per p vertex and one Q per q vertex;
       * the path closes each saved boundary once.
       */
      steps: string;
      /**
       * Finite nonnegative area supplied by the path optimizer, square
       * millimetres; emission reports its absolute discrepancy without
       * certifying optimality.
       */
      objectiveAreaMm2: number;
    }[];
  };

  /**
   * Generate an indexed surface from saved physical polygon identities and P/Q
   * paths. P emits (P_i,Q_j,P_next); Q emits (Q_next,P_i,Q_j). Positive XZ
   * rings and increasing Y stations give outward winding on an ordinary
   * exterior slab. This operation validates the path, not its optimization or
   * geometric embedding. Finite positive-area faces survive incidence warnings;
   * collapsed faces are counted.
   */
  export type IResult = {
    /**
     * New indexed mesh in metres with physical polygon-vertex identities;
     * unresolved accumulated normals remain zero and are diagnosed.
     */
    mesh: IAutoMovieMesh;
    /**
     * Saved polygon boundaries converted to metres, each closed by repeating
     * its first point at the end.
     */
    construction: {
      /** Original saved polygon identity. */
      id: string;
      /**
       * World-metre points in original ring order followed by the first point
       * again; the caller owns the returned arrays.
       */
      points: [number, number, number][];
    }[];
    /**
     * One emission report per requested pair in input order, including pairs
     * whose proposed triangles were all omitted.
     */
    pairs: {
      /** Original pair identity. */
      id: string;
      /**
       * First retained triangle ordinal in the returned mesh for this pair,
       * measured before emitting the pair.
       */
      firstTriangle: number;
      /** Number of finite positive-area triangles retained for this pair. */
      triangles: number;
      /**
       * Number of proposed triangles whose cross-product magnitude was zero or
       * nonfinite.
       */
      omittedTriangles: number;
      /**
       * Sum of retained triangle areas in square millimetres, measured from the
       * published metre positions.
       */
      areaMm2: number;
      /**
       * Absolute difference between measured retained area and
       * objectiveAreaMm2, in square millimetres.
       */
      objectiveDiscrepancyMm2: number;
      /**
       * Pair-local repeated-face or omitted-triangle reports; warnings do not
       * discard otherwise finite positive-area faces.
       */
      diagnostics: string[];
    }[];
    /**
     * Whole-mesh normal and oriented-incidence qualifications, including the
     * explicit unproved simplicity, embedding and optimizer limitations.
     */
    diagnostics: string[];
  };
}
