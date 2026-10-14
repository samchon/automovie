

/**
 * Map one building-fold validator's addresses back to the authored program.
 *
 * A root prefixes every path from a single-record validation. Otherwise fields map each filtered list's local indices to original program positions; root takes precedence if both forms are supplied.
 *
 * @evidence contracts/common.md#principled-implementation The root/list distinction matches single-network/domain versus multi-list water/cloth/planting validators, preserving engine-generated field paths while restoring authored list positions.
 * @evidence contracts/common.md#clear-and-simple-design buildingBoundDiagnostics constructs the address beside each validator invocation and productionEnvironmentRewriteBindingPath performs the shared translation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type enforces neither exclusive forms nor index completeness; an absent field/index mapping falls back to the engine-local spelling, so malformed caller maps are not independently refused.
 * @evidence contracts/common.md#meaningful-documentation States root precedence, filtered-to-original index ownership and unsupported mapping limits; indices are zero-based program positions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased interface executes no regex or list traversal; its producer and path translator own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Address records describe one validator invocation, without a retained cross-program equivalence key.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous fold call owns index arrays and address records until findings are translated; the declaration opens no resource or running task.
 * @author Samchon
 */
export interface IProductionEnvironmentBindingAddress {
  /** `$input` is one record of this program list, so every path hangs under it. */
  root?: {
    /** Program list that owns the single validated record. */
    key: string;

    /** Zero-based original position of that record. */
    index: number;
  };

  /** `$input.<name>[i]` addresses this program list at the mapped position. */
  fields?: Readonly<
    Record<string, {
      /** Authored program list corresponding to this validator field. */
      key: string;

      /** Original program positions in the same order as the filtered input. */
      indices: readonly number[];
    }>
  >;
}
