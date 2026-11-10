import {
  AUTOMOVIE_TEMPLATE_VERSIONS,
  SCAFFOLD_SYNC_STATE_FILE,
  renderScaffold,
  renderScaffoldInstructions,
  renderWorkspaceProductionScaffold,
  renderWorkspaceScaffold,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { throwsError } from "../internal/predicates";

/**
 * A single production, a workspace root and a workspace production compose the same scaffold layers without losing a link or a version.
 *
 * Scenarios:
 *
 * 1. The single production and the workspace root ship byte-identical instruction files, each with its sync state; a workspace production ships no instruction, state or root workspace file.
 * 2. The workspace root lists `movies/shorts/*`, `movies/series/*` and `packages/*`, and ships no production file.
 * 3. Every dependency of a workspace production is `catalog:<name>` and resolves, through the root's named catalogs and their anchors, to the single production's range; the root's `automovie` CLI resolves through `catalog:automovie` too.
 * 4. Every relative Markdown link a production README or PROJECT.md makes into `.agents/skills` lands on a shipped instruction file, both at a single production's root and three directories below a workspace root, and the evidence configuration names the same skills path.
 * 5. Each renderer refuses an unportable name.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Renders through the public renderers and inspects their maps, catching an instruction drift between layouts, a production leaking into a workspace root, a workspace production whose `catalog:` dependency has no catalog entry or a different range, a link or evidence root that misses the shared skills, and a renderer that skips the name rule.
 * @evidence contracts/development/testing.md#independent-expectations Expected paths come from the documented workspace layout (`movies/<family>/<name>`, root `.agents/skills`, `pnpm-workspace.yaml`), expected ranges from the exported version table, and link targets are checked against the separately rendered instruction surface rather than against the renderer under test.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both installation roots, the member directory depth, every dependency section, every skill link in both production documents, the CLI catalog entry, and refusals for each renderer.
 * @evidence contracts/development/testing.md#execution-ownership A unit test discovered by the `test_` prefix that renders in memory, writes no file and starts no process.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the behavior under test and lists each scenario with the property it pins.
 */
export function test_template_scaffold_workspace(): void {
  const instructions: Record<string, string> = renderScaffoldInstructions();
  const single: Record<string, string> = renderScaffold({ name: "solo" });
  const root: Record<string, string> = renderWorkspaceScaffold({
    name: "studio",
  });
  const member: Record<string, string> = renderWorkspaceProductionScaffold({
    name: "kickboxing",
  });

  // Both installation roots carry the same instruction bytes and their sync state.
  for (const [label, files] of [
    ["single", single],
    ["workspace", root],
  ] as const) {
    for (const [relative, content] of Object.entries(instructions))
      TestValidator.equals(
        `${label} ships ${relative}`,
        files[relative],
        content,
      );
    TestValidator.predicate(
      `${label} records sync state`,
      typeof files[SCAFFOLD_SYNC_STATE_FILE] === "string",
    );
  }
  TestValidator.predicate(
    "instructions include the router and skills",
    "AGENTS.md" in instructions &&
      Object.keys(instructions).some((file: string): boolean =>
        file.startsWith(".agents/skills/"),
      ),
  );
  for (const relative of [
    "AGENTS.md",
    "CLAUDE.md",
    SCAFFOLD_SYNC_STATE_FILE,
    "pnpm-workspace.yaml",
  ])
    TestValidator.equals(
      `member omits ${relative}`,
      member[relative],
      undefined,
    );
  TestValidator.predicate(
    "member ships no skills",
    Object.keys(member).every(
      (file: string): boolean => !file.startsWith(".agents/"),
    ),
  );

  // The workspace root lists its members and holds no production.
  const workspaceYaml: string = root["pnpm-workspace.yaml"]!;
  for (const glob of ["movies/shorts/*", "movies/series/*", "packages/*"])
    TestValidator.predicate(
      `workspace lists ${glob}`,
      workspaceYaml.includes(`  - ${glob}\n`),
    );
  for (const relative of ["PROJECT.md", "evidence.config.ts", "src/main.ts"])
    TestValidator.equals(`root omits ${relative}`, root[relative], undefined);

  // Every catalog dependency resolves to the single production's range.
  const catalogs: Map<string, Map<string, string>> = readCatalogs(
    workspaceYaml,
  );
  const singleManifest: IManifest = JSON.parse(single["package.json"]!);
  const memberManifest: IManifest = JSON.parse(member["package.json"]!);
  TestValidator.equals(
    "member package name",
    memberManifest.name,
    "kickboxing",
  );
  for (const section of ["dependencies", "devDependencies"] as const)
    for (const [dependency, specifier] of Object.entries(
      memberManifest[section] ?? {},
    )) {
      const range: string = singleManifest[section]![dependency]!;
      TestValidator.predicate(
        `${dependency} uses a named catalog`,
        specifier.startsWith("catalog:") && specifier !== "catalog:",
      );
      TestValidator.equals(
        `catalog range of ${dependency}`,
        catalogs.get(specifier.slice("catalog:".length))?.get(dependency),
        range,
      );
    }
  const rootManifest: IManifest = JSON.parse(root["package.json"]!);
  TestValidator.equals(
    "root CLI uses the catalog",
    rootManifest.devDependencies?.automovie,
    "catalog:automovie",
  );
  TestValidator.equals(
    "catalog CLI range",
    catalogs.get("automovie")?.get("automovie"),
    AUTOMOVIE_TEMPLATE_VERSIONS.cli,
  );

  // Skill links and the evidence root reach the shared tree from either depth.
  for (const [label, files, base, skills] of [
    ["single", single, "", ".agents/skills"],
    ["member", member, "movies/shorts/kickboxing/", "../../../.agents/skills"],
  ] as const) {
    TestValidator.predicate(
      `${label} evidence names its skills`,
      files["evidence.config.ts"]!.includes(`"${skills}"`),
    );
    for (const document of ["README.md", "PROJECT.md"]) {
      const links: string[] = [
        ...files[document]!.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/gu),
      ]
        .map((match: RegExpMatchArray): string => match[1]!)
        .filter((target: string): boolean => target.includes(".agents/skills"));
      TestValidator.predicate(
        `${label} ${document} links skills`,
        links.length > 0,
      );
      for (const target of links) {
        const resolved: string = path.posix.normalize(
          path.posix.join(base, target),
        );
        TestValidator.predicate(
          `${label} ${document} link ${target}`,
          resolved in instructions,
        );
      }
    }
  }

  // Every renderer applies the shared name rule.
  for (const render of [
    renderScaffold,
    renderWorkspaceScaffold,
    renderWorkspaceProductionScaffold,
  ])
    TestValidator.predicate(
      `${render.name} refuses a separator`,
      throwsError(
        (): unknown => render({ name: "a/b" }),
        "one portable directory segment",
      ),
    );
}

/** The dependency sections a rendered manifest can hold. */
interface IManifest {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/** Read the named `catalogs` of a rendered `pnpm-workspace.yaml`, whose entries are `    <name>: "<range>"`, `    <name>: &<anchor> "<range>"` or `    <name>: *<anchor>` lines under `  <catalog>:` headings, with optionally quoted names. */
function readCatalogs(yaml: string): Map<string, Map<string, string>> {
  const catalogs: Map<string, Map<string, string>> = new Map();
  const anchors: Map<string, string> = new Map();
  let inside: boolean = false;
  let current: Map<string, string> | undefined;
  for (const line of yaml.split("\n")) {
    if (/^\S/u.test(line)) {
      inside = line === "catalogs:";
      continue;
    }
    if (!inside) continue;
    const heading: RegExpMatchArray | null = line.match(/^ {2}([\w-]+):$/u);
    if (heading !== null) {
      current = new Map();
      catalogs.set(heading[1]!, current);
      continue;
    }
    const entry: RegExpMatchArray | null = line.match(
      /^ {4}"?([^":]+)"?: (?:&(\w+) )?(?:"([^"]+)"|\*(\w+))$/u,
    );
    if (entry === null || current === undefined) continue;
    const value: string | undefined =
      entry[3] !== undefined ? entry[3] : anchors.get(entry[4]!);
    if (value === undefined) continue;
    if (entry[2] !== undefined) anchors.set(entry[2], value);
    current.set(entry[1]!, value);
  }
  return catalogs;
}
