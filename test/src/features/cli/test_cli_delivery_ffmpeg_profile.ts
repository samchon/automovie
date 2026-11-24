import type {
  IAutoMovieProductionAudioProbe,
  IAutoMovieProductionVideoProbe,
  IAutoMovieRenderSpec,
} from "@automovie/interface";
import {
  AUTOMOVIE_MP4_SRGB_COLOUR,
  assertProductionAacProfile,
  assertProductionVideoProfile,
  encodeAutoMovieRasterPng,
  encodeAutoMovieWavPcm16,
  planAutoMovieVideoEncoding,
  resolveProductionVideoProfile,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  loadAutoMovieProductionModule,
  readAutoMovieDeliveryProbe,
  resolveAutoMovieFfmpeg,
} from "automovie";
import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { repositoryRoot } from "../internal/repositoryRoot";

/** The encoding controls the CLI's render passes for a production film. */
const SPEC: Omit<IAutoMovieRenderSpec, "frameFormat"> = {
  target: "production",
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 18,
};

/**
 * FFmpeg, run with the arguments `planAutoMovieVideoEncoding` ships, writes a
 * delivered film that passes the delivery video profile and the AAC audio
 * profile.
 *
 * Scenarios:
 *
 * 1. 241 frames at 24 fps, a runtime of 10.041666… s that is not a whole number of
 *    milliseconds, with a one-second 48 kHz stereo soundtrack, encode to a file
 *    whose boxes pass `assertProductionVideoProfile` for a 16 × 16 raster at
 *    24/1, so the colour box, matrix, sample timing and edit list conform.
 * 2. Its movie runtime `movieDuration / movieTimescale` is exactly 241/24 s and
 *    any edit's `segmentDuration` equals `movieDuration`.
 * 3. Its audio track passes `assertProductionAacProfile`: AAC-LC, 48 kHz, two
 *    channels.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Writes the frames with the shipped PNG encoder and the soundtrack with the shipped WAVE encoder, runs the FFmpeg the CLI resolves with the planned vector, reads the file with the CLI's MP4 box reader and asserts it with render's profile asserters. An encoder that tags limited range or no colour, writes B-frames, rounds the movie clock to milliseconds or writes another audio codec fails.
 * @evidence contracts/development/testing.md#independent-expectations The profile is the delivery contract of #4087: BT.709 primaries 1, sRGB transfer 13, BT.709 matrix 1 and full range, composition from time zero, and a movie runtime equal to the media runtime; 241 frames at 24 fps run 241/24 s; the AAC profile is ISO/IEC 14496-3 AAC-LC at 48 kHz in two channels.
 * @evidence contracts/development/testing.md#distinguishing-cases The odd frame count makes a millisecond movie clock differ from the media runtime, which the synthetic headers of `test_cli_delivery_video_probe` cover field by field; refusal of each mismatch belongs to that test and to `test_cli_render_video_delivery`.
 * @evidence contracts/development/testing.md#execution-ownership A native-tool integration test: it runs the FFmpeg binary `resolveAutoMovieFfmpeg` finds, `FFMPEG_PATH` or the CLI package's `ffmpeg-static`, which `pnpm install` downloads, in a temporary folder it removes.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the profile facts it pins.
 */
export async function test_cli_delivery_ffmpeg_profile(): Promise<void> {
  const ffmpeg: string = resolveAutoMovieFfmpeg({
    env: process.env,
    load: (id: string): unknown =>
      loadAutoMovieProductionModule(
        path.join(repositoryRoot(), "packages", "cli"),
        id,
      ),
  });
  const folder: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-delivery-"),
  );
  try {
    // 241 frames of a 16 × 16 raster whose shade steps every frame.
    const frameDir: string = path.join(folder, "frames");
    await fs.mkdir(frameDir);
    for (let index: number = 0; index < 241; ++index) {
      const pixels: Uint8ClampedArray = new Uint8ClampedArray(16 * 16 * 4);
      for (let at: number = 0; at < pixels.length; at += 4) {
        pixels[at] = index;
        pixels[at + 1] = 255 - index;
        pixels[at + 2] = (at / 4) % 256;
        pixels[at + 3] = 255;
      }
      await fs.writeFile(
        path.join(frameDir, `frame_${String(index).padStart(5, "0")}.png`),
        await encodeAutoMovieRasterPng({ width: 16, height: 16, pixels }),
      );
    }

    // One second of a 440 Hz tone at 48 kHz in both channels.
    const tone: Float32Array = Float32Array.from(
      { length: 48_000 },
      (_: unknown, index: number): number =>
        0.25 * Math.sin((2 * Math.PI * 440 * index) / 48_000),
    );
    const soundtrack: string = path.join(folder, "soundtrack.wav");
    await fs.writeFile(soundtrack, encodeAutoMovieWavPcm16(tone, tone, 48_000));

    const output: string = path.join(folder, "film.mp4");
    const plan: ReturnType<typeof planAutoMovieVideoEncoding> =
      planAutoMovieVideoEncoding({
        spec: { ...SPEC, frameFormat: { width: 16, height: 16, fps: 24 } },
        durationSeconds: 241 / 24,
        frameDir: frameDir.replaceAll("\\", "/"),
        outputPath: output,
        audio: soundtrack,
      });
    await new Promise<undefined>(
      (
        resolve: (value: undefined) => void,
        reject: (error: Error) => void,
      ): void => {
        execFile(ffmpeg, plan.args, (error: Error | null): void =>
          error === null ? resolve(undefined) : reject(error),
        );
      },
    );

    const probe: {
      video: IAutoMovieProductionVideoProbe;
      audio: IAutoMovieProductionAudioProbe | null;
    } = await readAutoMovieDeliveryProbe(output, AUTOMOVIE_MP4_SRGB_COLOUR);

    // 1. The video profile.
    assertProductionVideoProfile({
      expected: resolveProductionVideoProfile({
        width: 16,
        height: 16,
        frameRate: { numerator: 24, denominator: 1 },
      }),
      actual: probe.video,
    });

    // 2. The movie clock.
    const presentation: IAutoMovieProductionVideoProbe["presentation"] =
      probe.video.presentation;
    TestValidator.equals(
      "the movie runtime is the 241-frame runtime and any edit spans it",
      [
        presentation.movieDuration * 24 === 241 * presentation.movieTimescale,
        presentation.edits.every(
          (
            edit: IAutoMovieProductionVideoProbe["presentation"]["edits"][number],
          ): boolean => edit.segmentDuration === presentation.movieDuration,
        ),
        probe.video.frameCount,
      ],
      [true, true, 241],
    );

    // 3. The audio profile.
    if (probe.audio === null)
      throw new Error("the delivered film has no audio track");
    assertProductionAacProfile(probe.audio);
  } finally {
    await fs.rm(folder, { recursive: true, force: true });
  }
}
