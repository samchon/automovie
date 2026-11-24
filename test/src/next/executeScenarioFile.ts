import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import type { IScenarioExecutionAssessment } from "../IScenarioExecutionAssessment";
import { assessScenarioExecution } from "../scenarioExecution";
import type { IScenarioMark } from "./IScenarioMark";
import { readScenarioLimits } from "./readScenarioLimits";
import { watchScenarioStall } from "./watchScenarioStall";

/**
 * The process of one spec file: `executeScenarioFile <spec file> <journal>`.
 *
 * The runner starts one per selected spec file, so the file's modules load into
 * a registry of their own and nothing a scenario leaves at module scope, on
 * `globalThis` or in the process reaches another file's scenarios. The file's
 * `test_` functions run in order through `DynamicExecutor`, as the runner of
 * one process ran them. Each prints its own `✓`/`✗` line and, on failure, its
 * assertion as that runner printed it. Each also leaves a `start` and a
 * `complete` mark in the journal, appended synchronously so a mark is on disk
 * before the scenario's first statement runs.
 *
 * The stall watch also covers the file's import, under the name `<file>
 * (import)`: an import that never returns ends this process with its stack, as
 * a scenario does.
 *
 * The process ends with code 0 once every scenario of the file has completed,
 * passed or failed, and with code 1 when the file failed to load or exports no
 * `test_` function. A stall or a crash ends it otherwise, and the runner reads
 * which from the journal and the exit.
 */
async function main(): Promise<number> {
  const location: string | undefined = process.argv[2];
  const journal: string | undefined = process.argv[3];
  if (location === undefined || journal === undefined)
    throw new Error("usage: executeScenarioFile <spec file> <journal>");
  const file: string = path.basename(location);
  const watch: watchScenarioStall.IWatch = watchScenarioStall(
    readScenarioLimits(),
    journal,
  );

  // The import is watched too; each scenario's start restarts the clock.
  watch.start(`${file} (import)`);
  let before: string[] = [];
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    prefix: "test_",
    location: path.dirname(location),
    extension: path.extname(location).slice(1),
    filter: (name: string): boolean => name === file,
    parameters: (name: string): [] => {
      before = process.getActiveResourcesInfo();
      record(journal, { kind: "start", name, at: Date.now() });
      watch.start(name);
      return [];
    },
    onComplete: (exec: DynamicExecutor.IExecution): void => {
      watch.complete();
      const result: IScenarioExecutionAssessment =
        assessScenarioExecution(exec);
      const mark: string = result.passed
        ? chalk.green("  ✓")
        : chalk.red("  ✗");
      console.log(
        `${mark} ${exec.name} ${chalk.gray(`(${result.timingLabel})`)}`,
      );
      if (result.passed === false)
        console.log({ assertion: exec.error, timing: result.timingFailure });

      // A handle the scenario left open (a timer, a pool, a socket) no
      // longer keeps a run alive, since this process is ended by code, but
      // it is named so its owner can be traced.
      const left: string[] = remaining(
        before,
        process.getActiveResourcesInfo(),
      );
      if (left.length !== 0)
        console.log(
          chalk.gray(
            `    open handles left by ${exec.name}: ${left.join(", ")}`,
          ),
        );
      record(journal, {
        kind: "complete",
        name: exec.name,
        at: Date.now(),
        passed: result.passed,
      });
    },
  });
  watch.complete();
  if (report.executions.length === 0)
    throw new Error(`${location} exports no test_ function.`);
  return 0;
}

/** Append one mark to the journal, synchronously. */
function record(journal: string, mark: IScenarioMark): void {
  fs.appendFileSync(journal, `${JSON.stringify(mark)}\n`);
}

/**
 * The resource kinds present after a scenario beyond those present before it,
 * counted per kind.
 */
function remaining(
  before: readonly string[],
  after: readonly string[],
): string[] {
  const counts: Map<string, number> = new Map();
  for (const kind of before) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  const left: string[] = [];
  for (const kind of after) {
    const count: number = counts.get(kind) ?? 0;
    if (count === 0) left.push(kind);
    else counts.set(kind, count - 1);
  }
  return left;
}

/**
 * End the process once its standard output and error have flushed, so no
 * printed result is lost to a pipe still writing.
 */
function end(code: number): void {
  process.stdout.write("", (): void => {
    process.stderr.write("", (): void => process.exit(code));
  });
}

main()
  .then(end)
  .catch((error: unknown): void => {
    console.error(error);
    end(1);
  });
