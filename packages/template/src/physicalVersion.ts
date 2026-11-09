import * as fs from "node:fs";

import { writtenVersion } from "./writtenVersion";

/**
 * `writtenVersion` plus the change time, which a rename also moves.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The full file generation extends the shared written-state key with change-time nanoseconds, which can reveal a rename.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This formatter adds only the change-time component to the single written-state definition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts It preserves the actual stat values without inventing a revision or suppressing a change-time difference.
 * @evidence contracts/development/common.md#meaningful-documentation The comment distinguishes the full generation from content-oriented written state.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of bigint encodings costs their digit count, independent of file bytes or directory contents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each input stat is an independent observation; formatting shares the written-key implementation but caches no observation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned generation string belongs to the snapshot owner and no descriptor or task is acquired.
 */
export const physicalVersion: (status: fs.BigIntStats) => string = (
  status: fs.BigIntStats,
): string => `${writtenVersion(status)}:${status.ctimeNs}`;
