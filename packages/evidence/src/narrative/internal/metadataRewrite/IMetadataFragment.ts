/**
 * Records one owned metadata fragment and its protected-byte insertion anchor.
 *
 * @evidence contracts/development/design.md#principled-representation Exact removed metadata is paired with its protected-byte insertion anchor.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pair makes both changed text and movement across authored bytes observable.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Original text and endings are retained without normalized replacements.
 * @evidence contracts/development/common.md#meaningful-documentation Properties specify projected byte units and exact removed text.
 */
export interface IMetadataFragment {
  /** Protected-byte offset where this metadata fragment was removed. */
  projectedStart: number;

  /** Exact original metadata text, including its line ending. */
  text: string;
}
