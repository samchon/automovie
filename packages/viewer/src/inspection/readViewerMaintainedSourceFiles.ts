import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Read maintained files in declared checkout source roots from Git's cached and nonignored working-tree membership. Runtime SDK caches are not source; explicit data and emitted-library roots retain separate filesystem owners. Added/unlinked authored files are observed each time, without a fixed census. The returned paths are absolute and ordered; no file bytes are read here. A selected path resolving outside the actual checkout refuses the receipt.
 *
 * @evidence contracts/common.md#principled-implementation Uses Git's cached and nonignored working-tree membership within declared source roots and requires each present selected file's real path to remain inside the checkout.
 * @evidence contracts/common.md#clear-and-simple-design Authored membership stays distinct from emitted/data filesystem ownership; this helper returns ordered absolute paths without reading source bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixed census or runtime SDK cache is treated as maintained source, and a source symlink outside the actual checkout refuses instead of widening scope.
 * @evidence contracts/common.md#meaningful-documentation Documentation names Git membership, dynamic creation/unlink observation, physical checkout containment and no-byte-read behavior.
 * @evidence contracts/performance.md#efficient-algorithms Git inventory parsing scans its path bytes, each candidate compares declared scopes and performs required existence/real-path checks, and selected F paths sort in O(F log F).
 * @evidence contracts/performance.md#reuse-equivalent-work Each call reads current maintained membership; disk-source ownership separately shares unchanged byte receipts and no stale filename list is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources execFileSync joins the Git subprocess and filesystem checks are synchronous; only the returned path array escapes, with no retained child, watcher or open file handle.
 */
export function readViewerMaintainedSourceFiles(
  root: string,
  directories: readonly string[],
): string[] {
  const actualRoot: string = fs.realpathSync.native(root);
  const inside: (file: string) => boolean = (file: string): boolean => {
    const relative: string = path.relative(actualRoot, file);
    return (
      relative !== ".." &&
      !relative.startsWith(".." + path.sep) &&
      !path.isAbsolute(relative)
    );
  };
  const scopes: string[] = directories.map((directory: string): string => {
    const resolved: string = path.resolve(directory);
    if (!inside(resolved))
      throw new Error(
        "A maintained source root must remain within the checkout: " + resolved,
      );
    return resolved + path.sep;
  });
  const inventory: string = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    },
  );
  const selected: Set<string> = new Set();
  for (const relative of inventory.split("\0")) {
    if (relative === "") continue;
    const file: string = path.resolve(root, relative);
    if (
      !scopes.some((scope: string): boolean => file.startsWith(scope)) ||
      !fs.existsSync(file)
    )
      continue;
    if (!inside(fs.realpathSync.native(file)))
      throw new Error(
        "A maintained source file resolves outside the checkout: " + file,
      );
    selected.add(file);
  }
  return [...selected].sort((left: string, right: string): number =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}
