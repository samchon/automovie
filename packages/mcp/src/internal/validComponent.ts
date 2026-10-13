

const reserved: RegExp = /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/iu;


/**
 * Decide portable filename admission without consulting or normalizing the source.
 *
 *
 * @evidence contracts/common.md#principled-implementation Portable filename admission excludes separators, control characters, trailing dots or spaces, hidden components and case-insensitive Windows device aliases including superscript digits.
 * @evidence contracts/common.md#clear-and-simple-design One predicate owns component grammar for both direct reads and inventory walking.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission does not sanitize or normalize a name into another identity; ordinary nonreserved Unicode and internal spaces remain allowed.
 * @evidence contracts/common.md#meaningful-documentation The comment states portable raw-name policy; false is an admission decision without filesystem effects.
 * @evidence contracts/performance.md#efficient-algorithms For L component characters, bounded regular expressions scan O(L) with constant pattern state.
 * @evidence contracts/performance.md#reuse-equivalent-work The reserved-name regex is shared by calls; no result cache assumes that distinct raw names are equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module retains one fixed pattern and no request-owned byte buffer or handle.
 */
export function validComponent(part: string): boolean {
  return (
    part.length > 0 &&
    part !== "." &&
    part !== ".." &&
    !/[\\/:"#?*<>|\u0000-\u001f\u007f]/u.test(part) &&
    !/[. ]$/u.test(part) &&
    !reserved.test(part) &&
    !part.startsWith(".")
  );
}
