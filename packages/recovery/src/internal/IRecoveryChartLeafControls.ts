/**
 * Structural records for RecoveryChartLeafControls.
 *
 * @evidence contracts/common.md#principled-implementation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
 * @evidence contracts/common.md#clear-and-simple-design A type-only owner separates the unchanged input and result contracts from execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
 * @evidence contracts/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input and output lifetimes remain with the operation and its caller.
 */
export namespace IRecoveryChartLeafControls {
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
   * @evidence contracts/common.md#principled-implementation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/common.md#clear-and-simple-design A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input and output lifetimes remain with the operation and its caller.
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
