import fs from "node:fs";
import path from "node:path";

import type { IScenarioFile } from "./IScenarioFile";

/**
 * Find the spec files under a directory without importing any: every file whose
 * name starts with the prefix and ends with `.<extension>`, in the order
 * `DynamicExecutor` visits them (each directory's entries as `readdir` lists
 * them, a subdirectory searched where it is met, a directory reached twice
 * through a link searched once).
 *
 * The runner selects by base name, so two files of one base name would be one
 * ambiguous name; they are refused.
 *
 * @param location The directory to search.
 * @param prefix The spec files' name prefix, `test_`.
 * @param extension The extension the program runs from, `ts` from the sources
 *   or `mjs` from a build.
 * @returns The files found.
 * @throws An `Error` naming the paths when two files share a base name.
 */
export function findScenarioFiles(
  location: string,
  prefix: string,
  extension: string,
): IScenarioFile[] {
  const files: IScenarioFile[] = [];
  const visited: Set<string> = new Set();

  /** Search one directory, depth first. */
  function visit(directory: string): void {
    const identity: string = fs.realpathSync(directory);
    if (visited.has(identity)) return;
    visited.add(identity);
    for (const name of fs.readdirSync(directory)) {
      const file: string = path.resolve(directory, name);
      const stats: fs.Stats = fs.statSync(file);
      if (stats.isDirectory()) visit(file);
      else if (
        stats.isFile() &&
        name.startsWith(prefix) &&
        name.endsWith(`.${extension}`)
      )
        files.push({ name, location: file });
    }
  }
  visit(location);

  const seen: Map<string, string> = new Map();
  for (const file of files) {
    const other: string | undefined = seen.get(file.name);
    if (other !== undefined)
      throw new Error(
        `Two spec files share the base name ${file.name}: ${other} and ${file.location}.`,
      );
    seen.set(file.name, file.location);
  }
  return files;
}
