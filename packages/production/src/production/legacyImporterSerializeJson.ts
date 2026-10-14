

/**
 * Encode the supported import value as pretty-printed two-space JSON plus one trailing LF in UTF-8. This is the persisted state byte representation, distinct from canonical fingerprint JSON.
 *
 * @evidence contracts/common.md#principled-implementation The language JSON serializer, fixed indentation and LF establish exact persisted bytes used by publication and later byte-for-byte verification.
 * @evidence contracts/common.md#clear-and-simple-design One state serializer is shared across manifest, revision, incarnation, plan and applied-state files; fingerprint encoding has its separate canonical owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace serialization failure with fallback bytes or claim that pretty JSON is the canonical digest representation.
 * @evidence contracts/common.md#meaningful-documentation States UTF-8, indentation, trailing newline and the distinction from canonical content identity.
 * @evidence contracts/performance.md#efficient-algorithms Traverses and encodes J JSON output bytes with output-sized text and Buffer storage; cyclic values retain normal JSON serialization failures. Supported callers supply serializable import records, not arbitrary unknown values.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares byte formatting between write and exact verification, while each call encodes current values because mutable object identity is not equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one caller-owned byte buffer and opens no file or lock; temporary string storage expires after encoding.
 */
export const legacyImporterSerializeJson: (value: unknown) => Uint8Array = (value: unknown): Uint8Array =>
  Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
