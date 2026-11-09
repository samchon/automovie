import * as fs from "node:fs";
import * as path from "node:path";

import { type IScaffoldFileSnapshot } from "./IScaffoldFileSnapshot";
import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { type ScaffoldFilePublicationOutcome } from "./ScaffoldFilePublicationOutcome";
import { assertScaffoldOwnership } from "./assertScaffoldOwnership";
import { captureScaffoldFile } from "./captureScaffoldFile";
import { publishNativeScaffoldFile } from "./publishNativeScaffoldFile";

/**
 * Replace the directory entry of an existing scaffold file that other entries also name, such as a build cache's hard link.
 *
 * The new bytes go into a fresh single-link sibling `<name>.automovie-sync` through {@link publishNativeScaffoldFile}, which is then renamed over `existing.path`. The other names keep the old file and its old bytes, which is what the single-link rule of the in-place rewrite protects. Right before the rename, the pathname must still hold the inspected generation; right after it, the pathname must hold the staged file.
 *
 * `refused` means nothing changed. `partial` means the staged sibling exists but the target entry was not, or not provably, replaced; the sibling is left in place and named in the error, and nothing is retried or deleted.
 *
 * @param props.base Captured scaffold root; `parent` must lie inside it.
 * @param props.bytes Exact file content.
 * @param props.existing Inspected generation of the shared file.
 * @param props.parent Captured parent directory of `existing.path`.
 * @returns The frozen outcome.
 *
 * @evidence contracts/common.md#principled-implementation Replacing an entry by renaming a verified sibling over it changes only that name; every other hard link keeps its inode, so no other name observes the write.
 * @evidence contracts/common.md#clear-and-simple-design Native exclusive creation, generation checks and one rename compose the replacement; in-place rewriting stays with overwriteScaffoldFile for single-link files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The link-count safety is kept rather than weakened: a shared file is never truncated, a changed target refuses the rename, and failures are reported, never cleaned up or retried. A writer changing the target between the last check and the rename is the documented remaining race.
 * @evidence contracts/common.md#meaningful-documentation The comment states the sibling name, both generation checks, what other names observe and what each outcome leaves on disk.
 * @evidence contracts/performance.md#efficient-algorithms One native create with write and readback, linear in the file size, plus a constant number of lstats and one rename.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every call writes one file and re-observes it, which is an effect that must not be shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Handles belong to publishNativeScaffoldFile, which releases them before returning; this owner holds only scalar snapshots.
 */
export const replaceSharedScaffoldFile: (props: {
  base: IScaffoldPhysicalDirectory;
  bytes: Uint8Array;
  existing: IScaffoldFileSnapshot;
  parent: IScaffoldPhysicalDirectory;
}) => ScaffoldFilePublicationOutcome = (props: {
  base: IScaffoldPhysicalDirectory;
  bytes: Uint8Array;
  existing: IScaffoldFileSnapshot;
  parent: IScaffoldPhysicalDirectory;
}): ScaffoldFilePublicationOutcome => {
  const target: string = props.existing.path;
  const childName: string = `${path.basename(target)}.automovie-sync`;
  const staged: ScaffoldFilePublicationOutcome = publishNativeScaffoldFile({
    bytes: props.bytes,
    childName,
    expectedParentIdentity: props.parent.identity,
    parentPath: props.parent.path,
  });
  if (staged.status !== "completed") return staged;
  const staging: string = path.join(props.parent.path, childName);
  try {
    const fresh: IScaffoldFileSnapshot = captureScaffoldFile(staging);
    if (fresh.shared)
      throw new Error(`staged scaffold file gained another link: ${staging}`);
    assertScaffoldOwnership(props.base, props.parent);
    const current: IScaffoldFileSnapshot = captureScaffoldFile(target);
    if (
      current.identity !== props.existing.identity ||
      current.written !== props.existing.written
    )
      throw new Error(`scaffold file changed since inspection: ${target}`);
    fs.renameSync(staging, target);
    const resident: IScaffoldFileSnapshot = captureScaffoldFile(target);
    if (
      resident.identity !== fresh.identity ||
      resident.written !== fresh.written ||
      resident.shared
    )
      throw new Error(`scaffold file changed during entry replacement: ${target}`);
    assertScaffoldOwnership(props.base, props.parent);
  } catch (error) {
    return Object.freeze({
      bytesWritten: props.bytes.byteLength,
      error: new Error(
        `shared scaffold file was not replaced; staged copy remains at ${staging}`,
        { cause: error },
      ),
      parentIdentity: props.parent.identity,
      status: "partial" as const,
    });
  }
  return Object.freeze({
    parentIdentity: props.parent.identity,
    status: "completed" as const,
  });
};
