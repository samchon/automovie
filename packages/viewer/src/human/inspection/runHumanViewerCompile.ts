import { spawn, type ChildProcess } from "node:child_process";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IHumanViewerCompileOutput } from "./IHumanViewerCompileOutput.js";
import type { IHumanViewerCompiledPackage } from "./IHumanViewerCompiledPackage.js";
import type { IRunHumanViewerCompileProps } from "./IRunHumanViewerCompileProps.js";

/**
 * Run the human-package compile in a separate process and return its transformed absolute-path files and tracked graph inputs. Each run owns a unique output because invalidations can overlap. Wait for process close, log compiler-output success or refusal and independently remove the final and temporary output files on success or failure; compile computation stays outside the server's event loop.
 *
 * @evidence contracts/common.md#principled-implementation Spawns one isolated native compile process, waits for process close and reads its unique output before returning transformed files and tracked inputs.
 * @evidence contracts/common.md#clear-and-simple-design Compilation stays outside the HTTP server's event loop while this owner joins process completion, output decoding and both publication-file cleanup paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonzero child or compiler-output failure rejects; exit is not confused with drained process close and failed output parsing does not bypass cleanup.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies per-run process/output ownership, completion and logged duration/file counts without claiming a successful source gate from this worker.
 * @evidence contracts/performance.md#efficient-algorithms Compilation dominates dependency graph work; reading/parsing cost total emitted bytes and retained files, and each invalidation run has its own full compilation.
 * @evidence contracts/performance.md#reuse-equivalent-work Overlapping compile effects use distinct UUID output paths; equivalent graph compilation reuse remains with the revision owner rather than sharing this process by request label.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner waits for child close and independently removes output and output.tmp on success or failure, preserving the primary error; concurrent run count and emitted bytes have no independent cap here.
 */
export async function runHumanViewerCompile(
  props: IRunHumanViewerCompileProps,
): Promise<IHumanViewerCompiledPackage> {
  const output: string = path.join(
    props.outputDirectory,
    `compile-${process.pid}-${randomUUID()}.json`,
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const began: number = performance.now();
  let primary: { error: unknown } | undefined;
  try {
  console.log(`COMPILE start ${new Date().toISOString()}`);
  await new Promise<undefined>((resolve: (value: undefined) => void, reject: (error: unknown) => void): void => {
    const child: ChildProcess = spawn(
      process.execPath,
      [path.join(props.directory, "compile-human.mts"), props.human, output],
      { windowsHide: true, stdio: "ignore" },
    );
    child.once("error", reject);
    child.once("close", (code: number | null): void =>
      code === 0
        ? resolve(undefined)
        : reject(new Error(`The human compile exited with ${code}`)),
    );
  });
  const read: number = performance.now();
  const result: IHumanViewerCompileOutput = JSON.parse(
    await fs.promises.readFile(output, "utf8"),
  ) as IHumanViewerCompileOutput;
  const parseMs: number = performance.now() - read;
  if (result.files === undefined) {
    console.log(
      `COMPILE failed after ${Math.round(performance.now() - began)} ms: ${(result.error ?? "").slice(0, 300)}`,
    );
    throw new Error(result.error ?? "The human compile failed");
  }
  console.log(
    `COMPILE done in ${Math.round(performance.now() - began)} ms, ${Object.keys(result.files).length} files (output read ${Math.round(parseMs)} ms)`,
  );
  return {
    files: result.files,
    watch: result.watch ?? [],
    inputs: result.inputs ?? [],
  };
  } catch (error) {
    primary = { error };
    throw error;
  } finally {
    const operations: readonly (() => Promise<void>)[] = [
      async (): Promise<void> => { await fs.promises.rm(output, { force: true }); },
      async (): Promise<void> => { await fs.promises.rm(output + ".tmp", { force: true }); },
    ];
    if (primary === undefined) await createAutoMovieResourceRetirement(operations)();
    else await createAutoMovieResourceRetirement(operations, primary)();
  }
}
