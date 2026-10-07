import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IHumanViewerCompileOutput } from "./IHumanViewerCompileOutput";
import type { IHumanViewerCompiledPackage } from "./IHumanViewerCompiledPackage";
import type { IRunHumanViewerCompileProps } from "./IRunHumanViewerCompileProps";

/**
 * Run one whole human-package compile in a process of its own and return its
 * transformed files (by absolute path) and graph. The transform is a
 * synchronous call that takes seconds, so inside the server it froze every
 * request; here the server keeps answering. Each run writes a uniquely named
 * output, because invalidations can overlap runs, and removes it once read.
 * Every run is logged with its duration and file count, and a failure is
 * logged with the compiler's reason and thrown.
 *
 * @evidence contracts/common.md#principled-implementation Isolates the synchronous compiler in a child process and returns only a complete result or the named failure.
 * @evidence contracts/common.md#clear-and-simple-design One function owns running the compile; watching and publication stay with the caller.
 * @evidence contracts/common.md#meaningful-documentation States the process boundary, the logging and the failure effect.
 */
export async function runHumanViewerCompile(
  props: IRunHumanViewerCompileProps,
): Promise<IHumanViewerCompiledPackage> {
  const output = path.join(
    props.outputDirectory,
    `compile-${process.pid}-${randomUUID()}.json`,
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const began = performance.now();
  console.log(`COMPILE start ${new Date().toISOString()}`);
  await new Promise<undefined>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(props.directory, "compile-human.mts"), props.human, output],
      { windowsHide: true, stdio: "ignore" },
    );
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve(undefined)
        : reject(new Error(`The human compile exited with ${code}`)),
    );
  });
  const read = performance.now();
  const result = JSON.parse(
    await fs.promises.readFile(output, "utf8"),
  ) as IHumanViewerCompileOutput;
  const parseMs = performance.now() - read;
  fs.rmSync(output, { force: true });
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
}
