import type * as Render from "@automovie/render";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { loadAutoMovieProductionModule } from "./loadAutoMovieProductionModule";
import { readAutoMovieReviewOptions } from "./readAutoMovieReviewOptions";
import { recordAutoMoviePlayback } from "./recordAutoMoviePlayback";

/**
 * Run `automovie review` in a production: record real-time playback of its running inspector page for a person to watch, and resolve to the exit status.
 *
 * Options are read by `readAutoMovieCaptureArguments` and admitted by `readAutoMovieReviewOptions`. The recording is `recordAutoMoviePlayback` with the production's `playwright-core`; it and `playback.json`, holding the time readings and the page's script errors, go into `--out` or `media/automovie/review`. It prints the video and the number of errors, and resolves to 1 when the page reported a script error, since a playback that errors is not one to watch, and 0 otherwise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how options are read, what records, what is written where, what is printed and the status with its reason.
 * @evidence contracts/development/implementation.md#principled-implementation The recording's rules are `recordAutoMoviePlayback`'s; the command supplies the production's Playwright and writes the result.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, record, write, report.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown option is refused; a page error is reported in the status, not hidden.
 * @evidence contracts/development/implementation.md#efficient-algorithms One recording.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One review per command.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The browser is the recording's and closed by it.
 */
export async function reviewAutoMovie(props: {
  /** The tokens after `review`. */
  args: readonly string[];

  /** The production's root folder, the working directory. */
  root: string;

  /** The environment, read for `CHROME_PATH`. */
  env: Readonly<Record<string, string | undefined>>;
}): Promise<number> {
  const { root } = props;
  const render: typeof Render = loadAutoMovieProductionModule(
    root,
    "@automovie/render",
  ) as typeof Render;
  const options: ReturnType<typeof readAutoMovieReviewOptions> =
    readAutoMovieReviewOptions(
      render.readAutoMovieCaptureArguments(props.args),
    );
  const out: string = path.resolve(
    root,
    options.out ?? path.join("media", "automovie", "review"),
  );
  const recorded: Awaited<ReturnType<typeof recordAutoMoviePlayback>> =
    await recordAutoMoviePlayback({
      chromium: (
        loadAutoMovieProductionModule(root, "playwright-core") as {
          chromium: unknown;
        }
      ).chromium,
      url: options.url,
      seconds: options.seconds,
      out,
      env: props.env,
    });
  await fs.writeFile(
    path.join(out, "playback.json"),
    JSON.stringify(recorded, null, 2),
  );
  process.stdout.write(
    `review: ${recorded.video}\n${recorded.errors.length} page errors\n`,
  );
  return recorded.errors.length === 0 ? 0 : 1;
}
