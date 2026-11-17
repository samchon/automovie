import type { IAutoMovieComposition } from "./IAutoMovieComposition";

/**
 * Fluent view of a composition whose combinators return another instance of
 * the same class. AutoMovieChain stores node by reference and never freezes
 * the tree, so callers must keep shared nodes stable while reusing a chain.
 * Production subclasses preserve their vocabulary through the this result;
 * subclasses with additional constructor arguments customize derive in the
 * implementation class. Timing and anchor admission belongs to the schedule
 * resolver, not the chain constructor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains shared-node ownership, subclass-preserving results and deferred schedule admission.
 * @evidence contracts/development/design.md#principled-representation A readonly node reference and polymorphic combinators express persistent composition building without asserting deep immutability.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the public chain view implemented by AutoMovieChain; construction and protected derivation remain implementation details.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Sequence and parallel building consume the existing Part union and add no action vocabulary or implementation dependency.
 */
export interface IAutoMovieChain {
  /** Borrowed composition reference; readonly prevents reassignment through this view, not mutation of the tree. */
  readonly node: IAutoMovieComposition;

  /**
   * Returns a new same-class chain that places these parts after this node.
   * An existing sequence head is flattened; following nested sequences are
   * preserved. With no parts, a sequence wrapper or copy is still returned.
   * Existing child nodes are shared, and constructor/derive errors propagate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieChain.next: Returns a new same-class chain that places these parts after this node. An existing sequence head is flattened; following nested sequences are preserved. With no parts, a sequence wrapper or copy is still returned. Existing child nodes are shared, and constructor/derive errors propagate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieChain.next is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieChain.next is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieChain.next is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieChain.next is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieChain.next is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieChain.next is used through packages/engine/src/composition/AutoMovieChain.ts.
   */
  next(...parts: IAutoMovieComposition.Part[]): this;

  /**
   * Returns a new same-class chain whose parts begin at the same film instant.
   * An existing parallel head is flattened; following groups stay nested.
   * Empty arguments still return a parallel wrapper or copy sharing the
   * existing child nodes. Constructor/derive errors propagate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieChain.with: Returns a new same-class chain whose parts begin at the same film instant. An existing parallel head is flattened; following groups stay nested. Empty arguments still return a parallel wrapper or copy sharing the existing child nodes. Constructor/derive errors propagate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieChain.with is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieChain.with is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieChain.with is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieChain.with is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieChain.with is used through packages/engine/src/composition/AutoMovieChain.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieChain.with is used through packages/engine/src/composition/AutoMovieChain.ts.
   */
  with(...parts: IAutoMovieComposition.Part[]): this;
}
