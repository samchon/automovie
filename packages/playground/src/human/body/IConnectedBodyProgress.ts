/**
 * A stage signal a resident numerical worker posts while one request is still being answered. It carries no result and no correlation identity: the transport sends one request at a time, so the signal belongs to the request in flight. Its only effect is to tell the transport that the worker is alive and has finished a named stage, without imposing a silence deadline.
 *
 * @evidence contracts/common.md#principled-implementation The progress discriminator identifies a stage notification outside the result envelope; lack of request identity relies on the resident transport admitting only one request in flight.
 * @evidence contracts/common.md#clear-and-simple-design A single stage label communicates liveness without duplicating result or request payloads, and the transport remains responsible for serialized operation ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress is diagnostic only and never a substitute result or a reason to expire a slow numerical evaluation by elapsed time.
 * @evidence contracts/common.md#meaningful-documentation The comment records the one-flight premise, lack of correlation identity and the distinction between stage liveness and a completed numerical answer.
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
