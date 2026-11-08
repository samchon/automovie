import * as fs from "node:fs";

import { scaffoldPhysicalIdentity } from "./scaffoldPhysicalIdentity";

/**
 * Identity, size, and modification time: the part of a stat a writer moves.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Device-and-inode identity, exact byte size and modification-time nanoseconds define the resident written-state key.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One formatter keeps replacement and pathname verification on the same comparison representation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Change time is intentionally absent because Windows verification opens can move it; full post-close comparison uses physicalVersion instead.
 * @evidence contracts/development/common.md#meaningful-documentation The comment names the three stat components whose change can reveal another writer.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of bigint string conversions costs their digit count and never reads file contents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The formatter reuses shared physical identity formatting but does not cache a stat or previous generation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a fresh key string escapes; the function holds no file handle or retained cache.
 */
export const writtenVersion: (status: fs.BigIntStats) => string = (
  status: fs.BigIntStats,
): string =>
  `${scaffoldPhysicalIdentity(status)}:${status.size}:${status.mtimeNs}`;
