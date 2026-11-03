import fs from "node:fs";
import { Singleton } from "tstl";

/**
 * Each file of the private reference curve pack, parsed once per process and
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
    let found: Singleton<unknown> | undefined = cache.get(file);

    if (found === undefined) {
      found = new Singleton((): unknown => JSON.parse(fs.readFileSync(file, "utf8")));
      cache.set(file, found);
    }
    return found.get() as T;
  }

  /** One singleton per absolute file path. */
  const cache: Map<string, Singleton<unknown>> = new Map();
}
