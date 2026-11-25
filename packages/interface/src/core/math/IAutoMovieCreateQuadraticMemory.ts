import type { IAutoMovieQuadraticHeap } from "./IAutoMovieQuadraticHeap";

/**
 * Synchronous storage borrowing for the quadratic solver's typed-array
 * workspace.
 */
export namespace IAutoMovieCreateQuadraticMemory {
  /**
   * One workspace owner with at most one active borrow. Each borrow allocates
   * fresh zeroed storage, without factors or values from prior solves.
   */
  export type IResult = {
    /**
     * Invoke use once with a fresh heap and byte address zero, returning its
     * value unchanged. Invalid byte counts and nested borrows throw before
     * invocation; allocation and callback exceptions propagate. Finally
     * releases the owner's buffer reference on return or throw. The borrow ends
     * when use returns, even if T is a Promise. Copy values that must outlive
     * the callback; retained typed views keep their ordinary JS buffer alive.
     *
     * @param bytes Requested bytes before upward eight-byte alignment.
     * @param use Synchronous callback borrowing heap getters and views during
     *   this invocation.
     */
    withWorkspace<T>(
      bytes: number,
      use: (heap: IAutoMovieQuadraticHeap, address: number) => T,
    ): T;
  };
}
