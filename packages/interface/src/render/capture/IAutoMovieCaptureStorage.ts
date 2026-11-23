/**
 * The files a capture reads and writes, injected by its host so the capture core reaches no file system itself.
 *
 * The capture host supplies these five file operations. Node fs/promises and Map-backed test storage satisfy this structural port without importing their types. Paths are slash-joined host strings; request parsing owns round-name admission and the folder validates plain claimed file names. The storage port itself accepts arbitrary paths and provides no sandbox. mkdir's return value is deliberately ignored, so it remains unknown.
 *
 * @evidence contracts/development/design.md#principled-representation The five file operations a capture performs, with Node's own call shapes, so the host's object needs no adapter and the core's order of file steps runs unchanged against memory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the operations the capture folder calls: list a folder, create one, read a file, write one, delete one. This port owns the capture's operation subset; hosts implement it with their storage API and the core ignores mkdir's host-specific result.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a host, and a missing folder or file is the host's rejection, which the capture reports with the path.
 * @evidence contracts/development/common.md#meaningful-documentation States who supplies it, whose signatures it repeats, how paths are formed and the bound on them.
 */
export interface IAutoMovieCaptureStorage {
  /**
   * The names of the entries of a folder, files and folders alike. Rejects when the folder does not exist.
   */
  readdir(path: string): Promise<string[]>;

  /**
   * Create a folder and any missing parent; an existing folder is kept.
   */
  mkdir(
    path: string,
    options: {
      /** Create any missing parent directories as well as the destination. */
      recursive: true;
    },
  ): Promise<unknown>;

  /**
   * The bytes of a file. Rejects when the file does not exist.
   */
  readFile(path: string): Promise<Uint8Array>;

  /**
   * Write a file whole, replacing one of the same path; text is written as UTF-8.
   */
  writeFile(path: string, data: Uint8Array | string): Promise<void>;

  /**
   * Delete a file; with `force`, a path that does not exist is not an error.
   */
  rm(
    path: string,
    options: {
      /** Treat an absent file as successful deletion; other storage errors still reject. */
      force: true;
    },
  ): Promise<void>;
}
