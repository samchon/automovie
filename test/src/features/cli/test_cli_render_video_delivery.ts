import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";
import {
  auditAutoMovieDeliveryContent,
  renderAutoMovieDrawnVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { renderAutoMovieVideo } from "automovie";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { writeDeliveryMp4Header } from "../internal/writeDeliveryMp4Header";

/**
 * Publishes only complete and approved video while always preserving the report
 * for a failed attempt that reaches the output transaction.
 *
 * Scenarios:
 * 1. A generic video-only render publishes with its encoded digest and a black interval its drawn frames also show, which needs no approval without declared intent.
 * 2. A commissioned render retains both scene and decoded blockers, their frame cursor, the failed candidate's digest, and the previous film.
 * 3. A source-owned soundtrack and native silence allowance pass through the same entry. The final codec frame's samples past the container's end are padding, not duration. Missing required audio and a container that presents too little audio block.
 * 4. Encode refusal publishes its phase and reason, keeps the scene inspection drawn before it, and keeps the approved bytes.
 * 5. An interrupted empty output reservation can be reclaimed. A live reservation prevents a second writer from touching either published file.
 * 6. A report that cannot be installed restores the previous film, so the film and report never come from different attempts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the receipt, timing and release behavior verified by each case.
 * @evidence contracts/development/testing.md#behavioral-verification Uses normal CLI operations with Render's real composer and validators, with a fake draw session and FFmpeg process boundary, and a real MP4 movie box for the audio timing.
 * @evidence contracts/development/testing.md#independent-expectations Four 250-tick frames put the first black frame at 0.25 seconds. Literal SHA-256 values for abc and hello identify independent fixed byte sequences. A 4 Hz track skipping two priming samples and editing to 1000 ms presents four of six decoded samples, leaving two of padding; a 750 ms edit presents three, a quarter second short.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises absence, explicit content intent, mixed scene and delivery blockers, allowed silence, codec padding against a short container, missing audio, an encoder failure and a report installation failure.
 * @evidence contracts/development/testing.md#execution-ownership Owns its isolated temporary directory and calls no FFmpeg, browser or device.
 */
export async function test_cli_render_video_delivery(): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "automovie-delivery-"));
  const fixture: Parameters<typeof renderAutoMovieVideo>[0] = {
    host: {
      render: { renderAutoMovieDrawnVideo, auditAutoMovieDeliveryContent },
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
          ...(intent === undefined ? {} : { delivery: intent }),
        },
        frame: async (seconds) => [
          {
            pass: "beauty",
            picture: {
              width: 2,
              height: 2,
              pixels: new Uint8ClampedArray(16).fill(255),
            },
            ...(sceneError ? { diagnostics: diagnostics(seconds) } : {}),
          },
        ],
        close: async () => {
          sessionsClosed++;
        },
      }),
    },
    subject: null,
    root,
    out: "out",
    props: null,
    ffmpeg: "fixture-ffmpeg",
  };
  const video = path.join(root, "out", "film.mp4");
  const report = path.join(root, "out", "render-report.json");
  const reservation = path.join(root, "out", ".render-publish");
  const readReport = async () => JSON.parse(await fs.readFile(report, "utf8"));
  let intent: IAutoMovieDeliveryContentAudit.IIntent | undefined;
  let sceneError = false;
  let sessionsClosed = 0;
  let encodedBytes: string | Buffer = "abc";
  // Two samples of priming, then four; the edit's milliseconds end the track.
  const soundtrack = (segment: number): Buffer =>
    writeDeliveryMp4Header({
      movieTimescale: 1000,
      timescale: 4,
      samples: [
        [1, 2],
        [1, 4],
      ],
      edit: { segment, mediaTime: 2 },
    });
  let includeAudio = false;
  let refuseEncode = false;
  let encoderSoundtrack: string | undefined;

  const run: NonNullable<Parameters<typeof renderAutoMovieVideo>[1]> = async (
    _binary,
    args,
    _accept,
    output,
  ) => {
    if (!args.includes("-xerror")) {
      if (refuseEncode) throw new Error("Fixture encoder refused input");
      const audioInput = args.indexOf("-i", args.indexOf("-i") + 1);
      encoderSoundtrack = audioInput === -1 ? undefined : args[audioInput + 1];
      const candidate = args.at(-1);
      if (candidate === undefined) throw new Error("Missing fixture output");
      TestValidator.equals(
        "candidate is separate from the published film",
        candidate === video,
        false,
      );
      await fs.writeFile(candidate, encodedBytes);
      return "";
    }
    if (args.includes("0:v:0")) return videoLog(includeAudio);
    // One six-sample codec frame, of which the container presents four.
    const pcm = Buffer.alloc(24);
    pcm.writeFloatLE(0.5);
    output?.stderr?.(
      "[Parsed_ashowinfo_1 @ abc] n:0 pts:0 pts_time:0 fmt:flt channels:1 chlayout:mono rate:4 nb_samples:6 checksum:00\n",
    );
    output?.stdout?.(pcm);
    return "";
  };
  const rejected = async (): Promise<string> => {
    try {
      await renderAutoMovieVideo(fixture, run);
    } catch (error) {
      if (error instanceof Error) return error.message;
      throw error;
    }
    throw new Error("Fixture unexpectedly published a film");
  };

  try {
    await fs.mkdir(reservation, { recursive: true });
    await renderAutoMovieVideo(fixture, run);
    const first = await readReport();
    const originalDigest =
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    TestValidator.equals(
      "generic video only is published with its actual encoded SHA",
      [
        first.status,
        first.video,
        first.source.sha256,
        first.delivery.streams.audio.status,
        first.delivery.findings[0].outcome,
      ],
      ["published", "film.mp4", originalDigest, "missing", "drawn"],
    );

    intent = {};
    sceneError = true;
    encodedBytes = "hello";
    const failure = await rejected();
    const blocked = await readReport();
    TestValidator.equals(
      "both selected checks retain the same inspectable cursor",
      [
        failure.includes("SCENE_FIXTURE at frame 1 (0.25 s)"),
        failure.includes("black at frame 1 (0.25 s)"),
      ],
      [true, true],
    );
    TestValidator.equals(
      "blocked attempt carries its own digest and both diagnostics",
      [
        blocked.status,
        blocked.video,
        blocked.source.sha256,
        blocked.diagnostics.episodes[0].first.time.outputFrame,
        blocked.delivery.findings[0].firstOutputFrame,
      ],
      [
        "blocked",
        null,
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
        1,
        1,
      ],
    );
    TestValidator.equals(
      "the previous accepted film survives both blockers",
      await fs.readFile(video, "utf8"),
      "abc",
    );

    sceneError = false;
    const start = { ticks: 1, timeBase: [1, 4] as const };
    const end = { ticks: 1, timeBase: [1, 1] as const };
    intent = {
      audio: { path: "sound/accompaniment.wav", required: true },
      allowances: [
        { detector: "black", start, end },
        { detector: "silence", start, end },
      ],
    };
    includeAudio = true;
    encodedBytes = soundtrack(750);
    TestValidator.equals(
      "codec padding cannot hide a short presented duration",
      [
        (await rejected()).includes(
          "audio: The decoded stream does not cover the commissioned presentation",
        ),
        (await readReport()).delivery.streams.audio.end.ticks,
        await fs.readFile(video, "utf8"),
      ],
      [true, 3, "abc"],
    );

    encodedBytes = soundtrack(1000);
    await renderAutoMovieVideo(fixture, run);
    const approved = await readReport();
    TestValidator.equals(
      "source path is resolved by CLI and authored silence is allowed",
      [
        encoderSoundtrack,
        approved.status,
        approved.delivery.findings[1].outcome,
        approved.delivery.findings[1].firstOutputFrame,
      ],
      [
        path.join(root, "sound", "accompaniment.wav"),
        "published",
        "intentional",
        undefined,
      ],
    );
    TestValidator.equals(
      "the final frame's samples past the container end are padding",
      [
        approved.delivery.streams.audio.end.ticks,
        approved.delivery.streams.audio.trailingPadding,
      ],
      [4, 2],
    );

    intent.audio = { path: null, required: true };
    includeAudio = false;
    encodedBytes = "rejected candidate";
    const missing = await rejected();
    TestValidator.equals(
      "a required missing stream is diagnosed without replacing the film",
      [
        missing.includes("commissioned stream is absent"),
        (await fs.readFile(video)).equals(soundtrack(1000)),
      ],
      [true, true],
    );

    refuseEncode = true;
    sceneError = true;
    const refusal = await rejected();
    const failed = await readReport();
    TestValidator.equals(
      "encoder failure retains independent phase and reason",
      [
        refusal.includes(report),
        failed.status,
        failed.video,
        failed.failure.phase,
        failed.source,
      ],
      [true, "failed", null, "encode", null],
    );
    TestValidator.equals(
      "encoder failure keeps the scene inspection already drawn",
      [
        failed.frames.length,
        failed.diagnostics.hasBlockingFinding,
        failed.diagnostics.episodes[0].first.time.outputFrame,
      ],
      [4, true, 1],
    );
    sceneError = false;
    await fs.mkdir(reservation);
    const activeTicket = path.join(
      reservation,
      "owner-" + process.pid + "-.render-live",
    );
    await fs.writeFile(activeTicket, "");
    const conflict = await rejected();
    TestValidator.equals(
      "a live reservation leaves the published paths alone",
      [
        conflict.includes("Another render has reserved"),
        (await fs.readFile(video)).equals(soundtrack(1000)),
        (await readReport()).failure.phase,
      ],
      [true, true, "encode"],
    );
    await fs.unlink(activeTicket);
    await fs.rmdir(reservation);
    TestValidator.equals("every opened session closes", sessionsClosed, 7);
    TestValidator.equals(
      "no temporary output survives the attempts",
      (await fs.readdir(path.dirname(report))).sort(),
      ["film.mp4", "render-report.json"],
    );

    // A directory in the report's place refuses the report's rename.
    refuseEncode = false;
    intent = undefined;
    includeAudio = false;
    encodedBytes = "never published";
    await fs.rm(report);
    await fs.mkdir(path.join(report, "occupied"), { recursive: true });
    const unreported = await rejected();
    TestValidator.equals(
      "a report that cannot be installed restores the previous film",
      [
        unreported.includes("could not publish"),
        (await fs.readFile(video)).equals(soundtrack(1000)),
        (await fs.readdir(path.dirname(report))).sort(),
      ],
      [true, true, ["film.mp4", "render-report.json"]],
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}

/** Scene diagnostics with a fault starting at the second frame. */
function diagnostics(seconds: number): IAutoMovieInspectionDiagnostics {
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
      { check: "fixture", key: "collision", required: true, status: "checked" },
    ],
  };
}

/** Pinned filter-log shape for four quarter-second frames with black after the first. */
function videoLog(audio: boolean): string {
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
