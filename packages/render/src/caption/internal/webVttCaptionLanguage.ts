import { parseAutoMovieCaptionLanguage } from "./parseAutoMovieCaptionLanguage.js";

/*
 * Return one caption language tag, in its authored spelling, for a WebVTT
 * `<lang>` span annotation, or throw.
 *
 * A tag that is not well-formed RFC 5646 throws an `Error` naming the tag
 * rather than reaching the caption file, so a player never receives a language
 * span it cannot interpret. The authored case is kept; only identity comparison
 * folds case.
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
