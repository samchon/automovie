/**
 * Distinguish exhausted contention retries from an acknowledged publication.
 *
 * The retry owner supplies the final native failure and its path account. Inherited AggregateError data does not determine whether a surrounding transaction already published or committed; that accounting remains with its caller.
 *
 * @evidence contracts/common.md#principled-implementation An AggregateError subtype retains the final contended failure so callers can distinguish retry exhaustion from other storage failures.
 * @evidence contracts/common.md#clear-and-simple-design The marker adds no alternate retry or rollback policy to the transaction's existing publication accounting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Its class identity certifies no rollback or unchanged filesystem; inherited errors preserve the supplied failure values.
 * @evidence contracts/common.md#meaningful-documentation States final-failure provenance, inherited payload and separate commit-state ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The subtype introduces no algorithm beyond native AggregateError construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An error instance coordinates no equivalent operation or retry result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callers own the error and its inherited retained values; the marker starts no task or handle lifetime.
 */
export class productionProjectProductionAtomicContentionError extends AggregateError {
}
