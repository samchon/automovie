import { parseAutoMovieCaptionLanguage } from "./parseAutoMovieCaptionLanguage";

/**
 * Return one caption language tag, in its authored spelling, for a WebVTT
 * `<lang>` span annotation, or throw.
 *
 * A tag that is not well-formed RFC 5646 throws an `Error` naming the tag
 * rather than reaching the caption file, so a player never receives a language
 * span it cannot interpret. The authored case is kept; only identity
 * comparison folds case.
 *
 * @evidence contracts/common.md#principled-implementation A well-formed tag consists of ASCII letters, digits and hyphens only, which contain no WebVTT syntax character or control, so the parsed display spelling is written without escaping or flattening.
 * @evidence contracts/common.md#clear-and-simple-design The grammar lives in `parseAutoMovieCaptionLanguage`; this function is the throwing form `canonicalProductionWebVtt` needs for one annotation and adds no rule of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed tag throws instead of being normalized, replaced by a Preferred-Value, or dropped from the cue.
 * @evidence contracts/common.md#meaningful-documentation The doc says which spelling is returned, where it goes, and that a malformed tag throws and why.
 * @evidence contracts/performance.md#efficient-algorithms The cost is one parse, linear in the tag length, and no sanitizer pass follows because the grammar already excludes every character one would rewrite.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The function validates one tag per cue and coordinates no phases; repeated tags reparse in a few character comparisons.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Nothing persists past the call except the returned display string, and no handle or task is opened.
 */
export const webVttCaptionLanguage: (value: string) => string = (
  value: string,
): string => {
  const identity: ReturnType<typeof parseAutoMovieCaptionLanguage> =
    parseAutoMovieCaptionLanguage(value);
  if (identity === null)
    throw new Error(
      `Caption language "${value}" is not a well-formed RFC 5646 tag.`,
    );
  return identity.display;
};
