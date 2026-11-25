import type {
  IAutoMovieMeshPlaneContour,
  IAutoMoviePlaneFrame,
  IAutoMovieRecoveryIndexedMesh,
} from "../../index";

/**
 * Intersect a triangle surface with a plane without epsilon displacement or
 * branch loss. Equal signed zero vertices retain exact source positions.
 * Coplanar triangles contribute only qualified patch-boundary edges; binary64
 * signs are not exact predicates. Every graph edge is visited once in maximal
 * degree-two chains, so junctions terminate separate open chains. Isolated
 * tangent contacts return one-point open polylines instead of disappearing. A
 * supplied scalar chart shares the exact height samples used for PL topology;
 * its signs and edge fractions use height minus level without reprojecting an
 * origin.
 */

export namespace IAutoMovieMeshPlaneCut {
  /**
   * Intersect a triangle surface with a plane without epsilon displacement or
   * branch loss. Equal signed zero vertices retain exact source positions.
   * Coplanar triangles contribute only qualified patch-boundary edges; binary64
   * signs are not exact predicates. Every graph edge is visited once in maximal
   * degree-two chains, so junctions terminate separate open chains. Isolated
   * tangent contacts return one-point open polylines instead of disappearing. A
   * supplied scalar chart shares the exact height samples used for PL topology;
   * its signs and edge fractions use height minus level without reprojecting an
   * origin.
   */

  export type Operation = (
    skin: IAutoMovieRecoveryIndexedMesh,
    plane: IAutoMoviePlaneFrame,
    select?: (triangle: number) => boolean,
    chart?: {
      /**
       * Finite scalar projections aligned with source vertices, in the same
       * units as query levels.
       */
      heights: readonly number[];
      /**
       * Finite scalar query coordinate in the same physical units as the
       * prepared vertex heights.
       */
      level: number;
    },
  ) => IAutoMovieMeshPlaneContour[];

  /**
   * Admit immutable source positions, incidence and scalar heights once. The
   * caller keeps every supplied array unchanged until all queries finish. Each
   * query accepts original face IDs in strictly increasing order; candidates
   * must include every face whose scalar interval contains level, including
   * ties. Omitting candidates scans every face. The optional filter sees
   * original IDs. The supplied plane retains the physical chart, while heights
   * minus level own predicates. retainSourceFaces copies actual emitting faces,
   * excluding endpoint-star neighbors. retainOrderedSource additionally
   * preserves directed segments and original edge alias witnesses. Both default
   * false; omitted mode retains original properties and numeric paths. Binary64
   * predicates are not certified exact arithmetic.
   */

  export type Prepare = (
    skin: IAutoMovieRecoveryIndexedMesh,
    heights: readonly number[],
    retainSourceFaces?: boolean,
    retainOrderedSource?: boolean,
  ) => (
    plane: IAutoMoviePlaneFrame,
    level: number,
    candidates?: readonly number[],
    select?: (triangle: number) => boolean,
  ) => IAutoMovieMeshPlaneContour[];
}
