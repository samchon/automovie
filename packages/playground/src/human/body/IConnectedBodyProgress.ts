/**
 * An uncorrelated source-preparation or numerical-stage signal. It carries no result or request identity and may precede queued requests. The shared person worker broadcasts it to both logical endpoints; the current resident and simple transports ignore it rather than starting a silence deadline or resolving a pending request.
 *
 * @evidence contracts/common.md#principled-implementation The progress discriminator separates source/evaluation diagnostics from request-correlated result envelopes; it does not select either endpoint's pending request.
 * @evidence contracts/common.md#clear-and-simple-design One stage string carries diagnostic producer state while actual transports retain correlation, request settlement and worker retirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress is diagnostic only and never a substitute result or a reason to expire a slow numerical evaluation by elapsed time.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies pre-request source signals, shared broadcast, current consumers' ignoring and absence of a silence deadline or completed answer.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A stage notification is a scalar message shape and performs no numerical work or queue traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stage labels communicate an ongoing operation and cannot establish equivalent inputs or permit sharing its effect with another request.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This notification owns neither the task it describes nor a timer; the resident transport owns the running request and connection lifetime.
 *
 * @author Samchon
 */
export interface IConnectedBodyProgress {
  /** Name of the stage the worker just finished; display and diagnosis only. */
  progress: string;
}
