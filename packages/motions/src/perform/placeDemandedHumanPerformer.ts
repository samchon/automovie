import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleContext,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Place a person whose actions a later part of an open parallel group holds
 * before another action reads them at a second their placed actions do not
 * reach: the resolver's demand places that part first
 * (`IAutoMovieScheduleContext.demand`), repeatedly until the second is
 * covered or no waiting part holds the person. The placement is a
 * topological order over the reads, so a production need not declare the
 * read person's chain before the reader's. Two parts that read each other
 * are a cycle and are refused with the cycle named; a person no waiting
 * part holds is left to the caller's own refusal.
 *
 * @param self The performance state, its demand set while an action is timed.
 * @param person The person read.
 * @param subject The person's subject.
 * @param seconds The film second read.
 * @param axis The refusal's axis, or a reader of it.
 * @throws {HumanRefusal} When the parts holding the two people read each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when placement is demanded, what it places, the cycle and what is left to the caller.
 * @evidence contracts/development/implementation.md#principled-implementation Demand-driven placement: the read person's waiting part is placed before the read answers, a depth-first topological order over the reads; a part already being placed when demanded closes a cycle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the demand's answers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is read before it is placed; a cycle is refused, never broken by reading an entry pose.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most one demand per waiting part holding the person, each placing that part once.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Places through the resolver's own walk.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function placeDemandedHumanPerformer(
  self: IAutoMovieMotionHumanPerformanceState,
  person: IAutoMovieMotionHumanSegment.IPerson,
  subject: string,
  seconds: number,
  axis: DemandAxis,
): void {
  const unplaced: () => boolean = (): boolean =>
    self.resolving &&
    (self.intended.get(subject)?.length ?? 0) - person.segments.length > 0 &&
    seconds > (person.segments.at(-1)?.end ?? 0) + 1e-9;
  while (unplaced() && self.demand !== undefined) {
    const found: IAutoMovieScheduleContext.Demand = self.demand(subject);
    if (found === "placed") continue;
    if (found === "cycle")
      throw new HumanRefusal({
        kind: "participant",
        axis: typeof axis === "function" ? axis() : axis,
        value: subject,
        feasible: null,
        reason: `reading ${subject} at ${seconds.toFixed(2)} s needs ${subject}'s next actions placed, and those read this action in turn: the two read each other`,
        fix: "join the two performers' actions in one mutual action, or let one of them read the other a reaction time earlier",
      });
    return;
  }
}

/** The refusal's axis, or a reader of it. */
type DemandAxis = string | (() => string);
