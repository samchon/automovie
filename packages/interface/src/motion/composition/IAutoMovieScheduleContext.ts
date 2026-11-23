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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the call's effect, its three results and when the member is absent.
   */
  demand?: (subject: string) => IAutoMovieScheduleContext.Demand;

  /**
   * The start of the first parallel part, waiting or being placed, that
   * holds a subject's next actions, film seconds; undefined when no such
   * part remains. Up to it the subject is known, holding their last placed
   * pose (the entry pose at a group's start), so only a read past it needs
   * that part placed (`demand`). Absent where the walk places in declaration
   * order only.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instant returned, what a law may read up to it and when the member is absent.
   */
  horizon?: (subject: string) => number | undefined;

  /**
   * The start of the parallel group a subject shares with the action being
   * timed, film seconds, when a part of that group other than the reader's
   * own holds the subject's actions; undefined otherwise. A law reads such a
   * partner no later than its own action's start: as placed there where the
   * partner acted first inside the group, and at their last placed pose where
   * the partner's part is itself being placed (two actions that start
   * together and read each other). Absent where the walk places in
   * declaration order only.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instant returned, when it is returned, the reading it marks and when the member is absent.
   */
  meeting?: (subject: string) => number | undefined;

  /**
   * Place the waiting parallel part that holds an anchored intent, so a read
   * of that anchor finds it placed: "placed" when such a part was placed,
   * "none" when no waiting part holds it. Absent where the walk places in
   * declaration order only.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the call's effect, its results and when the member is absent.
   */
  demandAnchor?: (anchor: string) => IAutoMovieScheduleContext.Demand;
}

/** Companion types of `IAutoMovieScheduleContext`. */
export namespace IAutoMovieScheduleContext {
  /**
   * What a demand for a subject's placement found (`IAutoMovieScheduleContext.demand`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three outcomes and the member that returns them.
   * @evidence contracts/development/design.md#principled-representation A closed string union of the three outcomes, so no other result can be returned.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieSchedule returns it and placeDemandedHumanPerformer branches on it; one literal per outcome it distinguishes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal names the outcome, with no optional fields to combine.
   */
  export type Demand = "placed" | "cycle" | "none";
}
