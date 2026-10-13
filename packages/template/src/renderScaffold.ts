import * as fs from "node:fs";
import * as path from "node:path";

import type { IAutoMovieScaffoldProps } from "./IAutoMovieScaffoldProps";
import type { IAutoMovieScaffoldSourceEntry } from "./IAutoMovieScaffoldSourceEntry";
import { listAutoMovieScaffoldFiles } from "./listAutoMovieScaffoldFiles";
import { renderScaffoldEntries } from "./renderScaffoldEntries";
import { scaffoldAssetDirectory } from "./scaffoldAssetDirectory";
import { AUTOMOVIE_TEMPLATE_VERSIONS } from "./templateVersions";

/**
 * Render the bundled scaffold into an in-memory `{ posixPath: content }` map.
 *
 * Every shipped file under the package's `scaffold` directory is read as
 * UTF-8, its line endings normalized to LF, and its `{{name}}` and
 * `{{version:<key>}}` tokens replaced: the name from `props`, the versions
 * from the build-time {@link AUTOMOVIE_TEMPLATE_VERSIONS}. The root
 * `_gitignore` stand-in is returned as `.gitignore`. Nothing is written;
 * {@link publishFiles} and {@link writeFiles} write the map.
 *
 * The name is trimmed, then refused when empty, `.` or `..`, ending in `.`,
 * containing `<>:"/\|?*` or a control character, or equal to a reserved
 * Windows device name such as `con` or `lpt1`, with or without an extension.
 * It therefore fits one directory segment on every platform and needs no
 * escaping inside the JSON string of `package.json`.
 *
 * @param props The project's name.
 * @returns The rendered file map.
 * @throws When the name is refused, when the scaffold directory is missing, or
 *   on a token error or path collision from {@link renderScaffoldEntries}.
 *
 * @evidence contracts/common.md#principled-implementation The name rule is the intersection of Windows file-name restrictions and POSIX segment rules, checked after `trim` so surrounding whitespace is normalized instead of refused; the excluded quote, backslash, and control characters are also the ones JSON would need to escape, which keeps the plain token substitution into `package.json` valid; files are read as UTF-8 because the scaffold is text only.
 * @evidence contracts/common.md#clear-and-simple-design The function joins three owned steps: `scaffoldAssetDirectory` finds the assets, `listAutoMovieScaffoldFiles` decides what ships, and `renderScaffoldEntries` renders and checks collisions; it owns only the name rule and the variable table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The only variables are the name and the generated version table, with no per-file exception; a failure in any step throws instead of returning a partial map.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is read, which tokens are replaced and from where, the `.gitignore` rename, that nothing is written, every name refusal and why it matters, and what throws.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in the total scaffold size: one directory walk, one read per file, and one render pass per file; the variable table is built once per call from a fixed set of keys.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call reads the scaffold as installed now and is made once per CLI run, so no earlier render is equivalent to reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Reads use `readFileSync`, which closes each file before returning; the source list lives only for the call, and the returned map, which holds the whole rendered scaffold in memory, is owned by the caller.
 */
export const renderScaffold = (
  props: IAutoMovieScaffoldProps,
): Record<string, string> => {
  const name: string = props.name.trim();
  if (name.length === 0) throw new Error("scaffold requires a project name");
  if (
    name === "." ||
    name === ".." ||
    name.endsWith(".") ||
    /[<>:"/\\|?*\u0000-\u001f]/u.test(name) ||
    /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(name)
  )
    throw new Error(
      `scaffold project name "${name}" must be one portable directory segment`,
    );
  const variables: Record<string, string> = { name };
  for (const [key, value] of Object.entries(AUTOMOVIE_TEMPLATE_VERSIONS))
    variables[`version:${key}`] = value;

  const root: string = scaffoldAssetDirectory();
  return renderScaffoldEntries(
    listAutoMovieScaffoldFiles(root).map(
      (relative: string): IAutoMovieScaffoldSourceEntry => ({
        content: fs.readFileSync(path.join(root, relative), "utf8"),
        relative,
      }),
    ),
    variables,
  );
};
