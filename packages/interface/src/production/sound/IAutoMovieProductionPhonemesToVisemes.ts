import type { IAutoMovieProductionPhonemeChunk } from "../IAutoMovieProductionPhonemeChunk";

/** Adopted phoneme sample timing fitted to one film-frame dialogue span. */
export namespace IAutoMovieProductionPhonemesToVisemes {
  /**
   * Map supplied phoneme chunk sample timing to film-frame vowel/rest
   * intervals.
   *
   * Tokens are NFKC-normalized non-whitespace code points. Output intervals use
   * floor/ceiling boundaries and advance monotonically for admitted chunks;
   * tokens beyond the available span append their phoneme text to the previous
   * interval instead of adding frames.
   */
  export type IProps = {
    /**
     * Borrowed chunks in intended source order, with sample bounds on the
     * adopted mono generation. The function does not sort or validate them;
     * empty or whitespace-only chunks produce a full-span rest when the
     * duration/source count is positive.
     */
    chunks: readonly IAutoMovieProductionPhonemeChunk[];
    /**
     * Positive total count of source mono samples used as the timing
     * denominator. Nonpositive returns []; finite safe-integer count is the
     * caller's premise.
     */
    sourceSamples: number;
    /**
     * Inclusive film-frame start of the dialogue interval. Caller supplies a
     * nonnegative safe integer; mapping does not independently validate it.
     */
    startFrame: number;
    /**
     * Exclusive film-frame end. A nonpositive difference from startFrame
     * returns []; otherwise this boundary caps each admitted output interval.
     */
    endFrame: number;
  };
}
