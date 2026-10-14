import * as fs from "node:fs";
import * as path from "node:path";

import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { physicalDirectoryIdentity } from "./physicalDirectoryIdentity";

/**
 * Capture one ordinary directory, refusing a symbolic link or junction.
 *
 * @evidence contracts/common.md#principled-implementation A non-symlink directory lstat is paired with descriptor identity and native real path for later generation checks.
 * @evidence contracts/common.md#clear-and-simple-design All directory admission and revalidation reuse one capture definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A linked final component or non-directory is refused rather than being resolved and trusted.
 * @evidence contracts/common.md#meaningful-documentation The comment states ordinary-directory capture and the result documents lexical, physical and real-path identities.
 * @evidence contracts/performance.md#efficient-algorithms One lstat, one descriptor fstat and one native realpath are fixed metadata operations plus pathname processing.
 * @evidence contracts/performance.md#reuse-equivalent-work A fresh capture is needed for each revalidation; prior filesystem observations cannot prove current identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources physicalDirectoryIdentity attempts descriptor close in finally and must finish that close before this capture returns its three strings; failure propagates without proving native release, and no handle enters the returned record.
 */
export const captureScaffoldPhysicalDirectory: (
  directory: string,
) => IScaffoldPhysicalDirectory = (
  directory: string,
): IScaffoldPhysicalDirectory => {
  const absolute: string = path.resolve(directory);
  const status: fs.BigIntStats = fs.lstatSync(absolute, { bigint: true });
  if (status.isSymbolicLink() || status.isDirectory() === false)
    throw new Error(
      `scaffold directory is not one ordinary directory: ${absolute}`,
    );
  return {
    identity: physicalDirectoryIdentity(absolute, status),
    path: absolute,
    real: path.resolve(fs.realpathSync.native(absolute)),
  };
};
