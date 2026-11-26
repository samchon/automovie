import { AutoMovieTemplateScaffold } from "@automovie/template";
import assert from "node:assert/strict";
import path from "node:path";
import { parse } from "yaml";

import { repositoryRoot } from "../internal/repositoryRoot";

/**
 * A production added to an older workspace resolves all its catalog references
 * and keeps the workspace's own dependencies, comments and installation
 * policy.
 *
 * Scenarios:
 *
 * 1. Registry pins, catalog links and overrides supply the appropriate
 *    resolutions.
 * 2. Aliases in either direction keep unrelated catalogs, overrides and a snapshot
 *    of all catalogs unchanged.
 * 3. A repeated add preserves the file's bytes. Absent catalogs are filled and
 *    malformed settings fail.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the template API used by add and checks its returned YAML against the generated production manifest and the pre-existing workspace choices.
 * @evidence contracts/development/testing.md#independent-expectations The manifest supplies the required names. The fixture supplies the expected pins and links to real SDK package directories.
 * @evidence contracts/development/testing.md#distinguishing-cases Both SDK packages start missing. The same input with and without a linked SDK must produce different resolutions. Invalid input fails and a complete file survives byte-for-byte.
 * @evidence contracts/development/testing.md#execution-ownership The source and bundled runners invoke the template in-process with workspace YAML in memory and resolve the same repository SDK manifests.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the migration behavior and the cases that distinguish it.
 */
export function test_template_workspace_catalogs(): void {
  const directory: string = path.join(repositoryRoot(), "sample-workspace");
  const files: Record<string, string> = AutoMovieTemplateScaffold.create({
    name: "member",
    kind: "workspace-production",
  });
  const manifest: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  } = JSON.parse(files["package.json"]!);
  const dependencies: Record<string, string> = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
  };
  const complete = (source: string): string =>
    AutoMovieTemplateScaffold.renderWorkspace({ directory, source });
  for (const mode of ["registry", "catalog", "override"] as const) {
    const engine: string =
      mode === "catalog" ? "link:../packages/engine" : "1.2.3";
    const source: string = [
      "# keep the workspace owner's choices",
      "packages: [movies/shorts/*]",
      "pinned: &pinned",
      `  "@automovie/engine": ${engine}`,
      "catalogs:",
      "  automovie: *pinned",
      "  unrelated: *pinned",
      "  samchon: { ttsc: 1.0.0 }",
      "allowBuilds: { sharp: false }",
      ...(mode === "override"
        ? ["overrides:", '  "@automovie/engine": link:../packages/engine']
        : []),
      "",
    ].join("\n");
    const result: string = complete(source);
    const settings = parse(result);
    for (const [name, reference] of Object.entries(dependencies))
      assert.ok(
        settings.catalogs[reference.slice("catalog:".length)][name],
        name,
      );
    for (const name of ["archetypes", "motions"]) {
      const key: string = `@automovie/${name}`;
      assert.equal(dependencies[key], "catalog:automovie");
      const spec: string = settings.catalogs.automovie[key];
      if (mode === "registry") assert.match(spec, /^\^\d+/u);
      else assert.equal(spec, `link:../packages/${name}`);
    }
    assert.equal(settings.catalogs.automovie["@automovie/engine"], engine);
    assert.equal(settings.catalogs.samchon.ttsc, "1.0.0");
    assert.deepEqual(settings.catalogs.unrelated, {
      "@automovie/engine": engine,
    });
    assert.deepEqual(settings.packages, ["movies/shorts/*"]);
    assert.deepEqual(settings.allowBuilds, { sharp: false });
    assert.deepEqual(settings.overrides, parse(source).overrides);
    assert.ok(result.includes("# keep the workspace owner's choices"));
    const crlf: string = result.replaceAll("\n", "\r\n");
    assert.equal(complete(crlf), crlf);
  }
  assert.ok(
    parse(complete("packages: []\n")).catalogs.automovie["@automovie/motions"],
  );
  const anchored = parse(
    complete(
      [
        "catalogs: &all",
        "  automovie: &sdk {}",
        "  unrelated: *sdk",
        "overrides: *sdk",
        "originalCatalogs: *all",
      ].join("\n"),
    ),
  );
  assert.deepEqual(anchored.overrides, {});
  assert.deepEqual(anchored.catalogs.unrelated, {});
  assert.deepEqual(anchored.originalCatalogs, { automovie: {}, unrelated: {} });
  assert.ok(anchored.catalogs.automovie["@automovie/archetypes"]);
  for (const source of [
    "catalogs: [",
    "catalogs: []",
    "catalogs: { automovie: false }",
  ])
    assert.throws(() => complete(source));
}
