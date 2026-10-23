import fs from "node:fs";
import path from "node:path";

/**
 * Inventories Markdown paths without following directory symlinks.
 *
 * @evidence contracts/common.md#principled-implementation Recursively enumerate entries without traversing directory symlinks; include Markdown symlink paths so later safety checks can reject them.
 * @evidence contracts/common.md#clear-and-simple-design Inventory returns slash-normalized names while protectedFileKind owns physical-file validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeping symlink names prevents unsafe selected paths from disappearing silently.
 * @evidence contracts/common.md#meaningful-documentation The comment states the traversal rule; returned values are paths rather than contents.
 * @evidence contracts/performance.md#efficient-algorithms Traversal visits entries; nested flatMap copying can repeat path-array work with directory depth.
 * @evidence contracts/performance.md#reuse-equivalent-work Each root is inventoried independently because its current directory population may differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous readdir leaves no open handles; names and recursion grow with tree size without a fixed cap.
 */
export function markdownFiles(
  root: string,
  directoryPath: string = root,
): string[] {
  return fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .flatMap((entry: fs.Dirent<string>): string[] => {
      const target: string = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) return markdownFiles(root, target);
      if (
        (!entry.isFile() && !entry.isSymbolicLink()) ||
        !entry.name.endsWith(".md")
      )
        return [];
      return [path.relative(root, target).replaceAll("\\", "/")];
    });
}
