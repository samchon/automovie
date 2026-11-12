// Prepare what `createAutoMovieScaffold` reads from `generated`, which git
// ignores and the package publishes:
//
// - `generated/skills`: the repository skill items the scaffold's `$<name>`
//   placeholders name, so a production inherits them verbatim;
// - `generated/pnpm-workspace.json`: the ranges of every `catalog:` reference
//   in the scaffold's package.json files, read from the repository's own
//   pnpm-workspace.yaml, with its build policy. The `automovie` catalog lists
//   names only; its range is the template's own version, read at creation.
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { parse } from "yaml";

import { listAutoMovieScaffoldFiles } from "../src/listAutoMovieScaffoldFiles";
import { scaffoldSharedSkillPath } from "../src/scaffoldSharedSkillPath";

const ROOT: string = resolve(__dirname, "../../..");
const SCAFFOLD: string = resolve(__dirname, "../scaffold");
const GENERATED: string = resolve(__dirname, "../generated");

// Rebuilt whole, so an item a placeholder no longer names cannot ship.
rmSync(GENERATED, { force: true, recursive: true });
for (const relative of listAutoMovieScaffoldFiles(
  resolve(SCAFFOLD, "instructions"),
)) {
  const shared: string | null = scaffoldSharedSkillPath(relative);
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
