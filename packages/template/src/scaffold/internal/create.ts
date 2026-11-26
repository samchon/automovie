import * as fs from "node:fs";
import * as path from "node:path";

import type { AutoMovieTemplateScaffoldProps } from "../AutoMovieTemplateScaffoldProps";
import { assertProjectName } from "./assertProjectName";
import { listFiles } from "./listFiles";
import { renderWorkspace } from "./renderWorkspace";
import { sharedSkillPath } from "./sharedSkillPath";

/**
 * Create the files of a new AutoMovie installation as a `{ posixPath: content
 * }` map.
 *
 * The map joins scaffold layers with generated files, by `kind`:
 *
 * - `production`: the `instructions` and `production` layers,
 *   `pnpm-workspace.yaml` with catalogs and no packages, and
 *   `evidence.config.ts` reading the production's own `.agents/skills`.
 * - `workspace`: the `instructions` and `workspace` layers, and
 *   `pnpm-workspace.yaml` listing `movies/shorts/*`, `movies/series/*` and
 *   `packages/*` with the same catalogs.
 * - `workspace-production`: the `production` layer, and `evidence.config.ts`
 *   reading the workspace root's `../../../.agents/skills`.
 *
 * A `$<name>` placeholder under a layer's `.agents/skills` is replaced by the
 * repository skill item the build copied to `generated/skills`. A layer's root
 * `_gitignore` becomes `.gitignore`, because npm pack renames a packed
 * `.gitignore`. `{{name}}` becomes the admitted name and `{{skills}}` the path
 * of the skills the production reads. Line endings become LF. Every
 * `package.json` dependency is a `catalog:` reference: the `automovie` catalog
 * ranges this package's own version, and the others carry the ranges the build
 * read from the repository's `pnpm-workspace.yaml`.
 *
 * Instruction Markdown omits reserved `<!-- @source ... -->` lines after shared
 * skills are expanded. A source paragraph leaves one blank line between its
 * heading and the body.
 *
 * Nothing is written; the caller writes the map.
 *
 * @param props The installation kind and its name.
 * @returns The files, keyed by path relative to the installation directory.
 * @throws When the name is refused, when the build outputs are missing, or when
 *   two sources produce the same path.
 */
export const create: (
  props: AutoMovieTemplateScaffoldProps,
) => Record<string, string> = (
  props: AutoMovieTemplateScaffoldProps,
): Record<string, string> => {
  const name: string = assertProjectName(props.name);
  const skills: string =
    props.kind === "workspace-production"
      ? "../../../.agents/skills"
      : ".agents/skills";
  const files: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  const add = (relative: string, content: string): void => {
    if (relative in files)
      throw new Error(`scaffold sources collide at "${relative}"`);
    files[relative] = content
      .replaceAll("\r\n", "\n")
      .replaceAll("{{name}}", name)
      .replaceAll("{{skills}}", skills);
  };

  if (props.kind !== "workspace-production") readLayer("instructions", add);
  readLayer(props.kind === "workspace" ? "workspace" : "production", add);
  if (props.kind !== "workspace-production")
    add("pnpm-workspace.yaml", renderWorkspace(props.kind));
  if (props.kind !== "workspace")
    add(
      "evidence.config.ts",
      renderEvidenceConfig(props.kind === "workspace-production"),
    );
  return files;
};

/** The package root is three levels above this module in source and output. */
const PACKAGE: string = path.resolve(__dirname, "../../..");

/**
 * Pass every file of one scaffold layer to `add`, expanding shared-skill
 * placeholders and renaming the root `_gitignore`.
 */
const readLayer = (
  layer: "instructions" | "production" | "workspace",
  add: (relative: string, content: string) => void,
): void => {
  const root: string = path.join(PACKAGE, "scaffold", layer);

  /** Strip the source note while keeping one of its surrounding blank lines. */
  const read = (file: string): string => {
    const text: string = fs.readFileSync(file, "utf8");
    return layer === "instructions" && file.endsWith(".md")
      ? text.replace(
          /(?<=^|\n)(\r?\n)?<!-- @source (?:(?!-->)[^\r\n])+ -->[ \t]*(?:\r?\n|$)(\r?\n)?/gu,
          (_: string, before?: string, after?: string): string =>
            before ?? after ?? "",
        )
      : text;
  };

  for (const relative of listFiles(root)) {
    const shared: string | null = sharedSkillPath(relative);
    if (shared === null) {
      add(
        relative === "_gitignore" ? ".gitignore" : toPosix(relative),
        read(path.join(root, relative)),
      );
      continue;
    }
    const item: string = path.join(PACKAGE, "generated", "skills", shared);
    const target: string = `.agents/skills/${shared}`;
    if (fs.statSync(item).isDirectory())
      for (const file of listFiles(item))
        add(`${target}/${toPosix(file)}`, read(path.join(item, file)));
    else add(target, read(item));
  }
};

/**
 * The `evidence.config.ts` of a production, reading its own skills or, inside a
 * workspace, the root's.
 */
const renderEvidenceConfig = (workspace: boolean): string =>
  [
    `import { AutoMovieEvidenceConfig } from "@automovie/evidence";`,
    ``,
    workspace
      ? `/** The default project checks source and tests without selecting a narrative, against the workspace root's skills. */`
      : `/** The default project checks source and tests without selecting a narrative. */`,
    `export default AutoMovieEvidenceConfig.create({`,
    `  location: import.meta.dirname,`,
    ...(workspace ? [`  skills: "../../../.agents/skills",`] : []),
    `});`,
    ``,
  ].join("\n");

const toPosix = (relative: string): string =>
  relative.split(path.sep).join("/");
