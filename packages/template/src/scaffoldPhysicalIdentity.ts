import type * as fs from "node:fs";


/**
 * Physical identity of a file or directory, formatted `<device>:<inode>` from
 * a bigint stat.
 *
 * Captured directory identities and the identity a held native parent handle
 * reports are compared as these strings. On POSIX both come from `fstat` via
 * this function. On Windows, Node reports the volume serial number as `dev`
 * and the file index as `ino`, which is the pair the native adapter reads from
 * `GetFileInformationByHandle` and formats the same way.
 *
 * @param status Stat taken with `{ bigint: true }`.
 * @returns The identity string.
 *
 * @evidence contracts/common.md#principled-implementation The device and inode pair is the POSIX definition of file identity, and bigint stats keep both exact beyond 2^53; on Windows the premise is libuv's mapping of volume serial and file index to `dev` and `ino`, and a ReFS file whose 128-bit identifier does not fit the 64-bit index is the unresolved limitation.
 * @evidence contracts/common.md#clear-and-simple-design physicalDirectoryIdentity and the POSIX native adapter share this format; the Windows binding assembles the same device and index pair from BY_HANDLE_FILE_INFORMATION for the coordinator's comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function formats exactly the stat it receives, with no platform branch or substituted value.
 * @evidence contracts/common.md#meaningful-documentation The comment states the format, which stat it needs, and the cross-platform equivalence the comparisons rely on.
 * @evidence contracts/performance.md#efficient-algorithms Formatting two bigints is constant time per stat.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each stat is a separate observation of the file system, and identity checks exist to observe change, so caching a result would defeat them.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A pure formatter that returns a string and keeps nothing.
 */
export const scaffoldPhysicalIdentity: (status: fs.BigIntStats) => string = (status: fs.BigIntStats): string =>
  `${status.dev}:${status.ino}`;
