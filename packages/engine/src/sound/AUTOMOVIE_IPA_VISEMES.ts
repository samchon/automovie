import type { AutoMovieViseme } from "@automovie/interface";

/**
 * The fixed table from IPA phoneme symbols to the MPEG-4 viseme set (ISO/IEC
 * 14496-2 Annex C).
 *
 * It holds every consonant and vowel letter of the IPA chart (International
 * Phonetic Association, revised 2020), the affricates and the reduced vowels ᵻ
 * and ᵿ, so phoneme strings from espeak-ng, the phonemizer most speech models
 * and aligners use, and from the Montreal Forced Aligner's IPA dictionaries map
 * without refusal. espeak-ng writes its IPA from the `ipa` names of its phoneme
 * tables (`phsource/`) and an ASCII-to-IPA table in `translate.c`, which give,
 * among others, ᵻ in English "wanted", ɯ and ɯᵝ in Korean and Japanese, y, ø
 * and œ in French and German, ç, β, ɲ, ʎ, ʂ, ɕ, tɕ and ts. A diacritic or
 * modifier letter such as ʰ, ʲ, ʷ, ̃ or ̩ belongs to the phoneme before it and
 * takes its viseme, so this table lists base symbols only.
 *
 * Each consonant takes the viseme of its place of articulation as Ladefoged and
 * Johnson (A Course in Phonetics) classify it, the visible parts of the mouth
 * deciding: bilabial stops, nasals, trills, fricatives, implosives and clicks
 * close the lips (`PP`); labiodentals put the lower lip to the teeth (`FF`),
 * and so does the affricate p͡f, which releases there; dentals (`TH`); alveolar
 * and retroflex stops, taps and flaps and the central clicks (`DD`); palatal,
 * velar and uvular consonants, made with the tongue body out of sight, the
 * uvular rhotics ʁ and ʀ included (`kk`); postalveolar, alveolo-palatal and
 * retroflex sibilants and their affricates (`CH`); alveolar sibilants and their
 * affricates (`SS`); alveolar and retroflex nasals and every lateral (`nn`);
 * the coronal rhotics r ɹ ɻ (`RR`). Pharyngeal, epiglottal and glottal
 * consonants have no oral articulation and take `sil`, so their neighbours
 * shape the mouth through coarticulation. Vowels take the viseme of their
 * height and rounding: open and near-open (`aa`), with ʌ; close-mid, mid and
 * open-mid unrounded (`E`); close and near-close unrounded, front, central or
 * back, and the glides j and ɰ (`I`); close-mid and open-mid rounded (`O`);
 * close and near-close rounded, and the glides w ʍ ɥ (`U`). Japanese ɯᵝ, whose
 * lips are compressed, is rounded (`U`). An affricate is one phoneme when
 * written with a tie bar, U+0361 above or U+035C below, or as a ligature;
 * written plainly, ts, dz and pf read as two phonemes, because they also spell
 * clusters, as in "cats", while tʃ dʒ tɕ dʑ tʂ dʐ read as one. Multi-symbol
 * entries are matched before single symbols.
 */
export const AUTOMOVIE_IPA_VISEMES: Readonly<Record<string, AutoMovieViseme>> =
  Object.freeze(
    Object.fromEntries(
      (
        [
          ["PP", "p b m ʙ ɸ β ɓ ʘ"],
          ["FF", "f v ɱ ʋ ⱱ p͡f p͜f"],
          ["TH", "θ ð ǀ"],
          ["DD", "t d ʈ ɖ ɾ ɽ ɗ ǃ ǂ"],
          ["kk", "c ɟ k g ɡ q ɢ ŋ ɲ ɴ ç ʝ x ɣ χ ʁ ʀ ʄ ɠ ʛ"],
          [
            "CH",
            "ʃ ʒ ɕ ʑ ʂ ʐ ɧ tʃ dʒ tɕ dʑ tʂ dʐ t͡ʃ d͡ʒ t͡ɕ d͡ʑ t͡ʂ d͡ʐ t͜ʃ d͜ʒ t͜ɕ d͜ʑ t͜ʂ d͜ʐ ʧ ʤ ʨ ʥ",
          ],
          ["SS", "s z t͡s d͡z t͜s d͜z ʦ ʣ"],
          ["nn", "n ɳ l ɫ ɭ ʎ ʟ ɬ ɮ ɺ ǁ"],
          ["RR", "r ɹ ɻ"],
          ["sil", "h ɦ ʔ ħ ʕ ʜ ʢ ʡ"],
          ["aa", "a ɑ ɒ æ ɐ ɶ ʌ"],
          ["E", "e ɛ ə ɚ ɜ ɝ ɘ ɤ"],
          ["I", "i ɪ ɨ ᵻ ɯ j ɰ"],
          ["O", "o ɔ ø œ ɵ ɞ"],
          ["U", "u ʊ y ʏ ʉ ᵿ w ʍ ɥ ɯᵝ"],
        ] as const
      ).flatMap(
        ([viseme, symbols]: readonly [AutoMovieViseme, string]): [
          string,
          AutoMovieViseme,
        ][] =>
          symbols
            .split(" ")
            .map((symbol: string): [string, AutoMovieViseme] => [
              symbol,
              viseme,
            ]),
      ),
    ),
  );
