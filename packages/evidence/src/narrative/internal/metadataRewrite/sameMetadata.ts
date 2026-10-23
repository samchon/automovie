import type { IMetadataFragment } from "./IMetadataFragment";

/**
 * Compares ordered metadata text and its authored-byte insertion anchors.
 *
 * @evidence contracts/common.md#principled-implementation Compare fragment counts, protected insertion offsets and exact removed text in order.
 * @evidence contracts/common.md#clear-and-simple-design Including placement exposes movement across authored bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whitespace and endings are never normalized into equality.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies both text and insertion-anchor comparison.
 * @evidence contracts/performance.md#efficient-algorithms Up to M fragment pairs and their string comparisons are examined, short-circuiting with constant auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing projection fragments are compared without reconstruction or extra hashing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed arrays and fragments are not retained.
 */
export function sameMetadata(
  before: IMetadataFragment[],
  after: IMetadataFragment[],
): boolean {
  return (
    before.length === after.length &&
    before.every(
      (fragment: IMetadataFragment, index: number): boolean =>
        fragment.projectedStart === after[index].projectedStart &&
        fragment.text === after[index].text,
    )
  );
}
