import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/** Own the actual temporary directory acquired for one native Human worker.
 *
 * @evidence contracts/common.md#principled-implementation Acquisition records the actual real path and parent, including Windows app Temp virtualization; release rechecks the same nonsymbolic direct child.
 * @evidence contracts/common.md#clear-and-simple-design Filesystem acquisition and removal stay separate from native child and IPC ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller-supplied deletion path or weaker fallback substitutes for the acquired directory.
 * @evidence contracts/common.md#meaningful-documentation Documents virtualized Temp ownership and failure retention.
 * @evidence contracts/performance.md#efficient-algorithms Acquisition uses fixed filesystem metadata; removal scales with the owned directory contents.
 * @evidence contracts/performance.md#reuse-equivalent-work One immutable acquisition record serves its worker's publication and cleanup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each owner holds one path pair and no open file handle; release failure leaves ownership with its caller.
 */
export class HumanImageTemporaryDirectory {
  /** The actual acquired directory, passed to the worker and publication reader. */
  public readonly path: string;

  /** Actual parent captured with this acquisition, including operating-system redirection. */
  private readonly boundary: string;

  /** Capture the actual acquisition, never a later interpretation of the system Temp alias. */
  private constructor(directory: string, boundary: string) {
    this.path = directory;
    this.boundary = boundary;
  }

  /** Acquire and resolve one native-worker directory before publishing it to a child.
   *
   * @evidence contracts/common.md#principled-implementation mkdtemp exclusively creates the requested child; realpath records where the operating system actually placed it and lstat rejects a symbolic link.
   * @evidence contracts/common.md#clear-and-simple-design Only this factory creates the immutable ownership record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Windows virtualization is observed rather than assumed to preserve realpath(Temp) as the parent.
   * @evidence contracts/common.md#meaningful-documentation A resolution failure rejects without claiming that an uncertain acquisition was removed.
   * @evidence contracts/performance.md#efficient-algorithms Three fixed-size filesystem operations acquire one directory.
   * @evidence contracts/performance.md#reuse-equivalent-work The returned actual path is reused for both publication and release.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one directory owner; no file handle or watcher is retained.
   */
  public static async create(): Promise<HumanImageTemporaryDirectory> {
    const acquired: string = await fs.mkdtemp(
      path.join(os.tmpdir(), "automovie-human-worker-"),
    );
    const directory: string = await fs.realpath(acquired);
    if ((await fs.lstat(acquired)).isSymbolicLink())
      throw new Error("Worker temporary acquisition is a symbolic link");
    return new HumanImageTemporaryDirectory(directory, path.dirname(directory));
  }

  /** Remove only the unchanged actual acquisition, retaining ownership if its boundary changed.
   *
   * @evidence contracts/common.md#principled-implementation Re-resolves the captured path and parent, then requires the original nonsymbolic prefixed direct child before recursive removal.
   * @evidence contracts/common.md#clear-and-simple-design The lifecycle owner calls this only after the native child exits.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A replaced link, relocated directory or foreign path fails; force and alternate deletion paths are not used.
   * @evidence contracts/common.md#meaningful-documentation States exact acquisition ownership and rejection effects.
   * @evidence contracts/performance.md#efficient-algorithms Fixed metadata checks precede traversal of only the owned directory.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses acquisition identity, while lifecycle close owns repeated-call deduplication.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful removal releases directory contents; no open filesystem handle is acquired.
   */
  public async remove(): Promise<void> {
    const resolved: string = await fs.realpath(this.path);
    const base: string = await fs.realpath(this.boundary);
    const relative: string = path.relative(base, resolved);
    if (
      resolved !== this.path ||
      path.dirname(relative) !== "." ||
      !path.basename(relative).startsWith("automovie-human-worker-") ||
      (await fs.lstat(this.path)).isSymbolicLink()
    )
      throw new Error(
        "Worker cleanup target lost its owned temporary boundary",
      );
    await fs.rm(resolved, { recursive: true });
  }
}
