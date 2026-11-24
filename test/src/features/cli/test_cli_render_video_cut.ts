import type {
  IAutoMovieDeliveredCutEntry,
  IAutoMoviePlaybackTimeline,
} from "@automovie/interface";
import {
  AUTOMOVIE_MP4_SRGB_COLOUR,
  assertProductionAacProfile,
  assertProductionVideoProfile,
  auditAutoMovieDeliveryContent,
  createAutoMovieLoudnessMeter,
  renderAutoMovieDrawnVideo,
  resolveProductionVideoProfile,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { renderAutoMovieVideo } from "automovie";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { writeDeliveryMp4Header } from "../internal/writeDeliveryMp4Header";

/**
 * A one-second film at 4 fps cut into two entries of one shot, the second
 * starting at 0.6 s.
 */
const CUT: IAutoMoviePlaybackTimeline = {
  runtime: 1,
  entries: [
    { entry: 0, shot: "shot:a", start: 0, played: 0.6, offset: 0 },
    { entry: 1, shot: "shot:a", start: 0.6, played: 0.4, offset: 2 },
  ],
};

/**
 * The render report records the film's cut beside the digest of the file it
 * audited, so a reader can trust the cut for the `film.mp4` beside it only when
 * the report is published and the digests match.
 *
 * Scenarios:
 *
 * 1. A published render of a subject with a two-entry cut writes `cut` with each
 *    entry's fields and its live frames, `[0, 3)` and `[3, 4)` at 4 fps, and
 *    `source.sha256` equal to the SHA-256 of the published `film.mp4`.
 * 2. A subject with no cut publishes a report with no `cut` field.
 * 3. A blocked attempt, a file whose colour box declares limited range, keeps the
 *    previous `film.mp4` and installs a `blocked` report whose `source.sha256`
 *    differs from the kept film's, so its cut no longer describes the film
 *    beside it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the CLI render with render's real drawn-video composer and validators over a fake draw session and FFmpeg boundary, then reads the installed report and film; a dropped or invented cut, a cut without the audited digest, or a blocked attempt that replaced the film fails.
 * @evidence contracts/development/testing.md#independent-expectations Frames sit at 0, 0.25, 0.5 and 0.75 s, so the entry starting at 0.6 s is live from frame 3; digests are Node's SHA-256 of the bytes the fixture encoder wrote. The conforming and limited-range headers differ only in the colour range the profile check reads.
 * @evidence contracts/development/testing.md#distinguishing-cases A subject with and without a cut, and a published against a blocked attempt; range edge cases are owned by `test_draw_drawn_video_cut` and the profile checks by `test_cli_render_video_delivery`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_cli_render_video_cut`; it owns an isolated temporary directory and runs no FFmpeg, browser or device.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_cli_render_video_cut(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-cut-"),
  );
  let cut: IAutoMoviePlaybackTimeline | undefined = CUT;
  const fixture: Parameters<typeof renderAutoMovieVideo>[0] = {
    host: {
      render: {
        renderAutoMovieDrawnVideo,
        auditAutoMovieDeliveryContent,
        createAutoMovieLoudnessMeter,
        AUTOMOVIE_MP4_SRGB_COLOUR,
        assertProductionAacProfile,
        assertProductionVideoProfile,
        resolveProductionVideoProfile,
      },
      session: async () => ({
        backend: "fixture",
        subject: {
          name: "test",
          durationSeconds: 1,
          fps: 4,
          width: 2,
          height: 2,
          views: [],
          marks: [],
          drawables: [],
          ...(cut === undefined ? {} : { cut }),
        },
        frame: async () => [
          {
            pass: "beauty" as const,
            picture: {
              width: 2,
              height: 2,
              pixels: new Uint8ClampedArray(16).fill(255),
            },
          },
        ],
        // No sound list, so the dialogue mouths are never handed.
        speak: async (): Promise<void> => {},
        close: async (): Promise<void> => {},
      }),
    },
    subject: null,
    root,
    out: "out",
    props: null,
    ffmpeg: "fixture-ffmpeg",
  };
  const video: string = path.join(root, "out", "film.mp4");
  const report: string = path.join(root, "out", "render-report.json");
  const header: (fullRange: boolean) => Buffer = (fullRange: boolean): Buffer =>
    writeDeliveryMp4Header({
      movieTimescale: 4,
      video: {
        timescale: 4,
        frames: 4,
        delta: 1,
        movieDuration: 4,
        width: 2,
        height: 2,
        colour: { primaries: 1, transfer: 13, matrix: 1, fullRange },
      },
    });
  const sha256: (bytes: Buffer) => string = (bytes: Buffer): string =>
    createHash("sha256").update(bytes).digest("hex");
  let encoded: Buffer = header(true);
  const run: NonNullable<Parameters<typeof renderAutoMovieVideo>[1]> = async (
    _binary,
    args,
  ) => {
    if (!args.includes("-xerror")) {
      await fs.writeFile(args.at(-1)!, encoded);
      return "";
    }
    return videoLog();
  };

  try {
    // 1. A published cut beside the audited digest.
    await renderAutoMovieVideo(fixture, run);
    const published: any = JSON.parse(await fs.readFile(report, "utf8"));
    TestValidator.equals(
      "the published report keeps the cut and the film's digest",
      [
        published.status,
        published.source.sha256 === sha256(await fs.readFile(video)),
        published.cut,
      ],
      [
        "published",
        true,
        [
          {
            entry: 0,
            shot: "shot:a",
            start: 0,
            played: 0.6,
            offset: 0,
            liveFrames: [0, 3],
          },
          {
            entry: 1,
            shot: "shot:a",
            start: 0.6,
            played: 0.4,
            offset: 2,
            liveFrames: [3, 4],
          },
        ] satisfies IAutoMovieDeliveredCutEntry[],
      ],
    );

    // 2. No cut, no field.
    cut = undefined;
    await renderAutoMovieVideo(fixture, run);
    TestValidator.equals(
      "a subject without a cut leaves no cut field",
      "cut" in JSON.parse(await fs.readFile(report, "utf8")),
      false,
    );

    // 3. A blocked attempt keeps the film and installs its own report.
    cut = CUT;
    const kept: Buffer = await fs.readFile(video);
    encoded = header(false);
    const leaked: boolean = await renderAutoMovieVideo(fixture, run)
      .then((): boolean => true)
      .catch((): boolean => false);
    if (leaked) throw new Error("A limited-range file was published");
    const blocked: any = JSON.parse(await fs.readFile(report, "utf8"));
    TestValidator.equals(
      "a blocked report no longer matches the kept film",
      [
        blocked.status,
        (await fs.readFile(video)).equals(kept),
        blocked.source.sha256 === sha256(kept),
        blocked.source.sha256 === sha256(header(false)),
      ],
      ["blocked", true, false, true],
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}

/** Pinned filter-log shape of four quarter-second frames with no black interval. */
function videoLog(): string {
  return [
    "Input #0, mov, from 'fixture.mp4':",
    "  Stream #0:0[0x1](und): Video: h264 (High)",
    "Stream mapping:",
    "[Parsed_showinfo_0 @ abc] config in time_base: 1/1000, frame_rate: 4/1",
    ...[0, 250, 500, 750].map(
      (pts: number, index: number): string =>
        "[Parsed_showinfo_0 @ abc] n: " +
        index +
        " pts: " +
        pts +
        " pts_time:" +
        pts / 1000 +
        " duration: 250 duration_time:0.25 fmt:yuv420p",
    ),
  ].join("\n");
}
