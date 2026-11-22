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

  /**
   * The start of the first parallel part, waiting or being placed, that
   * holds a subject's next actions, film seconds; undefined when no such
   * part remains. Up to it the subject is known, holding their last placed
   * pose (the entry pose at a group's start), so only a read past it needs
   * that part placed (`demand`). Absent where the walk places in declaration
   * order only.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instant returned, what a law may read up to it and when the member is absent.
   * @evidence contracts/development/implementation.md#principled-implementation A subject's next action cannot begin before its part does, so up to that start the subject holds the pose its placed actions end on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan of the resolver's waiting parts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is placed by the query; a read past the start still asks `demand`.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the waiting parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the same waiting list `demand` places from.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the resolver's closure.
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
   * @evidence contracts/development/implementation.md#principled-implementation Within one exchange each actor commits to where the other was when its own action began, the reaction time covering the rest, so two parts of one group never wait on each other.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk up the parts being placed, one sibling test each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is placed by the query; whether the partner is placed first is the reader's `demand`.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the nesting depth times each group's parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the resolver's own part records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the resolver's closure.
   */
  meeting?: (subject: string) => number | undefined;

  /**
   * Place the waiting parallel part that holds an anchored intent, so a read
   * of that anchor finds it placed: "placed" when such a part was placed,
   * "none" when no waiting part holds it. Absent where the walk places in
   * declaration order only.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the call's effect, its results and when the member is absent.
   * @evidence contracts/development/implementation.md#principled-implementation The anchor's own action is placed before the action that reads it, the same depth-first order as `demand`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan for the part declaring the anchor, then its placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An anchor no waiting part holds is left to the caller's refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the waiting parts, plus the placement of the one part found.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Places through the same part bookkeeping as `demand`, so a part is placed once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the resolver's closure.
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
