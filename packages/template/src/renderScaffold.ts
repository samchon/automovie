import * as fs from "node:fs";
import * as path from "node:path";

import { AUTOMOVIE_TEMPLATE_VERSIONS } from "./AUTOMOVIE_TEMPLATE_VERSIONS";
import type { IAutoMovieScaffoldProps } from "./IAutoMovieScaffoldProps";
import type { IAutoMovieScaffoldSourceEntry } from "./IAutoMovieScaffoldSourceEntry";
import { SCAFFOLD_SYNC_STATE_FILE } from "./SCAFFOLD_SYNC_STATE_FILE";
import { createScaffoldSyncState } from "./createScaffoldSyncState";
import { listAutoMovieScaffoldFiles } from "./listAutoMovieScaffoldFiles";
import { renderScaffoldEntries } from "./renderScaffoldEntries";
import { scaffoldAssetDirectory } from "./scaffoldAssetDirectory";

/**
 * Render the bundled scaffold into an in-memory `{ posixPath: content }` map.
 *
 * Every shipped file under the package's `scaffold` directory is read as UTF-8, its line endings normalized to LF, and its `{{name}}` and `{{version:<key>}}` tokens replaced: the name from `props`, the versions from the build-time {@link AUTOMOVIE_TEMPLATE_VERSIONS}. The root `_gitignore` stand-in is returned as `.gitignore`. The returned map includes generated instruction digests for explicit later sync. Nothing is written; {@link publishFiles} and {@link writeFiles} write the map.
 *
 * The name is trimmed, then refused when empty, `.` or `..`, ending in `.`, containing `<>:"/\|?*` or an ASCII control character, or matching the ASCII device-name pattern `con`, `prn`, `aux`, `nul`, `com1` through `com9`, or `lpt1` through `lpt9`, with or without an extension. These checks prevent separators and JSON string delimiters; they do not establish npm package-name validity or every filesystem's name and length restrictions.
 *
 * @param props The project's name.
 * @returns The rendered file map.
 * @throws When the name is refused, when the scaffold directory is missing, or on a token error or path collision from {@link renderScaffoldEntries}.
 *
 * @evidence contracts/common.md#principled-implementation After trim, explicit separator, ASCII control and device-name checks refuse the listed unsafe names; excluding quote, backslash and ASCII controls keeps plain substitution inside package.json's JSON string valid. This is a partial filename policy rather than npm-name or universal filesystem validation; installed scaffold files are read as UTF-8 text.
 * @evidence contracts/common.md#clear-and-simple-design The function joins three owned steps: `scaffoldAssetDirectory` finds the assets, `listAutoMovieScaffoldFiles` decides what ships, and `renderScaffoldEntries` renders and checks collisions; it owns only the name rule and the variable table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The only variables are the name and the generated version table, with no per-file exception; a failure in any step throws instead of returning a partial map.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is read, which tokens are replaced and from where, the `.gitignore` rename, that nothing is written, every name refusal and why it matters, and what throws.
 * @evidence contracts/performance.md#efficient-algorithms The owner walks directories once, reads each file once and renders each content and path once. Directory entry sorts and the rendered n-entry collision sort add comparison costs driven by entry counts and path lengths; token search and output construction follow renderTemplate's cost. The fixed version table is built once per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call reads the scaffold as installed now and is made once per CLI run, so no earlier render is equivalent to reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Reads use `readFileSync`, which closes each file before returning; the source list lives only for the call, and the returned map, which holds the whole rendered scaffold in memory, is owned by the caller.
 */
export const renderScaffold: (
  props: IAutoMovieScaffoldProps,
) => Record<string, string> = (
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
  const files: Record<string, string> = renderScaffoldEntries(
    listAutoMovieScaffoldFiles(root).map(
      (relative: string): IAutoMovieScaffoldSourceEntry => ({
        content: fs.readFileSync(path.join(root, relative), "utf8"),
        relative,
      }),
    ),
    variables,
  );
  if (SCAFFOLD_SYNC_STATE_FILE in files)
    throw new Error("The scaffold reserves its generated sync-state address.");
  files[SCAFFOLD_SYNC_STATE_FILE] = createScaffoldSyncState(files);
  return files;
};
