import { type IScaffoldPublicationReceipt } from "./IScaffoldPublicationReceipt";

/**
 * Error thrown when a scaffold publication did not complete, carrying the receipt of the observed file effects for recovery.
 *
 * The message lists the completed relative paths and the stopping entry with its status, refusal reason or partial byte count, and parent identity. The stopping outcome's own error becomes `cause`.
 *
 * @evidence contracts/common.md#principled-implementation The error is built from the frozen receipt after publication stopped, so the throwing form loses none of the observed effect; `cause` uses the standard `ErrorOptions` chaining for the native error.
 * @evidence contracts/common.md#clear-and-simple-design One error class serves both throwing callers, `writeFiles` and the CLI, and holds the receipt instead of copying its fields onto the error.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constructor accepts a completed receipt and then reports a failure without a stopping entry instead of refusing; it is constructed only after a `status` check in both callers.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the message contains, where the native cause goes, and that `receipt` is kept for recovery.
 * @evidence contracts/performance.md#efficient-algorithms Building the message visits the completed list once and serializes its paths and parent identities plus the stopping details; work and allocated text depend on their total string lengths, with runtime-dependent Error stack capture.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each failed publication raises its own error; there is no repeated work for the constructor to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The error keeps the receipt, and with it every planned file's bytes, alive for as long as the error object is held; it holds no descriptor.
 */
export class ScaffoldPublicationError extends Error {
  /** Receipt of the publication that did not complete. */
  public readonly receipt: IScaffoldPublicationReceipt;

  /** @param receipt Receipt whose status is not `completed`. */
  public constructor(receipt: IScaffoldPublicationReceipt) {
    const failure: IScaffoldPublicationReceipt["failure"] = receipt.failure;
    super(
      failure === null
        ? "scaffold publication failed without a stopping entry"
        : `scaffold publication ${receipt.status}: ${JSON.stringify({
            completed: receipt.completed.map(
              ({
                entry,
                parentIdentity,
              }: IScaffoldPublicationReceipt["completed"][number]): {
                parentIdentity: string;
                relative: string;
              } => ({
                parentIdentity,
                relative: entry.relative,
              }),
            ),
            failure: {
              bytesWritten:
                failure.outcome.status === "partial"
                  ? failure.outcome.bytesWritten
                  : undefined,
              parentIdentity:
                failure.outcome.status === "partial"
                  ? failure.outcome.parentIdentity
                  : undefined,
              reason:
                failure.outcome.status === "refused"
                  ? failure.outcome.reason
                  : undefined,
              relative: failure.entry.relative,
              status: failure.outcome.status,
            },
          })}`,
      { cause: failure?.outcome.error },
    );
    this.name = "ScaffoldPublicationError";
    this.receipt = receipt;
  }
}
