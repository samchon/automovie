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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the articulation classes checked, the affricate spellings, the untimed marks and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Maps single-phoneme chunks through `productionPhonemesToVisemes` and reads each viseme. A table that sends consonants to rest, splits affricates or times stress marks fails.
 * @evidence contracts/development/testing.md#independent-expectations Each expectation is written from the place and manner of articulation in Ladefoged and Johnson's A Course in Phonetics and the class names of ISO/IEC 14496-2 Annex C, not read from the engine table.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every viseme but `sil`, both affricate spellings, all three untimed marks and one refusal; timing and coarticulation belong to `test_engine_dialogue_viseme_coarticulation`.
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
}
