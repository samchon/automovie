import { type IScaffoldPublicationReceipt } from "./IScaffoldPublicationReceipt";

/**
 * Error thrown when a scaffold publication did not complete, carrying the receipt of the observed file effects for recovery.
 *
 * The message lists the completed relative paths and the stopping entry with its status, refusal reason or partial byte count, and parent identity. The stopping outcome's own error becomes `cause`.
 *
 * @evidence contracts/development/design.md#principled-representation The error is built from the frozen receipt after publication stopped, so the throwing form loses none of the observed effect; `cause` uses the standard `ErrorOptions` chaining for the native error.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One error class serves both throwing callers, `writeFiles` and the CLI, and holds the receipt instead of copying its fields onto the error.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The constructor accepts a completed receipt and then reports a failure without a stopping entry instead of refusing; it is constructed only after a `status` check in both callers.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what the message contains, where the native cause goes, and that `receipt` is kept for recovery.
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
