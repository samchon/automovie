import { execFileSync } from "node:child_process";

/**
 * The checked-out revision a review run's frames came from: the short commit
 * hash, with `+local` appended when a file under `packages` differs from it.
 *
 * A frame is evidence about a source tree, and a tree with local changes is not
 * its commit. The marker says so in the record without listing the changes, and
 * a record whose revision no longer equals the current one reads as old.
 *
 * @param root The repository root.
 */
export function readSourceRevision(root: string): string {
  const git = (args: string[]): string =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const dirty = git(["status", "--porcelain", "--", "packages"]) !== "";
  return git(["rev-parse", "--short", "HEAD"]) + (dirty ? "+local" : "");
}
