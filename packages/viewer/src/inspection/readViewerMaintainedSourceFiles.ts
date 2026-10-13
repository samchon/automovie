import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

/**
 * Read maintained files in declared checkout source roots from Git's cached
 * and nonignored working-tree membership. Runtime SDK caches are not source;
 * explicit data and emitted-library roots retain separate filesystem owners.
 * Added/unlinked authored files are observed each time, without a fixed census.
 * The returned paths are absolute and ordered; no file bytes are read here.
 * A selected path resolving outside the actual checkout refuses the receipt.
 *
 * @evidence contracts/common.md#principled-implementation Actual Git working-tree membership and checked physical boundaries identify maintained source separately from runtime caches.
 * @evidence contracts/common.md#clear-and-simple-design One membership owner serves numerical witnesses and ordinary Playground source receipts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No named-subject skip, guessed cache result or private SDK mutation supplies membership.
 * @evidence contracts/common.md#meaningful-documentation Defines maintained source, independent data/output roots and physical-path refusal.
 */
export function readViewerMaintainedSourceFiles(root: string, directories: readonly string[]): string[] {
  const actualRoot = fs.realpathSync.native(root);
  const inside = (file: string): boolean => {
    const relative = path.relative(actualRoot, file);
    return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative);
  };
  const scopes = directories.map((directory) => {
    const resolved = path.resolve(directory);
    if (!inside(resolved)) throw new Error("A maintained source root must remain within the checkout: " + resolved);
    return resolved + path.sep;
  });
  const inventory = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: root, encoding: "utf8", windowsHide: true,
  });
  const selected = new Set<string>();
  for (const relative of inventory.split("\0")) {
    if (relative === "") continue;
    const file = path.resolve(root, relative);
    if (!scopes.some((scope) => file.startsWith(scope)) || !fs.existsSync(file)) continue;
    if (!inside(fs.realpathSync.native(file)))
      throw new Error("A maintained source file resolves outside the checkout: " + file);
    selected.add(file);
  }
  return [...selected].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
}
