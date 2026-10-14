

/**
 * Compare captured byte witnesses exactly, distinguishing null absence from an empty present file. Shared buffers are not assumed equivalent merely because they have the same byte length.
 *
 * @evidence contracts/common.md#principled-implementation Null equality preserves absence semantics and Buffer.equals compares actual content for present witnesses.
 * @evidence contracts/common.md#clear-and-simple-design One comparator supports before/after revision-byte coherence without replacing the scalar revision comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No digest-only, reference-only or length-only shortcut certifies equal bytes.
 * @evidence contracts/common.md#meaningful-documentation States exact equality and absence-versus-empty meaning.
 * @evidence contracts/performance.md#efficient-algorithms Present comparison follows L bytes until inequality and Buffer.from creates input-sized copies for the supplied typed arrays; null comparison is constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses captured boundary witnesses but compares their content for this attempt rather than caching equality after later mutation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary Buffer copies expire with the call; the caller continues to own retained snapshot bytes and no file is opened.
 */
export const legacyImporterEqualOptionalBytes: (left: Uint8Array | null, right: Uint8Array | null) => boolean = (
  left: Uint8Array | null,
  right: Uint8Array | null,
): boolean =>
  left === null || right === null
    ? left === right
    : Buffer.from(left).equals(Buffer.from(right));
