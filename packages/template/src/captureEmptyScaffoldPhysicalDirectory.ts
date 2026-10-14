import * as fs from "node:fs";

import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { assertScaffoldPhysicalDirectory } from "./assertScaffoldPhysicalDirectory";
import { captureScaffoldPhysicalDirectory } from "./captureScaffoldPhysicalDirectory";
import { physicalDirectoryIdentity } from "./physicalDirectoryIdentity";
import { physicalVersion } from "./physicalVersion";

/**
 * Capture a directory this module just created and require it to be empty.
 *
 * @evidence contracts/common.md#principled-implementation A newly created ordinary directory is captured, checked empty and revalidated across the inspection by identity and full generation.
 * @evidence contracts/common.md#clear-and-simple-design New-directory qualification is separate from capturing pre-existing ordinary directories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unexpected content or a concurrent generation change refuses instead of adopting a competitor's directory.
 * @evidence contracts/common.md#meaningful-documentation The comment states that this owner created the directory and requires it still be empty.
 * @evidence contracts/performance.md#efficient-algorithms Metadata work is fixed and readdir scans the current entries; an unexpectedly populated new directory therefore costs its full entry count.
 * @evidence contracts/performance.md#reuse-equivalent-work The inspection cannot reuse an earlier empty answer because another process can change the directory between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each identity helper attempts its own descriptor close before returning; a failed close aborts qualification without proving release. The entry array is call-local and only the completed capture transfers to the caller.
 */
export const captureEmptyScaffoldPhysicalDirectory: (
  directory: string,
) => IScaffoldPhysicalDirectory = (
  directory: string,
): IScaffoldPhysicalDirectory => {
  const ownership: IScaffoldPhysicalDirectory =
    captureScaffoldPhysicalDirectory(directory);
  const before: fs.BigIntStats = fs.lstatSync(ownership.path, { bigint: true });
  if (physicalDirectoryIdentity(ownership.path, before) !== ownership.identity)
    throw new Error(`scaffold directory changed generation: ${ownership.path}`);
  const entries: string[] = fs.readdirSync(ownership.path);
  const after: fs.BigIntStats = fs.lstatSync(ownership.path, { bigint: true });
  if (
    physicalDirectoryIdentity(ownership.path, after) !== ownership.identity ||
    physicalVersion(after) !== physicalVersion(before)
  )
    throw new Error(
      `scaffold directory changed while inspected: ${ownership.path}`,
    );
  assertScaffoldPhysicalDirectory(ownership);
  if (entries.length !== 0)
    throw new Error(
      `new scaffold directory is unexpectedly non-empty: ${ownership.path}`,
    );
  return ownership;
};
