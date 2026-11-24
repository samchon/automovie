import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";
import path from "node:path";
import process from "node:process";

import type { IScenarioExecutionAssessment } from "./IScenarioExecutionAssessment";
import { assessScenarioExecution } from "./scenarioExecution";
import { prepareScenarioFilter } from "./scenarioSelection";

/**
 * Seconds one scenario may take: the project's cap on one spec, three minutes,
 * past which a spec is a defect to fix rather than a run to wait on.
 */
const SCENARIO_LIMIT: number = 180;

/**
 * Run the selected scenarios and exit with their combined verdict.
 *
 * Every selected scenario runs to its end, however long it takes; no scenario
 * ends the run or its process. A scenario whose elapsed time is past
 * `SCENARIO_LIMIT` seconds (`AUTOMOVIE_TEST_SCENARIO_LIMIT` when set) is
 * reported ✗ with "ran N s, past the 3-minute cap: a defect to fix", even when
 * its assertions passed, and is listed among the FAILED at the end; the run
 * goes on to the next scenario. Completed failures keep their immediate report
 * and timing assessment.
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
  const limit: number = Number(
    process.env.AUTOMOVIE_TEST_SCENARIO_LIMIT ?? SCENARIO_LIMIT,
  );
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    ...discovery,
    onComplete: (exec: DynamicExecutor.IExecution): void => {
      const result: IScenarioExecutionAssessment =
        assessScenarioExecution(exec);
      const late: string | null = overCap(result, limit);
      const mark: string =
        result.passed && late === null ? chalk.green("  ✓") : chalk.red("  ✗");
      console.log(
        `${mark} ${exec.name} ${chalk.gray(`(${result.timingLabel})`)}`,
      );

      // Completed failures stay readable at once, before the next scenario.
      if (result.passed === false || late !== null)
        console.log({
          assertion: exec.error,
          timing: result.timingFailure,
          ...(late === null ? {} : { cap: late }),
        });
    },
    filter,
  });

  if (report.executions.length === 0)
    throw new Error("The scenario selection matched nothing.");

  const failures: IScenarioExecutionAssessment[] = report.executions
    .map(assessScenarioExecution)
    .filter(
      (result: IScenarioExecutionAssessment): boolean =>
        result.passed === false || overCap(result, limit) !== null,
    );
  const passed: number = report.executions.length - failures.length;
  console.log("---------------------------------------------------");
  console.log(
    `${passed}/${report.executions.length} passed in ${report.time.toLocaleString()} ms`,
  );

  if (failures.length !== 0) {
    console.log(chalk.red(`\n${failures.length} FAILED:`));
    for (const f of failures) {
      const late: string | null = overCap(f, limit);
      console.log(
        chalk.red(
          `\n● ${f.execution.name}${late === null ? "" : ` (${late})`}`,
        ),
      );
    }
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

/**
 * The cap's report for a scenario that ran past the limit: "ran N s, past the
 * 3-minute cap: a defect to fix". A slow scenario is a defect of that scenario,
 * reported as such; it ends nothing.
 *
 * @param result The scenario's assessment.
 * @param limit The cap, seconds.
 * @returns The report, or null when the scenario finished within the cap or its
 *   clock is invalid (which the assessment reports itself).
 */
function overCap(
  result: IScenarioExecutionAssessment,
  limit: number,
): string | null {
  if (result.elapsedMs === null || result.elapsedMs <= limit * 1000)
    return null;
  const cap: string = limit % 60 === 0 ? `${limit / 60}-minute` : `${limit} s`;
  return `ran ${(result.elapsedMs / 1000).toFixed(1)} s, past the ${cap} cap: a defect to fix`;
}

main().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
