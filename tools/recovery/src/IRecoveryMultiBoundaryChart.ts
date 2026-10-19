import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";

/**
 * Structural records for RecoveryMultiBoundaryChart.
 *
 * @evidence contracts/common.md#principled-implementation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
 * @evidence contracts/common.md#clear-and-simple-design A type-only owner separates the unchanged input and result contracts from execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
 * @evidence contracts/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input and output lifetimes remain with the operation and its caller.
 */
export namespace IRecoveryMultiBoundaryChart {
  /**
   * Original immutable input contract.
   *
   * @evidence contracts/common.md#principled-implementation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/common.md#clear-and-simple-design A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input and output lifetimes remain with the operation and its caller.
   */
  export type Input = {
    /** Private physical positions in millimetres; returned positions include fan duplicates. */
    verticesMm: readonly C.Vector[];

    /** Private oriented incidence; returned triangles address the cut disk vertices. */
    triangles: readonly (readonly [number, number, number])[];

    /** Declared physical identities, including distinct cut-fan occurrences in the result. */
    vertexKeys: readonly string[];

    /** Complete coherent boundary cycles of one orientable genus-zero component. */
    cycles: readonly (readonly number[])[];
  };

  /**
   * Original returned coefficient and diagnostic contract.
   *
   * @evidence contracts/common.md#principled-implementation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/common.md#clear-and-simple-design A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input and output lifetimes remain with the operation and its caller.
   */
  export type Result = {
    /** Private physical positions in millimetres; returned positions include fan duplicates. */
    verticesMm: C.Vector[];

    /** Private oriented incidence; returned triangles address the cut disk vertices. */
    triangles: [number, number, number][];

    /** Declared physical identities, including distinct cut-fan occurrences in the result. */
    vertexKeys: string[];

    /** Single coherent boundary of the resulting private cut disk. */
    boundaryCycle: number[];

    /** Actual source edges selected by the private connecting cut forest. */
    cutEdges: number;

    /** Actual extra vertex occurrences introduced to separate cut banks. */
    duplicatedFanVertices: number;

    /** Measured returned minus input triangle area in square millimetres. */
    sourceAreaDifferenceMm2: number;
  };
}
