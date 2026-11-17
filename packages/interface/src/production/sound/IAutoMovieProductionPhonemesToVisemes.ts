import type { IAutoMovieProductionPhonemeChunk } from "../IAutoMovieProductionPhonemeChunk";

/**
 * Adopted phoneme sample timing fitted to one film-frame dialogue span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Adopted phoneme sample timing fitted to one film-frame dialogue span. Chunk endpoints use mono source sample indices and the target uses [startFrame, endFrame) film frames. Ratios fit sample timing into that span; no sample rate is required because only relative source position matters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nonpositive duration or sourceSamples returns no intervals; no tokens yields one full-span rest. Other numeric validity/order is a caller premise, and gaps between timed chunks are not automatically filled.
 * @evidence contracts/development/design.md#principled-representation Chunk endpoints use mono source sample indices and the target uses [startFrame, endFrame) film frames. Ratios fit sample timing into that span; no sample rate is required because only relative source position matters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface productionPhonemesToVisemes lowers adopted speech chunks to vowel/rest intervals, preserving input chunk order and grouping multiple tokens when fewer frames are available.
 */
export namespace IAutoMovieProductionPhonemesToVisemes {
  /**
   * Map supplied phoneme chunk sample timing to film-frame vowel/rest intervals.
   *
   * Tokens are NFKC-normalized non-whitespace code points. Output intervals use floor/ceiling boundaries and advance monotonically for admitted chunks; tokens beyond the available span append their phoneme text to the previous interval instead of adding frames.
   *
   * @evidence contracts/development/design.md#principled-representation Chunk endpoints use mono source sample indices and the target uses [startFrame, endFrame) film frames. Ratios fit sample timing into that span; no sample rate is required because only relative source position matters.
   * @evidence contracts/development/design.md#minimal-and-owned-surface productionPhonemesToVisemes lowers adopted speech chunks to vowel/rest intervals, preserving input chunk order and grouping multiple tokens when fewer frames are available.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nonpositive duration or sourceSamples returns no intervals; no tokens yields one full-span rest. Other numeric validity/order is a caller premise, and gaps between timed chunks are not automatically filled.
   * @evidence contracts/development/common.md#meaningful-documentation Adopted phoneme sample timing fitted to one film-frame dialogue span. Chunk endpoints use mono source sample indices and the target uses [startFrame, endFrame) film frames. Ratios fit sample timing into that span; no sample rate is required because only relative source position matters.
   */
  export type IProps = {
    /**
     * Borrowed chunks in intended source order, with sample bounds on the adopted mono generation. The function does not sort or validate them; empty or whitespace-only chunks produce a full-span rest when the duration/source count is positive.
     */
    chunks: readonly IAutoMovieProductionPhonemeChunk[];
    /**
     * Positive total count of source mono samples used as the timing denominator. Nonpositive returns []; finite safe-integer count is the caller's premise.
     */
    sourceSamples: number;
    /**
     * Inclusive film-frame start of the dialogue interval. Caller supplies a nonnegative safe integer; mapping does not independently validate it.
     */
    startFrame: number;
    /**
     * Exclusive film-frame end. A nonpositive difference from startFrame returns []; otherwise this boundary caps each admitted output interval.
     */
    endFrame: number;
  };
}
