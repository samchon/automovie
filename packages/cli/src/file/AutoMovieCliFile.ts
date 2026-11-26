import { hashAutoMovieFile } from "./internal/hashAutoMovieFile";

/** Public file operations for the CLI. */
export namespace AutoMovieCliFile {
  /**
   * Stream a file's bytes into a lowercase SHA-256 digest; reject when reading
   * the file fails.
   */
  export function hash(file: string): Promise<string> {
    return hashAutoMovieFile(file);
  }
}