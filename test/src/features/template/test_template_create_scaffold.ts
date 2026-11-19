import {
  type IAutoMovieScaffoldProps,
  createAutoMovieScaffold,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

import { repositoryRoot } from "../internal/repositoryRoot";

interface IWorkspaceYaml {
  packages?: string[];
  catalogs: Record<string, Record<string, string>>;
}

interface IManifest {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const ROOT: string = repositoryRoot();

/**
 * `createAutoMovieScaffold` selects layers and generated files by kind, names
 * the package, and resolves every `catalog:` dependency.
 *
 * Scenarios:
 *
 * 1. Each kind names its `package.json` as requested, and every dependency
 *    resolves through the generated catalogs: `automovie` at the template's own
 *    version, every other catalog at the repository's range.
 * 2. Only `production` and `workspace` carry the instructions and a
 *    `pnpm-workspace.yaml`, which lists packages only for `workspace`. Both
 *    omit the source note and leave one blank line between heading and body.
 * 3. Only `production` and `workspace-production` carry `evidence.config.ts`,
 *    which names a skills root only inside a workspace.
 * 4. A refused name throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public generator for every kind and checks the selected files, name, catalog ranges and installed guide. Leaking a citation or dropping part of the guide changes the expected output.
 * @evidence contracts/development/testing.md#independent-expectations Ranges come from the repository catalogs and template manifest. The expected guide is the authored Markdown with its source paragraph omitted, so its rules, links and paragraph breaks must survive installation.
 * @evidence contracts/development/testing.md#distinguishing-cases The three kinds differ in instructions, workspace file, packages and evidence configuration, and the refused name pins admission.
 * @evidence contracts/development/testing.md#execution-ownership A unit test discovered by the `test_` prefix that reads the installed template in-process and writes nothing.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the behavior under test and lists each scenario with the property it pins.
 */
export function test_template_create_scaffold(): void {
  const repository: IWorkspaceYaml = parse(
    fs.readFileSync(path.join(ROOT, "pnpm-workspace.yaml"), "utf8"),
  ) as IWorkspaceYaml;
  const version: string = (
    JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "packages/template/package.json"),
        "utf8",
      ),
    ) as IManifest
  ).version;
  const create = (
    kind: IAutoMovieScaffoldProps["kind"],
  ): Record<string, string> => createAutoMovieScaffold({ kind, name: kind });
  const production: Record<string, string> = create("production");
  const workspace: Record<string, string> = create("workspace");
  const member: Record<string, string> = create("workspace-production");
  const catalogs: IWorkspaceYaml["catalogs"] = (
    parse(production["pnpm-workspace.yaml"]!) as IWorkspaceYaml
  ).catalogs;

  // 1. Name and catalog resolution.
  for (const [kind, files] of [
    ["production", production],
    ["workspace", workspace],
    ["workspace-production", member],
  ] as const) {
    const manifest: IManifest = JSON.parse(files["package.json"]!) as IManifest;
    TestValidator.equals(`${kind} name`, manifest.name, kind);
    for (const [dependency, specifier] of Object.entries({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })) {
      const catalog: string = specifier.replace(/^catalog:/u, "");
      TestValidator.equals(
        `${kind} ${dependency}`,
        catalogs[catalog]?.[dependency],
        catalog === "automovie"
          ? `^${version}`
          : repository.catalogs[catalog]?.[dependency],
      );
    }
  }

  // 2. Instructions and the workspace file.
  TestValidator.equals(
    "instructions",
    [production, workspace, member].map(
      (files: Record<string, string>): boolean => "AGENTS.md" in files,
    ),
    [true, true, false],
  );
  TestValidator.equals(
    "packages",
    [production, workspace].map(
      (files: Record<string, string>): string[] | undefined =>
        (parse(files["pnpm-workspace.yaml"]!) as IWorkspaceYaml).packages,
    ),
    [undefined, ["movies/shorts/*", "movies/series/*", "packages/*"]],
  );
  TestValidator.equals(
    "workspace production has no workspace file",
    "pnpm-workspace.yaml" in member,
    false,
  );

  const guide: string = ".agents/skills/story/layers/notation.md";
  const manuscript: string = fs.readFileSync(
    path.join(ROOT, "packages/template/scaffold/instructions", guide),
    "utf8",
  );
  const installed: string = manuscript
    .replaceAll("\r\n", "\n")
    .split("\n\n")
    .filter(
      (paragraph: string): boolean => !paragraph.startsWith("<!-- @source "),
    )
    .join("\n\n");
  TestValidator.equals("production guide", production[guide], installed);
  TestValidator.equals("workspace guide", workspace[guide], installed);

  // 3. Evidence configuration.
  TestValidator.equals(
    "evidence skills root",
    [production, workspace, member].map(
      (files: Record<string, string>): string | null | undefined =>
        files["evidence.config.ts"] === undefined
          ? undefined
          : (/skills: "([^"]+)"/u.exec(files["evidence.config.ts"])?.[1] ??
            null),
    ),
    [null, undefined, "../../../.agents/skills"],
  );

  // 4. The name rule.
  TestValidator.error("refused name", () =>
    createAutoMovieScaffold({ kind: "production", name: "a/b" }),
  );
}
