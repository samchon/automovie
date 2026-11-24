import chalk from "chalk";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { prepareScenarioFilter } from "../scenarioSelection";
import type { IScenarioFile } from "./IScenarioFile";
import type { IScenarioLimits } from "./IScenarioLimits";
import type { IScenarioOutcome } from "./IScenarioOutcome";
import { findScenarioFiles } from "./findScenarioFiles";
import { readScenarioLimits } from "./readScenarioLimits";
import { runScenarioProcess } from "./runScenarioProcess";

/**
 * Run the selected scenarios of `features-next`, each spec file in a process of
 * its own, one after another, and exit with their combined verdict.
 *
 * The selection is the current runner's: `--include`, `--exclude` and one
 * `--shard=<index>/<count>`, matched on the spec files' base names before
 * anything is imported. Each selected file runs in its own process
 * (`runScenarioProcess`). Its modules therefore load fresh, and module-scope
 * state cannot pass from one file to the next. A scenario past the limit
 * (`AUTOMOVIE_TEST_SCENARIO_LIMIT` seconds, three minutes by default), a crash
 * or a failed load ends that file's process only. It is reported as a failure
 * by name, with the stalled stack when there is one, and the next file runs.
 * Every completed scenario prints its `✓`/`✗` line as it completes, and the
 * summary at the end counts them all.
 *
 * The scenario processes share one compile cache in the run's own temporary
 * directory, which is removed when the run ends, so the shared modules'
 * bytecode is compiled once per run rather than once per file.
 */
async function main(): Promise<void> {
  console.log("---------------------------------------------------");
  console.log("AutoMovie Test Program (isolated scenarios)");
  console.log("Start", new Date().toLocaleString("en-US"));
  console.log("---------------------------------------------------");

  // The program finds tests with its own extension, so it runs from the
  // sources and from a build of them alike.
  const extension: string = path.extname(__filename).slice(1);
  const files: IScenarioFile[] = findScenarioFiles(
    path.join(__dirname, "..", "features-next"),
    "test_",
    extension,
  );
  const filter: (name: string) => boolean = await prepareScenarioFilter(
    process.argv.slice(2),
    async (filter: (name: string) => boolean): Promise<void> => {
      for (const file of files) filter(file.name);
    },
  );
  const selected: IScenarioFile[] = files.filter(
    (file: IScenarioFile): boolean => filter(file.name),
  );
  if (selected.length === 0)
    throw new Error("The scenario selection matched nothing.");

  // The run's own directory holds every file's journal and the shared
  // compile cache; it goes when the run ends, however it ends.
  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-scenarios-"),
  );
  process.on("exit", (): void =>
    fs.rmSync(directory, { recursive: true, force: true }),
  );
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_COMPILE_CACHE:
      process.env.NODE_COMPILE_CACHE ?? path.join(directory, "compile-cache"),
  };
  const limits: IScenarioLimits = readScenarioLimits();
  const entry: string = path.join(
    __dirname,
    `executeScenarioFile.${extension}`,
  );

  const started: number = Date.now();
  const outcomes: IScenarioOutcome[] = [];
  for (const [index, file] of selected.entries())
    outcomes.push(
      ...(await runScenarioProcess({
        entry,
        file,
        journal: path.join(directory, `${index}.jsonl`),
        limits,
        environment,
      })),
    );

  const failures: IScenarioOutcome[] = outcomes.filter(
    (outcome: IScenarioOutcome): boolean => outcome.passed === false,
  );
  console.log("---------------------------------------------------");
  console.log(
    `${outcomes.length - failures.length}/${outcomes.length} passed in ${(Date.now() - started).toLocaleString()} ms`,
  );
  if (failures.length !== 0) {
    console.log(chalk.red(`\n${failures.length} FAILED:`));
    for (const f of failures) console.log(chalk.red(`\n● ${f.name}`));
    process.exit(1);
  }
  console.log(chalk.green("All tests passed."));
  process.exit(0);
}

main().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
