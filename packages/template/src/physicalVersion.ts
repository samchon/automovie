import * as fs from "node:fs";

import { writtenVersion } from "./writtenVersion";

/**
 * `writtenVersion` plus the change time, which a rename also moves.
 *
 * @evidence contracts/common.md#principled-implementation The full file generation extends the shared written-state key with change-time nanoseconds, which can reveal a rename.
 * @evidence contracts/common.md#clear-and-simple-design This formatter adds only the change-time component to the single written-state definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It preserves the actual stat values without inventing a revision or suppressing a change-time difference.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes the full generation from content-oriented written state.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of bigint encodings costs their digit count, independent of file bytes or directory contents.
 * @evidence contracts/performance.md#reuse-equivalent-work Each input stat is an independent observation; formatting shares the written-key implementation but caches no observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned generation string belongs to the snapshot owner and no descriptor or task is acquired.
 */
export const physicalVersion: (status: fs.BigIntStats) => string = (
  status: fs.BigIntStats,
): string => `${writtenVersion(status)}:${status.ctimeNs}`;
