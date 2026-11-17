import type { IAutoMovieComposition } from "@automovie/interface";

/**
 * Construct composition trees while preserving the supplied intent and node
 * references. These helpers do not resolve timing or validate anchor names.
 * Alignment offsets are seconds in the containing composition's clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents reference sharing, the seconds clock and the boundary between tree construction and schedule resolution.
 * @evidence contracts/development/design.md#principled-representation Returns the discriminated composition contracts owned by interface; sequence, parallel and anchor alignment remain distinct nodes, while temporal validity belongs to schedule resolution.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns only the four stateless construction helpers used by composition authors; the public node and part types are imported from interface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Accepts the shared part union and preserves caller nodes without consumer-specific alternatives, hidden state or casts that widen that union.
 */
export namespace AutoMovieComposition {
  /**
   * Normalize a part without copying an existing composition node.
   *
   * A node-bearing chain contributes its node, a composition contributes itself,
   * and a plain intent receives one intent wrapper. No schedule is resolved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which inputs retain identity, which receive a wrapper and that timing is not resolved here.
   * @evidence contracts/development/implementation.md#principled-implementation Tests the Part union's node and kind properties in that order; the remaining plain intent becomes an intent node without changing its content.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One normalization boundary is reused by sequence, parallel and at.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The branches represent the public part alternatives; no content-dependent timing, fixture identifier or fallback intent is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) time and additional space: existing nodes are returned directly and only a plain intent requires a new wrapper.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing chain and composition nodes are shared by reference. The helper does not memoize wrappers for plain intents.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned node and its referenced intent/tree; the namespace retains no node, resource handle or running work.
   */
  export function of(part: IAutoMovieComposition.Part): IAutoMovieComposition {
    if ("node" in part) return part.node;
    if ("kind" in part) return part;
    return { kind: "intent", intent: part };
  }

  /**
   * Build a sequence in the supplied order.
   *
   * The returned parts array is new. Existing child nodes remain shared;
   * durations, anchor validity and start times are resolved later.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents ordered children, new array ownership, shared child identity and deferred timing.
   * @evidence contracts/development/implementation.md#principled-implementation Normalizes each supplied part with of and preserves its position in the sequence; construction does not evaluate durations.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates all part-union handling to of and owns only the sequence node and ordered child array.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the caller's exact children and order, including an empty input; it inserts no scene-specific timing or placeholder child.
   * @evidence contracts/development/implementation.md#efficient-algorithms For n parts, normalization takes O(n) time and the child array takes O(n) space, with at most one wrapper for each plain intent.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work of preserves existing child references; only this sequence's array/node and necessary intent wrappers are newly allocated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned tree retains its children for the caller's chosen lifetime. No tree or array is stored by the namespace.
   */
  export function sequence(
    ...parts: IAutoMovieComposition.Part[]
  ): IAutoMovieComposition.ISequence {
    return { kind: "sequence", parts: parts.map(of) };
  }

  /**
   * Build a group whose children start together when scheduled.
   *
   * The returned parts array is new and retains input order and existing child
   * node references. Construction does not determine the group's duration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States simultaneous-start intent, retained order and child identity, and deferred duration.
   * @evidence contracts/development/implementation.md#principled-implementation Normalizes each part with of under the parallel discriminant; the schedule resolver owns the simultaneous-start semantics.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares the part normalization rule with sequence and at instead of interpreting intent variants here.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves each supplied child, including an empty group, without fixture-specific offsets or invented synchronization events.
   * @evidence contracts/development/implementation.md#efficient-algorithms For n parts, one normalization pass takes O(n) time and O(n) array/wrapper space; no child subtree is traversed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing composition and chain nodes are borrowed by reference, while the containing group and array are fresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the resulting group and transitive child references; this stateless constructor retains nothing between calls.
   */
  export function parallel(
    ...parts: IAutoMovieComposition.Part[]
  ): IAutoMovieComposition.IParallel {
    return { kind: "parallel", parts: parts.map(of) };
  }

  /**
   * Declare alignment of a part to an earlier anchor.
   *
   * The offset defaults to zero seconds in the composition clock. Omitted
   * instant fields remain absent for the schedule resolver to apply its
   * anchor-event and part-alignment defaults; this helper checks no anchor.
   *
   * @param anchor Anchor identifier resolved by the scheduler.
   * @param part Child to normalize, preserving an existing node's identity.
   * @param offset Seconds after the selected anchor instant.
   * @param instant Optional anchor event/index and child alignment instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents seconds, zero offset, deferred defaults/anchor validation and child reference sharing.
   * @evidence contracts/development/implementation.md#principled-implementation Creates the at discriminant, normalizes its child with of and copies the supplied instant selectors unchanged; schedule resolution owns temporal admission.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps node construction separate from anchor lookup and timing, sharing only the existing part normalizer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The only default is the contract's zero-second offset; no anchor is synthesized and no timing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) work and additional space for the fixed at fields and optional plain-intent wrapper; the child subtree is not copied.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing child nodes remain shared; at nodes are fresh because each call describes its own anchor, offset and instant selectors.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller retains the new alignment node and child reference. No cache, handle or background task is acquired.
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
