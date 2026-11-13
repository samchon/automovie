import * as fs from "node:fs";
import * as path from "node:path";
import { stringify } from "yaml";

import type { IAutoMovieScaffoldProps } from "./IAutoMovieScaffoldProps";
import { assertScaffoldProjectName } from "./assertScaffoldProjectName";
import { listAutoMovieScaffoldFiles } from "./listAutoMovieScaffoldFiles";
import { scaffoldSharedSkillPath } from "./scaffoldSharedSkillPath";

/** The package root: `src` under ttsx and `lib` when published both sit one level below it. */
const PACKAGE: string = path.resolve(__dirname, "..");

/** The pnpm settings `build/prepare.ts` reads from the repository's own `pnpm-workspace.yaml`. */
interface IScaffoldPnpmSettings {
  /** Names of the packages in the `automovie` catalog, whose range is this package's own version. */
  automovie: string[];

  /** Every other catalog the scaffold's `package.json` files reference, with the repository's ranges. */
  catalogs: Record<string, Record<string, string>>;

  /** The repository's dependency build policy. */
  allowBuilds: Record<string, boolean>;
}

/**
 * Create the files of a new AutoMovie installation as a `{ posixPath: content }` map.
 *
 * The map joins scaffold layers with generated files, by `kind`:
 *
 * - `production`: the `instructions` and `production` layers, `pnpm-workspace.yaml` with catalogs and no packages, and `evidence.config.ts` reading the production's own `.agents/skills`.
 * - `workspace`: the `instructions` and `workspace` layers, and `pnpm-workspace.yaml` listing `movies/shorts/*`, `movies/series/*` and `packages/*` with the same catalogs.
 * - `workspace-production`: the `production` layer, and `evidence.config.ts` reading the workspace root's `../../../.agents/skills`.
 *
 * A `$<name>` placeholder under a layer's `.agents/skills` is replaced by the repository skill item the build copied to `generated/skills`. A layer's root `_gitignore` becomes `.gitignore`, because npm pack renames a packed `.gitignore`. `{{name}}` becomes the admitted name and `{{skills}}` the path of the skills the production reads. Line endings become LF. Every `package.json` dependency is a `catalog:` reference: the `automovie` catalog ranges this package's own version, and the others carry the ranges the build read from the repository's `pnpm-workspace.yaml`.
 *
 * Nothing is written; the caller writes the map.
 *
 * @param props The installation kind and its name.
 * @returns The files, keyed by path relative to the installation directory.
 * @throws When the name is refused, when the build outputs are missing, or when two sources produce the same path.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Layers are read from the installed package, so the map always matches the shipped scaffold. Catalog ranges come from the build's record of the repository catalogs and the automovie range from this package's own manifest, so a workspace and its productions resolve the release the package belongs to. A duplicate path throws instead of keeping either source.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function owns the whole map for every kind; the kind decides only which layers are read and which generated files are added, and writing is left to the caller.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No file is named except the generated `pnpm-workspace.yaml` and `evidence.config.ts`, whose content differs by kind, and the root `_gitignore`, whose rename npm pack forces.
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists every kind's layers and generated files, the placeholder, rename, token and line-ending rules, the version sources, and what throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each shipped file is listed and read once, and each content is scanned once for tokens and line endings, so the cost is linear in the scaffold's size plus each directory's sort.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads the scaffold as installed now, once per creation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Files are read with `readFileSync`, which releases its handle before returning; only the returned map, owned by the caller, outlives the call.
 */
export const createAutoMovieScaffold: (
  props: IAutoMovieScaffoldProps,
) => Record<string, string> = (
  props: IAutoMovieScaffoldProps,
): Record<string, string> => {
  const name: string = assertScaffoldProjectName(props.name);
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
    add("pnpm-workspace.yaml", renderPnpmWorkspace(props.kind === "workspace"));
  if (props.kind !== "workspace")
    add(
      "evidence.config.ts",
      renderEvidenceConfig(props.kind === "workspace-production"),
    );
  return files;
};

/** Pass every file of one scaffold layer to `add`, expanding shared-skill placeholders and renaming the root `_gitignore`. */
const readLayer = (
  layer: "instructions" | "production" | "workspace",
  add: (relative: string, content: string) => void,
): void => {
  const root: string = path.join(PACKAGE, "scaffold", layer);
  for (const relative of listAutoMovieScaffoldFiles(root)) {
    const shared: string | null = scaffoldSharedSkillPath(relative);
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
      for (const file of listAutoMovieScaffoldFiles(item))
        add(`${target}/${toPosix(file)}`, read(path.join(item, file)));
    else add(target, read(item));
  }
};

/** The `pnpm-workspace.yaml` of a single production, or with `packages` of a workspace root. */
const renderPnpmWorkspace = (packages: boolean): string => {
  const settings: IScaffoldPnpmSettings = JSON.parse(
    read(path.join(PACKAGE, "generated", "pnpm-workspace.json")),
  ) as IScaffoldPnpmSettings;
  const manifest: { version: string } = JSON.parse(
    read(path.join(PACKAGE, "package.json")),
  ) as { version: string };
  return stringify({
    ...(packages
      ? { packages: ["movies/shorts/*", "movies/series/*", "packages/*"] }
      : {}),
    catalogs: {
      automovie: Object.fromEntries(
        settings.automovie.map((key: string): [string, string] => [
          key,
          `^${manifest.version}`,
        ]),
      ),
      ...settings.catalogs,
    },
    allowBuilds: settings.allowBuilds,
  });
};

/** The `evidence.config.ts` of a production, reading its own skills or, inside a workspace, the root's. */
const renderEvidenceConfig = (workspace: boolean): string =>
  [
    `import { createEvidenceConfig } from "@automovie/evidence";`,
    ``,
    workspace
      ? `/** The default project checks source and tests without selecting a narrative, against the workspace root's skills. */`
      : `/** The default project checks source and tests without selecting a narrative. */`,
    `export default createEvidenceConfig({`,
    `  location: import.meta.dirname,`,
    ...(workspace ? [`  skills: "../../../.agents/skills",`] : []),
    `});`,
    ``,
  ].join("\n");

const read = (file: string): string => fs.readFileSync(file, "utf8");

const toPosix = (relative: string): string =>
  relative.split(path.sep).join("/");
