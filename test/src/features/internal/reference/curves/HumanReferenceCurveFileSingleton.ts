import fs from "node:fs";

/**
 * Each file of the private reference curve pack, parsed by each call and
 * shared by every reader.
 *
 * A pack region file holds up to a few megabytes of Hermite spans, and a
 * curve query reads the same files again and again, so each absolute path has
 * one `Singleton` holding the parsed JSON. The value is shared, so a caller
 * reads it and never mutates it.
 */
export namespace HumanReferenceCurveFileSingleton {
  /**
   * A pack file's parsed JSON, read on first use.
   *
   * @param file Absolute path of the pack file.
   * @returns The parsed value, typed by the caller's record type.
   * @throws Error when the file is missing or is not JSON.
   */
  export function get<T>(file: string): T {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  }

}
