import type * as Render from "@automovie/render";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { AutoMovieCaptureHost } from "./AutoMovieCaptureHost";
import { readAutoMovieRevision } from "./readAutoMovieRevision";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

/**
 * The delivery encoding of a drawn subject: H.264 in yuv420p at CRF 18, without tone mapping, as the production's render used; the frame format is the subject's own clock and raster.
 */
const SPEC: Parameters<typeof Render.renderAutoMovieDrawnVideo>[0]["spec"] = {
  target: "production",
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 18,
};

/**
 * Render one subject of a host's draw page into `<out>/film.mp4`, with `render-report.json` beside it.
 *
 * The subject is opened through the host's draw session, every frame of its clock is drawn by `renderAutoMovieDrawnVideo` into a scratch folder under `<root>/.cache/render/`, and FFmpeg encodes them into a partial file that is renamed to `film.mp4` only once it is complete, so a failed render leaves no file that looks finished. The report names the subject, the source revision, the backend, the encoder's arguments and every frame's second and pixel hash. The scratch folder is deleted and the session closed on every outcome.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is written where, how a failure leaves the output, what the report holds, and what is released.
 * @evidence contracts/development/implementation.md#principled-implementation Drawing and encoding are the render package's; this host supplies the session, files and FFmpeg, so a delivered frame is drawn by the same function as a capture's still.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Open, draw and encode, rename, report, release.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The output is replaced only by a complete encode; no frame is reused from an earlier render.
 * @evidence contracts/development/implementation.md#efficient-algorithms One draw and one PNG file per frame, then one FFmpeg run.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each render draws afresh.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The frame files live in the scratch folder until the encode ends, then are deleted with it; the session's page is closed on every outcome.
 */
export async function renderAutoMovieVideo(props: {
  /** The opened draw host. */
  host: AutoMovieCaptureHost;

  /** The production's root folder. */
  root: string;

  /** The subject's name, or null for the page's only subject. */
  subject: string | null;

  /** Data the subject module reads, as JSON, or null. */
  props: unknown;

  /** Output folder, relative to the root or absolute; absent, `media/automovie/<subject>/videos`. */
  out?: string;

  /** FFmpeg executable. */
  ffmpeg: string;
}): Promise<{
  /** The video written. */
  video: string;

  /** The report written beside it. */
  report: string;

  /** Frames drawn. */
  frames: number;
}> {
  const session: Render.AutoMovieDrawSession = await props.host.session({
    subject: props.subject,
    props: props.props,
  });
  const name: string = session.subject.name;
  const out: string = path.resolve(
    props.root,
    props.out ?? path.join("media", "automovie", name, "videos"),
  );
  const scratch: string = path.join(
    props.root,
    ".cache",
    "render",
    `${name}-${process.pid}-${Date.now()}`,
  );
  const partial: string = path.join(out, `.film-${process.pid}.mp4`);
  try {
    await fs.mkdir(scratch, { recursive: true });
    await fs.mkdir(out, { recursive: true });
    const result: Awaited<ReturnType<typeof Render.renderAutoMovieDrawnVideo>> =
      await props.host.render.renderAutoMovieDrawnVideo({
        session,
        spec: SPEC,
        frameDir: scratch.split(path.sep).join("/"),
        outputPath: partial,
        audio: null,
        write: (file: string, data: Uint8Array): Promise<void> =>
          fs.writeFile(file, data),
        encode: async (args: readonly string[]): Promise<void> => {
          await runAutoMovieFfmpeg(props.ffmpeg, args);
        },
      });
    const video: string = path.join(out, "film.mp4");
    await fs.rename(partial, video);
    const report: string = path.join(out, "render-report.json");
    await fs.writeFile(
      report,
      JSON.stringify(
        {
          subject: name,
          revision: readAutoMovieRevision(props.root),
          backend: session.backend,
          video: "film.mp4",
          args: result.args,
          frames: result.frames.map(
            (frame: {
              index: number;
              seconds: number;
              hash: string;
            }): { index: number; seconds: number; hash: string } => ({
              index: frame.index,
              seconds: frame.seconds,
              hash: frame.hash,
            }),
          ),
        },
        null,
        2,
      ),
    );
    return { video, report, frames: result.frames.length };
  } finally {
    await fs.rm(partial, { force: true });
    await fs.rm(scratch, { recursive: true, force: true });
    await session.close();
  }
}
