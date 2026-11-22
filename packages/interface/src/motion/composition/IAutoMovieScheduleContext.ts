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
   * @evidence contracts/development/implementation.md#principled-implementation resolveAutoMovieSchedule supplies it as a depth-first topological order over the laws' reads: it places the first pending part holding the subject, and reports a cycle only while a part holding the subject is itself being placed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The resolver owns the parts' bookkeeping; a law names only the subject it reads and acts on the result, as placeDemandedHumanPerformer does.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cycle is returned to the law, which refuses it; the resolver never breaks it by a default order or a retry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each call scans the waiting parts at most twice, linear in their count, plus the placement of the one part it finds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A part is placed once: its status moves from pending to placing to placed and it leaves the waiting list, so a repeated demand for the same subject finds no pending part to place again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The resolver's closure retains only the walk's waiting parts and a depth counter; the list only shrinks, and both are dropped with the walk.
   */
  demand?: (subject: string) => IAutoMovieScheduleContext.Demand;
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
