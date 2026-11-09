/**
 * Structural records for RecoveryChartLeafControls.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
 * @evidence contracts/development/design.md#principled-representation Represents Structural records for RecoveryChartLeafControls: companion namespace of 2 members (`Input`, `Result`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IRecoveryChartLeafControls` in packages/recovery/src/internal/IRecoveryChartLeafControls.ts; its surface is the 2 members listed and the text shows 1 other file naming it, mostly packages/recovery (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IRecoveryChartLeafControls {
  /**
   * Original immutable input contract.
   *
   * @evidence contracts/development/design.md#principled-representation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
   */
  export type Input = {
    /** Unique named rectangles covering the unit UV square with disjoint interiors. */
    leaves: readonly {
      id: string;
      bounds: readonly [number, number, number, number];
    }[];
    /** Positive safe cap on every allocated corner, edge and interior control ID. */
    maxControls: number;
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
    /** Number of original IDs for the relation resolver and fitter. */
    controls: number;
    /** Sixteen original control IDs per patch, v rows with u varying fastest. */
    patches: { id: string; controlIds: number[] }[];
    /** Dependent original controls as unchanged sparse master-control expressions. */
    relations: { id: number; terms: { id: number; weight: number }[] }[];
    /** Master cubic intervals only, with increasing global varying coordinate. */
    edges: {
      id: string;
      axis: 0 | 1;
      line: number;
      start: number;
      end: number;
      controlIds: [number, number, number, number];
    }[];
    /** Increasing side intervals normalized to their declared master edge. */
    bindings: {
      patch: string;
      side: 0 | 1 | 2 | 3;
      edge: string;
      start: number;
      end: number;
    }[];
    /** Master outer coefficients only; never dependent fine-edge controls. */
    boundary: { control: number; u: number; v: number }[];
  };
}
