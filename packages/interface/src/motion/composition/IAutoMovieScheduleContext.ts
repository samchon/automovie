import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/**
 * What the laws see while an intent is placed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the proposed film start and borrowed live walk-order entries.
 * @evidence contracts/development/design.md#principled-representation start is film seconds; entries excludes the current draft and is a growing array, not a frozen historical snapshot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSchedulePlace supplies this context to timing, until, outcome and state; laws must copy if they need a snapshot.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The context exposes only already placed entries, making declaration-order dependence explicit.
 */
export interface IAutoMovieScheduleContext {
  /** Proposed start on the film clock, seconds from composition origin zero; during align this is the anchor instant plus offset. */
  start: number;

  /** Borrowed live walk-order array, excluding the entry currently being timed or decided; take an explicit copy for a snapshot. */
  entries: readonly IAutoMovieScheduleEntry[];

  /**
   * Place a subject's actions that a parallel group declares but has not
   * placed yet, so a law that reads that subject at a later second finds it
   * placed: "placed" when a waiting part was placed, "cycle" when the only
   * part holding the subject's actions is itself waiting on this read (two
   * parts that read each other), "none" when no part holds any. Absent
   * where the walk places in declaration order only.
   */
  demand?: (subject: string) => IAutoMovieScheduleContext.Demand;
}

/** Companion types of `IAutoMovieScheduleContext`. */
export namespace IAutoMovieScheduleContext {
  /** What a demand for a subject's placement found (`IAutoMovieScheduleContext.demand`). */
  export type Demand = "placed" | "cycle" | "none";
}
