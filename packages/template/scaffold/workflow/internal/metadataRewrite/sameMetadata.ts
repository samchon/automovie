import type { IMetadataFragment } from "./IMetadataFragment";

/** Compares ordered metadata text and its authored-byte insertion anchors. */
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
