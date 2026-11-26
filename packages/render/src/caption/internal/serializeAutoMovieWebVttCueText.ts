import { canonicalizeAutoMovieCaptionText } from "./canonicalizeAutoMovieCaptionText.js";
import { escapeWebVttText } from "../escapeWebVttText.js";

/**
 * Serialize one authored caption as a WebVTT cue payload.
 *
 * The caption is canonicalized first, so the payload shows exactly the lines
 * readability measured. Each line is escaped, and an empty line becomes the
 * empty class span `<c></c>`, which keeps a visible line without writing a
 * blank line that would end the cue block.
 */
export const serializeAutoMovieWebVttCueText: (value: string) => string = (
  value: string,
): string =>
  canonicalizeAutoMovieCaptionText(value)
    .split("\n")
    .map((line: string): string =>
      line.length === 0 ? "<c></c>" : escapeWebVttText(line),
    )
    .join("\n");
