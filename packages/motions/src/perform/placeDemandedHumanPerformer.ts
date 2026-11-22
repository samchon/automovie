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
 * the reader's. A person of the reader's own group whose part still waits
 * (`meeting`) is placed on demand the same way, so a strike reads the
 * partner's guard as the partner holds it, and what follows the strike is
 * planned from the strike as it is finally shown, the partner then read
 * live. Only where that part is itself waiting on this read (a defence
 * anchored on the strike that reads the defender, or two roles of a mutual
 * action that start together), the demand's cycle, is the partner read no
 * later than the end of their placed actions, the caller holding their last
 * placed pose: the fixed point of a cycle of reads within one exchange,
 * where each actor commits to what the other had done when its own action
 * was placed. Lazy evaluation of the reads, placed in demand order, needs no
 * pass that places anything again (a topological order over the reads, with
 * the freeze only on a detected cycle).
 * Across groups two parts that read each other are a cycle and are refused;
 * a person no waiting part holds is left to the caller's own refusal.
 *
 * @param self The performance state, its schedule readers set while an action is timed.
 * @param person The person read.
 * @param subject The person's subject.
 * @param seconds The film second read.
 * @param axis The refusal's axis, or a reader of it.
 * @param meeting Whether the person belongs to the reader's own parallel group with their part still waiting; such a person's cycle is held, not refused.
 * @returns Whether the read holds the person's last placed pose at the second; false for a partner whose cycle the caller holds.
 * @throws {HumanRefusal} When parts of different groups holding the two people read each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is known without placement, when placement is demanded, the partner within a group placed on demand and held only on a cycle, the cycle across groups and what is left to the caller.
 * @evidence contracts/development/implementation.md#principled-implementation A person's next action cannot begin before its part does, so up to that start the person holds their placed pose; past it the read person's waiting part is placed before the read answers, a depth-first topological order over the reads (lazy, demand-driven placement), a partner of the same group included; only a detected cycle within a group holds the partner at what they had placed, the fixed point of two reads that wait on each other.
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
  while (unplaced() && self.demand !== undefined) {
    const horizon: number | undefined = self.horizon?.(subject);
    if (horizon !== undefined && seconds <= horizon + 1e-9) return false;
    const found: IAutoMovieScheduleContext.Demand = self.demand(subject);
    if (found === "placed") continue;
    // A partner of the reader's own group whose part is itself waiting on
    // this read (a defence anchored on the strike that reads the defender)
    // is read as placed: the caller holds them at their last placed pose.
    if (found === "cycle" && meeting) return false;
    if (found === "cycle")
      throw new HumanRefusal({
        kind: "participant",
        axis: typeof axis === "function" ? axis() : axis,
        value: subject,
        feasible: null,
        reason: `reading ${subject} at ${seconds.toFixed(2)} s needs ${subject}'s next actions placed, and those read this action in turn: the two read each other`,
        fix: "put the two performers' actions in one parallel group, where each reads the other as far as the other's actions are placed, or let one read the other a reaction time earlier",
      });
    return false;
  }
  return false;
}

/** The refusal's axis, or a reader of it. */
type DemandAxis = string | (() => string);
