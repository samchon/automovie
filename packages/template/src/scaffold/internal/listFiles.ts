import * as fs from "node:fs";
import * as path from "node:path";

/**
 * List every shipped file under `root`, as root-relative paths with the host's
 * separator, in a deterministic order.
 *
 * The walk skips any directory named `.cache`, `.git`, or `node_modules` at any
 * depth, and any file whose name ends in `.js`, `.cjs`, `.mjs`, their `.map`,
 * `.d.ts`, `.d.cts`, `.d.mts`, or `.tsbuildinfo`. Entries that are neither a
 * plain directory nor a plain file, such as symbolic links, are skipped. Each
 * directory's entries are visited in UTF-16 code-unit order of their names, so
 * the listing is identical on every host.
 *
 * @param root Absolute scaffold directory.
 * @returns The shipped files.
 */
export const listFiles: (root: string) => string[] = (
  root: string,
): string[] => {
  const out: string[] = [];
  const walk: (dir: string) => void = (dir: string): void => {
    const entries: fs.Dirent[] = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort(
        (left: fs.Dirent, right: fs.Dirent): number =>
          Number(left.name > right.name) - Number(left.name < right.name),
      );
    for (const entry of entries) {
      const full: string = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (UNSHIPPED_DIRECTORIES.has(entry.name) === false) walk(full);
      } else if (entry.isFile() && UNSHIPPED_FILES.test(entry.name) === false)
        out.push(path.relative(root, full));
    }
  };
  walk(root);
  return out;
};

/** Directory names that hold local project work rather than scaffold inputs. */
const UNSHIPPED_DIRECTORIES: ReadonlySet<string> = new Set([
  ".cache",
  ".git",
  "node_modules",
]);

/** Compiler output files that are never authored scaffold inputs. */
const UNSHIPPED_FILES: RegExp =
  /(?:\.(?:c|m)?js(?:\.map)?|\.d\.(?:c|m)?ts|\.tsbuildinfo)$/u;
