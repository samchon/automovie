import { type BigIntStats } from "node:fs";

/**
 * Represent the observed device and inode as a NUL-delimited identity string; the caller separately establishes regular-file or directory suitability.
 *
 * @evidence contracts/common.md#principled-implementation Both bigint fields are converted without number rounding and NUL separation distinguishes field boundaries in the observed filesystem identity.
 * @evidence contracts/common.md#clear-and-simple-design One representation is shared by linked, opened and resident snapshots; regular-file admission remains with the reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not substitute path spelling, age or token content for device/inode identity, and does not authenticate future path state.
 * @evidence contracts/common.md#meaningful-documentation States the two fields, separator and the scope of this finite observation.
 * @evidence contracts/performance.md#efficient-algorithms Conversion follows decimal digit lengths of dev and ino, producing an output-sized identity string.
 * @evidence contracts/performance.md#reuse-equivalent-work Snapshot comparison reuses this formatter, while each native stat is independently acquired by the reader.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one string and owns no native handle or retained identity registry.
 */
export const projectCommitLockLockIdentity: (status: BigIntStats) => string = (status: BigIntStats): string =>
  `${status.dev}\0${status.ino}`;
