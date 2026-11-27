import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieRecoveryFeatureChartCuts } from "./IAutoMovieRecoveryFeatureChartCuts";
import type { IAutoMovieRecoveryIndexedCrease } from "./IAutoMovieRecoveryIndexedCrease";
import type { IAutoMovieRecoveryObservedMeshTopology } from "./IAutoMovieRecoveryObservedMeshTopology";

/**
 * Subdivide colliding feature edges using the unchanged exact midpoint
 * arithmetic.
 */

export namespace IAutoMovieRecoveryFeatureChartCutsSubdivide {
  /**
   * Subdivide colliding feature edges using the unchanged exact midpoint
   * arithmetic.
   */

  export type Operation = (
    input: Parameters<IAutoMovieRecoveryFeatureChartCuts.Operation>[0],
    source: IAutoMovieRecoveryObservedMeshTopology,
    features: Map<string, IAutoMovieRecoveryIndexedCrease>,
    collisions: Set<string>,
    physicalPositions: Map<string, Readonly<AutoMovieVector3Tuple>>,
    analyze: (
      vertices: readonly Readonly<AutoMovieVector3Tuple>[],
      triangles: readonly (readonly [number, number, number])[],
    ) => IAutoMovieRecoveryObservedMeshTopology,
    fail: (reason: string) => never,
    edge: (a: number, b: number) => string,
    lex: (a: string, b: string) => number,
  ) => {
    /**
     * Physical vertex positions in the registered millimetre chart, aligned
     * with the supplied triangle indices.
     */
    vertices: Readonly<AutoMovieVector3Tuple>[];

    /** Physical incidence identities aligned with the current vertex array. */
    physical: string[];

    /**
     * Directed halfedge occurrences retained in actual source-cell traversal
     * order.
     */
    occurrences: string[];

    /**
     * Admitted new boundary vertices with original edge identities and explicit
     * interpolation fractions.
     */
    insertions: ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation>["insertions"];

    /**
     * Observed admission failures and qualification limits in production order;
     * an empty array adds no extra certificate.
     */
    diagnostics: string[];

    /**
     * Reported upper displacement introduced by admitted source-chart
     * subdivision, in millimetres.
     */
    observationDisplacementUpperMm: number;

    /**
     * Oriented triangle vertex-index triples addressing the paired position
     * array; indices are not control IDs.
     */
    triangles: [number, number, number][];

    /**
     * Ownership registry binding retained domain or generated fragment
     * identities to their declared source-free owners.
     */
    owners: number[];

    /** Original source-triangle ordinal for each subdivided triangle. */
    parents: number[];

    /**
     * Crease-edge registry after required edge subdivision, retaining original
     * feature ownership.
     */
    expanded: Map<string, IAutoMovieRecoveryIndexedCrease>;

    /**
     * Topology of the subdivided observation mesh before chart-local
     * extraction.
     */
    subdivided: IAutoMovieRecoveryObservedMeshTopology;
  };
}
