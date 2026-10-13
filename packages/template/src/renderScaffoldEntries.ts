import * as path from "node:path";

import type { IAutoMovieScaffoldSourceEntry } from "./IAutoMovieScaffoldSourceEntry";
import { renderTemplate } from "./renderTemplate";


/** One source entry after rendering, keeping its source path for diagnostics. */
interface IRenderedScaffoldEntry {
  content: string;
  relative: string;
  source: string;
}

/**
 * Normalize `\r\n` to `\n` so the scaffold emits identical bytes on every host: a Windows checkout with `core.autocrlf` would otherwise ship CRLF. The tree is text only, so the replacement cannot corrupt binary content.
 */
const normalizeLineEndings: (content: string) => string = (content: string): string =>
  content.replaceAll("\r\n", "\n");


/** Join path segments with `/` so map keys do not depend on the host. */
const toPosix: (value: string) => string = (value: string): string => value.split(path.sep).join("/");


/**
 * The rendered key for one scaffold-relative path.
 *
 * Path segments get the same strict substitution and unknown-token failure as file contents, so a templated path cannot ship verbatim. The root `_gitignore` stand-in becomes `.gitignore` only here, because npm pack renames a packed `.gitignore` to `.npmignore`; nested files of that name stay ordinary paths.
 */
const renderKey: (relative: string, variables: Readonly<Record<string, string>>) => string = (
  relative: string,
  variables: Readonly<Record<string, string>>,
): string => {
  const dir: string = path.dirname(relative);
  const base: string = path.basename(relative);
  const outputBase: string =
    dir === "." && base === "_gitignore" ? ".gitignore" : base;
  return renderTemplate(
    toPosix(dir === "." ? outputBase : path.join(dir, outputBase)),
    variables,
  );
};


/**
 * Render a list of scaffold sources into a `{ posixPath: content }` map, refusing the whole list when two sources render to the same path.
 *
 * Each content has CRLF normalized to LF and its tokens rendered; each path is rendered the same way, with `/` separators, and a root `_gitignore` becomes `.gitignore`, so a scaffold that ships both is refused as a collision. The collision error names the first colliding path in code-unit order and both source paths, independent of the input order. The returned object has no prototype, so a key such as `__proto__` is an ordinary file path.
 *
 * @param entries Source paths relative to the scaffold root, with their text.
 * @param variables Token values, as for {@link renderTemplate}.
 * @returns The rendered file map.
 * @throws On a collision or on any token error from {@link renderTemplate}.
 *
 * @evidence contracts/common.md#principled-implementation Collisions are found by sorting rendered entries by output path, then source path, and comparing neighbours, which detects a duplicate whenever one exists and reports the smallest colliding path regardless of input order; string relational operators compare UTF-16 code units, so the order does not depend on the host locale; `Object.defineProperty` on a null-prototype object stores `__proto__` as data instead of invoking the setter.
 * @evidence contracts/common.md#clear-and-simple-design The function owns line endings, path rendering, the `.gitignore` rename, and collision refusal for an explicit source list, while `renderScaffold` owns reading the scaffold from disk, so this step works on any list without file-system access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `_gitignore` rename is the one path special case, and its basis is npm's documented renaming of `.gitignore` in packed packages; a collision is refused rather than resolved by keeping either source.
 * @evidence contracts/common.md#meaningful-documentation The comment states the normalization, the path rules and the rename, what a collision reports and that it is order independent, the null prototype, and what throws.
 * @evidence contracts/performance.md#efficient-algorithms Rendering is linear in total content and path length; collision detection sorts a copy of the n entries once, n log n comparisons, which keeps the deterministic smallest-collision report that a hash set would lose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every entry renders distinct text once; there is no repeated computation within a call, and a new call receives a new source list.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The rendered list and its sorted copy live only for the call; the returned map holds one string per entry and is owned by the caller.
 */
export const renderScaffoldEntries: (entries: readonly IAutoMovieScaffoldSourceEntry[], variables: Readonly<Record<string, string>>) => Record<string, string> = (
  entries: readonly IAutoMovieScaffoldSourceEntry[],
  variables: Readonly<Record<string, string>>,
): Record<string, string> => {
  const rendered: IRenderedScaffoldEntry[] = entries.map(
    (entry: IAutoMovieScaffoldSourceEntry): IRenderedScaffoldEntry => ({
      content: renderTemplate(normalizeLineEndings(entry.content), variables),
      relative: renderKey(entry.relative, variables),
      source: toPosix(entry.relative),
    }),
  );
  const ordered: IRenderedScaffoldEntry[] = [...rendered].sort(
    (left: IRenderedScaffoldEntry, right: IRenderedScaffoldEntry): number =>
      left.relative < right.relative
        ? -1
        : left.relative > right.relative
          ? 1
          : left.source < right.source
            ? -1
            : left.source > right.source
              ? 1
              : 0,
  );
  for (let index: number = 1; index < ordered.length; index++) {
    const previous: IRenderedScaffoldEntry = ordered[index - 1]!;
    const current: IRenderedScaffoldEntry = ordered[index]!;
    if (previous.relative === current.relative)
      throw new Error(
        `scaffold sources collide at rendered path "${current.relative}": "${previous.source}", "${current.source}"`,
      );
  }
  const files: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  for (const entry of rendered)
    Object.defineProperty(files, entry.relative, {
      configurable: true,
      enumerable: true,
      value: entry.content,
      writable: true,
    });
  return files;
};
