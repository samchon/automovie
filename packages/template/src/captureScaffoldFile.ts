import * as fs from "node:fs";
import * as path from "node:path";

import { type IScaffoldFileSnapshot } from "./IScaffoldFileSnapshot";
import { assertOrdinaryFile } from "./assertOrdinaryFile";
import { physicalVersion } from "./physicalVersion";
import { scaffoldPhysicalIdentity } from "./scaffoldPhysicalIdentity";
import { writtenVersion } from "./writtenVersion";

/**
 * Capture one existing ordinary file through its pathname, recording whether another directory entry also names it.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A fresh lstat admits an ordinary pathname and captures its physical identity, written and full versions, and whether its link count exceeds one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One snapshot producer supplies reading, replacement admission and before-and-after resident verification; the writer chooses its method from `shared`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Symbolic links and non-regular entries fail before a snapshot exists; a shared file is admitted but marked, so no writer rewrites it in place.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states ordinary-file admission and the shared mark; the snapshot members document exact version semantics.
 * @evidence contracts/development/implementation.md#efficient-algorithms One lstat and a fixed number of bigint-to-string encodings dominate, independent of file contents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each snapshot is a new pathname observation, so a previous snapshot is not reused as current ownership.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only scalar snapshot fields escape; lstat opens no retained descriptor in this owner.
 */
export const captureScaffoldFile: (file: string) => IScaffoldFileSnapshot = (
  file: string,
): IScaffoldFileSnapshot => {
  const absolute: string = path.resolve(file);
  const status: fs.BigIntStats = fs.lstatSync(absolute, { bigint: true });
  assertOrdinaryFile(status, absolute);
  return {
    identity: scaffoldPhysicalIdentity(status),
    path: absolute,
    shared: status.nlink > 1n,
    version: physicalVersion(status),
    written: writtenVersion(status),
  };
};
