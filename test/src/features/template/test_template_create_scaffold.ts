import {
  type IAutoMovieScaffoldProps,
  createAutoMovieScaffold,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

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

const ROOT: string = path.resolve(__dirname, "../../../..");

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
 *    `pnpm-workspace.yaml`, which lists packages only for `workspace`.
 * 3. Only `production` and `workspace-production` carry `evidence.config.ts`,
 *    which names a skills root only inside a workspace.
 * 4. A refused name throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public `createAutoMovieScaffold` for every kind and asserts what the function decides — the selected layers, the generated files, the name and the catalog ranges — catching a wrong kind branch, an unresolved or stale catalog entry or an unrendered name, without asserting the static scaffold text the function copies.
 * @evidence contracts/development/testing.md#independent-expectations Ranges are read from the repository's `pnpm-workspace.yaml` and the automovie range from the template's `package.json`, not from the build output the function reads.
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
