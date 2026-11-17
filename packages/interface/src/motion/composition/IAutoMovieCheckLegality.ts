import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";
import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/**
 * Data and callback contracts shared by the CheckLegality operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieCheckLegality contracts used by packages/engine/src/composition/checkAutoMovieLegality.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieCheckLegality contract belongs to interface; packages/engine/src/composition/checkAutoMovieLegality.ts and packages/motions/src/perform/HumanPerformanceState.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieCheckLegality {
  /**
   * A production rule.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieCheckLegality.IRule keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieCheckLegality.IRule contract belongs to interface; packages/engine/src/composition/checkAutoMovieLegality.ts and packages/motions/src/perform/HumanPerformanceState.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IRule {
    /** Stable rule id. */
    id: string;

    /**
     * A violation text for this entry, or null when it holds.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieCheckLegality.IRule.check: A violation text for this entry, or null when it holds.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieCheckLegality.IRule.check is used through packages/engine/src/composition/checkAutoMovieLegality.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieCheckLegality.IRule.check is used through packages/engine/src/composition/checkAutoMovieLegality.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieCheckLegality.IRule.check is used through packages/engine/src/composition/checkAutoMovieLegality.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieCheckLegality.IRule.check is used through packages/engine/src/composition/checkAutoMovieLegality.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieCheckLegality.IRule.check is used through packages/engine/src/composition/checkAutoMovieLegality.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieCheckLegality.IRule.check is used through packages/engine/src/composition/checkAutoMovieLegality.ts.
     */
    check(
      entry: IAutoMovieScheduleEntry,
      schedule: IAutoMovieSchedule,
    ): string | null;
  }

  /**
   * One violation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieCheckLegality.IViolation keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieCheckLegality.IViolation contract belongs to interface; packages/engine/src/composition/checkAutoMovieLegality.ts and packages/motions/src/perform/HumanPerformanceState.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IViolation {
    /** The rule id. */
    rule: string;

    /** The entry's walk-order index. */
    entry: number;

    /** The rule's text. */
    detail: string;
  }
}
