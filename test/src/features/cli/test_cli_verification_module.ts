import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { verifyAutoMovie } from "../../../../packages/cli/src/verifyAutoMovie";

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
 * @evidence contracts/development/testing.md#behavioral-verification Uses the normal command's native Node loader on separate authored TypeScript files.
 * @evidence contracts/development/testing.md#independent-expectations A disabled explicitly required row prevents stage completion, and unrelated invalid source must not prevent a read.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises an imported target with both ordinary status and explicit stage enforcement.
 * @evidence contracts/development/testing.md#execution-ownership This portable CLI unit owns its temporary files. Status launches no compiler or renderer.
 */
export async function test_cli_verification_module(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-verify-module-"),
  );
  try {
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
    const output: string[] = [];
    const write = (text: string): void => {
      output.push(text);
    };
    assert.equal(
      await verifyAutoMovie({
        root,
        env: {},
        write,
        args: ["--subject", "chair", "--json"],
      }),
      0,
    );
    assert.match(output[0]!, /"state": "disabled"/u);
    assert.equal(
      await verifyAutoMovie({
        root,
        env: {},
        write,
        args: ["--subject", "chair", "--require", "handoff", "--json"],
      }),
      1,
    );
    assert.match(output[1]!, /"blocked": true/u);
  } finally {
    await fs.rm(root, { recursive: true, force: false });
  }
}
