/**
 * One phoneme-derived mouth target on the production frame clock.
 *
 * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `IAutoMovieProductionViseme` as the portable data boundary for the sound derived source closure requirement.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `IAutoMovieProductionViseme` for the sound decode and derived source closure system contract.
 */
export interface IAutoMovieProductionViseme {
  /**
   * Source phoneme or grapheme token.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `phoneme` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `phoneme` for the sound decode and derived source closure system contract.
   */
  phoneme: string;
  /**
   * VRM expression target, or `rest` for a closed/neutral mouth.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `viseme` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `viseme` for the sound decode and derived source closure system contract.
   */
  viseme: "aa" | "ih" | "ou" | "ee" | "oh" | "rest";
  /**
   * Film-global inclusive start frame.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `startFrame` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `startFrame` for the sound decode and derived source closure system contract.
   */
  startFrame: number;
  /**
   * Film-global exclusive end frame.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `endFrame` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `endFrame` for the sound decode and derived source closure system contract.
   */
  endFrame: number;
}
