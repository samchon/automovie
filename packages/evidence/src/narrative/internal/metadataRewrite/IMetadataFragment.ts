/**
 * Records one owned metadata fragment and its protected-byte insertion anchor.
 *
 * @evidence contracts/common.md#principled-implementation Exact removed metadata is paired with its protected-byte insertion anchor.
 * @evidence contracts/common.md#clear-and-simple-design The pair makes both changed text and movement across authored bytes observable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original text and endings are retained without normalized replacements.
 * @evidence contracts/common.md#meaningful-documentation Properties specify projected byte units and exact removed text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
 */
export interface IMetadataFragment {
  /** Protected-byte offset where this metadata fragment was removed. */
  projectedStart: number;

  /** Exact original metadata text, including its line ending. */
  text: string;
}
