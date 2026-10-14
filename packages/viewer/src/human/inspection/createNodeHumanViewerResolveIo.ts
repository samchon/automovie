import fs from "node:fs";
import path from "node:path";

import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps.js";

/**
 * File access for revision digests on the local disk: a regular file exists, and its text, undefined when it cannot be read. The caller supplies its actual checkout root. Resolved paths outside that physical root are refused before existence or bytes can enter a source graph; a foreign symlink is not relabelled as missing optional source. Directories are not source files.
 *
 * @evidence contracts/common.md#principled-implementation Realpath ownership is checked against the actual checkout before file existence or text enters the revision graph; only regular files are admitted.
 * @evidence contracts/common.md#clear-and-simple-design One physical ownership helper supports both exists and read with the existing resolver IO contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A symlink outside the physical root throws an ownership cause instead of becoming optional missing source; unreadable owned text alone returns undefined.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies physical-root authority, unreadable text behavior and directory exclusion.
 * @evidence contracts/performance.md#efficient-algorithms Each access performs realpath/stat and at most one file read; path containment comparison is linear in path length and no directory-wide traversal occurs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads must observe the current filesystem; this adapter does not memoize path resolution or source bytes across edit batches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only the resolved root string; synchronous filesystem calls own no open descriptor or source buffer beyond the invocation.
 */
export function createNodeHumanViewerResolveIo(
  root: string,
): ICreateHumanViewerRevisionsProps["io"] {
  const actualRoot: string = fs.realpathSync.native(root);
  const owned: (file: string) => string | undefined = (
    file: string,
  ): string | undefined => {
    let resolved: string;
    try {
      resolved = fs.realpathSync.native(file);
    } catch {
      return undefined;
    }
    const relative: string = path.relative(actualRoot, resolved);
    if (
      relative === ".." ||
      relative.startsWith(".." + path.sep) ||
      path.isAbsolute(relative)
    )
      throw new Error(
        "A source graph input resolves outside its physical checkout: " + file,
      );
    return resolved;
  };
  return {
    exists: (file: string): boolean => {
      const resolved: string | undefined = owned(file);
      return resolved !== undefined && fs.statSync(resolved).isFile();
    },
    read: (file: string): string | undefined => {
      const resolved: string | undefined = owned(file);
      if (resolved === undefined) return undefined;
      try {
        return fs.statSync(resolved).isFile()
          ? fs.readFileSync(resolved, "utf8")
          : undefined;
      } catch {
        return undefined;
      }
    },
  };
}
