import { parseAutoMovieCaptionLanguage } from "./parseAutoMovieCaptionLanguage.js";

/**
 * Return the ASCII case-folded identity of a well-formed RFC 5646 language tag,
 * or null for a malformed tag.
 *
 * Two caption languages are the same language exactly when their keys are
 * equal, so `EN-us` and `en-US` share a readability profile and a preceding-gap
 * history. A null key matches nothing; the readability inspector leaves such a
 * cue without a profile or a gap instead of guessing a language.
 */
export const autoMovieCaptionLanguageComparisonKey: (
  value: string,
) => string | null = (value: string): string | null =>
  parseAutoMovieCaptionLanguage(value)?.comparisonKey ?? null;
