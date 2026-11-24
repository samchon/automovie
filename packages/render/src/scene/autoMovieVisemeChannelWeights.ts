import type {
  AutoMovieExpressionPreset,
  IAutoMovieHumanVisemeWeights,
} from "@automovie/interface";

import { AUTOMOVIE_EXPRESSION_PRESET_CHANNELS } from "./AUTOMOVIE_EXPRESSION_PRESET_CHANNELS.js";

/**
 * The expression channels a VRM or imported model receives for MPEG-4 viseme
 * weights: each viseme adds its weight to one of the five mouth presets and to
 * that preset's ARKit channels times their factors.
 *
 * Vowels take the preset of the same vowel: `aa`→`aa`, `E`→`ee`, `I`→`ih`,
 * `O`→`oh`, `U`→`ou`. Consonants take the preset nearest their mouth opening
 * and lip shape (Ladefoged and Johnson, A Course in Phonetics): the rounded
 * `CH` and `RR` take `ou`; the spread, nearly closed `SS` takes `ee`; the
 * tongue consonants `TH`, `DD`, `kk` and `nn`, made with the jaw slightly open,
 * take `ih`. `sil`, `PP` and `FF` close the lips and take none, because no
 * preset closes them. So `{ aa: 0.5, O: 0.5 }` gives `jawOpen` 0.5 × 1 + 0.5 ×
 * 0.6 = 0.8. Weights are clamped to [0, 1] before they are summed; sums are not
 * clamped here.
 *
 * @param visemes The viseme weights.
 * @returns Each preset and channel the weights set, with its summed weight.
 */
export function autoMovieVisemeChannelWeights(
  visemes: IAutoMovieHumanVisemeWeights,
): Map<string, number> {
  const mouth: Map<string, number> = new Map();
  for (const [viseme, weight] of Object.entries(visemes) as [
    keyof IAutoMovieHumanVisemeWeights,
    number | undefined,
  ][]) {
    const preset: AutoMovieExpressionPreset | null | undefined =
      VISEME_PRESETS[viseme];
    if (preset === null || preset === undefined || weight === undefined)
      continue;
    const w: number = Math.max(0, Math.min(1, weight));
    mouth.set(preset, (mouth.get(preset) ?? 0) + w);
    for (const [channel, factor] of AUTOMOVIE_EXPRESSION_PRESET_CHANNELS[
      preset
    ] ?? [])
      mouth.set(channel, (mouth.get(channel) ?? 0) + w * factor);
  }
  return mouth;
}

/**
 * The mouth preset of each viseme, or null for a closed mouth; the rows are
 * explained on `autoMovieVisemeChannelWeights`.
 */
const VISEME_PRESETS: Readonly<
  Record<keyof IAutoMovieHumanVisemeWeights, AutoMovieExpressionPreset | null>
> = {
  sil: null,
  PP: null,
  FF: null,
  TH: "ih",
  DD: "ih",
  kk: "ih",
  CH: "ou",
  SS: "ee",
  nn: "ih",
  RR: "ou",
  aa: "aa",
  E: "ee",
  I: "ih",
  O: "oh",
  U: "ou",
};
