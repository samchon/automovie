import * as fs from "node:fs";
import * as path from "node:path";

import type { IAutoMovieScaffoldProps } from "./IAutoMovieScaffoldProps";
import { listAutoMovieScaffoldFiles } from "./listAutoMovieScaffoldFiles";
import { renderAutoMovieLanguageContracts } from "./renderAutoMovieLanguageContracts";
import { renderScaffoldEntries } from "./renderScaffoldEntries";
import { scaffoldAssetDirectory } from "./scaffoldAssetDirectory";
import { AUTOMOVIE_TEMPLATE_VERSIONS } from "./templateVersions";
import {
  validateAutoMovieInstructionDocumentLinks,
  validateAutoMovieSkillRouterLinks,
} from "./instructionRoutes";

/**
 * Render the bundled scaffold into an in-memory `{ posixPath: content }` map:
 * read every asset, normalize line endings, substitute `{{name}}` and the
 * catalog-resolved `{{version:*}}` tokens, and restore the root pack-safe
 * `_gitignore` stand-in to the installed `.gitignore` identity.
 *
 * The map is deliberately not written to disk here (that is {@link writeFiles}'s
 * job). Callers can inspect the returned candidate or pass it directly to the
 * bounded writer without an intermediate file or persisted project state.
 *
 * @author Samchon
 */
export const renderScaffold = (
  props: IAutoMovieScaffoldProps,
): Record<string, string> => {
  const name = props.name.trim();
  if (name.length === 0) throw new Error("scaffold requires a project name");
  // A trailing space cannot survive `trim`, so refusing one here would be a
  // rule no input can break: such a name is normalized rather than rejected.
  // A trailing dot is not whitespace and reaches this rule intact, which is
  // why only that half of the Windows restriction is stated.
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
  const variables: Record<string, string> = { name, language: props.language };
  for (const [key, value] of Object.entries(AUTOMOVIE_TEMPLATE_VERSIONS))
    variables[`version:${key}`] = value;

  const root = scaffoldAssetDirectory();
  const languageEntries = Object.entries(
    renderAutoMovieLanguageContracts({ language: props.language }),
  ).map(([relative, content]) => ({ content, relative }));
  const files = renderScaffoldEntries(
    [
      ...listAutoMovieScaffoldFiles(root).map((relative) => ({
        content: fs.readFileSync(path.join(root, relative), "utf8"),
        relative,
      })),
      ...languageEntries,
    ],
    variables,
  );
  const instructionSources = Object.entries(files).map(([path, content]) => ({
    path,
    content,
  }));
  validateAutoMovieSkillRouterLinks(instructionSources);
  validateAutoMovieInstructionDocumentLinks(instructionSources, "AGENTS.md");
  return files;
};
