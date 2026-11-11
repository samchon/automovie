import { execFileSync } from "node:child_process";

/**
 * The source revision a capture records: the production's git commit, with `+changes` when its working tree differs from that commit, or `unrecorded` when the folder is not in a git checkout or git is not installed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three forms and when each is written.
 * @evidence contracts/development/implementation.md#principled-implementation `git rev-parse HEAD` names the commit and `git status --porcelain` is empty exactly when nothing differs from it, so the revision says whether the commit alone repeats the capture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two git calls, one fallback.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing revision is written as `unrecorded`, never as a guessed commit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two short processes per capture.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per capture, since the tree may change between captures.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Both processes end before it returns.
 */
export function readAutoMovieRevision(root: string): string {
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
