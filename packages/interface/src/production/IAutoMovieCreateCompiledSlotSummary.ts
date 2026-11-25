import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePlacementSummary } from "./IAutoMoviePlacementSummary";

/** Incremental placement-point summary shared by compact population compilers. */
export namespace IAutoMovieCreateCompiledSlotSummary {
  /**
   * Caller-owned accumulator for world-space placement points in ascending slot
   * order.
   *
   * The engine folds exact axis extrema and an order-dependent binary64 running
   * mean. It does not validate point finiteness. Finish only after all admitted
   * points: returned vectors are the live accumulator vectors, so further
   * additions or mutations change previously returned results. An empty fold
   * retains positive-infinite minima, negative-infinite maxima and a zero
   * centroid; it is not a valid finite population summary.
   */
  export type IResult = {
    /**
     * Synchronously fold one borrowed finite world-space position in metres.
     * Its components are read immediately and no point reference is retained;
     * callers preserve ascending slot order for digest-stable centroid
     * arithmetic.
     */
    add: (point: IAutoMovieVector3) => void;

    /**
     * Return fresh wrappers around the live summary vectors. This does not
     * reset or seal the fold; the caller must stop adding and may release the
     * accumulator after taking ownership.
     */
    finish: () => IAutoMoviePlacementSummary;
  };
}
