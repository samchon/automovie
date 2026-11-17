import type { IAutoMovieComposition } from "@automovie/interface";
/** Companion types of {@link AutoMovieComposition}. */
export namespace AutoMovieComposition {

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
  export function of(part: IAutoMovieComposition.Part): IAutoMovieComposition {
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
  export function sequence(...parts: IAutoMovieComposition.Part[]): IAutoMovieComposition.ISequence {
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
  export function parallel(...parts: IAutoMovieComposition.Part[]): IAutoMovieComposition.IParallel {
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
    part: IAutoMovieComposition.Part,
    offset: number = 0,
    instant: Pick<IAutoMovieComposition.IAt, "event" | "index" | "align"> = {},
  ): IAutoMovieComposition.IAt {
    return { kind: "at", anchor, offset, part: of(part), ...instant };
  }
}
