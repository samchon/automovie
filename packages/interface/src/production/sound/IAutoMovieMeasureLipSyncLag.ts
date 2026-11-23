/** Inputs and result of measuring a phoneme-driven line's lip-sync lag. */
export namespace IAutoMovieMeasureLipSyncLag {
  /**
   * The mouth and level series of one line over the same window of film frames.
   *
   * The window is the line's speech span widened by `W = ceil(0.25 × fps)`
   * frames on each side and clipped to the film. Engine's
   * `measureAutoMovieLipSyncLag` refuses series of different lengths,
   * non-finite values and a rate that is not positive.
   */
  export interface IProps {
    /**
     * Per frame, the mouth value handed to the drawing: jaw opening in
     * millimetres, or the `jawOpen` channel weight.
     */
    mouth: ArrayLike<number>;

    /** Per frame, the line's frame level as a linear RMS amplitude. */
    level: ArrayLike<number>;

    /** Film frames per second. */
    fps: number;
  }

  /**
   * The lag with the highest normalized cross-correlation and its verdict.
   *
   * Lag `k` pairs mouth frame `t` with level frame `t + k`, so a positive lag
   * means the sound comes later than the mouth. The line passes when the lag
   * lies from −45 ms to +125 ms, the detectability thresholds of ITU-R
   * BT.1359-1 for sound ahead of and behind the picture, and fails outside
   * them. It is inconclusive when either series is constant over the window or
   * the peak correlation is below the minimum; the lag fields then still report
   * the best lag found, or 0 for a constant series.
   */
  export interface IResult {
    /** The lag in frames, from −W to W. */
    lagFrames: number;

    /** The lag in milliseconds, `lagFrames × 1000 / fps`. */
    lagMilliseconds: number;

    /**
     * The peak normalized cross-correlation, in [−1, 1]; 0 for a constant
     * series.
     */
    correlation: number;

    /** Whether the lag lies inside the detectability window. */
    verdict: "pass" | "fail" | "inconclusive";
  }
}
