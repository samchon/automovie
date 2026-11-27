import { execFileSync } from "node:child_process";

/*
 * The source revision a capture records: the production's git commit, with
 * `+changes` when its working tree differs from that commit, or `unrecorded`
 * when the folder is not in a git checkout or git is not installed.
 */
export function readRevisionImplementation(root: string): string {
  const git: (args: string[]) => string = (args: string[]): string =>
    execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    }).trim();
  try {
    const commit: string = git(["rev-parse", "HEAD"]);
    return git(["status", "--porcelain", "--", "."]) === ""
      ? commit
      : `${commit}+changes`;
  } catch {
    return "unrecorded";
  }
}
