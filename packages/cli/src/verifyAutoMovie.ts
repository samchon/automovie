import { createRequire } from "node:module";
import * as path from "node:path";

import type { IAutoMovieVerification } from "./IAutoMovieVerification";
import { readAutoMovieVerifyOptions } from "./readAutoMovieVerifyOptions";
import { runAutoMovieVerification } from "./runAutoMovieVerification";

/**
 * Load the production's authored verification definitions with its installed
 * Node runtime and print the selected observations. The module is editable
 * trusted production code, loaded without building unrelated sources. Status
 * does not execute checks. Only a requested and unsatisfied stage returns 1.
 *
 * @param props Raw command tokens, production root and capture environment.
 * @returns The requested stage's exit status, or zero for an ordinary read.
 */
export async function verifyAutoMovie(props: {
  /** Tokens after the `verify` command. */
  readonly args: readonly string[];

  /** The production's working directory. */
  readonly root: string;

  /** Environment passed to any expressly refreshed capture. */
  readonly env: Readonly<Record<string, string | undefined>>;

  /** Output sink, default standard output. */
  readonly write?: (text: string) => void;
}): Promise<number> {
  const options: ReturnType<typeof readAutoMovieVerifyOptions> =
    readAutoMovieVerifyOptions(props.args);
  const module: { default?: readonly IAutoMovieVerification[] } = createRequire(
    path.join(props.root, "package.json"),
  )(path.resolve(props.root, options.module)) as {
    default?: readonly IAutoMovieVerification[];
  };
  if (!Array.isArray(module.default))
    throw new Error(
      `${options.module} must default-export verification targets.`,
    );
  const report: IAutoMovieVerification.IReport = await runAutoMovieVerification(
    {
      root: props.root,
      env: props.env,
      targets: module.default,
      options,
    },
  );
  const write: (text: string) => void =
    props.write ??
    ((text: string): void => {
      process.stdout.write(text);
    });
  if (options.json) write(`${JSON.stringify(report, null, 2)}\n`);
  else if (report.items.length === 0)
    write(`No verification checks selected. Edit ${options.module}.\n`);
  else {
    const items: IAutoMovieVerification.IResult[] = [...report.items];
    const lines: string[] = items
      .sort(
        (
          a: IAutoMovieVerification.IResult,
          b: IAutoMovieVerification.IResult,
        ): number =>
          Number(a.state === "passed") - Number(b.state === "passed"),
      )
      .map(
        (item: IAutoMovieVerification.IResult): string =>
          `${item.state} ${item.target}/${item.id}: ${item.title} (${item.scope})\n` +
          `  ${item.message}${item.evidence === undefined ? "" : ` [${item.evidence}]`}`,
      );
    write(`${lines.join("\n")}\n`);
  }
  return report.blocked ? 1 : 0;
}
