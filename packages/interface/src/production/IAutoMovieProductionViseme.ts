/** One phoneme-derived mouth target over a half-open production-frame interval. */
export interface IAutoMovieProductionViseme {
  /** Source phoneme or grapheme token. */
  phoneme: string;

  /** VRM expression target, or `rest` for a closed/neutral mouth. */
  viseme: "aa" | "ih" | "ou" | "ee" | "oh" | "rest";

  /** Film-global inclusive start frame. */
  startFrame: number;

  /** Film-global exclusive end frame. */
  endFrame: number;
}
