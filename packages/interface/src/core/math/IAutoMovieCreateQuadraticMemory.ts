import type { IAutoMovieQuadraticHeap } from "./IAutoMovieQuadraticHeap";

/**
 * Synchronous storage borrowing for the quadratic solver's typed-array workspace.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Synchronous storage borrowing for the quadratic solver's typed-array workspace. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation One byte-addressed borrow operation carries the existing heap views and a caller-chosen synchronous result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The memory factory owns buffer lifetime while numerical kernels own layout and copied output.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Generic result typing does not revoke retained views or make asynchronous callbacks safe.
 */
export namespace IAutoMovieCreateQuadraticMemory {
  /**
   * One workspace owner with at most one active borrow. Each borrow allocates fresh zeroed storage, without factors or values from prior solves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines byte addressing, synchronous lifetime, recursive refusal, exception propagation and retained-view limitations.
   * @evidence contracts/development/design.md#principled-representation Requests are positive integer byte counts at most 2^32-1; the memory owner rounds to eight-byte alignment and supplies address zero.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The numerical kernel uses one withWorkspace operation and the existing heap contract; generic T carries the caller's extracted result without imposing a numerical layout.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Heap getters reject post-callback access but retained typed arrays cannot be revoked; the type does not prevent returning a Promise or claim memory isolation.
   */
  export type IResult = {
    /**
     * Invoke use once with a fresh heap and byte address zero, returning its value unchanged. Invalid byte counts and nested borrows throw before invocation; allocation and callback exceptions propagate. Finally releases the owner's buffer reference on return or throw. The borrow ends when use returns, even if T is a Promise. Copy values that must outlive the callback; retained typed views keep their ordinary JS buffer alive.
     *
     * @param bytes Requested bytes before upward eight-byte alignment.
     * @param use Synchronous callback borrowing heap getters and views during this invocation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines byte alignment, callback invocation/lifetime, propagated errors, return transfer and retained-view limitations.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature specifies borrowing semantics; createAutoMovieQuadraticMemory owns allocation and finally release.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No method body exists here; the memory factory owns admission, allocation, callback and cleanup phases.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The declaration executes no size fallback, recursive borrow or callback branch; the factory enforces the stated refusal policy.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The implementation accounts for byte-count allocation/zeroing and callback cost; the generic return signature chooses no algorithm.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration owns no pool or retained workspace; fresh storage per borrow is a contractual obligation of the producer.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Runtime buffer lifetime belongs to the factory's active borrow; this signature acquires no storage and explicitly requires copying retained results.
     */
    withWorkspace<T>(
      bytes: number,
      use: (heap: IAutoMovieQuadraticHeap, address: number) => T,
    ): T;
  };
}
