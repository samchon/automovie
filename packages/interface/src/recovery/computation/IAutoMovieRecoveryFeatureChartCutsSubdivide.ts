import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieRecoveryFeatureChartCuts } from "./IAutoMovieRecoveryFeatureChartCuts";

/**
 * Subdivide colliding feature edges using the unchanged exact midpoint arithmetic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Physical vertex positions in the registered millimetre chart, aligned with the supplied triangle indices. Physical incidence identities aligned with the current vertex array.
 * @evidence contracts/development/design.md#principled-representation Physical vertex positions in the registered millimetre chart, aligned with the supplied triangle indices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryFeatureChartCuts, RecoveryFeatureChartCutsSubdivide share IAutoMovieRecoveryFeatureChartCutsSubdivide's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Directed halfedge occurrences retained in actual source-cell traversal order.
 */

export namespace IAutoMovieRecoveryFeatureChartCutsSubdivide {
  /**
   * Subdivide colliding feature edges using the unchanged exact midpoint arithmetic.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Physical vertex positions in the registered millimetre chart, aligned with the supplied triangle indices. Physical incidence identities aligned with the current vertex array.
   * @evidence contracts/development/design.md#principled-representation Physical vertex positions in the registered millimetre chart, aligned with the supplied triangle indices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryFeatureChartCuts, RecoveryFeatureChartCutsSubdivide share IAutoMovieRecoveryFeatureChartCutsSubdivide's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Directed halfedge occurrences retained in actual source-cell traversal order.
   */

  export type Operation = (
    input: Parameters<IAutoMovieRecoveryFeatureChartCuts.Operation>[0],
    source: IAutoMovieRecoveryFeatureChartCutsSubdivide.Topology,
    features: Map<string, IAutoMovieRecoveryFeatureChartCutsSubdivide.Feature>,
    collisions: Set<string>,
    physicalPositions: Map<string, Readonly<AutoMovieVector3Tuple>>,
    analyze: (
      vertices: readonly Readonly<AutoMovieVector3Tuple>[],
      triangles: readonly (readonly [number, number, number])[],
    ) => IAutoMovieRecoveryFeatureChartCutsSubdivide.Topology,
    fail: (reason: string) => never,
    edge: (a: number, b: number) => string,
    lex: (a: string, b: string) => number,
  ) => {
    /** Physical vertex positions in the registered millimetre chart, aligned with the supplied triangle indices. */
    vertices: Readonly<AutoMovieVector3Tuple>[];

    /** Physical incidence identities aligned with the current vertex array. */
    physical: string[];

    /** Directed halfedge occurrences retained in actual source-cell traversal order. */
    occurrences: string[];

    /** Admitted new boundary vertices with original edge identities and explicit interpolation fractions. */
    insertions: ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation>["insertions"];

    /** Observed admission failures and qualification limits in production order; an empty array adds no extra certificate. */
    diagnostics: string[];

    /** Reported upper displacement introduced by admitted source-chart subdivision, in millimetres. */
    observationDisplacementUpperMm: number;

    /** Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs. */
    triangles: [number, number, number][];

    /** Ownership registry binding retained domain or generated fragment identities to their declared source-free owners. */
    owners: number[];

    /** Original source-triangle ordinal for each subdivided triangle. */
    parents: number[];

    /** Crease-edge registry after required edge subdivision, retaining original feature ownership. */
    expanded: Map<string, IAutoMovieRecoveryFeatureChartCutsSubdivide.Feature>;

    /** Topology of the subdivided observation mesh before chart-local extraction. */
    subdivided: IAutoMovieRecoveryFeatureChartCutsSubdivide.Topology;
  };

  /**
   * Topology within recovery feature chart cuts subdivide. Undirected edge-incidence registry with the actual incident faces or master-control bindings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Undirected edge-incidence registry with the actual incident faces or master-control bindings. Per-vertex incident undirected edge identities in the current observation topology.
   * @evidence contracts/development/design.md#principled-representation Per-vertex original incident-face ordinals, retained for source-topology checks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryFeatureChartCuts, RecoveryFeatureChartCutsSubdivide share IAutoMovieRecoveryFeatureChartCutsSubdivide's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Undirected edge-incidence registry with the actual incident faces or master-control bindings.
   */
  export type Topology = {
    /** Undirected edge-incidence registry with the actual incident faces or master-control bindings. */
    edges: Map<string, IAutoMovieRecoveryFeatureChartCutsSubdivide.Row[]>;

    /** Per-vertex incident undirected edge identities in the current observation topology. */
    vertexEdges: string[][];

    /** Per-vertex original incident-face ordinals, retained for source-topology checks. */
    incident: number[][];

    /** Observed two-cell components or their query-local ordinals; lower-dimensional contacts do not merge them. */
    components: number[][];

    /** Triangle ordinal to connected-component ordinal in the admitted observation mesh. */
    faceComponent: Int32Array;

    /** Admitted boundary cycles in deterministic traversal order; each entry retains its own incidence rather than coordinate welding. */
    cycles: number[][];

    /** Physical source-triangle areas in square millimetres, aligned with the current triangle array. */
    areas: number[];

    /** Unit source-face normals aligned with the current triangle array; these remain observation evidence. */
    normals: Readonly<AutoMovieVector3Tuple>[];
  };

  /**
   * Feature within recovery feature chart cuts subdivide. Its referenced contract retains the same units, ordering and absence semantics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Subdivide colliding feature edges using the unchanged exact midpoint arithmetic.
   * @evidence contracts/development/design.md#principled-representation Subdivide colliding feature edges using the unchanged exact midpoint arithmetic.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryFeatureChartCuts, RecoveryFeatureChartCutsSubdivide share IAutoMovieRecoveryFeatureChartCutsSubdivide's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type Feature =
    Parameters<IAutoMovieRecoveryFeatureChartCuts.Operation>[0]["featureEdges"][number];

  /**
   * Row within recovery feature chart cuts subdivide. Its referenced contract retains the same units, ordering and absence semantics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Subdivide colliding feature edges using the unchanged exact midpoint arithmetic.
   * @evidence contracts/development/design.md#principled-representation Subdivide colliding feature edges using the unchanged exact midpoint arithmetic.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryFeatureChartCuts, RecoveryFeatureChartCutsSubdivide share IAutoMovieRecoveryFeatureChartCutsSubdivide's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type Row = {
    /** Original first endpoint index of this source edge, in the paired source vertex array. */
    a: number;
    /** Original second endpoint index of this source edge, in the paired source vertex array. */
    b: number;
    /** Original source-triangle ordinal, preserved through observation and subdivision. */
    face: number;
  };
}
