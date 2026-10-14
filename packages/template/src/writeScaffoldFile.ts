import * as path from "node:path";

import { type IScaffoldFileSnapshot } from "./IScaffoldFileSnapshot";
import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { type ScaffoldFilePublicationOutcome } from "./ScaffoldFilePublicationOutcome";
import { assertScaffoldOwnership } from "./assertScaffoldOwnership";
import { captureScaffoldFile } from "./captureScaffoldFile";
import { missingPath } from "./missingPath";
import { overwriteScaffoldFile } from "./overwriteScaffoldFile";
import { publishNativeScaffoldFile } from "./publishNativeScaffoldFile";

/**
 * Write one scaffold file into a captured parent directory and report the effect.
 *
 * A missing file is created through {@link publishNativeScaffoldFile}, relative to a handle on `parent`. With `force`, an existing file is instead rewritten in place, and only when it is one ordinary file that exactly one directory entry names: the descriptor that truncates it must stay the file the pathname names before the truncation, after the write, and after the final readback. Without `force`, an existing file meets the exclusive create and is refused as `target-competitor`.
 *
 * An in-place rewrite reports `refused` (`create-failed`) for any failure before truncation and `partial` with the bytes written for any failure after it. A link to the file created between the descriptor's link-count check and the truncation is not seen, and the rewrite then reaches it.
 *
 * @param props.base Captured scaffold root; `parent` must lie inside it.
 * @param props.bytes Exact file content.
 * @param props.force Rewrite an existing file instead of refusing it.
 * @param props.parent Captured directory that must be `target`'s parent.
 * @param props.target Path of the file.
 * @returns The frozen outcome.
 * @throws Before any write, when `target` is not directly inside `parent`, when `base` or `parent` fails revalidation, or, with `force`, when an existing `target` is a link, not a file, or has more than one link.
 *
 * @evidence contracts/common.md#principled-implementation A new file uses the native exclusive create relative to the parent handle, which cannot follow a link or replace an entry; an existing file is rewritten through `ftruncate` and positioned writes on one descriptor, and every check compares that descriptor's identity, size, and modification time with a fresh pathname capture, leaving the change time out because Windows moves it when this module's own verification opens the file; the link race named in the comment is the unresolved limitation.
 * @evidence contracts/common.md#clear-and-simple-design This function chooses create versus replacement and checks ownership against base; publishNativeScaffoldFile owns handle-relative creation and overwriteScaffoldFile owns the replacement descriptor sequence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed rewrite is never cleaned up or retried; it is reported as `refused` or `partial` from whether truncation happened, and a multiply linked file is refused because rewriting its inode would change every other name for it.
 * @evidence contracts/common.md#meaningful-documentation The comment states both paths, the admission for a rewrite, the refusal without `force`, how failures map to outcomes, the remaining race, each parameter, and what throws before any write.
 * @evidence contracts/performance.md#efficient-algorithms A create costs what `publishNativeScaffoldFile` costs; a rewrite is one write pass and one readback pass over the file plus a constant number of stats and pathname opens, linear in its size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every call writes one file and re-observes it, which is an effect that must not be shared; directory captures it receives are reused by the caller's cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Replacement delegates writer and resident descriptors to overwriteScaffoldFile, while creation delegates handles to publishNativeScaffoldFile; both attempt release on every outcome and preserve close errors without promising release after a failed close. This dispatch retains no handle itself.
 */
export const writeScaffoldFile: (props: {
  base: IScaffoldPhysicalDirectory;
  bytes: Uint8Array;
  force: boolean;
  parent: IScaffoldPhysicalDirectory;
  target: string;
}) => ScaffoldFilePublicationOutcome = (props: {
  base: IScaffoldPhysicalDirectory;
  bytes: Uint8Array;
  force: boolean;
  parent: IScaffoldPhysicalDirectory;
  target: string;
}): ScaffoldFilePublicationOutcome => {
  const target: string = path.resolve(props.target);
  if (path.dirname(target) !== props.parent.path)
    throw new Error(`scaffold file changed declared parent: ${target}`);
  assertScaffoldOwnership(props.base, props.parent);
  if (props.force) {
    let existing: IScaffoldFileSnapshot | null;
    try {
      existing = captureScaffoldFile(target);
    } catch (error) {
      if (missingPath(error) === false) throw error;
      existing = null;
    }
    if (existing !== null)
      return overwriteScaffoldFile({
        base: props.base,
        bytes: props.bytes,
        existing,
        parent: props.parent,
      });
  }
  return publishNativeScaffoldFile({
    bytes: props.bytes,
    childName: path.basename(target),
    expectedParentIdentity: props.parent.identity,
    parentPath: props.parent.path,
  });
};
