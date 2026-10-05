/**
 * The basis token of a document built on the published face and/or body
 * basis: `published@<digest12>` for one basis, `published@<face12>.<body12>`
 * for a person on both. The worker requests the published files with these
 * digests and the server refuses changed bytes with 409, so a basis replaced
 * on disk never builds under a key, or a worker memo, that names the old one.
 *
 * @evidence contracts/common.md#principled-implementation Embeds the exact basis bytes a derived build depends on, so a stale derivative is detectable.
 * @evidence contracts/common.md#clear-and-simple-design One formula serves every published-basis document kind.
 * @evidence contracts/common.md#meaningful-documentation States the token forms and how they are checked.
 */
export function humanViewerPublishedBasis(...digests: readonly string[]): string {
  if (digests.length === 0 || digests.some((digest) => !/^[0-9a-f]{12,}$/.test(digest)))
    throw new Error("A published basis token needs one or two hex digests");
  return "published@" + digests.map((digest) => digest.slice(0, 12)).join(".");
}
