/**
 * A pure counter-based random stream; made by `createAutoMovieRandom`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A pure counter-based random stream; made by `createAutoMovieRandom`) and documents 5 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents A pure counter-based random stream; made by `createAutoMovieRandom`: interface of 5 members (`seed`, `block`, `uint32`, `float`, `stream`). It has no optional member, so no absent-value state combines with another. 1 member is readonly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieRandom` in packages/engine/src/random/IAutoMovieRandom.ts; its surface is the 5 members listed and the text shows 3 other files naming it, mostly packages/engine (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export interface IAutoMovieRandom {
  /** The stream's seed, lowercase. */
  readonly seed: string;

  /**
   * The four unsigned 32-bit words of one index's block.
   *
   * @param index A nonnegative safe integer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: The four unsigned 32-bit words of one index's block.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: The four unsigned 32-bit words of one index's block.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  block(index: number): [number, number, number, number];

  /**
   * One unsigned 32-bit integer per index: the block's first word.
   *
   * @param index A nonnegative safe integer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: One unsigned 32-bit integer per index: the block's first word.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: One unsigned 32-bit integer per index: the block's first word.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  uint32(index: number): number;

  /**
   * One uniform double in [0, 1) per index, with 53 random bits.
   *
   * @param index A nonnegative safe integer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: One uniform double in [0, 1) per index, with 53 random bits.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: One uniform double in [0, 1) per index, with 53 random bits.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  float(index: number): number;

  /**
   * An independent stream keyed by this seed and stable ids, such as a
   * subject's or a channel's name; never an ordinal.
   *
   * @param ids Stable ids, outermost first.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: An independent stream keyed by this seed and stable ids, such as a subject's or a channel's name; never an ordinal.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: An independent stream keyed by this seed and stable ids, such as a subject's or a channel's name; never an ordinal.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  stream(...ids: string[]): IAutoMovieRandom;
}
