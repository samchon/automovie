import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import type * as Render from "@automovie/render";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { AutoMovieCliRenderTypes } from "../AutoMovieCliRenderTypes";
import type { AutoMovieFfmpegStaticPath } from "../../ffmpeg/internal/AutoMovieFfmpegStaticPath";
import { AutoMovieCliCaptureHost } from "../../capture/AutoMovieCliCaptureHost";
import { loadProductionModule } from "../../production/internal/loadProductionModule";
import { readRenderOptions } from "./readRenderOptions";
import { renderVideoImplementation } from "./renderVideoImplementation";
import { resolveFfmpeg } from "../../ffmpeg/internal/resolveFfmpeg";

/*
 * Run `automovie render` in a production: draw one subject of a module's draw
 * page frame by frame in headless Chromium and encode it into one video,
 * resolving to the exit status.
 *
 * Options are read by `AutoMovieCliRender.readOptions`; the rest is the
 * request, of which a render
 * takes only `subject` and `passes`, read by `parseCapturePlanRequest`
 * as `capture` reads them, and any other key is refused. `passes` names the
 * control channels drawn beside the film, admitted by
 * `AutoMovieRenderDraw.admitControlPasses` before anything is drawn: guide passes other
 * than `beauty`, each once, so an inspection shade such as `clay` is refused
 * too. `--background transparent` renders the straight-alpha layer and refuses
 * `--passes`. A `--props` file is read as JSON before anything starts. FFmpeg
 * is resolved before the page is built, so a missing encoder costs no drawing.
 * The work is `renderVideoImplementation` through one `AutoMovieCliCaptureHost`,
 * closed on every outcome. It prints the video, the report and the frame count,
 * and resolves to 0; a refusal throws to `run`, which prints it.
 */
export async function renderProduction(
  props: AutoMovieCliRenderTypes.RenderProps,
): Promise<number> {
  const { root } = props;
  const render: typeof Render = loadProductionModule<typeof Render>(
    root,
    "@automovie/render",
  );
  const options: AutoMovieCliRenderTypes.Options = readRenderOptions(
    render.AutoMovieRenderCapture.readArguments(props.args),
  );

  // The request names the subject and the control passes; a render draws its whole clock through its own camera, so no other key applies.
  const request: IAutoMovieCapturePlanRequest =
    render.AutoMovieRenderCapture.parsePlanRequest(options.request);
  for (const key of options.request.keys())
    if (key !== "subject" && key !== "passes")
      throw new Error(
        `Render draws a subject's whole clock through its own camera; the request key --${key} does not apply, only --subject and --passes`,
      );
  const passes: string[] = options.request.has("passes")
    ? render.AutoMovieRenderDraw.admitControlPasses(request.passes)
    : [];
  if (options.background === "transparent" && passes.length !== 0)
    throw new Error(
      "Render --background transparent draws the beauty layer alone; guide passes keep their own black background, so --passes does not apply",
    );
  const data: unknown =
    options.props === null
      ? null
      : JSON.parse(
          await fs.readFile(path.resolve(root, options.props), "utf8"),
        );
  const ffmpeg: string = resolveFfmpeg({
    env: props.env,
    load: (id: "ffmpeg-static"): AutoMovieFfmpegStaticPath =>
      loadProductionModule<AutoMovieFfmpegStaticPath>(root, id),
  });
  const checkpoint = options.checkpoint === null
    ? undefined
    : {
        ...options.checkpoint,
        rendererIdentity: createHash("sha256")
          .update(JSON.stringify([options.module, options.backend, props.env.CHROME_PATH ?? null]))
          .update(await fs.readFile(createRequire(path.join(root, "package.json")).resolve("@automovie/render")))
          .digest("hex"),
      };

  // Open the host within the attempt so build and launch failures can leave a
  // report when the output folder is known.
  const owner: { host?: AutoMovieCliCaptureHost } = {};
  let nextFrameMessage: number = 0;
  try {
    const written: Awaited<ReturnType<typeof renderVideoImplementation>> =
      await renderVideoImplementation({
        host: {
          render,
          async session(sessionProps) {
            owner.host = await AutoMovieCliCaptureHost.open({
              root,
              module: options.module,
              backend: options.backend,
              timeout: options.timeout,
              env: props.env,
            });
            return owner.host.session(sessionProps);
          },
        },
        root,
        subject: request.subject,
        props: data,
        ...(options.out === null ? {} : { out: options.out }),
        ffmpeg,
        passes,
        background: options.background,
        ...(checkpoint === undefined ? {} : { checkpoint }),
        observe: (activity): void => {
          if (activity.type !== "requested") return;
          if (activity.stage === "draw-frame") {
            const now: number = performance.now();
            if (now < nextFrameMessage) return;
            nextFrameMessage = now + 1_000;
            process.stderr.write(
              `render: drawing frame ${activity.frame! + 1}/${activity.frameCount} at ${activity.seconds} s\n`,
            );
          } else if (
            activity.stage === "mount" ||
            activity.stage === "encode" ||
            activity.stage === "audit" ||
            activity.stage === "publish"
          )
            process.stderr.write(`render: ${activity.stage}\n`);
        },
      });
    process.stdout.write(
      `render: ${written.frames} frames into ${written.video}\nbackend ${written.backend}\n${written.report}\n` +
        (written.controls === null
          ? ""
          : `controls ${passes.join(",")} in ${written.controls}\n`),
    );
    return 0;
  } finally {
    await owner.host?.close();
  }
}
