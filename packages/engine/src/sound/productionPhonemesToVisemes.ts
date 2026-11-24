import type {
  AutoMovieViseme,
  IAutoMovieProductionPhonemeChunk,
  IAutoMovieProductionPhonemesToVisemes,
  IAutoMovieProductionViseme,
} from "@automovie/interface";

import { AUTOMOVIE_IPA_VISEMES } from "./AUTOMOVIE_IPA_VISEMES";

/**
 * Time each phoneme of a line's chunks and map it to its MPEG-4 viseme.
 *
 * A chunk's IPA string, decomposed to NFD so a letter and its diacritics are
 * separate code points, is read left to right, matching the longest entry of
 * `AUTOMOVIE_IPA_VISEMES` first. Whitespace, the stress marks ˈ ˌ, the length
 * marks ː ˑ and the tone letters ˥ ˦ ˧ ˨ ˩ take no share. A combining
 * diacritic, a modifier letter such as ʰ ʲ ʷ ʼ ᵝ or a spacing modifier such as
 * ˞ after a phoneme belongs to that phoneme: it takes no share and keeps the
 * phoneme's viseme, so tʰ is `DD` and ɑ̃ is `aa`. A modifier with no phoneme
 * before it in its chunk, a tie bar the table does not join and any other
 * symbol outside the table are refused, naming the symbol and its chunk. The
 * phonemes share the chunk's sample interval equally, in order, so a chunk of
 * three phonemes over samples 0 to 24 000 gives each 8 000 samples. A chunk
 * with no phoneme adds nothing. Each phoneme is reported in NFC with its
 * modifiers and without its untimed marks.
 *
 * @param props The line's phoneme chunks.
 * @returns Each phoneme with its viseme and its share, in spoken order.
 */
export const productionPhonemesToVisemes: (
  props: IAutoMovieProductionPhonemesToVisemes.IProps,
) => IAutoMovieProductionViseme[] = (
  props: IAutoMovieProductionPhonemesToVisemes.IProps,
): IAutoMovieProductionViseme[] => {
  const output: IAutoMovieProductionViseme[] = [];
  props.chunks.forEach(
    (chunk: IAutoMovieProductionPhonemeChunk, index: number): void => {
      if (
        Number.isFinite(chunk.startSample) === false ||
        Number.isFinite(chunk.endSample) === false ||
        chunk.endSample <= chunk.startSample
      )
        throw new Error(
          `Phoneme chunk ${index} must span an increasing sample interval, not ${chunk.startSample} to ${chunk.endSample}.`,
        );
      const phonemes: IPhoneme[] = tokenize(chunk.phonemes, index);
      const share: number =
        (chunk.endSample - chunk.startSample) / Math.max(1, phonemes.length);
      phonemes.forEach((phoneme: IPhoneme, order: number): void => {
        output.push({
          phoneme: phoneme.text,
          viseme: phoneme.viseme,
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
};

/** One timed phoneme of a chunk: its symbols and its viseme. */
interface IPhoneme {
  /** The phoneme with its modifiers, in NFD while it is read. */
  text: string;

  /** Its MPEG-4 viseme. */
  viseme: AutoMovieViseme;
}

/**
 * Symbols that take no share and join no phoneme: the primary and secondary
 * stress marks, the length and half-length marks and the five tone letters;
 * whitespace is handled apart.
 */
const UNTIMED: ReadonlySet<string> = new Set([
  "ˈ",
  "ˌ",
  "ː",
  "ˑ",
  "˥",
  "˦",
  "˧",
  "˨",
  "˩",
]);

/** The two tie bars, which join two letters only inside a table entry. */
const TIES: ReadonlySet<string> = new Set(["͡", "͜"]);

/**
 * A code point that modifies the phoneme before it: a combining mark, a
 * modifier letter, or a modifier symbol of the Spacing Modifier Letters block
 * (U+02B0 to U+02FF), such as ˞. ASCII and Latin-1 accents such as `^`, which
 * Unicode also files as modifier symbols, are not IPA and stay refused.
 */
const MODIFIER: RegExp = /^[\p{M}\p{Lm}ʰ-˿]$/u;

/** The table keyed in NFD, the form chunks are read in. */
const TABLE: ReadonlyMap<string, AutoMovieViseme> = new Map(
  Object.entries(AUTOMOVIE_IPA_VISEMES).map(
    ([symbol, viseme]: [string, AutoMovieViseme]): [
      string,
      AutoMovieViseme,
    ] => [symbol.normalize("NFD"), viseme],
  ),
);

/** The longest table entry, in code points, so matching can try it first. */
const LONGEST: number = Math.max(
  ...[...TABLE.keys()].map(
    (symbol: string): number => Array.from(symbol).length,
  ),
);

/**
 * Split one chunk's IPA string into phonemes, longest table match first, with
 * each following modifier attached; refuse a symbol outside the table.
 */
const tokenize: (phonemes: string, chunk: number) => IPhoneme[] = (
  phonemes: string,
  chunk: number,
): IPhoneme[] => {
  const points: string[] = Array.from(phonemes.normalize("NFD"));
  const output: IPhoneme[] = [];
  const refuse: (point: string, why: string) => never = (
    point: string,
    why: string,
  ): never => {
    throw new Error(
      `Phoneme chunk ${chunk} contains "${point}" (U+${point.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}), ${why}.`,
    );
  };
  for (let at: number = 0; at < points.length; ) {
    const point: string = points[at]!;
    if (/\s/u.test(point) || UNTIMED.has(point)) {
      ++at;
      continue;
    }
    if (TIES.has(point))
      refuse(point, "a tie bar the IPA table joins nothing with");
    if (MODIFIER.test(point)) {
      const last: IPhoneme | undefined = output.at(-1);
      if (last === undefined)
        refuse(point, "a modifier with no phoneme before it");
      last!.text += point;
      ++at;
      continue;
    }
    let matched: number = 0;
    let viseme: AutoMovieViseme | undefined;
    for (
      let length: number = Math.min(LONGEST, points.length - at);
      length > 0 && viseme === undefined;
      --length
    ) {
      viseme = TABLE.get(points.slice(at, at + length).join(""));
      matched = length;
    }
    if (viseme === undefined)
      refuse(point, "which has no viseme in the IPA table");
    output.push({
      text: points.slice(at, at + matched).join(""),
      viseme: viseme!,
    });
    at += matched;
  }
  return output.map(
    (phoneme: IPhoneme): IPhoneme => ({
      text: phoneme.text.normalize("NFC"),
      viseme: phoneme.viseme,
    }),
  );
};
