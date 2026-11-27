import type {
  IAutoMovieProductionPhonemeChunk,
  IAutoMovieProductionPhonemesToVisemes,
  IAutoMovieProductionViseme,
} from "@automovie/interface";

import { AUTOMOVIE_IPA_VISEMES } from "../constants/AUTOMOVIE_IPA_VISEMES";

/**
 * Time each phoneme of a line's chunks and map it to its MPEG-4 viseme.
 *
 * A chunk's IPA string, NFC-normalized, is read left to right, matching the
 * longest entry of `AUTOMOVIE_IPA_VISEMES` first. Whitespace and the stress and
 * length marks ˈ ˌ ː take no share; any other symbol outside the table is
 * refused, naming it and its chunk. The phonemes left share the chunk's sample
 * interval equally, in order, so a chunk of three phonemes over samples 0 to 24
 * 000 gives each 8 000 samples. A chunk with no phoneme adds nothing.
 *
 * @param props The line's phoneme chunks.
 * @returns Each phoneme with its viseme and its share, in spoken order.
 */
export function productionPhonemesToVisemes(
  props: IAutoMovieProductionPhonemesToVisemes.IProps,
): IAutoMovieProductionViseme[] {
  const output: IAutoMovieProductionViseme[] = [];
  props.chunks.forEach(
    (chunk: IAutoMovieProductionPhonemeChunk, index: number): void => {
      if (chunk.endSample <= chunk.startSample)
        throw new Error(
          `Phoneme chunk ${index} must span an increasing sample interval, not ${chunk.startSample} to ${chunk.endSample}.`,
        );
      const phonemes: string[] = tokenize(chunk.phonemes, index);
      const share: number =
        (chunk.endSample - chunk.startSample) / Math.max(1, phonemes.length);
      phonemes.forEach((phoneme: string, order: number): void => {
        output.push({
          phoneme,
          viseme: AUTOMOVIE_IPA_VISEMES[phoneme]!,
          startSample: chunk.startSample + share * order,
          endSample:
            order + 1 === phonemes.length
              ? chunk.endSample
              : chunk.startSample + share * (order + 1),
        });
      });
    },
  );
  return output;
}

/**
 * Symbols that take no share: whitespace is handled apart; these are the
 * primary and secondary stress marks and the length mark.
 */
const UNTIMED: ReadonlySet<string> = new Set(["ˈ", "ˌ", "ː"]);

/** The longest table entry, in code points, so matching can try it first. */
const LONGEST: number = Math.max(
  ...Object.keys(AUTOMOVIE_IPA_VISEMES).map(
    (symbol: string): number => Array.from(symbol).length,
  ),
);

/**
 * Split one chunk's IPA string into table symbols, longest match first; refuse
 * a symbol outside the table.
 */
const tokenize: (phonemes: string, chunk: number) => string[] = (
  phonemes: string,
  chunk: number,
): string[] => {
  const points: string[] = Array.from(phonemes.normalize("NFC"));
  const output: string[] = [];
  for (let at: number = 0; at < points.length; ) {
    const point: string = points[at]!;
    if (/\s/u.test(point) || UNTIMED.has(point)) {
      ++at;
      continue;
    }
    let matched: number = 0;
    for (
      let length: number = Math.min(LONGEST, points.length - at);
      length > 0;
      --length
    )
      if (
        Object.prototype.hasOwnProperty.call(
          AUTOMOVIE_IPA_VISEMES,
          points.slice(at, at + length).join(""),
        )
      ) {
        matched = length;
        break;
      }
    if (matched === 0)
      throw new Error(
        `Phoneme chunk ${chunk} contains "${point}" (U+${point.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}), which has no viseme in the IPA table.`,
      );
    output.push(points.slice(at, at + matched).join(""));
    at += matched;
  }
  return output;
};
