import type { IAutoMovieDialogueMouthRange } from "./IAutoMovieDialogueMouthRange";

/**
 * One actor's timed visemes for one line, with `sil` filling pauses between
 * phonemes.
 *
 * Before the first range and after the last the mouth is silent; engine's
 * `sampleDialogueVisemeWeights` treats both as `sil` targets.
 */
export interface IAutoMovieDialogueVisemeTimeline {
  /** Joined dialogue line identity. */
  line: string;

  /** Resolved actor node. */
  actor: string;

  /**
   * Ordered, nonoverlapping ranges from the first phoneme's start to the last
   * phoneme's end.
   */
  ranges: IAutoMovieDialogueMouthRange[];
}
