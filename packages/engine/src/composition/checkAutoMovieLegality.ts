import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/**
 * Check a schedule against a production's rules: each rule's predicate reads
 * one entry in the whole schedule and returns a violation text or null. The
 * engine applies every rule to every entry and reports, never repairs.
 *
 * @param schedule The resolved schedule.
 * @param rules The production's rules.
 * @returns Every violation, by entry then rule order.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Check a schedule against a production's rules: each rule's predicate reads one entry in the whole schedule and returns a violation text or null) and documents parameters `schedule`, `rules`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Check a schedule against a production's rules: each rule's predicate reads one entry in the whole schedule and returns a violation text or null) directly over its typed inputs (`schedule`, `rules`) as nested iteration of depth 2 (for-of over schedule.entries; for-of over rules), delegating to `rule.check`, `violations.push`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 10 lines and 3 top-level statements that reuses `rule.check`, `violations.push` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `schedule`, `rules`; the dominant cost is nested iteration of depth 2 (for-of over schedule.entries; for-of over rules), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function checkAutoMovieLegality(
  schedule: IAutoMovieSchedule,
  rules: readonly checkAutoMovieLegality.IRule[],
): checkAutoMovieLegality.IViolation[] {
  const violations: checkAutoMovieLegality.IViolation[] = [];
  for (const entry of schedule.entries)
    for (const rule of rules) {
      const detail: string | null = rule.check(entry, schedule);
      if (detail !== null)
        violations.push({ rule: rule.id, entry: entry.index, detail });
    }
  return violations;
}
/**
 * Companion types of {@link checkAutoMovieLegality}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 2 members (`IRule`, `IViolation`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `checkAutoMovieLegality` in packages/engine/src/composition/checkAutoMovieLegality.ts; its surface is the 2 members listed and the text shows 4 other files naming it, mostly movies (2), packages/engine (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace checkAutoMovieLegality {
  /** A production rule. */
  export interface IRule {
    /** Stable rule id. */
    id: string;

    /** A violation text for this entry, or null when it holds. */
    check(
      entry: IAutoMovieSchedule.IEntry,
      schedule: IAutoMovieSchedule,
    ): string | null;
  }

  /** One violation. */
  export interface IViolation {
    /** The rule id. */
    rule: string;

    /** The entry's walk-order index. */
    entry: number;

    /** The rule's text. */
    detail: string;
  }
}
