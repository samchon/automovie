import { type Hash, createHash } from "node:crypto";
import type { Dirent } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Digest the source files a stage runs, for its key's toolchain.
 *
 * A stage cache keyed only on its inputs serves stale results after its own
 * code changes; build systems treat the task's code as an input to avoid that
 * (Excel's self-tracking and ninja's recorded command line in Mokhov et al.
 * 2018). In a workspace the package version never changes, so a production
 * puts this digest of the package's `src` directory into the key instead, for
 * example through a Vite `define` read by the page that computes the stage.
 * Every regular file below each directory contributes its path relative to
 * that directory and its bytes, in code-unit order; symbolic links and other
 * entries are skipped.
 *
 * @param directories Directories whose files form the identity, in a fixed order.
 * @returns `sha256:` digest of the paths and contents.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Hashing (directory ordinal, relative path, content digest) records in sorted order is a deterministic identity of the file set, so any edit, addition, removal or rename changes it while an untouched tree keeps it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function owns the tree walk; composing it into a key is the caller's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No file is excluded by name or extension; the caller chooses directories, and a missing directory rejects.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads every file once: linear in total bytes plus an O(N log N) sort of N paths per directory.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reflects the files at that moment; reusing an earlier digest would hide edits.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one file's bytes at a time and the path list; file handles close per read.
 * @evidence contracts/development/common.md#meaningful-documentation States why code identity belongs in the key, how to supply it to a page, what contributes and what is skipped.
 */
export async function digestAutoMovieSourceTree(
  directories: readonly string[],
): Promise<string> {
  const hash: Hash = createHash("sha256");
  for (const [ordinal, directory] of directories.entries())
    for (const file of await listFiles(directory, "")) {
      const content: string = createHash("sha256")
        .update(await readFile(path.join(directory, file)))
        .digest("hex");
      hash.update(`${JSON.stringify([ordinal, file, content])}\n`);
    }
  return `sha256:${hash.digest("hex")}`;
}

/** Regular files below `directory`, as `/`-separated relative paths in code-unit order. */
const listFiles: (
  directory: string,
  prefix: string,
) => Promise<string[]> = async (
  directory: string,
  prefix: string,
): Promise<string[]> => {
  const files: string[] = [];
  const entries: Dirent[] = await readdir(path.join(directory, prefix), {
    withFileTypes: true,
  });
  for (const entry of entries) {
    const relative: string =
      prefix.length === 0 ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory())
      files.push(...(await listFiles(directory, relative)));
    else if (entry.isFile()) files.push(relative);
  }
  return files.sort((a: string, b: string): number =>
    a < b ? -1 : a > b ? 1 : 0,
  );
};
