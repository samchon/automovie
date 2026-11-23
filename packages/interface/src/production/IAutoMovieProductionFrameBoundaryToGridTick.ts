import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/** Explicit rounding request from a rational film boundary to an integer clock. */
export namespace IAutoMovieProductionFrameBoundaryToGridTick {
  /**
   * Map one non-negative film-frame boundary onto a destination integer clock,
   * such as audio samples or WebVTT milliseconds.
   *
   * The boundary of frame `f` at rate `n/d` lies at `f·d/n` seconds, so its
   * tick on a `ticksPerSecond` clock is `f·d·ticksPerSecond / n`, rounded once.
   * `nearest` sends an exact half tick upward, and `floor` and `ceiling` are
   * the caller's explicit choices. A frame that is not a non-negative safe
   * integer, a clock rate that is not a positive safe integer, an invalid frame
   * rate, and a tick beyond `Number.MAX_SAFE_INTEGER` each throw an `Error`.
   */
  export type IProps = {
    /**
     * Film boundary index, a nonnegative safe integer. Zero is the clock
     * origin; the end boundary of an interval is valid even though it is not a
     * played frame.
     */
    frame: number;
    /**
     * Exact positive rational frames per second. canonicalProductionFrameRate
     * validates safe integer numerator/denominator and reduces the ratio.
     */
    frameRate: IAutoMovieProductionFrameRate;
    /**
     * Positive safe integer destination ticks per second, such as the audio
     * sample rate or 1000 for milliseconds.
     */
    ticksPerSecond: number;
    /**
     * Resolution of a boundary between ticks: nearest rounds an exact half
     * upward; floor and ceiling select their mathematical bounds.
     */
    rounding: "nearest" | "floor" | "ceiling";
  };
}
