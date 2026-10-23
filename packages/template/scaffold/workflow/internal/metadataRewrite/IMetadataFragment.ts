/** Records one owned metadata fragment and its protected-byte insertion anchor. */
export interface IMetadataFragment {
  /** Protected-byte offset where this metadata fragment was removed. */
  projectedStart: number;
  /** Exact original metadata text, including its line ending. */
  text: string;
}
