import { build } from "esbuild";
import assert from "node:assert/strict";
import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the native module boundary and unrelated-source control.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the actual CLI entry in the fixture directory and checks its output and status while Node loads the two authored TypeScript files.
 * @evidence contracts/development/testing.md#independent-expectations A disabled explicitly required row prevents stage completion, and unrelated invalid source must not prevent a read.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises an imported target with both ordinary status and explicit stage enforcement.
 * @evidence contracts/development/testing.md#execution-ownership Builds only the CLI into an owned temporary directory and waits for two local Node subprocesses; the fixture's production files are loaded by the command.
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
    const verify = (...args: string[]): SpawnSyncReturns<string> =>
      spawnSync(
        process.execPath,
        [cli, "verify", "--subject", "chair", "--json", ...args],
        {
          cwd: root,
          encoding: "utf8",
          windowsHide: true,
          timeout: 20000,
        },
      );
    const status: SpawnSyncReturns<string> = verify();
    assert.ifError(status.error);
    assert.equal(status.status, 0, status.stderr);
    assert.match(status.stdout, /"state": "disabled"/u);
    const gate: SpawnSyncReturns<string> = verify("--require", "handoff");
    assert.ifError(gate.error);
    assert.equal(gate.status, 1, gate.stderr);
    assert.match(gate.stdout, /"blocked": true/u);
  } finally {
    await fs.rm(root, { recursive: true, force: false });
  }
}
