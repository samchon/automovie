/**
 * Host-provided file operations for a capture.
 *
 * Node `fs/promises` and Map-backed test storage satisfy this port. The
 * capture core uses the port for all file access and ignores the value returned
 * by `mkdir`.
 *
 * Paths are slash-joined host strings. The request parser validates round names,
 * and the folder validates claimed file names. The host supplies the sandbox
 * when one is needed because this port accepts arbitrary paths.
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

  /** Resolve the actual path of an existing folder, including aliases. */
  realpath?(path: string): Promise<string>;

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
