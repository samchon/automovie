import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";
import {
  AUTOMOVIE_MP4_SRGB_COLOUR,
  AutoMovieRenderDelivery,
  AutoMovieRenderVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliRender } from "automovie";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { writeDeliveryMp4Header } from "./writeDeliveryMp4Header";

/**
 * A `AutoMovieCliRender.renderVideo` run against Render's real composer and validators,
 * with a fixture draw session and FFmpeg process in place of a browser and an
 * encoder. The session draws four white 2 by 2 frames at 4 fps, the "encoder"
 * writes `encodedBytes` as the candidate, and the "decoder" logs black from the
 * second frame and, when asked for audio, one 72,000-sample codec frame with a
 * quarter second of sound. The public fields steer the next attempt.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives the CLI's public render entry with Render's real host functions; only the draw session and the FFmpeg process boundary are fixtures.
 * @evidence contracts/development/testing.md#independent-expectations Four 250-tick frames at 4 fps put the first black frame at 0.25 seconds; the headers are `writeDeliveryMp4Header`'s literal boxes.
 * @evidence contracts/development/testing.md#distinguishing-cases The fields choose content intent, a scene fault, an audio stream, an encoder refusal and the encoded bytes, which separate the delivery outcomes a test pins.
 * @evidence contracts/development/testing.md#execution-ownership Writes only under the caller's root and calls no FFmpeg, browser or device.
 */
export class CliRenderDeliveryFixture {
  /** The content intent the subject declares; absent, a generic render. */
  public intent: IAutoMovieDeliveryContentAudit.IIntent | undefined;

  /** Whether each frame carries a confirmed scene fault at 0.25 seconds. */
  public sceneError: boolean = false;

  /** Whether the decoder's video log lists an audio stream. */
  public includeAudio: boolean = false;

  /** Whether the encoder refuses its input. */
  public refuseEncode: boolean = false;

  /** The bytes the encoder writes as the candidate. */
  public encodedBytes: string | Buffer = CliRenderDeliveryFixture.silent();

  /** The soundtrack path the encoder was last handed, if any. */
  public encoderSoundtrack: string | undefined;

  /** How many draw sessions have closed. */
  public sessionsClosed: number = 0;

  /** The published film's path. */
  public readonly video: string;

  /** The published report's path. */
  public readonly report: string;

  /** The output reservation's path. */
  public readonly reservation: string;

  /** The render input, its session reading the fields above. */
  public readonly input: Parameters<typeof AutoMovieCliRender.renderVideo>[0];

  /** The temporary project root the caller owns. */
  public readonly root: string;

  /** @param root The temporary project root the caller owns. */
  public constructor(root: string) {
    this.root = root;
    this.video = path.join(root, "out", "film.mp4");
    this.report = path.join(root, "out", "render-report.json");
    this.reservation = path.join(root, "out", ".render-publish");
    this.input = {
      host: {
        render: {
          AutoMovieRenderVideo,
          createAutoMovieLoudnessMeter: AutoMovieEngineSound.createLoudnessMeter,
          AUTOMOVIE_MP4_SRGB_COLOUR,
          AutoMovieRenderDelivery,
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
            ...(this.intent === undefined ? {} : { delivery: this.intent }),
          },
          frame: async (seconds) => [
            {
              pass: "beauty",
              picture: {
                width: 2,
                height: 2,
                pixels: new Uint8ClampedArray(16).fill(255),
              },
              ...(this.sceneError
                ? { diagnostics: CliRenderDeliveryFixture.diagnostics(seconds) }
                : {}),
            },
          ],

          // No sound list, so the dialogue mouths are never handed.
          speak: async () => {},
          close: async () => {
            this.sessionsClosed++;
          },
        }),
      },
      subject: null,
      root,
      out: "out",
      props: null,
      ffmpeg: "fixture-ffmpeg",
    };
  }

  /** The FFmpeg process the render runs: the fixture encoder and decoder. */
  public readonly run: NonNullable<Parameters<typeof AutoMovieCliRender.renderVideo>[1]> =
    async (_binary, args, _accept, output) => {
      if (!args.includes("-xerror")) {
        if (this.refuseEncode) throw new Error("Fixture encoder refused input");
        const audioInput: number = args.indexOf("-i", args.indexOf("-i") + 1);
        this.encoderSoundtrack =
          audioInput === -1 ? undefined : args[audioInput + 1];
        const candidate: string | undefined = args.at(-1);
        if (candidate === undefined) throw new Error("Missing fixture output");
        TestValidator.equals(
          "candidate is separate from the published film",
          candidate === this.video,
          false,
        );
        await fs.writeFile(candidate, this.encodedBytes);
        return "";
      }
      if (args.includes("0:v:0"))
        return CliRenderDeliveryFixture.videoLog(this.includeAudio);

      // One 72,000-sample codec frame, of which the container presents 48,000;
      // a quarter second of sound, then silence.
      const pcm: Buffer = Buffer.alloc(72_000 * 4);
      for (let sample: number = 0; sample < 12_000; sample++)
        pcm.writeFloatLE(0.5, sample * 4);
      output?.stderr?.(
        "[Parsed_ashowinfo_1 @ abc] n:0 pts:0 pts_time:0 fmt:flt channels:1 chlayout:mono rate:48000 nb_samples:72000 checksum:00\n",
      );
      output?.stdout?.(pcm);
      return "";
    };

  /** The published report, parsed. */
  public async readReport(): Promise<any> {
    return JSON.parse(await fs.readFile(this.report, "utf8"));
  }

  /**
   * Render once and return the refusal's message.
   *
   * @throws {Error} When the attempt publishes a film.
   */
  public async rejected(): Promise<string> {
    try {
      await AutoMovieCliRender.renderVideo(this.input, this.run);
    } catch (error) {
      if (error instanceof Error) return error.message;
      throw error;
    }
    throw new Error("Fixture unexpectedly published a film");
  }

  /**
   * The video track's delivery facts: four frames at 4 fps on one 4-tick clock,
   * tagged as sRGB.
   *
   * @param fullRange Whether the `colr` box declares full range.
   * @param aspect The pixel aspect ratio's `pasp` box; absent, none.
   */
  public static picture(
    fullRange: boolean = true,
    aspect?: readonly [number, number],
  ): NonNullable<Parameters<typeof writeDeliveryMp4Header>[0]["video"]> {
    return {
      timescale: 4,
      frames: 4,
      delta: 1,
      movieDuration: 4,
      width: 2,
      height: 2,
      colour: { primaries: 1, transfer: 13, matrix: 1, fullRange },
      ...(aspect === undefined ? {} : { aspect }),
    };
  }

  /**
   * A video-only file of {@link picture}'s track.
   *
   * @param fullRange Whether the `colr` box declares full range.
   * @param aspect The pixel aspect ratio's `pasp` box; absent, none.
   */
  public static silent(
    fullRange: boolean = true,
    aspect?: readonly [number, number],
  ): Buffer {
    return writeDeliveryMp4Header({
      movieTimescale: 4,
      video: CliRenderDeliveryFixture.picture(fullRange, aspect),
    });
  }

  /**
   * A file with a 48 kHz AAC track of half a second of priming, then one
   * second; the edit's milliseconds end the track.
   *
   * @param segment The audio edit's duration, milliseconds.
   */
  public static soundtrack(segment: number): Buffer {
    return writeDeliveryMp4Header({
      movieTimescale: 1000,
      timescale: 48_000,
      samples: [
        [1, 24_000],
        [1, 48_000],
      ],
      edit: { segment, mediaTime: 24_000 },
      aac: { objectType: 2, sampleRate: 48_000, channels: 2 },
      video: { ...CliRenderDeliveryFixture.picture(), movieDuration: 1000 },
    });
  }

  /** Node's SHA-256 of the bytes, in hex. */
  public static sha256(bytes: string | Buffer): string {
    return createHash("sha256").update(bytes).digest("hex");
  }

  /** Scene diagnostics with a fault starting at the second frame. */
  private static diagnostics(seconds: number): IAutoMovieInspectionDiagnostics {
    return {
      scope: "film/shot",
      time: { filmSeconds: seconds },
      findings:
        seconds === 0.25
          ? [
              {
                check: "fixture",
                key: "collision",
                code: "SCENE_FIXTURE",
                paths: ["bed", "person"],
                category: "error",
                confidence: "confirmed",
                message: "Confirmed penetration",
                witness: {},
              },
            ]
          : [],
      coverage: [
        {
          check: "fixture",
          key: "collision",
          required: true,
          status: "checked",
        },
      ],
    };
  }

  /**
   * Pinned filter-log shape for four quarter-second frames with black after the
   * first.
   */
  private static videoLog(audio: boolean): string {
    return [
      "Input #0, mov, from 'fixture.mp4':",
      "  Stream #0:0[0x1](und): Video: h264 (High)",
      ...(audio ? ["  Stream #0:1[0x2](und): Audio: aac (LC)"] : []),
      "Stream mapping:",
      "[Parsed_showinfo_0 @ abc] config in time_base: 1/1000, frame_rate: 4/1",
      ...[0, 250, 500, 750].map(
        (pts, index) =>
          "[Parsed_showinfo_0 @ abc] n: " +
          index +
          " pts: " +
          pts +
          " pts_time:" +
          pts / 1000 +
          " duration: 250 duration_time:0.25 fmt:yuv420p",
      ),
      "[Parsed_metadata_3 @ abc] frame:1 pts:250 pts_time:0.25",
      "[Parsed_metadata_3 @ abc] lavfi.black_start=0.25",
    ].join("\n");
  }
}
