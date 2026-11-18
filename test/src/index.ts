import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";
import path from "node:path";
import process from "node:process";

import type { IScenarioExecutionAssessment } from "./IScenarioExecutionAssessment";
import { assessScenarioExecution } from "./scenarioExecution";
import { prepareScenarioFilter } from "./scenarioSelection";
import { watchScenarioStall } from "./watchScenarioStall";

/** Seconds one scenario may run before the run ends it as a stall: the project's cap on one spec, three minutes, past which a spec is a defect to fix rather than a run to wait on. */
const SCENARIO_LIMIT: number = 180;

/**
 * Run the selected scenarios and exit with their combined verdict. A
 * scenario past `SCENARIO_LIMIT` ends the run by name with its JavaScript
 * stack (`watchScenarioStall`). Completed failures keep their immediate
 * report and timing assessment.
 */
async function main(): Promise<void> {
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
  // A scenario whose work never returns ends the run by name with its stack
  // (`watchScenarioStall`), past AUTOMOVIE_TEST_SCENARIO_LIMIT seconds.
  const watch: ReturnType<typeof watchScenarioStall> = watchScenarioStall(
    Number(process.env.AUTOMOVIE_TEST_SCENARIO_LIMIT ?? SCENARIO_LIMIT),
  );
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    ...discovery,

    // The watch marks the selected call's start; it names a stall by itself.
    parameters: (name: string): [] => {
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
