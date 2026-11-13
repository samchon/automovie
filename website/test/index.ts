// Run the site's tests: every `test_*` function a file of `features` exports.
//
//   pnpm test [name-fragment ...]
//
// With fragments, only the tests whose name holds one of them run. The
// process exits 1 when a test throws or when nothing was selected.
import { DynamicExecutor } from "@nestia/e2e";
import path from "node:path";

const main = async (): Promise<void> => {
  const wanted: string[] = process.argv.slice(2);
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    prefix: "test_",
    location: path.join(__dirname, "features"),
    parameters: (): [] => [],
    extension: "ts",
    filter: (name: string): boolean =>
      wanted.length === 0 ||
      wanted.some((fragment: string): boolean => name.includes(fragment)),
    onComplete: (execution: DynamicExecutor.IExecution): void => {
      const seconds: string = (
        (new Date(execution.completed_at).getTime() -
          new Date(execution.started_at).getTime()) /
        1000
      ).toFixed(1);
      console.log(
        `${execution.error === null ? "pass" : "FAIL"} ${execution.name} (${seconds} s)`,
      );
    },
  });

  const failures: DynamicExecutor.IExecution[] = report.executions.filter(
    (execution: DynamicExecutor.IExecution): boolean =>
      execution.error !== null,
  );
  for (const failure of failures) {
    console.error(`\n${failure.name}`);
    console.error(failure.error);
  }
  console.log(
    `${report.executions.length - failures.length}/${report.executions.length} passed`,
  );
  if (report.executions.length === 0)
    throw new Error("The selection matched no test");
  if (failures.length !== 0) process.exit(1);
};
main().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
