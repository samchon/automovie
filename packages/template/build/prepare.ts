// Prepare what `AutoMovieTemplateScaffold.create` reads from `generated`, which git
// ignores and the package publishes:
//
// - `generated/skills`: the repository skill items the scaffold's `$<name>`
//   placeholders name, ready for expansion by the scaffold reader;
// - `generated/sections`: root skill Markdown sources referenced by section
//   markers, validated before the scaffold reader expands them;
// - `generated/pnpm-workspace.json`: the ranges of every `catalog:` reference
//   in the scaffold's package.json files, read from the repository's own
//   pnpm-workspace.yaml, with its build policy. The `automovie` catalog lists
//   names only; its range is the template's own version, read at creation.
import {
  cpSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative as relativePath, resolve, sep } from "node:path";
import { parse } from "yaml";

import { listFiles } from "../src/scaffold/internal/listFiles";
import { sharedSkillPath } from "../src/scaffold/internal/sharedSkillPath";
import { transcludeMarkdownSection } from "../src/scaffold/internal/transcludeMarkdownSection";

const ROOT: string = resolve(__dirname, "../../..");
const SCAFFOLD: string = resolve(__dirname, "../scaffold");
const GENERATED: string = resolve(__dirname, "../generated");

// Rebuilt whole, so an item a placeholder no longer names cannot ship.
rmSync(GENERATED, { force: true, recursive: true });
for (const relative of listFiles(resolve(SCAFFOLD, "instructions"))) {
  if (!relative.endsWith(".md")) continue;
  const scaffoldFile: string = resolve(SCAFFOLD, "instructions", relative);
  const markdown: string = readFileSync(scaffoldFile, "utf8");
  const sectionSource: string | null = transcludeMarkdownSection.sourcePath(
    markdown,
    relative,
  );
  if (sectionSource === null) continue;

  const sourceRoot: string = resolve(ROOT, ".agents/skills");
  const source: string = resolve(ROOT, sectionSource);
  const sourceWithinRoot: string = relativePath(sourceRoot, source);
  if (
    sourceWithinRoot === ".." ||
    sourceWithinRoot.startsWith(`..${sep}`) ||
    sourceWithinRoot === "" ||
    sourceWithinRoot === "."
  )
    throw new Error(
      `section source "${sectionSource}" is not below the root skills directory`,
    );
  if (!lstatSync(source, { throwIfNoEntry: false })?.isFile())
    throw new Error(`section source "${sectionSource}" does not exist`);
  const sourceMarkdown: string = readFileSync(source, "utf8");
  transcludeMarkdownSection.expand(markdown, relative, sourceMarkdown);
  const destination: string = resolve(GENERATED, "sections", sectionSource);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, sourceMarkdown);
}

for (const relative of listFiles(resolve(SCAFFOLD, "instructions"))) {
  const shared: string | null = sharedSkillPath(relative);
  if (shared === null) continue;
  const destination: string = resolve(GENERATED, "skills", shared);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(resolve(ROOT, ".agents/skills", shared), destination, {
    recursive: true,
  });
}

const workspace: {
  catalogs: Record<string, Record<string, string>>;
  allowBuilds: Record<string, boolean>;
} = parse(readFileSync(resolve(ROOT, "pnpm-workspace.yaml"), "utf8"));
const automovie: Set<string> = new Set();
const catalogs: Record<string, Record<string, string>> = {};
for (const layer of ["production", "workspace"]) {
  const manifest: Record<string, Record<string, string> | undefined> =
    JSON.parse(readFileSync(resolve(SCAFFOLD, layer, "package.json"), "utf8"));
  for (const [key, specifier] of Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })) {
    if (!specifier.startsWith("catalog:"))
      throw new Error(
        `scaffold/${layer}/package.json: ${key} must use a catalog: reference`,
      );
    const catalog: string = specifier.slice("catalog:".length);
    if (catalog === "automovie") {
      automovie.add(key);
      continue;
    }
    const range: string | undefined = workspace.catalogs[catalog]?.[key];
    if (range === undefined)
      throw new Error(
        `scaffold/${layer}/package.json: ${key} names catalog:${catalog}, which pnpm-workspace.yaml lacks`,
      );
    (catalogs[catalog] ??= {})[key] = range;
  }
}
mkdirSync(GENERATED, { recursive: true });
writeFileSync(
  resolve(GENERATED, "pnpm-workspace.json"),
  JSON.stringify(
    {
      automovie: [...automovie].sort(),
      catalogs,
      allowBuilds: workspace.allowBuilds,
    },
    null,
    2,
  ),
);
