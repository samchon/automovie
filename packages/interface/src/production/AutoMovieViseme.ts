import type { IAutoMovieHumanVisemeWeights } from "../human/IAutoMovieHumanVisemeWeights";

/**
 * One of the 15 visemes of ISO/IEC 14496-2 (MPEG-4 Visual) Annex C, under the
 * names `IAutoMovieHumanVisemeWeights` uses: `sil` for silence, the consonant
 * classes `PP` (p b m), `FF` (f v), `TH` (θ ð), `DD` (t d), `kk` (k g), `CH`
 * (tʃ dʒ ʃ ʒ), `SS` (s z), `nn` (n l) and `RR` (r), and the vowels `aa`, `E`,
 * `I`, `O` and `U`.
 */
export type AutoMovieViseme = keyof IAutoMovieHumanVisemeWeights;
