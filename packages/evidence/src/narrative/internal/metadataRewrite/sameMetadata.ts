import type { IMetadataFragment } from "./IMetadataFragment";

/**
 * Compares ordered metadata text and its authored-byte insertion anchors.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Compare fragment counts, protected insertion offsets and exact removed text in order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Including placement exposes movement across authored bytes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Whitespace and endings are never normalized into equality.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies both text and insertion-anchor comparison.
 * @evidence contracts/development/implementation.md#efficient-algorithms Up to M fragment pairs and their string comparisons are examined, short-circuiting with constant auxiliary space.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing projection fragments are compared without reconstruction or extra hashing.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrowed arrays and fragments are not retained.
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
