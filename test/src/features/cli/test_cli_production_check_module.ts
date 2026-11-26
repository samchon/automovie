import { build } from "esbuild";
import assert from "node:assert/strict";
import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import { repositoryRoot } from "../internal/repositoryRoot";

/**
 * An editable verification entry can import additional TypeScript targets in
 * the layout the scaffold emits without compiling unrelated work.
 *
 * Scenarios:
 *
 * 1. A type-module production owns a verification module and one imported target
 *    next to it.
 * 2. An unrelated incomplete production module remains untouched. The imported
 *    target still participates in the selected required stage.
 * 3. Authored TypeScript and CommonJS retain their own source bytes when a runtime
 *    loader transforms modules. Installed and linked packages resolve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the native module boundary and unrelated-source control.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the actual CLI entry in the fixture directory and checks its output and status while Node loads the two authored TypeScript files.
 * @evidence contracts/development/testing.md#independent-expectations A disabled explicitly required row prevents stage completion, and unrelated invalid source must not prevent a read.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises an imported target with both ordinary status and explicit stage enforcement.
 * @evidence contracts/development/testing.md#execution-ownership Builds only the CLI into an owned temporary directory and waits for two local Node subprocesses; the fixture's production files are loaded by the command.
 */
export async function test_cli_production_check_module(): Promise<void> {
  const workspace: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-check-module-"),
  );
  const root: string = path.join(workspace, "production");
  const link: string = path.join(root, "node_modules", "linked-sdk");
  let linked: boolean = false;
  try {
    await fs.mkdir(root);
    const cli: string = path.join(root, "automovie.cjs");
    await build({
      entryPoints: [path.join(repositoryRoot(), "packages/cli/src/bin.ts")],
      bundle: true,
      platform: "node",
      format: "cjs",
      outfile: cli,
    });
    const executable: string = path.join(root, "src", "executable");
    await fs.mkdir(executable, { recursive: true });
    await fs.writeFile(
      path.join(root, "package.json"),
      '{"type":"module","imports":{"#other-target":"./src/executable/other.ts"}}\n',
    );
    await fs.writeFile(
      path.join(root, "src", "unrelated.ts"),
      "export const draft =",
    );
    await fs.writeFile(
      path.join(executable, "check.ts"),
      'import chair from "./chair.ts";\nexport default [chair];\n',
    );
    await fs.writeFile(
      path.join(executable, "chair.ts"),
      [
        'const stage: string = "handoff";',
        'export default { id:"chair", checks:[{ id:"fit", title:"Check the fit", scope:"support", enabled:false, kind:"measure", inputs:["src/executable/chair.ts"], unit:"m", minimum:0, measure: (): number => 1 }], required:{[stage]:["fit"]} };',
      ].join("\n"),
    );
    const env: NodeJS.ProcessEnv = nativeVerificationEnvironment();
    const execute = (
      args: readonly string[],
      nodeOptions: readonly string[] = [],
    ): SpawnSyncReturns<string> =>
      spawnSync(
        process.execPath,
        [...nodeOptions, cli, "check", "--subject", "chair", "--json", ...args],
        {
          cwd: root,
          encoding: "utf8",
          env,
          windowsHide: true,
          timeout: 20000,
        },
      );
    const verify = (...args: string[]): SpawnSyncReturns<string> =>
      execute(args);
    const status: SpawnSyncReturns<string> = verify();
    assert.ifError(status.error);
    assert.equal(status.status, 0, status.stderr);
    assert.match(status.stdout, /"state": "disabled"/u);
    const gate: SpawnSyncReturns<string> = verify("--require", "handoff");
    assert.ifError(gate.error);
    assert.equal(gate.status, 1, gate.stderr);
    assert.match(gate.stdout, /"blocked": true/u);

    const measureModule: string = path.join(executable, "chair.ts");
    const definition = (dependency: string, scoped: boolean = false): string =>
      [
        'import { readFileSync } from "node:fs";',
        dependency,
        'export default { id:"chair", checks:[{ id:"fit", title:"Check the fit", scope:"support", kind:"measure",',
        scoped ? 'source:"src/executable/chair.ts",' : "",
        'inputs:["model.txt"], unit:"cm", minimum:2, measure: (directory: string): number => Number(readFileSync(directory + "/model.txt", "utf8")) + adjustment }], required:{handoff:["fit"]} };',
      ].join("\n");
    const expect = (
      result: SpawnSyncReturns<string>,
      exit: number,
      state: string,
    ): void => {
      assert.ifError(result.error);
      assert.equal(result.status, exit, result.stderr);
      assert.match(result.stdout, new RegExp(`"state": "${state}"`, "u"));
    };
    await fs.writeFile(path.join(root, "model.txt"), "3");
    await fs.writeFile(
      measureModule,
      definition("const adjustment: number = 0;"),
    );
    expect(verify("--run", "--require", "handoff"), 0, "passed");

    const compilerPreload: string = path.join(executable, "compiler.cjs");
    await fs.writeFile(
      compilerPreload,
      [
        'const { registerHooks } = require("node:module");',
        'const { readFileSync } = require("node:fs");',
        "registerHooks({ load(url, context, next) {",
        '  if (url.endsWith("/cached.cjs")) return { format: "commonjs", shortCircuit: true, source: readFileSync(new URL(url), "utf8").replace("const value =", "const value = -100 +") };',
        "  const loaded = next(url, context);",
        '  if (!url.endsWith("/chair.ts")) return loaded;',
        '  return { ...loaded, source: Buffer.from(loaded.source).toString("utf8").replace("adjustment: number = 0", "adjustment: number = -100") };',
        "} });",
      ].join("\n"),
    );
    expect(
      execute(
        ["--run", "--require", "handoff"],
        ["--require", compilerPreload],
      ),
      0,
      "passed",
    );

    const linkedPackage: string = path.join(workspace, "linked-sdk");
    for (const directory of [
      path.join(root, "node_modules", "installed-sdk"),
      linkedPackage,
    ]) {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(
        path.join(directory, "package.json"),
        '{"type":"module","exports":"./index.js"}\n',
      );
      await fs.writeFile(
        path.join(directory, "index.js"),
        "export const adjustment = 0;\n",
      );
    }
    await fs.symlink(linkedPackage, link, "junction");
    linked = true;
    await fs.writeFile(
      measureModule,
      definition('import { adjustment } from "installed-sdk";'),
    );
    expect(verify("--run", "--require", "handoff"), 0, "passed");
    await fs.writeFile(
      measureModule,
      definition('import { adjustment } from "linked-sdk";'),
    );
    expect(verify("--run", "--require", "handoff"), 0, "passed");

    const aliasPreload: string = path.join(executable, "alias.cjs");
    const external: string = pathToFileURL(
      path.join(linkedPackage, "index.js"),
    ).href;
    await fs.writeFile(
      aliasPreload,
      [
        'const { registerHooks } = require("node:module");',
        "registerHooks({ resolve(specifier, context, next) {",
        '  if (specifier === "external-file" || specifier === "#external-file")',
        `    return next(${JSON.stringify(external)}, context);`,
        "  return next(specifier, context);",
        "} });",
      ].join("\n"),
    );
    for (const alias of ["external-file", "#external-file"]) {
      await fs.writeFile(
        measureModule,
        definition(`import { adjustment } from "${alias}";`),
      );
      const refused: SpawnSyncReturns<string> = execute(
        ["--run"],
        ["--require", aliasPreload],
      );
      assert.ifError(refused.error);
      assert.equal(refused.status, 1);
      assert.match(refused.stderr, /outside the project and its Git checkout/u);
    }
    for (const missing of ["./missing.ts", "#missing-target"]) {
      await fs.writeFile(
        measureModule,
        definition(`import { adjustment } from "${missing}";`),
      );
      const refused: SpawnSyncReturns<string> = verify("--run");
      assert.ifError(refused.error);
      assert.equal(refused.status, 1);
      assert.ok(
        refused.stderr.includes(path.basename(missing)),
        refused.stderr,
      );
    }

    await fs.writeFile(
      measureModule,
      definition("const adjustment: number = -2;"),
    );
    expect(verify("--require", "handoff"), 1, "stale");
    expect(verify("--run", "--require", "handoff"), 1, "failed");

    await fs.writeFile(
      path.join(executable, "check.ts"),
      'import chair from "./chair";\nimport other from "#other-target";\nexport default [chair, other];\n',
    );
    const other: string = path.join(executable, "other.ts");
    const shared: string = path.join(executable, "shared", "index.ts");
    await fs.mkdir(path.dirname(shared));
    await fs.writeFile(other, 'export default { id: "table", checks: [] };\n');
    await fs.writeFile(shared, "export const adjustment: number = 0;\n");
    await fs.writeFile(
      measureModule,
      definition('import { adjustment } from "./shared";', true),
    );
    expect(verify("--run", "--require", "handoff"), 0, "passed");
    await fs.writeFile(other, 'export default { id: "desk", checks: [] };\n');
    expect(verify("--require", "handoff"), 0, "passed");
    await fs.writeFile(shared, "export const adjustment: number = -2;\n");
    expect(verify("--require", "handoff"), 1, "stale");

    await fs.writeFile(shared, "export const adjustment: number = 0;\n");
    await fs.writeFile(
      measureModule,
      definition(
        [
          'import { writeFileSync } from "node:fs";',
          'import { adjustment } from "./shared";',
          'writeFileSync(new URL("./shared/index.ts", import.meta.url), "export const adjustment: number = -2;\\n");',
        ].join("\n"),
        true,
      ),
    );
    const race: SpawnSyncReturns<string> = verify(
      "--run",
      "--require",
      "handoff",
    );
    assert.ifError(race.error);
    assert.equal(race.status, 1);
    assert.match(race.stderr, /Verification source changed after it loaded/u);

    const common: string = path.join(executable, "cached.cjs");
    const commonPreload: string = path.join(executable, "cache-common.cjs");
    await fs.writeFile(
      path.join(executable, "value.cjs"),
      "module.exports = 3;\n",
    );
    await fs.writeFile(
      common,
      [
        'const value = require("./value.cjs") + require("linked-sdk").adjustment;',
        'exports.default = [{ id: "chair", checks: [{ id: "fit", title: "Check fit", scope: "chair", kind: "measure", inputs: ["model.txt"], unit: "cm", minimum: 2, measure: () => value }], required: { handoff: ["fit"] } }];',
      ].join("\n"),
    );
    await fs.writeFile(
      commonPreload,
      [
        'require("./value.cjs");',
        'require("node:fs").writeFileSync(require("node:path").join(__dirname, "value.cjs"), "module.exports = 1;\\n");',
      ].join("\n"),
    );
    const commonStage: readonly string[] = [
      "--module",
      common,
      "--run",
      "--require",
      "handoff",
    ];
    expect(execute(commonStage), 0, "passed");
    expect(execute(commonStage, ["--require", compilerPreload]), 0, "passed");
    const cachedChild: SpawnSyncReturns<string> = execute(commonStage, [
      "--require",
      await fs.realpath(commonPreload),
    ]);
    assert.ifError(cachedChild.error);
    assert.equal(cachedChild.status, 1);
    assert.match(
      cachedChild.stderr,
      /Verification source could not be observed: .*value\.cjs/u,
    );

    const esm: string = path.join(executable, "delivery.mjs");
    const esmPreload: string = path.join(executable, "cache-delivery.mjs");
    const delivered = (report: string): string =>
      `export default ${JSON.stringify([
        {
          id: "chair",
          checks: [
            {
              id: "released",
              title: "Check output",
              scope: "film",
              kind: "delivery",
              subject: "chair",
              report,
            },
          ],
          required: { handoff: ["released"] },
        },
      ])};\n`;
    await fs.writeFile(path.join(root, "film.mp4"), "first film");
    await fs.writeFile(
      path.join(root, "valid.json"),
      JSON.stringify({
        subject: "chair",
        status: "published",
        video: "film.mp4",
        source: {
          file: ".render-fixture/film.mp4",
          sha256: createHash("sha256").update("first film").digest("hex"),
        },
      }),
    );
    await fs.writeFile(esm, delivered("valid.json"));
    await fs.writeFile(
      esmPreload,
      [
        'import "./delivery.mjs";',
        'import { writeFileSync } from "node:fs";',
        `writeFileSync(new URL("./delivery.mjs", import.meta.url), ${JSON.stringify(delivered("missing.json"))});`,
      ].join("\n"),
    );
    const esmStage: readonly string[] = [
      "--module",
      esm,
      "--require",
      "handoff",
    ];
    expect(execute(esmStage), 0, "passed");
    const preloadEsm: readonly string[] = [
      "--import",
      pathToFileURL(await fs.realpath(esmPreload)).href,
    ];
    const cachedEntry: SpawnSyncReturns<string> = execute(esmStage, preloadEsm);
    assert.ifError(cachedEntry.error);
    assert.equal(cachedEntry.status, 1);
    assert.match(
      cachedEntry.stderr,
      /Verification source could not be observed: .*delivery\.mjs/u,
    );

    const mixed: string = path.join(executable, "mixed.cjs");
    await fs.writeFile(esm, delivered("valid.json"));
    await fs.writeFile(
      mixed,
      'exports.default = require("./delivery.mjs").default;\n',
    );
    const cachedRequiredEsm: SpawnSyncReturns<string> = execute(
      ["--module", mixed, "--require", "handoff"],
      preloadEsm,
    );
    assert.ifError(cachedRequiredEsm.error);
    assert.equal(cachedRequiredEsm.status, 1);
    assert.match(
      cachedRequiredEsm.stderr,
      /Use a native import to verify the source of .*delivery\.mjs/u,
    );
  } finally {
    if (linked) await fs.unlink(link);
    await fs.rm(workspace, { recursive: true, force: false });
  }
}

/**
 * Restore the Node options the caller supplied before ttsx added its hooks. The
 * native verification subprocess installs its own hooks and compares their
 * source bytes with the fixture files.
 */
function nativeVerificationEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const record: string | undefined = env.TTSX_NODE_OPTIONS_RECORD;
  const current: string | undefined = env.NODE_OPTIONS;
  if (record === undefined || current === undefined) return env;

  const suffix: string = `,${JSON.stringify(current)}]`;
  if (!record.startsWith('["') || !record.endsWith(suffix)) return env;

  // The first element starts with a quote. A successful parse of that element
  // therefore gives a string. Match its canonical spelling to the ttsx record.
  const encoded: string = record.slice(1, -suffix.length);
  let received: string;
  try {
    received = JSON.parse(encoded);
  } catch {
    return env;
  }
  if (JSON.stringify(received) !== encoded) return env;

  if (received.trim() === "") delete env.NODE_OPTIONS;
  else env.NODE_OPTIONS = received;
  delete env.TTSX_NODE_OPTIONS_RECORD;
  return env;
}
