import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/**
 * Structural records for RecoveryMultiBoundaryChart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
 * @evidence contracts/development/design.md#principled-representation Represents Structural records for RecoveryMultiBoundaryChart: companion namespace of 2 members (`Input`, `Result`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IRecoveryMultiBoundaryChart` in packages/recovery/src/internal/IRecoveryMultiBoundaryChart.ts; its surface is the 2 members listed and the text shows 1 other file naming it, mostly packages/recovery (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IRecoveryMultiBoundaryChart {
  /**
   * Original immutable input contract.
   *
   * @evidence contracts/development/design.md#principled-representation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
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
   * @evidence contracts/development/design.md#principled-representation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
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
