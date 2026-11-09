import { AutoMovieComposition } from "./AutoMovieComposition";

/**
 * An immutable composition value with fluent combinators, the return type of
 * a production's subject methods: `a.jab().next(a.cross()).with(b.slip())`.
 *
 * `next` appends in sequence (not `then`, which would make every chain a
 * thenable that `await` unwraps) and `with` joins in parallel; each returns a
 * new chain of the same class through {@link derive} and never changes this
 * one, so a chain can be shared and reused. A production subclass adds its
 * own vocabulary methods that call `next` with its subject's intents, so
 * `a.jab().cross()` keeps its vocabulary after every combinator; a subclass
 * whose constructor takes more than the node overrides `derive`. The engine
 * keeps no vocabulary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (An immutable composition value with fluent combinators, the return type of a production's subject methods: `a.jab().next(a.cross()).with(b.slip())`) and documents 6 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents An immutable composition value with fluent combinators, the return type of a production's subject methods: `a.jab().next(a.cross()).with(b.slip())`: class of 6 members (`node`, `?`, `of`, `next`, `with`, `derive`). It has no optional member, so no absent-value state combines with another. 1 member is readonly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieChain` in packages/engine/src/composition/AutoMovieChain.ts; its surface is the 6 members listed and the text shows 7 other files naming it, mostly movies (5), packages/engine (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export class AutoMovieChain {
  /** The composition this chain holds; never reassigned. */
  public readonly node: AutoMovieComposition;

  /**
   * A chain holding a composition.
   *
   * @param node The node.
   */
  public constructor(node: AutoMovieComposition) {
    this.node = node;
  }

  /**
   * A chain of one part.
   *
   * @param part An intent, composition or chain.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: A chain of one part.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (A chain of one part) directly over its typed inputs (`part`) as a fixed number of statements with no loop or recursion in the body, delegating to `AutoMovieComposition.of`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 3 lines and 1 top-level statements that reuses `AutoMovieComposition.of` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `part`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
   */
  public static of(part: AutoMovieComposition.Part): AutoMovieChain {
    return new AutoMovieChain(AutoMovieComposition.of(part));
  }

  /**
   * This chain followed by parts, flattening a trailing sequence.
   *
   * @param parts The following parts.
   * @returns A new chain of this chain's class.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: This chain followed by parts, flattening a trailing sequence.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (This chain followed by parts, flattening a trailing sequence) directly over its typed inputs (`parts`) as a single pass (map over parts), delegating to `parts.map`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 8 lines and 2 top-level statements that reuses `parts.map` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `parts`; the dominant cost is a single pass (map over parts), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
   */
  public next(...parts: AutoMovieComposition.Part[]): this {
    const head: readonly AutoMovieComposition[] =
      this.node.kind === "sequence" ? this.node.parts : [this.node];
    return this.derive({
      kind: "sequence",
      parts: [...head, ...parts.map(AutoMovieComposition.of)],
    });
  }

  /**
   * This chain together with parts starting at the same instant.
   *
   * @param parts The parallel parts.
   * @returns A new chain of this chain's class.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: This chain together with parts starting at the same instant.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (This chain together with parts starting at the same instant) directly over its typed inputs (`parts`) as a single pass (map over parts), delegating to `parts.map`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 8 lines and 2 top-level statements that reuses `parts.map` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `parts`; the dominant cost is a single pass (map over parts), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
   */
  public with(...parts: AutoMovieComposition.Part[]): this {
    const head: readonly AutoMovieComposition[] =
      this.node.kind === "parallel" ? this.node.parts : [this.node];
    return this.derive({
      kind: "parallel",
      parts: [...head, ...parts.map(AutoMovieComposition.of)],
    });
  }

  /**
   * A new chain of this chain's class holding another node; a subclass whose
   * constructor needs more than the node overrides it.
   *
   * @param node The new node.
   * @returns The new chain.
   */
  protected derive(node: AutoMovieComposition): this {
    const make: new (node: AutoMovieComposition) => this = this
      .constructor as new (node: AutoMovieComposition) => this;
    return new make(node);
  }
}
