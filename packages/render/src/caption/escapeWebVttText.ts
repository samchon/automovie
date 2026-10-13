/**
 * Escape the three characters WebVTT reads as cue-text syntax: `&`, `<` and
 * `>`.
 *
 * Cue payloads and single-line annotations share this escape, because a caption
 * that escaped one but not the other would publish markup in one field and
 * literal text in the other.
 *
 * @evidence contracts/common.md#principled-implementation WebVTT cue text defines the character references `&amp;`, `&lt;` and `&gt;`, and escaping `&` first keeps the later replacements from being escaped twice, so the mapping is reversible.
 * @evidence contracts/common.md#clear-and-simple-design A single shared escape is the only thing the cue-text and annotation serializers have in common, so it is its own function while their different line handling stays with each serializer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The escaped set is the WebVTT syntax set and nothing else; no input is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc names the exact escaped characters and why both serializers must share the escape.
 * @evidence contracts/performance.md#efficient-algorithms Three `replaceAll` passes are each linear in the text length; a single-pass replacer would save at most two scans of one caption line.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure per-string escape coordinates no phases, so there is no completed work to share between its callers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function returns a new string and keeps no state, handle or task.
 */
export const escapeWebVttText = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
