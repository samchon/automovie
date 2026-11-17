import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePlacementSummary } from "./IAutoMoviePlacementSummary";

/** Incremental placement-point summary shared by compact population compilers. */
export namespace IAutoMovieCreateCompiledSlotSummary {
  /**
   * Caller-owned accumulator for world-space placement points in ascending slot order.
   *
   * The engine folds exact axis extrema and an order-dependent binary64 running mean. It does not validate point finiteness. Finish only after all admitted points: returned vectors are the live accumulator vectors, so further additions or mutations change previously returned results. An empty fold retains positive-infinite minima, negative-infinite maxima and a zero centroid; it is not a valid finite population summary.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents world-metre inputs, ordered folding, empty state and the shared-vector lifetime after finish.
   * @evidence contracts/development/design.md#principled-representation Two operations represent one ordered fold; callers supply finite positions and positive admitted population counts because neither requirement is encoded or checked here.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Range and combined chunk/global summarizers need only add and finish; no input point history or placement callback is retained.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounds cover placement points rather than body geometry, and the explicit empty sentinel is not replaced by a fabricated zero-sized population.
   */
  export type IResult = {
    /** Synchronously fold one borrowed finite world-space position in metres. Its components are read immediately and no point reference is retained; callers preserve ascending slot order for digest-stable centroid arithmetic. */
    add: (point: IAutoMovieVector3) => void;

    /** Return fresh wrappers around the live summary vectors. This does not reset or seal the fold; the caller must stop adding and may release the accumulator after taking ownership. */
    finish: () => IAutoMoviePlacementSummary;
  };
}
