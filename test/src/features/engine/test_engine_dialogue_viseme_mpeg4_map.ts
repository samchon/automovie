import { productionPhonemesToVisemes } from "@automovie/engine";
import type {
  AutoMovieViseme,
  IAutoMovieProductionViseme,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * IPA phoneme symbols map to the MPEG-4 viseme set by place of articulation,
 * and symbols outside the table are refused.
 *
 * Scenarios:
 *
 * 1. Every consonant and vowel row maps to its viseme: bilabials to `PP`,
 *    labiodentals to `FF`, dentals to `TH`, alveolar stops to `DD`, velars to
 *    `kk`, postalveolars and affricates to `CH`, alveolar fricatives to `SS`,
 *    the alveolar nasal and lateral to `nn`, rhotics to `RR`, and open, mid,
 *    close front, mid back and close back vowels to `aa`, `E`, `I`, `O` and
 *    `U`.
 * 2. Affricates written with a tie bar or as one ligature are one phoneme, not
 *    two.
 * 3. The stress and length marks ˈ ˌ ː and whitespace carry no viseme and take no
 *    share.
 * 4. A symbol outside the table, such as the Kokoro-specific capital "A", is
 *    refused by name.
 * 5. Symbols espeak-ng and the Montreal Forced Aligner emit beyond English map by
 *    their articulation: ᵻ ɯ ɨ to `I`, Japanese ɯᵝ, y and ɥ to `U`, ø and œ to
 *    `O`, ɐ to `aa`, ç, ɲ, ʁ and c to `kk`, β and ɸ to `PP`, ʎ and ɬ to `nn`,
 *    ɕ, ʂ and tɕ to `CH`, t͡s to `SS`, ʋ to `FF` and ʔ to `sil`.
 * 6. A diacritic or modifier letter joins the phoneme before it with that
 *    phoneme's viseme and no share of its own: tʰ, pʲ, ɑ̃, n̩, precomposed ä
 *    and kʷ; tone letters ˥ ˩ take no share.
 * 7. A modifier with no phoneme before it, a tie bar joining a pair outside the
 *    table and an ASCII circumflex, which is not an IPA modifier, are refused
 *    by name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the articulation classes checked, the affricate spellings, the untimed marks, the modifiers and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Maps single-phoneme chunks through `productionPhonemesToVisemes` and reads each viseme. A table that sends consonants to rest, splits affricates, times stress marks, refuses an emitted IPA letter or diacritic, or gives a modifier its own share fails.
 * @evidence contracts/development/testing.md#independent-expectations Each expectation is written from the place and manner of articulation in Ladefoged and Johnson's A Course in Phonetics, the IPA chart's height and rounding of each vowel and the class names of ISO/IEC 14496-2 Annex C, not read from the engine table; the extra symbols are those espeak-ng's phoneme tables name (`phsource/ph_english_us` I# as ᵻ, `ph_korean` u- as ɯ, `ph_japanese` u as ɯᵝ and a as ä) and the English MFA dictionary's phone set lists.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every viseme, both affricate spellings, all three untimed marks and the tone letters, base letters against the same letters with diacritics, and three refusals; timing and coarticulation belong to `test_engine_dialogue_viseme_coarticulation`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_dialogue_viseme_mpeg4_map`; it starts no process.
 */
export function test_engine_dialogue_viseme_mpeg4_map(): void {
  const rows: [string, AutoMovieViseme][] = [
    ["p", "PP"],
    ["b", "PP"],
    ["m", "PP"],
    ["f", "FF"],
    ["v", "FF"],
    ["θ", "TH"],
    ["ð", "TH"],
    ["t", "DD"],
    ["d", "DD"],
    ["k", "kk"],
    ["ɡ", "kk"],
    ["ŋ", "kk"],
    ["ʃ", "CH"],
    ["ʒ", "CH"],
    ["tʃ", "CH"],
    ["dʒ", "CH"],
    ["s", "SS"],
    ["z", "SS"],
    ["n", "nn"],
    ["l", "nn"],
    ["ɹ", "RR"],
    ["ɑ", "aa"],
    ["æ", "aa"],
    ["ʌ", "aa"],
    ["ɛ", "E"],
    ["ə", "E"],
    ["i", "I"],
    ["ɪ", "I"],
    ["ɔ", "O"],
    ["o", "O"],
    ["u", "U"],
    ["ʊ", "U"],
    ["w", "U"],
  ];
  const map: (phonemes: string) => IAutoMovieProductionViseme[] = (
    phonemes: string,
  ): IAutoMovieProductionViseme[] =>
    productionPhonemesToVisemes({
      chunks: [{ phonemes, startSample: 0, endSample: 1200 }],
    });
  TestValidator.equals(
    "each IPA row maps to its MPEG-4 viseme",
    rows.map(([symbol]: [string, AutoMovieViseme]): string[] =>
      map(symbol).map((v: IAutoMovieProductionViseme): string => v.viseme),
    ),
    rows.map(([, viseme]: [string, AutoMovieViseme]): string[] => [viseme]),
  );

  TestValidator.equals(
    "tie-bar and ligature affricates are one phoneme",
    [map("t͡ʃ").length, map("d͡ʒ").length, map("ʧ").length, map("ʤ").length],
    [1, 1, 1, 1],
  );

  const marked: IAutoMovieProductionViseme[] = map("ˈɑː ˌm");
  TestValidator.equals(
    "stress, length and whitespace take no share",
    marked.map((v: IAutoMovieProductionViseme): [string, string, number] => [
      v.phoneme,
      v.viseme,
      v.endSample - v.startSample,
    ]),
    [
      ["ɑ", "aa", 600],
      ["m", "PP", 600],
    ],
  );

  TestValidator.predicate(
    "a symbol outside the table is refused by name",
    throwsError(() => map("hAlo"), ['"A"', "chunk 0"]),
  );

  // 5. Emitted symbols beyond English.
  const emitted: [string, AutoMovieViseme][] = [
    ["ᵻ", "I"],
    ["ɯ", "I"],
    ["ɨ", "I"],
    ["ɯᵝ", "U"],
    ["y", "U"],
    ["ɥ", "U"],
    ["ø", "O"],
    ["œ", "O"],
    ["ɐ", "aa"],
    ["ç", "kk"],
    ["ɲ", "kk"],
    ["ʁ", "kk"],
    ["c", "kk"],
    ["β", "PP"],
    ["ɸ", "PP"],
    ["ʎ", "nn"],
    ["ɬ", "nn"],
    ["ɕ", "CH"],
    ["ʂ", "CH"],
    ["tɕ", "CH"],
    ["t͡s", "SS"],
    ["ʋ", "FF"],
    ["ʔ", "sil"],
  ];
  TestValidator.equals(
    "emitted IPA symbols map by their articulation",
    emitted.map(([symbol]: [string, AutoMovieViseme]): string[] =>
      map(symbol).map((v: IAutoMovieProductionViseme): string => v.viseme),
    ),
    emitted.map(([, viseme]: [string, AutoMovieViseme]): string[] => [viseme]),
  );

  // 6. Modifiers join their phoneme.
  const modified: IAutoMovieProductionViseme[] = map("tʰ pʲ ɑ̃ n̩ ä kʷ ma˥˩");
  TestValidator.equals(
    "a modifier keeps its phoneme's viseme and takes no share",
    modified.map((v: IAutoMovieProductionViseme): [string, string] => [
      v.phoneme,
      v.viseme,
    ]),
    [
      ["tʰ", "DD"],
      ["pʲ", "PP"],
      ["ɑ̃", "aa"],
      ["n̩", "nn"],
      ["ä", "aa"],
      ["kʷ", "kk"],
      ["m", "PP"],
      ["a", "aa"],
    ],
  );

  // 7. Modifiers and ties that join nothing.
  TestValidator.predicate(
    "a modifier before any phoneme and a tie outside the table are refused",
    throwsError(() => map("ʰa"), ['"ʰ"', "chunk 0"]) &&
      throwsError(() => map("k͡p"), ["U+0361", "chunk 0"]) &&
      throwsError(() => map("a^"), ['"^"', "chunk 0"]),
  );
}
