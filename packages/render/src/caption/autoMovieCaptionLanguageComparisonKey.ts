import { parseAutoMovieCaptionLanguage } from "./parseAutoMovieCaptionLanguage";

/**
 * Return the ASCII case-folded identity of a well-formed RFC 5646 language
 * tag, or null for a malformed tag.
 *
 * Two caption languages are the same language exactly when their keys are
 * equal, so `EN-us` and `en-US` share a readability profile and a preceding-gap
 * history. A null key matches nothing; the readability inspector leaves such a
 * cue without a profile or a gap instead of guessing a language.
 *
 * @evidence contracts/common.md#principled-implementation RFC 5646 section 2.1.1 defines tag comparison as ASCII case-insensitive, and the key is the parser's lower-cased spelling, which is ASCII-only because the parser admits only letters, digits and hyphens.
 * @evidence contracts/common.md#clear-and-simple-design The function is a projection of `parseAutoMovieCaptionLanguage` for callers that need only identity, so the grammar and the case fold each live in the parser once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It consults no registry, applies no Preferred-Value and special-cases no tag; a malformed tag returns null rather than a best-effort key.
 * @evidence contracts/common.md#meaningful-documentation The doc states the comparison rule the key implements, gives a concrete equivalence, and says what a null key means to the readability consumer.
 * @evidence contracts/performance.md#efficient-algorithms Cost is one parse linear in tag length, including its folded string, subtag array and variant/singleton sets. The grammar bounds each subtag's length but this boundary imposes no total tag-length quota.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure per-tag projection coordinates no phases; the inspector calls it once per profile and once per cue, and a cache would cost more than reparsing a short tag.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function retains nothing after returning a string, and it opens no handle or task.
 */
export const autoMovieCaptionLanguageComparisonKey: (value: string) => string | null = (
  value: string,
): string | null => parseAutoMovieCaptionLanguage(value)?.comparisonKey ?? null;
