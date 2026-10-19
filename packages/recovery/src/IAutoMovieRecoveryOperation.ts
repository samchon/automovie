/**
 * Terminal outcomes for one synchronous source observation or saved reconstruction.
 * Complete describes declared domain coverage, never source likeness, embedding,
 * smoothness or a surface-error certificate. Partial retains every returned valid
 * primitive and names unsupported domains. Refused has no admitted operation;
 * failed reports an admitted operation that could not finish. Cancellation never
 * publishes a value. Callers own all values and may discard them after inspection.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union separates terminal state from geometry quality and preserves explicit failure effects.
 * @evidence contracts/common.md#clear-and-simple-design The same operation envelope is used by memory consumers and command hosts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No quality miss is silently upgraded to complete and no source surface is substituted.
 * @evidence contracts/common.md#meaningful-documentation Documents state scope, ownership, operation version and diagnostic meaning.
 * @evidence contracts/performance.md#efficient-algorithms The type performs no traversal; producing functions document their costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The erased record coordinates no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Values and diagnostic arrays transfer to the caller; the record owns no handle.

 */
export namespace IAutoMovieRecoveryOperation {
  /**
   * One completed attempt, qualified only for the declared operation and policy.
 *
 * @evidence contracts/common.md#principled-implementation Literal terminal tags make value presence and failure effects explicit.
 * @evidence contracts/common.md#clear-and-simple-design One union prevents an absent value from being presented as a complete artifact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unqualified visual fidelity is not represented as an acceptance boolean.
 * @evidence contracts/common.md#meaningful-documentation Each arm states whether a usable value exists.
 * @evidence contracts/performance.md#efficient-algorithms This structural type performs no arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work No runtime cache is defined.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned values and messages.

   */
  export type Result<T> =
    | { schema: "automovie-recovery-operation-v1"; operator: "legacy-contour-v1" | "registered-triangles-v1" | "json-publication-v1"; status: "complete" | "partial"; value: T; diagnostics: string[] }
    | { schema: "automovie-recovery-operation-v1"; operator: "legacy-contour-v1" | "registered-triangles-v1" | "json-publication-v1"; status: "refused" | "failed" | "cancelled"; diagnostics: string[] };

  /**
   * Cooperative cancellation checked before work and at existing progress points.
   * A synchronous operation cannot observe an abort from a blocked event loop.
 *
 * @evidence contracts/common.md#principled-implementation AbortSignal supplies explicit cancellation without replacing globals or engine functions.
 * @evidence contracts/common.md#clear-and-simple-design Progress is a caller observer, not a geometry authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cancellation claim is made between progress points.
 * @evidence contracts/common.md#meaningful-documentation States event-loop limitation and callback failure propagation.
 * @evidence contracts/performance.md#efficient-algorithms Checks are constant time per existing progress notification.
 * @evidence contracts/performance.md#reuse-equivalent-work Callbacks do not cache or share effectful operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the signal; no event listener or timer is registered.
 * @author Samchon

   */
  export interface Options {
    /** Optional caller-owned cancellation token. */
    signal?: AbortSignal;

    /** Observation callback; a thrown error fails the operation. */
    onProgress?: (phase: string, completed: number, total: number) => void;

    /** Explicit incomplete observation prefix; omitted for the full planned station set. */
    sectionLimit?: number;

    /** Collect operation timing observations without changing geometry. */
    observeWork?: boolean;
  }
}
