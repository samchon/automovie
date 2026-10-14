import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Project published face/body authority to published@digest12 or published@face12.body12 in supplied order. The worker requests these prefixes and the server refuses a mismatching current digest with 409. Twelve hexadecimal characters provide a conventional 48-bit prefix, so a collision can leave changed bytes under the same token; this is not full content identity.
 *
 * @evidence contracts/common.md#principled-implementation Published basis tokens use lowercase hexadecimal digest inputs and join their twelve-character prefixes in the supplied order.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty digest validation and canonical token projection serve the existing one-basis and paired-basis callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid hex inputs refuse, but this variadic helper does not independently cap arity; supported consumers choose their required digest count.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies existing one/two-digest uses and leaves actual byte refusal with the served basis owner.
 * @evidence contracts/performance.md#efficient-algorithms Validation visits input digest characters once and projection visits each digest prefix once.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared canonical published naming preserves supplied digest order without caching another caller's token or asset.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input strings are borrowed and only the returned token remains; no disk or numerical model ownership is acquired.
 */
export function humanViewerPublishedBasis(
  ...digests: readonly string[]
): string {
  if (
    digests.length === 0 ||
    digests.some((digest: string): boolean => !/^[0-9a-f]{12,}$/.test(digest))
  )
    throw new Error("A published basis token needs at least one hex digest");
  return (
    humanViewerBasisTokens.published +
    "@" +
    digests.map((digest: string): string => digest.slice(0, 12)).join(".")
  );
}
