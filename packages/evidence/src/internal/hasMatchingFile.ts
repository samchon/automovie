import fs from "node:fs";
import path from "node:path";

/**
 * Returns whether a glob selects a regular file under the production root. A
 * link to a file counts. A directory with a source extension does not.
 */
export function hasMatchingFile(
  cwd: string,
  patterns: string | string[],
  exclude: string[],
): boolean {
  return fs
    .globSync(patterns, { cwd, exclude })
    .some(
      (file: string): boolean =>
        fs
          .statSync(path.join(cwd, file), { throwIfNoEntry: false })
          ?.isFile() === true,
    );
}
