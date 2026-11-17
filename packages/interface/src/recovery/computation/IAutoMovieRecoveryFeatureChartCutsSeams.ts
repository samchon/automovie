import type { IAutoMovieRecoveryFeatureChartCuts } from "./IAutoMovieRecoveryFeatureChartCuts";
import type { IAutoMovieRecoveryFeatureChartCutsSubdivide } from "./IAutoMovieRecoveryFeatureChartCutsSubdivide";

/**
 * Publish maximal feature arcs with their two actual coherent boundary banks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Topology of the subdivided observation mesh before chart-local extraction. Crease-edge registry after required edge subdivision, retaining original feature ownership.
 * @evidence contracts/development/design.md#principled-representation Per-chart map from shared source vertex indices to chart-local vertex indices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryFeatureChartCutsSeams share IAutoMovieRecoveryFeatureChartCutsSeams's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Directed halfedge occurrences retained in actual source-cell traversal order.
 */

export namespace IAutoMovieRecoveryFeatureChartCutsSeams {
  /**
   * Publish maximal feature arcs with their two actual coherent boundary banks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Topology of the subdivided observation mesh before chart-local extraction. Crease-edge registry after required edge subdivision, retaining original feature ownership.
   * @evidence contracts/development/design.md#principled-representation Per-chart map from shared source vertex indices to chart-local vertex indices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryFeatureChartCutsSeams share IAutoMovieRecoveryFeatureChartCutsSeams's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Directed halfedge occurrences retained in actual source-cell traversal order.
   */

  export type Operation = (
    context: {
      /** Topology of the subdivided observation mesh before chart-local extraction. */
      subdivided: IAutoMovieRecoveryFeatureChartCutsSubdivide.Topology;

      /** Crease-edge registry after required edge subdivision, retaining original feature ownership. */
      expanded: Map<string, IAutoMovieRecoveryFeatureChartCutsSeams.Feature>;

      /** Physical incidence identities aligned with the current vertex array. */
      physical: string[];

      /** Directed halfedge occurrences retained in actual source-cell traversal order. */
      occurrences: string[];

      /** Per-chart map from shared source vertex indices to chart-local vertex indices. */
      remap: Map<number, number>[];

      /** Topology recomputed after subdivision, used to verify the emitted chart incidence. */
      actual: IAutoMovieRecoveryFeatureChartCutsSubdivide.Topology;

      /** Shared source vertex index to chart-local index for the current component. */
      localOf: Map<number, number>;

      /** Source component index to its emitted chart ordinal. */
      chartOf: Map<number, number>;

      /** Prepared or fitted source charts in deterministic observation order, including each independently retained feature piece. */
      charts: ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation>["charts"];

      /** Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs. */
      triangles: [number, number, number][];

      /** Admitted new boundary vertices with original edge identities and explicit interpolation fractions. */
      insertions: ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation>["insertions"];

      /** Observed admission failures and qualification limits in production order; an empty array adds no extra certificate. */
      diagnostics: string[];

      /** Reported upper displacement introduced by admitted source-chart subdivision, in millimetres. */
      observationDisplacementUpperMm: number;
    },
    fail: (reason: string) => never,
    edge: (a: number, b: number) => string,
    lex: (a: string, b: string) => number,
  ) => ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation>;

  /**
   * Feature within recovery feature chart cuts seams. Its referenced contract retains the same units, ordering and absence semantics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Publish maximal feature arcs with their two actual coherent boundary banks.
   * @evidence contracts/development/design.md#principled-representation Publish maximal feature arcs with their two actual coherent boundary banks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryFeatureChartCutsSeams share IAutoMovieRecoveryFeatureChartCutsSeams's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type Feature =
    Parameters<IAutoMovieRecoveryFeatureChartCuts.Operation>[0]["featureEdges"][number];
}
