import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/** Half-open film intervals mapped to half-open integer-clock intervals. */
export namespace IAutoMovieProductionFrameIntervalToGridTicks {
  /**
   * Map one positive film-frame interval onto a destination integer clock, and
   * refuse an interval the clock cannot represent.
   *
   * Both boundaries go through {@link productionFrameBoundaryToGridTick} with
   * the same rounding, so adjacent intervals share their boundary tick and tile
   * the destination clock without gaps or overlaps. An interval whose end frame
   * is not after its start frame throws an `Error`, and so does one whose two
   * boundaries land on the same tick, because a caption or sound region with no
   * duration on its own clock is not a delivered interval. Every error of the
   * boundary map passes through.
   */
  export type IProps = {
    /** Inclusive first film frame, a nonnegative safe integer. */
    startFrame: number;
    /**
     * Exclusive film-frame boundary after the last included frame; must be a
     * safe integer greater than startFrame.
     */
    endFrame: number;
    /**
     * Exact rational film frames per second admitted by the shared boundary
     * converter.
     */
    frameRate: IAutoMovieProductionFrameRate;
    /** Positive safe integer rate of the destination clock, in ticks per second. */
    ticksPerSecond: number;
    /**
     * One rounding rule for both absolute endpoints: nearest with half upward,
     * floor or ceiling.
     */
    rounding: "nearest" | "floor" | "ceiling";
  };

  /**
   * New caller-owned destination interval with safe integer endpoints and end >
   * start. Both endpoints are rounded independently from their absolute film
   * boundaries with the same rule, preserving adjacency.
   */
  export type IResult = {
    /**
     * Inclusive destination tick, a nonnegative safe integer owned by the
     * returned interval.
     */
    start: number;
    /**
     * Exclusive destination tick, a safe integer strictly greater than start.
     * The duration in ticks is end - start.
     */
    end: number;
  };
}
