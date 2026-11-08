import * as fs from "node:fs";
import * as path from "node:path";

import { type IScaffoldFileSnapshot } from "./IScaffoldFileSnapshot";
import { assertOrdinarySingleLinkFile } from "./assertOrdinarySingleLinkFile";
import { physicalVersion } from "./physicalVersion";
import { scaffoldPhysicalIdentity } from "./scaffoldPhysicalIdentity";
import { writtenVersion } from "./writtenVersion";

/**
 * Capture one existing ordinary single-link file through its pathname.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A fresh lstat admits an ordinary single-link pathname and captures its physical identity plus written and full versions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One snapshot producer supplies replacement admission and before-and-after resident verification.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Links and multiply linked residents fail before a snapshot can authorize writing.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states ordinary single-link admission and the snapshot members document exact version semantics.
 * @evidence contracts/development/implementation.md#efficient-algorithms One lstat and a fixed number of bigint-to-string encodings dominate, independent of file contents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each snapshot is a new pathname observation, so a previous snapshot is not reused as current ownership.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only scalar snapshot fields escape; lstat opens no retained descriptor in this owner.
 */
export const captureScaffoldFile: (file: string) => IScaffoldFileSnapshot = (
  file: string,
): IScaffoldFileSnapshot => {
  const absolute: string = path.resolve(file);
  const status: fs.BigIntStats = fs.lstatSync(absolute, { bigint: true });
  assertOrdinarySingleLinkFile(status, absolute);
  return {
    identity: scaffoldPhysicalIdentity(status),
    path: absolute,
    version: physicalVersion(status),
    written: writtenVersion(status),
  };
};
