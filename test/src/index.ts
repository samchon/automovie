import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";
import { writeSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import type { IScenarioExecutionAssessment } from "./IScenarioExecutionAssessment";
import { assessScenarioExecution } from "./scenarioExecution";
import { prepareScenarioFilter } from "./scenarioSelection";

/**
 * Run the selected scenarios and exit with their combined verdict. A synchronous
 * start record identifies the selected function before it is invoked, including
 * when its event loop later stalls or its heap is exhausted. Completed failures
 * keep their existing immediate report and timing assessment.
 */
async function main(): Promise<void> {
  // Static dependencies have loaded; selected unit discovery and execution
  // follow this owned-process marker. Compiler/launcher time remains separate.
  console.log(
    JSON.stringify({
      stage: "entry",
      pid: process.pid,
      started: new Date().toISOString(),
      phase: "after-static-imports-before-unit-discovery",
    }),
  );
  console.log("---------------------------------------------------");
  console.log("AutoMovie Test Program");
  console.log("Start", new Date().toLocaleString("en-US"));
  console.log("---------------------------------------------------");

  const discovery: DynamicExecutor.IProps<[]> = {
    prefix: "test_",
    location: path.join(__dirname, "features"),
    parameters: (): [] => [],
    // The program finds tests with its own extension, so it runs from the
    // sources and from a build of them alike.
    extension: path.extname(__filename).slice(1),
  };
  const filter: (name: string) => boolean = await prepareScenarioFilter(
    process.argv.slice(2),
    (filter: (name: string) => boolean): Promise<DynamicExecutor.IReport> =>
      DynamicExecutor.validate({ ...discovery, filter }),
  );
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    ...discovery,

    // The executor requests parameters immediately before the selected call.
    // Write synchronously so a blocked event loop cannot retain its start line.
    parameters: (name: string): [] => {
      writeSync(process.stdout.fd, `${JSON.stringify({
        stage: "scenario-start",
        pid: process.pid,
        name,
        started: new Date().toISOString(),
      })}\n`);
      return [];
    },
    onComplete: (exec: DynamicExecutor.IExecution): void => {
      const result: IScenarioExecutionAssessment =
        assessScenarioExecution(exec);
      const mark: string = result.passed
        ? chalk.green("  ✓")
        : chalk.red("  ✗");
      console.log(
        `${mark} ${exec.name} ${chalk.gray(`(${result.timingLabel})`)}`,
      );

      // A later scenario can stall; completed failures must remain readable
      // without repeating the scenarios that already finished.
      if (result.passed === false)
        console.log({ assertion: exec.error, timing: result.timingFailure });
    },
    filter,
  });

  if (report.executions.length === 0)
    throw new Error("The scenario selection matched nothing.");

  const failures: IScenarioExecutionAssessment[] = report.executions
    .map(assessScenarioExecution)
    .filter(
      (result: IScenarioExecutionAssessment): boolean =>
        result.passed === false,
    );
  const passed: number = report.executions.length - failures.length;
  console.log("---------------------------------------------------");
  console.log(
    `${passed}/${report.executions.length} passed in ${report.time.toLocaleString()} ms`,
  );

  if (failures.length !== 0) {
    console.log(chalk.red(`\n${failures.length} FAILED:`));
    for (const f of failures) console.log(chalk.red(`\n● ${f.execution.name}`));
    process.exit(1);
  }
  console.log(chalk.green("All tests passed."));

  // A passing run ends its own process: a handle a test leaves open (a
  // timer, a pool, a socket) kept passing runs alive on a shared machine
  // after their result. The handles still open are named so their owner can
  // be traced.
  const open: string[] = process
    .getActiveResourcesInfo()
    .filter((kind: string): boolean => kind !== "TTYWrap");
  if (open.length !== 0)
    console.log(chalk.gray(`open handles at the end: ${open.join(", ")}`));
  process.exit(0);
}

main().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
