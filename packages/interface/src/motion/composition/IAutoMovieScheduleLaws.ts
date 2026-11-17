import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { IAutoMovieIntentTiming } from "./IAutoMovieIntentTiming";
import type { IAutoMovieScheduleAlignment } from "./IAutoMovieScheduleAlignment";
import type { IAutoMovieScheduleContext } from "./IAutoMovieScheduleContext";
import type { IAutoMovieScheduleCue } from "./IAutoMovieScheduleCue";
import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/**
 * The production's pure laws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains synchronous pure callbacks, borrowed growing entries, callback absence and retained opaque state.
 * @evidence contracts/development/design.md#principled-representation timing is mandatory; optional align and until are required only by matching composition features. Missing required laws throw during placement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieSchedule holds these laws only during resolution; outcome and state run on the draft before it enters context.entries.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pre-existing unknown state is deliberately uninterpreted production data; callers own its schema and immutability, and the engine retains it by reference.
 */
export interface IAutoMovieScheduleLaws {
  /**
   * Tracks of named instants that belong to no intent, by track name: a
   * dialogue's line starts and accents, a score's beats. A part aligns to
   * one and an intent is cut on one as on an anchored intent's events.
   */
  cues?: Readonly<Record<string, readonly IAutoMovieScheduleCue[]>>;

  /**
   * The instants of a track the laws compute from what is placed so far,
   * read when an `at` names neither an anchor nor a track of `cues`: the
   * hits a struck person has received, known only once their strikers
   * are placed. Undefined for a name the laws do not know, which the
   * walk then refuses as a missing anchor. Pure in the entries given.
   *
   * @param of The track's name.
   * @param entries Entries placed so far, in walk order.
   * @returns The instants, or undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieScheduleLaws.instants: The instants of a track the laws compute from what is placed so far, read when an `at` names neither an anchor nor a track of `cues`: the hits a struck person has received, known only once their strikers are placed. Undefined for a name the laws do not know, which the walk then refuses as a missing anchor. Pure in the entries given.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieScheduleLaws.instants is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieScheduleLaws.instants is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieScheduleLaws.instants is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieScheduleLaws.instants is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieScheduleLaws.instants is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieScheduleLaws.instants is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   */
  instants?(
    of: string,
    entries: readonly IAutoMovieScheduleEntry[],
  ): readonly IAutoMovieScheduleCue[] | undefined;

  /**
   * The second an intent must start at for its named instant to fall on a
   * target second. It places nothing: the intent is timed again when it
   * is placed at the second returned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieScheduleLaws.align: The second an intent must start at for its named instant to fall on a target second. It places nothing: the intent is timed again when it is placed at the second returned.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieScheduleLaws.align is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieScheduleLaws.align is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieScheduleLaws.align is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieScheduleLaws.align is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieScheduleLaws.align is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieScheduleLaws.align is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   */
  align?(
    intent: IAutoMovieIntent,
    instant: string,
    target: number,
    context: IAutoMovieScheduleAlignment,
  ): number;

  /**
   * Duration and contact of an intent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieScheduleLaws.timing: Duration and contact of an intent.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieScheduleLaws.timing is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieScheduleLaws.timing is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieScheduleLaws.timing is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieScheduleLaws.timing is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieScheduleLaws.timing is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieScheduleLaws.timing is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   */
  timing(
    intent: IAutoMovieIntent,
    context: IAutoMovieScheduleContext,
  ): IAutoMovieIntentTiming;

  /**
   * The share of an intent's duration at which a `proximity` cut happens,
   * found from the production's motion, or undefined when it never does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieScheduleLaws.until: The share of an intent's duration at which a `proximity` cut happens, found from the production's motion, or undefined when it never does.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieScheduleLaws.until is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieScheduleLaws.until is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieScheduleLaws.until is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieScheduleLaws.until is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieScheduleLaws.until is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieScheduleLaws.until is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   */
  until?(
    intent: IAutoMovieIntent,
    placed: {
      /** Proposed start in film seconds. */
      start: number;
      /** Full uncut duration in seconds. */
      duration: number;
    },
    context: IAutoMovieScheduleContext,
  ): number | undefined;

  /**
   * Outcome class for the draft entry before it is appended; absent callback or undefined result omits outcome. The draft contains no outcome or state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieScheduleLaws.outcome: Outcome class for the draft entry before it is appended; absent callback or undefined result omits outcome. The draft contains no outcome or state.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieScheduleLaws.outcome is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieScheduleLaws.outcome is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieScheduleLaws.outcome is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieScheduleLaws.outcome is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieScheduleLaws.outcome is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieScheduleLaws.outcome is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   */
  outcome?(
    entry: IAutoMovieScheduleEntry,
    context: IAutoMovieScheduleContext,
  ): string | undefined;

  /**
   * Production-owned state for the same draft passed to outcome, without outcome attached. Undefined omits state; other values are retained by reference and are not deep-frozen. The engine does not interpret their shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieScheduleLaws.state: Production-owned state for the same draft passed to outcome, without outcome attached. Undefined omits state; other values are retained by reference and are not deep-frozen. The engine does not interpret their shape.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieScheduleLaws.state is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieScheduleLaws.state is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieScheduleLaws.state is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieScheduleLaws.state is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieScheduleLaws.state is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieScheduleLaws.state is used through packages/engine/src/composition/AutoMovieScheduleCut.ts.
   */
  state?(
    entry: IAutoMovieScheduleEntry,
    context: IAutoMovieScheduleContext,
  ): unknown;
}
