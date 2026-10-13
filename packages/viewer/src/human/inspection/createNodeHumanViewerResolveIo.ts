import fs from "node:fs";
import path from "node:path";

import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps.js";

/**
 * File access for revision digests on the local disk: a regular file exists,
 * and its text, undefined when it cannot be read. The caller supplies its
 * actual checkout root. Resolved paths outside that physical root are refused
 * before existence or bytes can enter a source graph; a foreign symlink is
 * not relabelled as missing optional source. Directories are not source files.
 *
 * @evidence contracts/common.md#clear-and-simple-design One disk adapter serves the server's first digests and the worker's later ones.
 * @evidence contracts/common.md#principled-implementation Native physical-path checks precede regular-file selection and UTF-8 reads; foreign symlinks refuse the receipt while missing or unreadable local source remains absent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the requested file without expected-source substitution, private compiler-cache lookup or mutation of filesystem methods.
 * @evidence contracts/common.md#meaningful-documentation States the caller-owned checkout, foreign-boundary refusal, regular-file requirement and optional unreadable result.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Filesystem existence and UTF-8 source reads supply the revision owner's actual on-disk inputs; unreadable source remains absent.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor One disk adapter serves the server's first digests and the worker's later ones.
 */
export function createNodeHumanViewerResolveIo(root: string): ICreateHumanViewerRevisionsProps["io"] {
  const actualRoot = fs.realpathSync.native(root);
  const owned = (file: string): string | undefined => {
    let resolved: string;
    try { resolved = fs.realpathSync.native(file); }
    catch { return undefined; }
    const relative = path.relative(actualRoot, resolved);
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative))
      throw new Error("A source graph input resolves outside its physical checkout: " + file);
    return resolved;
  };
  return {
    exists: (file) => {
      const resolved = owned(file);
      return resolved !== undefined && fs.statSync(resolved).isFile();
    },
    read: (file) => {
      const resolved = owned(file);
      if (resolved === undefined) return undefined;
      try {
        return fs.statSync(resolved).isFile() ? fs.readFileSync(resolved, "utf8") : undefined;
      } catch {
        return undefined;
      }
    },
  };
}
