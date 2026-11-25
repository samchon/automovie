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
 * 3. A closed-over constant invalidates the warmed result although the callback
 *    text and measured data stay the same.
 * 4. A named defining module follows local extensionless imports, including a
 *    directory index. Its transitive source invalidates the selected check and
 *    an edit to another target leaves its receipt current.
 * 5. Bytes changed during module loading cannot seal an older runtime value.
 * 6. Cached CommonJS and ESM definitions cannot authorize the current handoff
 *    after their files have changed, including a CommonJS entry that requires a
 *    preloaded ES module.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the native module boundary and unrelated-source control.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the actual CLI entry in the fixture directory and checks its output and status while Node loads the two authored TypeScript files.
 * @evidence contracts/development/testing.md#independent-expectations A disabled required row blocks a stage. Literal 3 cm and 1 cm measurements straddle the 2 cm bound, independent of the verifier's receipt format.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises ordinary status and stage enforcement, changed defining and transitive sources, an unrelated loaded target, bytes mutated mid-load and stale CommonJS and ESM caches.
 * @evidence contracts/development/testing.md#execution-ownership Builds only the CLI into an owned temporary directory and waits for each local Node subprocess; the authored files are loaded by the command.
 */
export async function test_cli_verification_module(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-verify-module-"),
  );
  try {
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
    await fs.writeFile(path.join(root, "package.json"), '{"type":"module"}\n');
    await fs.writeFile(
      path.join(root, "src", "unrelated.ts"),
      "export const draft =",
    );
    await fs.writeFile(
      path.join(executable, "verify.ts"),
      'import chair from "./chair.ts";\nexport default [chair];\n',
    );
    await fs.writeFile(
      path.join(executable, "chair.ts"),
      [
        'const stage: string = "handoff";',
        'export default { id:"chair", checks:[{ id:"fit", title:"Check the fit", scope:"support", enabled:false, kind:"measure", inputs:["src/executable/chair.ts"], unit:"m", minimum:0, measure: (): number => 1 }], required:{[stage]:["fit"]} };',
      ].join("\n"),
    );
    const execute = (
      args: readonly string[],
      nodeOptions: readonly string[] = [],
    ): SpawnSyncReturns<string> =>
      spawnSync(
        process.execPath,
        [
          ...nodeOptions,
          cli,
          "verify",
          "--subject",
          "chair",
          "--json",
          ...args,
        ],
        {
          cwd: root,
          encoding: "utf8",
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
      assert.match(result.stdout, new RegExp(`"state": "${state}"`, "u"));
      assert.equal(result.status, exit, result.stderr);
    };
    await fs.writeFile(path.join(root, "model.txt"), "3");
    await fs.writeFile(
      measureModule,
      definition("const adjustment: number = 0;"),
    );
    expect(verify("--run", "--require", "handoff"), 0, "passed");
    await fs.writeFile(
      measureModule,
      definition("const adjustment: number = -2;"),
    );
    expect(verify("--require", "handoff"), 1, "stale");
    expect(verify("--run", "--require", "handoff"), 1, "failed");

    await fs.writeFile(
      path.join(executable, "verify.ts"),
      'import chair from "./chair";\nimport other from "./other";\nexport default [chair, other];\n',
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
        'const value = require("./value.cjs");',
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
    await fs.rm(root, { recursive: true, force: false });
  }
}
