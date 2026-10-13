const PROHIBITED_CAPTION_CONTROLS: RegExp =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu;

/**
 * Normalize one authored caption into the presentation shared by readability
 * measurement and WebVTT delivery.
 *
 * CRLF and lone CR become LF, tabs stay intact, and every other C0 control and
 * DEL becomes one space. Lines are never reflowed or trimmed, and empty lines
 * stay empty here so readability counts the exact authored presentation; the
 * cue serializer, not this function, makes an empty line survive WebVTT.
 *
 * @evidence contracts/common.md#principled-implementation Two global regular-expression replacements implement the mapping: the first folds both legacy line terminators into LF, and the second maps the remaining C0 controls and DEL one-for-one to a space, so line count and every printable code point are preserved.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the presentation so the readability inspector, film assembly's blank-text check and the cue serializer all read the same text; it does no escaping, which belongs to the WebVTT serializers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The character classes are the controls WebVTT cue text cannot carry, a format rule rather than a measured case, and no caption or consumer is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc lists the exact newline, tab and control mappings, states that lines are not reflowed or trimmed, and names which layer preserves empty lines.
 * @evidence contracts/performance.md#efficient-algorithms Each replacement is one linear scan of the caption, so the cost is O(L) time and at most two new strings of length L.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure string mapping coordinates no phases; its callers each normalize the one caption they hold, and caching short captions would cost more than the scan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module retains only the compiled pattern for its lifetime; the global flag carries no state across calls because `String.prototype.replace` resets it.
 */
export const canonicalizeAutoMovieCaptionText = (value: string): string =>
  value.replace(/\r\n?/gu, "\n").replace(PROHIBITED_CAPTION_CONTROLS, " ");
