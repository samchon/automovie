import type * as Render from "@automovie/render";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type * as Playwright from "playwright-core";

import type { AutoMovieCliReviewTypes } from "../AutoMovieCliReviewTypes";
import { loadProductionModule } from "../../production/internal/loadProductionModule";
import { readReviewOptions } from "./readReviewOptions";
import { recordPlaybackImplementation } from "./recordPlaybackImplementation";
import { reviewFileImplementation } from "./reviewFileImplementation";

/*
 * Run `automovie review` in a production, recording Inspector playback or
 * marking and reopening a file-bound observation.
 *
 * Options are read by `readCaptureArguments` and admitted by
 * `AutoMovieCliReview.readOptions`. The recording is
 * `AutoMovieCliReview.recordPlayback` with
 * the production's `playwright-core`; it and `playback.json`, holding the time
 * readings and the page's script errors, go into `--out` or
 * `media/automovie/review`. It prints the video and the number of errors and
 * resolves to 1 when the page reported a script error. File mode delegates to
 * the published-file review host and resolves to 0 after the mark or replay
 * succeeds.
 */
export async function reviewProduction(
  props: AutoMovieCliReviewTypes.ReviewProps,
): Promise<number> {
  const { root } = props;
  const render: typeof Render = loadProductionModule<typeof Render>(
    root,
    "@automovie/render",
  );
  const options: ReturnType<typeof readReviewOptions> =
    readReviewOptions(
      render.AutoMovieRenderCapture.readArguments(props.args),
    );
  if (!("url" in options)) {
    await reviewFileImplementation({ options, root, env: props.env });
    return 0;
  }
  const out: string = path.resolve(
    root,
    options.out ?? path.join("media", "automovie", "review"),
  );
  const recorded: Awaited<ReturnType<typeof recordPlaybackImplementation>> =
    await recordPlaybackImplementation({
      chromium: loadProductionModule<typeof Playwright>(
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
