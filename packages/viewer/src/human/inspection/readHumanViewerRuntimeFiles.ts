import fs from "node:fs";
import path from "node:path";

/**
 * Inventory executable JavaScript, JSON resources and application pages in explicitly selected installed roots. Symlinks are not followed, so package-store roots must be supplied as their actual directories. Git membership remains the separate checkout-source contract.
 *
 * @evidence contracts/common.md#principled-implementation Directory entries identify regular runtime files in caller-selected roots without assuming a checkout or following undeclared symlink targets.
 * @evidence contracts/common.md#clear-and-simple-design Installed artifact membership has its own filesystem inventory rather than widening Git-maintained source ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The inventory does not invent a source compiler receipt; skipped symlinks require explicit resolved package roots.
 * @evidence contracts/common.md#meaningful-documentation Documents selected root ownership, supported files and separate Git/source membership.
 * @evidence contracts/performance.md#efficient-algorithms Each directory entry is visited once and F accepted paths sort in O(F log F); bytes are read later by the witness owner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Membership is reread at startup; this helper retains no inventory cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous directory reads retain no open handles; pending paths and returned files scale with the selected tree.
 */
export function readHumanViewerRuntimeFiles(
  roots: readonly string[],
): string[] {
  const pending: string[] = [...roots];
  const files: Set<string> = new Set<string>();
  while (pending.length !== 0) {
    const directory: string = pending.pop()!;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file: string = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(file);
      else if (
        entry.isFile() &&
        /\.(?:js|mjs|cjs|json|html|ts)$/.test(entry.name)
      )
        files.add(file);
    }
  }
  return [...files].sort((left: string, right: string): number =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}
