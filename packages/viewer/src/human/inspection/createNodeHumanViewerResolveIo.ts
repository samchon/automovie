import fs from "node:fs";
import path from "node:path";

import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps.js";

/**
 * File access for revision digests on the local disk: a regular file exists,
 * and its text, undefined when it cannot be read. The caller supplies its
 * actual checkout root. Resolved paths outside that physical root are refused
 * before existence or bytes can enter a source graph; a foreign symlink is
 * not relabelled as missing optional source. Directories are not source files.
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
