import { DynamicExecutor } from "@nestia/e2e";
import path from "node:path";
import process from "node:process";

import { assessTestExecution } from "./helpers/assessTestExecution";
import { selectTestFiles } from "./helpers/selectTestFiles";

/** Discover selected pure unit tests, finish every case, then report failures. */
async function main(): Promise<void> {
  console.log("AutoMovie Production Unit Tests");

  const discovery: DynamicExecutor.IProps<[]> = {
    prefix: "test_",
    location: path.join(import.meta.dirname, "features"),
    parameters: (): [] => [],
    extension: "ts",
  };
  const names: string[] = [];

  // The discovery pass never imports tests, including excluded modules.
  await DynamicExecutor.validate({
    ...discovery,
    filter: (name: string): boolean => {
      names.push(name);
      return false;
    },
  });
  const selected: Set<string> = selectTestFiles(process.argv.slice(2), names);
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    ...discovery,
    filter: (name: string): boolean => selected.has(name),
    onComplete: (execution: DynamicExecutor.IExecution): void => {
      const result: ReturnType<typeof assessTestExecution> =
        assessTestExecution(execution);
      const timing: string =
        result.elapsedMs === null ? "invalid timing" : `${result.elapsedMs} ms`;
      console.log(
        `${result.passed ? "PASS" : "FAIL"} ${execution.name} (${timing})`,
      );
    },
  });

  if (report.executions.length === 0)
    throw new Error("The selected files exported no test functions.");

  const failures: DynamicExecutor.IExecution[] = report.executions.filter(
    (execution: DynamicExecutor.IExecution): boolean =>
      !assessTestExecution(execution).passed,
  );
  console.log(
    `${report.executions.length - failures.length}/${report.executions.length} passed in ${report.time.toLocaleString()} ms`,
  );
  for (const failure of failures)
    console.error(failure.name, {
      assertion: failure.error,
      timing: assessTestExecution(failure).elapsedMs,
    });
  if (failures.length !== 0) process.exitCode = 1;
}

main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
