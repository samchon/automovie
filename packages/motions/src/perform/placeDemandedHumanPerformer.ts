import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleContext,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Place a person a waiting part of an open parallel group holds before a
 * read of them at a second their placed actions do not cover.
 *
 * Up to the start of that part (`IAutoMovieScheduleContext.horizon`) the
 * person is known, holding the pose their placed actions end on, so nothing
 * is placed; a read past it has the resolver's demand place that part
 * (`IAutoMovieScheduleContext.demand`), repeatedly until the second is
 * covered or no waiting part holds the person, a topological order over the
 * reads, so a production need not declare the read person's chain before
 * the reader's. A person of the reader's own group (`meeting`) is read no
 * later than the reader's own start, as placed there where their placed
 * actions reach it, and otherwise at their last placed pose held there, the
 * frozen meeting, without placing their part: within one exchange each actor
 * commits to where the other was when its own action began, and the other's
 * part may itself wait on this action (a defence anchored on the strike that
 * reads the defender, or two roles of a mutual action that start together).
 * Across groups two parts that read each other are a cycle and are refused;
 * a person no waiting part holds is left to the caller's own refusal.
 *
 * @param self The performance state, its schedule readers set while an action is timed.
 * @param person The person read.
 * @param subject The person's subject.
 * @param seconds The film second read.
 * @param axis The refusal's axis, or a reader of it.
 * @param meeting Whether the person belongs to the reader's own parallel group.
 * @returns Whether the read holds the person's last placed pose at the second.
 * @throws {HumanRefusal} When parts of different groups holding the two people read each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is known without placement, when placement is demanded, the frozen meeting within a group, the cycle across groups and what is left to the caller.
 * @evidence contracts/development/implementation.md#principled-implementation A person's next action cannot begin before its part does, so up to that start the person holds their placed pose; past it the read person's waiting part is placed before the read answers, a depth-first topological order over the reads; within a group, two actions that start together commit to where the other was at that start.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One horizon check and one loop over the demand's answers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is read past what is placed except a held pose; a part is placed whole, once, never resumed, and a cycle across groups is refused, never broken by a default order.
 * @evidence contracts/development/implementation.md#efficient-algorithms One horizon scan, then at most one demand per waiting part holding the person, each placing that part once.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Places through the resolver's own walk.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function placeDemandedHumanPerformer(
  self: IAutoMovieMotionHumanPerformanceState,
  person: IAutoMovieMotionHumanSegment.IPerson,
  subject: string,
  seconds: number,
  axis: DemandAxis,
  meeting: boolean,
): boolean {
  const unplaced: () => boolean = (): boolean =>
    self.resolving &&
    (self.intended.get(subject)?.length ?? 0) - person.segments.length > 0 &&
    seconds > (person.segments.at(-1)?.end ?? 0) + 1e-9;
  // A partner of the reader's own group whose placed actions do not reach the
  // reader's start holds their last placed pose there: their part may wait
  // on this very action (a defence on the strike that reads it), so placing
  // it now could need this action placed first.
  if (meeting) return unplaced();
  while (unplaced() && self.demand !== undefined) {
    const horizon: number | undefined = self.horizon?.(subject);
    if (horizon !== undefined && seconds <= horizon + 1e-9) return false;
    const found: IAutoMovieScheduleContext.Demand = self.demand(subject);
    if (found === "placed") continue;
    if (found === "cycle")
      throw new HumanRefusal({
        kind: "participant",
        axis: typeof axis === "function" ? axis() : axis,
        value: subject,
        feasible: null,
        reason: `reading ${subject} at ${seconds.toFixed(2)} s needs ${subject}'s next actions placed, and those read this action in turn: the two read each other`,
        fix: "put the two performers' actions in one parallel group, where each reads the other no later than its own start, or let one read the other a reaction time earlier",
      });
    return false;
  }
  return false;
}

/** The refusal's axis, or a reader of it. */
type DemandAxis = string | (() => string);
