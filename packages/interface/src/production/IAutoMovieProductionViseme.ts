/**
 * One phoneme-derived mouth target over a half-open production-frame interval.
 *
 * @evidence contracts/common.md#principled-implementation productionPhonemesToVisemes maps native chunk sample extents into bounded film frame bins and selects a closed VRM mouth target from each bin's leading token; joining validates ordered nonoverlapping frame intervals and fills silence gaps with rest.
 * @evidence contracts/common.md#clear-and-simple-design Keeps source token text, target expression and global interval in one record while actor identity and authored-expression composition remain in the lip-sync join.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Multiple phonemes may share one frame bin and unknown tokens map to rest; the record does not claim measured phoneme onset precision or invent speech analysis for arbitrary external audio.
 * @evidence contracts/common.md#meaningful-documentation Defines source token ownership, bounded mouth vocabulary, neutral rest and inclusive-start exclusive-end global frame timing.
 */
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
