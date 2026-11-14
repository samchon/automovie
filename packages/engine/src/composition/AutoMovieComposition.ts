import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/**
 * A time-scoped composition of intents: an immutable tree the schedule
 * resolver places on the film clock.
 *
 * - an intent is a leaf;
 * - `sequence` places its parts one after another;
 * - `parallel` starts its parts together and ends with the longest;
 * - `at` starts its part at an earlier part's anchor (its contact instant
 *   when the timing declares one, else its start) plus an offset, so a
 *   reaction aligns to the action it answers without coordinates or ordinals.
 *   It may name which instant of the anchor it means (`event`, with `index`
 *   where the name repeats) and which instant of its own part falls there
 *   (`align`), as BML's synchronisation constraints do; the anchor may then
 *   also be a cue track the laws declare, such as a dialogue's accents or a
 *   score's beats.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A time-scoped composition of intents: an immutable tree the schedule resolver places on the film clock) as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents A time-scoped composition of intents: an immutable tree the schedule resolver places on the film clock: type alias of 0 members (). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieComposition` in packages/engine/src/composition/AutoMovieComposition.ts; its surface is the 0 members listed and the text shows 25 other files naming it, mostly movies (20), packages/engine (4), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export type AutoMovieComposition =
  | AutoMovieComposition.IIntent
  | AutoMovieComposition.ISequence
  | AutoMovieComposition.IParallel
  | AutoMovieComposition.IAt;
/** Companion types of {@link AutoMovieComposition}. */
export namespace AutoMovieComposition {
  /**
   * A leaf.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: A leaf.
   * @evidence contracts/development/design.md#principled-representation Represents A leaf: interface of 2 members (`kind`, `intent`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IIntent` in packages/engine/src/composition/AutoMovieComposition.ts; its surface is the 2 members listed and the text shows 0 other files naming it, so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IIntent {
    /** Discriminator. */
    kind: "intent";

    /** The intent. */
    intent: IAutoMovieIntent;
  }

  /**
   * Parts one after another.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Parts one after another.
   * @evidence contracts/development/design.md#principled-representation Represents Parts one after another: interface of 2 members (`kind`, `parts`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `ISequence` in packages/engine/src/composition/AutoMovieComposition.ts; its surface is the 2 members listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface ISequence {
    /** Discriminator. */
    kind: "sequence";

    /** The parts in order. */
    parts: readonly AutoMovieComposition[];
  }

  /**
   * Parts starting together.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Parts starting together.
   * @evidence contracts/development/design.md#principled-representation Represents Parts starting together: interface of 2 members (`kind`, `parts`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IParallel` in packages/engine/src/composition/AutoMovieComposition.ts; its surface is the 2 members listed and the text shows 0 other files naming it, so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IParallel {
    /** Discriminator. */
    kind: "parallel";

    /** The parts. */
    parts: readonly AutoMovieComposition[];
  }

  /**
   * A part aligned to an earlier anchor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: A part aligned to an earlier anchor.
   * @evidence contracts/development/design.md#principled-representation Represents A part aligned to an earlier anchor: interface of 7 members (`kind`, `anchor`, `offset`, `event`, `index`, `align`, `part`); the offset is in seconds on the film clock. `event`, `index` and `align` are optional and each states its absence (the anchor's contact or start, occurrence 0, the part's own start); an `index` without an `event` is the only meaningless combination and the resolver checks it at runtime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAt` in packages/engine/src/composition/AutoMovieComposition.ts and read by `resolveAutoMovieSchedule`; `event`, `index` and `align` are the BML-style synchronisation the motions' performance composes with, so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; the three optional members refine one placement and do not encode alternatives; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IAt {
    /** Discriminator. */
    kind: "at";

    /** The anchor id of an intent placed earlier in walk order, or the name of a cue track. */
    anchor: string;

    /** Seconds after the anchor's instant; may be negative. */
    offset: number;

    /**
     * The anchor's named instant: one of its events, or `start` or `end`.
     * Absent, an intent's contact instant when its timing declares one, else
     * its start. Required when the anchor is a cue track.
     */
    event?: string;

    /** Which occurrence of `event`, from 0, where the anchor has several of that name; 0 when absent. */
    index?: number;

    /**
     * The instant of the part's own first intent that falls on the anchor's
     * instant: one of its events. Absent, the part starts there.
     */
    align?: string;

    /** The aligned part. */
    part: AutoMovieComposition;
  }

  /**
   * Anything a combinator accepts: a composition, an intent, or a chain's node.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Anything a combinator accepts: a composition, an intent, or a chain's node.
   * @evidence contracts/development/design.md#principled-representation Represents Anything a combinator accepts: a composition, an intent, or a chain's node: type alias of 0 members (). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `Part` in packages/engine/src/composition/AutoMovieComposition.ts; its surface is the 0 members listed and the text shows 53 other files naming it, mostly packages/human (28), packages/engine (11), test (6), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export type Part =
    | AutoMovieComposition
    | IAutoMovieIntent
    | { readonly node: AutoMovieComposition };

  /**
   * Normalize a part to a composition node.
   *
   * @param part The part.
   * @returns Its node.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Normalize a part to a composition node.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Normalize a part to a composition node) directly over its typed inputs (`part`) as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 5 lines and 3 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `part`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
   */
  export function of(part: Part): AutoMovieComposition {
    if ("node" in part) return part.node;
    if ("kind" in part) return part;
    return { kind: "intent", intent: part };
  }

  /**
   * Parts one after another.
   *
   * @param parts The parts.
   * @returns The sequence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Parts one after another.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Parts one after another) directly over its typed inputs (`parts`) as a single pass (map over parts), delegating to `parts.map`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 3 lines and 1 top-level statements that reuses `parts.map` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `parts`; the dominant cost is a single pass (map over parts), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
   */
  export function sequence(...parts: Part[]): ISequence {
    return { kind: "sequence", parts: parts.map(of) };
  }

  /**
   * Parts starting together.
   *
   * @param parts The parts.
   * @returns The parallel group.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Parts starting together.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Parts starting together) directly over its typed inputs (`parts`) as a single pass (map over parts), delegating to `parts.map`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 3 lines and 1 top-level statements that reuses `parts.map` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `parts`; the dominant cost is a single pass (map over parts), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
   */
  export function parallel(...parts: Part[]): IParallel {
    return { kind: "parallel", parts: parts.map(of) };
  }

  /**
   * A part aligned to an earlier anchor.
   *
   * @param anchor The anchor id.
   * @param part The part.
   * @param offset Seconds after the anchor's instant.
   * @param instant Which instant of the anchor is meant and which of the part falls there; the anchor's contact or start and the part's start when absent.
   * @returns The aligned part.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: A part aligned to an earlier anchor.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (A part aligned to an earlier anchor) directly over its typed inputs (`anchor`, `part`, `offset`, `instant`) as a fixed number of statements with no loop or recursion in the body, delegating to `of` and spreading the optional `instant` members onto the node; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 3 lines and 1 top-level statements that reuses `of` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `anchor`, `part`, `offset`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
   */
  export function at(
    anchor: string,
    part: Part,
    offset: number = 0,
    instant: Pick<IAt, "event" | "index" | "align"> = {},
  ): IAt {
    return { kind: "at", anchor, offset, part: of(part), ...instant };
  }
}
