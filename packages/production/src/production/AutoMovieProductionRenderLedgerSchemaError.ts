import type { AutoMovieProductionRenderLedgerRecord } from "./AutoMovieProductionRenderLedgerRecord";

/**
 * Report render-record schema paths and expected shapes without retaining offending values.
 *
 * @evidence contracts/common.md#principled-implementation Error retains record and ordered violation strings; the admission helper omits validation values before construction.
 * @evidence contracts/common.md#clear-and-simple-design Delivery validation distinguishes schema from JSON ingress failure through this same class identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arbitrary constructor strings are not independently sanitized; actual admission projects schema paths and expected descriptions, excluding offending values.
 * @evidence contracts/common.md#meaningful-documentation Defines stable code/name and report order; structural refusal is not byte-ownership or media proof.
 * @evidence contracts/performance.md#efficient-algorithms Joining violation text and native stack capture dominate; error count and description length drive message storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Borrows the projected violation array without rerunning schema validation; each failed observation creates a new Error.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Catching callers retain message/stack and borrowed strings until release; no input record, byte buffer or handle is stored.
 */
export class AutoMovieProductionRenderLedgerSchemaError extends Error {
  /** Stable machine-readable refusal code. */
  public readonly code: "automovie-render-ledger-schema-invalid" = "automovie-render-ledger-schema-invalid" as const;

  public constructor(
    /** Ledger family whose materialized value was refused. */
    public readonly record: AutoMovieProductionRenderLedgerRecord,

    /** Ordered schema paths and expected shapes, borrowed without copying. */
    public readonly violations: readonly string[],
  ) {
    super(`AutoMovie render ledger record "${record}" does not satisfy its schema: ${violations.join("; ")}.`);
    this.name = "AutoMovieProductionRenderLedgerSchemaError";
  }
}
