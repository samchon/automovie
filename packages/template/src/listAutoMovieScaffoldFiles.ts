import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Directory names the scaffold never ships, whatever a host leaves there: a generated project installs its own dependencies and builds its own caches, so anything under these names is a working artifact of whoever ran a tool inside the scaffold directory.
 */
const UNSHIPPED_DIRECTORIES: ReadonlySet<string> = new Set([
  ".cache",
  ".git",
  "node_modules",
]);

/**
 * Compiler outputs, which are never authored scaffold inputs. Every executable scaffold source is TypeScript, and a generated project's loader would prefer an emitted `.js` next to its `.ts`, so an earlier local compilation must not ship its modules, maps, declarations, or build info.
 */
const UNSHIPPED_FILES: RegExp =
  /(?:\.(?:c|m)?js(?:\.map)?|\.d\.(?:c|m)?ts|\.tsbuildinfo)$/u;

/**
 * List every shipped file under `root`, as root-relative paths with the host's separator, in a deterministic order.
 *
 * The walk skips any directory named `.cache`, `.git`, or `node_modules` at any depth, and any file whose name ends in `.js`, `.cjs`, `.mjs`, their `.map`, `.d.ts`, `.d.cts`, `.d.mts`, or `.tsbuildinfo`. Entries that are neither a plain directory nor a plain file, such as symbolic links, are skipped. Each directory's entries are visited in UTF-16 code-unit order of their names, so the listing is identical on every host.
 *
 * @param root Absolute scaffold directory.
 * @returns The shipped files.
 *
 * @evidence contracts/common.md#principled-implementation A depth-first walk over `readdirSync` with file types visits each entry once without a stat per entry; names are compared with relational operators, which order by code unit independent of the host locale, unlike `localeCompare`; skipping symbolic links relies on the premise that the authored scaffold contains none, so a link is never shipped as a copy of its target.
 * @evidence contracts/common.md#clear-and-simple-design The two exclusion constants are the whole shipping policy and sit beside the walk, so `renderScaffold` receives the population without deciding it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exclusions are by directory name and output-file shape only, with no exception for any particular file or fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment lists every excluded directory and file shape, states that links are skipped, and states the path form and the order of the result.
 * @evidence contracts/performance.md#efficient-algorithms The walk is linear in the number of entries under `root` plus a per-directory sort of its entries, never descending into an excluded directory, so a populated `node_modules` costs one skipped entry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call lists the directory as it is on disk now, and `renderScaffold` calls it once per render.
 * @evidence contracts/performance.md#bound-retention-and-release-resources `readdirSync` opens and closes each directory before returning, the recursion depth equals the scaffold's directory depth, and only the result array is retained, holding one string per shipped file.
 */
export const listAutoMovieScaffoldFiles: (root: string) => string[] = (
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
