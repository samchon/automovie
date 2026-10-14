import type { IProductionPayloadSnapshotEntry } from "./IProductionPayloadSnapshotEntry";

/**
 * Ordered identity observations used to guard retained render publication bytes.
 *
 * @evidence contracts/common.md#principled-implementation The entry array preserves the caller-declared payload population and order; currentness checks every retained member before transaction transfer.
 * @evidence contracts/common.md#clear-and-simple-design Render-bundle publication captures one snapshot for retained members and passes it to the currentness guard under its own authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The TypeScript array is mutable; transaction callers keep the snapshot private rather than claiming this type freezes caller-owned values.
 * @evidence contracts/common.md#meaningful-documentation States ordered member population and transaction-owned snapshot lifetime without an immutability claim.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The aggregate type executes no path traversal, hashing or currentness scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The transaction compares recorded identities with fresh reads, and this shape itself shares no cached guard answer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The transaction owns the array and scalar entry facts until publication completes or refuses, without storing member buffers.
 */
export interface IProductionPayloadSnapshot {
  /** Complete candidate entries in caller-declared order. */
  entries: IProductionPayloadSnapshotEntry[];
}
