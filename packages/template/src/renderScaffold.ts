import { AUTOMOVIE_TEMPLATE_VERSIONS } from "./AUTOMOVIE_TEMPLATE_VERSIONS";
import type { IAutoMovieScaffoldProps } from "./IAutoMovieScaffoldProps";
import { SCAFFOLD_SYNC_STATE_FILE } from "./SCAFFOLD_SYNC_STATE_FILE";
import { createScaffoldSyncState } from "./createScaffoldSyncState";
import { readAutoMovieScaffoldSources } from "./readAutoMovieScaffoldSources";
import { renderScaffoldEntries } from "./renderScaffoldEntries";
import { scaffoldAssetDirectory } from "./scaffoldAssetDirectory";
import { scaffoldSharedSkillDirectory } from "./scaffoldSharedSkillDirectory";

/**
 * Render the bundled scaffold into an in-memory `{ posixPath: content }` map.
 *
 * Every shipped file under the package's `scaffold` directory is read as UTF-8, with each `$<name>` placeholder under `.agents/skills` replaced by the repository skill folder or file it names, as {@link readAutoMovieScaffoldSources} describes; each file's line endings are normalized to LF and its `{{name}}` and `{{version:<key>}}` tokens replaced: the name from `props`, the versions from the build-time {@link AUTOMOVIE_TEMPLATE_VERSIONS}. The root `_gitignore` stand-in is returned as `.gitignore`. The returned map includes generated instruction digests for explicit later sync. Nothing is written; {@link publishFiles} and {@link writeFiles} write the map.
 *
 * The name is trimmed, then refused when empty, `.` or `..`, ending in `.`, containing `<>:"/\|?*` or an ASCII control character, or matching the ASCII device-name pattern `con`, `prn`, `aux`, `nul`, `com1` through `com9`, or `lpt1` through `lpt9`, with or without an extension. These checks prevent separators and JSON string delimiters; they do not establish npm package-name validity or every filesystem's name and length restrictions.
 *
 * @param props The project's name.
 * @returns The rendered file map.
 * @throws When the name is refused, when the scaffold or shared-skill directory is missing, on a placeholder refusal from {@link readAutoMovieScaffoldSources}, or on a token error or path collision from {@link renderScaffoldEntries}.
 *
 * @evidence contracts/development/implementation.md#principled-implementation After trim, explicit separator, ASCII control and device-name checks refuse the listed unsafe names; excluding quote, backslash and ASCII controls keeps plain substitution inside package.json's JSON string valid. This is a partial filename policy rather than npm-name or universal filesystem validation; installed scaffold files are read as UTF-8 text.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The function joins owned steps: `scaffoldAssetDirectory` and `scaffoldSharedSkillDirectory` find the assets, `readAutoMovieScaffoldSources` reads what ships with placeholders expanded, and `renderScaffoldEntries` renders and checks collisions; it owns only the name rule and the variable table.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The only variables are the name and the generated version table, with no per-file exception; a failure in any step throws instead of returning a partial map.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what is read, that placeholders are expanded and where that is described, which tokens are replaced and from where, the `.gitignore` rename, that nothing is written, every name refusal and why it matters, and what throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms The owner walks the scaffold and each shared folder once, reads each file once and renders each content and path once. Directory entry sorts and the rendered n-entry collision sort add comparison costs driven by entry counts and path lengths; token search and output construction follow renderTemplate's cost. The fixed version table is built once per call.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads the scaffold as installed now and is made once per CLI run, so no earlier render is equivalent to reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reads use `readFileSync`, which closes each file before returning; the source list lives only for the call, and the returned map, which holds the whole rendered scaffold in memory, is owned by the caller.
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

  const files: Record<string, string> = renderScaffoldEntries(
    readAutoMovieScaffoldSources(
      scaffoldAssetDirectory(),
      scaffoldSharedSkillDirectory(),
    ),
    variables,
  );
  if (SCAFFOLD_SYNC_STATE_FILE in files)
    throw new Error("The scaffold reserves its generated sync-state address.");
  files[SCAFFOLD_SYNC_STATE_FILE] = createScaffoldSyncState(files);
  return files;
};
