import type * as Render from "@automovie/render";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { AutoMovieCaptureHost } from "./AutoMovieCaptureHost";
import { loadAutoMovieProductionModule } from "./loadAutoMovieProductionModule";
import { readAutoMovieRenderOptions } from "./readAutoMovieRenderOptions";
import { renderAutoMovieVideo } from "./renderAutoMovieVideo";
import { resolveAutoMovieFfmpeg } from "./resolveAutoMovieFfmpeg";

/**
 * Run `automovie render` in a production: draw one subject of a module's draw page frame by frame in headless Chromium and encode it into one video, resolving to the exit status.
 *
 * Options are read by `readAutoMovieCaptureArguments` and split by `readAutoMovieRenderOptions`; the rest is the request, of which a render takes only `subject`, read by `parseAutoMovieCapturePlanRequest` as `capture` reads it, and any other key is refused. A `--props` file is read as JSON before anything starts. FFmpeg is resolved before the page is built, so a missing encoder costs no drawing. The work is `renderAutoMovieVideo` through one `AutoMovieCaptureHost`, closed on every outcome. It prints the video, the report and the frame count, and resolves to 0; a refusal throws to `run`, which prints it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how options are read, the order of the checks, what does the work, what is printed and the status.
 * @evidence contracts/development/implementation.md#principled-implementation Every rule is the render package's or `renderAutoMovieVideo`'s; the command loads the production's packages and reports.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, resolve FFmpeg, open the host, render, report.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown option and a request key a render cannot honour are refused, and FFmpeg's absence fails before any drawing.
 * @evidence contracts/development/implementation.md#efficient-algorithms One page build, one browser and one encode.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One render per command.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The host is closed on every outcome.
 */
export async function renderAutoMovie(props: {
  /** The tokens after `render`. */
  args: readonly string[];

  /** The production's root folder, the working directory. */
  root: string;

  /** The environment, read for `CHROME_PATH` and `FFMPEG_PATH`. */
  env: Readonly<Record<string, string | undefined>>;
}): Promise<number> {
  const { root } = props;
  const render: typeof Render = loadAutoMovieProductionModule(
    root,
    "@automovie/render",
  ) as typeof Render;
  const options: ReturnType<typeof readAutoMovieRenderOptions> =
    readAutoMovieRenderOptions(
      render.readAutoMovieCaptureArguments(props.args),
    );

  // The request names the subject; a render draws its whole clock through its own camera, so no other key applies.
  const request: Render.IAutoMovieCapturePlanRequest =
    render.parseAutoMovieCapturePlanRequest(options.request);
  for (const key of options.request.keys())
    if (key !== "subject")
      throw new Error(
        `Render draws a subject's whole clock through its own camera; the request key --${key} does not apply, only --subject`,
      );
  const data: unknown =
    options.props === null
      ? null
      : JSON.parse(
          await fs.readFile(path.resolve(root, options.props), "utf8"),
        );
  const ffmpeg: string = resolveAutoMovieFfmpeg({
    env: props.env,
    load: (id: string): unknown => loadAutoMovieProductionModule(root, id),
  });

  const host: AutoMovieCaptureHost = await AutoMovieCaptureHost.open({
    root,
    module: options.module,
    backend: options.backend,
    env: props.env,
  });
  try {
    const written: Awaited<ReturnType<typeof renderAutoMovieVideo>> =
      await renderAutoMovieVideo({
        host,
        root,
        subject: request.subject,
        props: data,
        ...(options.out === null ? {} : { out: options.out }),
        ffmpeg,
      });
    process.stdout.write(
      `render: ${written.frames} frames into ${written.video}\nbackend ${host.backend}\n${written.report}\n`,
    );
    return 0;
  } finally {
    await host.close();
  }
}
