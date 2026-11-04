import fs from "node:fs";

/**
 * Each file of the private reference curve pack, parsed by each call and
 * shared by every reader.
 *
 * A pack region file holds up to a few megabytes of Hermite spans, and a
 * curve query reads each file it overlaps, parsed for each call; a caller
 * reads the value and never mutates it.
 */
export namespace HumanReferenceCurveFile {
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
