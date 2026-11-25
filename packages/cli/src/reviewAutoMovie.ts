import type * as Render from "@automovie/render";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type * as Playwright from "playwright-core";

import { loadAutoMovieProductionModule } from "./loadAutoMovieProductionModule";
import { readAutoMovieReviewOptions } from "./readAutoMovieReviewOptions";
import { recordAutoMoviePlayback } from "./recordAutoMoviePlayback";
import { reviewAutoMovieFile } from "./reviewAutoMovieFile";

/**
 * Run `automovie review` in a production, recording Inspector playback or
 * marking and reopening a file-bound observation.
 *
 * Options are read by `readAutoMovieCaptureArguments` and admitted by
 * `readAutoMovieReviewOptions`. The recording is `recordAutoMoviePlayback` with
 * the production's `playwright-core`; it and `playback.json`, holding the time
 * readings and the page's script errors, go into `--out` or
 * `media/automovie/review`. It prints the video and the number of errors and
 * resolves to 1 when the page reported a script error. File mode delegates to
 * the published-file review host and resolves to 0 after the mark or replay
 * succeeds.
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
  const render: typeof Render = loadAutoMovieProductionModule<typeof Render>(
    root,
    "@automovie/render",
  );
  const options: ReturnType<typeof readAutoMovieReviewOptions> =
    readAutoMovieReviewOptions(
      render.readAutoMovieCaptureArguments(props.args),
    );
  if (!("url" in options)) {
    await reviewAutoMovieFile({ options, root, env: props.env });
    return 0;
  }
  const out: string = path.resolve(
    root,
    options.out ?? path.join("media", "automovie", "review"),
  );
  const recorded: Awaited<ReturnType<typeof recordAutoMoviePlayback>> =
    await recordAutoMoviePlayback({
      chromium: loadAutoMovieProductionModule<typeof Playwright>(
        root,
        "playwright-core",
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
