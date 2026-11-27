import type { IAutoMovieProductionCheck } from "@automovie/interface";

import { loadProductionCheckModule } from "./loadProductionCheckModule";
import { readCheckOptions } from "./readCheckOptions";
import { runProductionCheck } from "./runProductionCheck";

/*
 * Load the production's authored check definitions with its installed Node
 * runtime and print the selected observations. The module is editable trusted
 * production code, loaded without building unrelated sources. Status does not
 * execute checks. Only a requested and unsatisfied stage returns 1.
 * Parameter props: Raw command tokens, production root and capture environment.
 * Returns: The requested stage's exit status, or zero for an ordinary read.
 */
export async function check(props: {
  /*
   * Tokens after the `check` command.
   */
  readonly args: readonly string[];

  /*
   * The production's working directory.
   */
  readonly root: string;

  /*
   * Environment passed to any expressly refreshed capture.
   */
  readonly env: Readonly<Record<string, string | undefined>>;

  /*
   * Output sink, default standard output.
   */
  readonly write?: (text: string) => void;
}): Promise<number> {
  const options: ReturnType<typeof readCheckOptions> =
    readCheckOptions(props.args);
  const module: Awaited<ReturnType<typeof loadProductionCheckModule>> =
    await loadProductionCheckModule(props.root, options.module);
  const report: IAutoMovieProductionCheck.IReport =
    await runProductionCheck({
      root: props.root,
      env: props.env,
      targets: module.targets,
      options,
      measurementSources: module.sources,
    });
  const write: (text: string) => void =
    props.write ??
    ((text: string): void => {
      process.stdout.write(text);
    });
  if (options.json) write(`${JSON.stringify(report, null, 2)}\n`);
  else if (report.items.length === 0)
    write(`No production checks selected. Edit ${options.module}.\n`);
  else {
    const items: IAutoMovieProductionCheck.IResult[] = [...report.items];
    const lines: string[] = items
      .sort(
        (
          a: IAutoMovieProductionCheck.IResult,
          b: IAutoMovieProductionCheck.IResult,
        ): number =>
          Number(a.state === "passed") - Number(b.state === "passed"),
      )
      .map(
        (item: IAutoMovieProductionCheck.IResult): string =>
          `${item.state} ${item.target}/${item.id}: ${item.title} (${item.scope})\n` +
          `  ${item.message}${item.evidence === undefined ? "" : ` [${item.evidence}]`}`,
      );
    write(`${lines.join("\n")}\n`);
  }
  return report.blocked ? 1 : 0;
}
