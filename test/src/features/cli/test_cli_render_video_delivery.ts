import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieDialogueLipSync,
  IAutoMovieDrawnVideoResult,
  IAutoMovieInspectionDiagnostics,
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
 * Publishes only complete and approved video while always preserving the report
 * for a failed attempt that reaches the output transaction.
 *
 * Scenarios:
 *
 * 1. A generic video-only render publishes with its encoded digest and a black
 *    interval its drawn frames also show, which needs no approval without
 *    declared intent.
 * 2. A commissioned render retains both scene and decoded blockers, their frame
 *    cursor, the failed candidate's digest, and the previous film.
 * 3. A source-owned soundtrack and native silence allowance pass through the same
 *    entry. The final codec frame's samples past the container's end are
 *    padding, not duration. Missing required audio and a container that
 *    presents too little audio block.
 * 4. Encode refusal publishes its phase and reason, keeps the scene inspection
 *    drawn before it, and keeps the approved bytes.
 * 5. An interrupted empty output reservation can be reclaimed. A live reservation
 *    prevents a second writer from touching either published file.
 * 6. A report that cannot be installed restores the previous film, so the film and
 *    report never come from different attempts.
 * 7. A file whose `colr` box declares limited range is blocked with
 *    `unsupported-video-profile.color`, its report records the field with its
 *    expected and observed values, and the previous conforming film stays.
 * 8. A report with one failed lip-sync line blocks publication; a report with one
 *    inconclusive line and one envelope-driven line publishes and lists both,
 *    the second as unmeasured.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the receipt, timing and release behavior verified by each case.
 * @evidence contracts/development/testing.md#behavioral-verification Uses normal CLI operations with Render's real composer and validators, with a fake draw session and FFmpeg process boundary, and a real MP4 movie box for the audio timing.
 * @evidence contracts/development/testing.md#independent-expectations Four 250-tick frames put the first black frame at 0.25 seconds. Each published digest is Node's SHA-256 of the bytes the fixture encoder wrote. A 48 kHz track skipping 24,000 priming samples and editing to 1000 ms presents 48,000 of 72,000 decoded samples, leaving 24,000 of padding; a 750 ms edit presents 36,000, a quarter second short. The conforming header carries the profile the types declare: a 4 fps clock in a movie and track timescale of 4, the 2 by 2 raster, the unity matrix and `nclx` 1, 13, 1, full range; limited range is the one changed field of the refused file.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises absence, explicit content intent, mixed scene and delivery blockers, allowed silence, codec padding against a short container, missing audio, an encoder failure, a report installation failure, a limited-range colour box, and a failed against an inconclusive and an unmeasured lip-sync line; the lag itself belongs to test_engine_lip_sync_lag. Every probe field is owned by test_cli_delivery_video_probe and the audio profile by test_render_delivery_audio_profile.
 * @evidence contracts/development/testing.md#execution-ownership Owns its isolated temporary directory and calls no FFmpeg, browser or device.
 */
export async function test_cli_render_video_delivery(): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "automovie-delivery-"));
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
        // No sound list, so the dialogue mouths are never handed.
        speak: async () => {},
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
  // Four frames at 4 fps on one 4-tick clock, tagged as full-range sRGB.
  const picture = (
    fullRange: boolean = true,
    aspect?: readonly [number, number],
  ): NonNullable<Parameters<typeof writeDeliveryMp4Header>[0]["video"]> => ({
    timescale: 4,
    frames: 4,
    delta: 1,
    movieDuration: 4,
    width: 2,
    height: 2,
    colour: { primaries: 1, transfer: 13, matrix: 1, fullRange },
    ...(aspect === undefined ? {} : { aspect }),
  });
  const silent = (
    fullRange: boolean = true,
    aspect?: readonly [number, number],
  ): Buffer =>
    writeDeliveryMp4Header({
      movieTimescale: 4,
      video: picture(fullRange, aspect),
    });
  const sha256 = (bytes: string | Buffer): string =>
    createHash("sha256").update(bytes).digest("hex");
  let encodedBytes: string | Buffer = silent();
  // Half a second of priming, then one second; the edit's milliseconds end
  // the track.
  const soundtrack = (segment: number): Buffer =>
    writeDeliveryMp4Header({
      movieTimescale: 1000,
      timescale: 48_000,
      samples: [
        [1, 24_000],
        [1, 48_000],
      ],
      edit: { segment, mediaTime: 24_000 },
      aac: { objectType: 2, sampleRate: 48_000, channels: 2 },
      video: { ...picture(), movieDuration: 1000 },
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
    // One 72,000-sample codec frame, of which the container presents 48,000;
    // a quarter second of sound, then silence.
    const pcm = Buffer.alloc(72_000 * 4);
    for (let sample = 0; sample < 12_000; sample++)
      pcm.writeFloatLE(0.5, sample * 4);
    output?.stderr?.(
      "[Parsed_ashowinfo_1 @ abc] n:0 pts:0 pts_time:0 fmt:flt channels:1 chlayout:mono rate:48000 nb_samples:72000 checksum:00\n",
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
    const originalDigest = sha256(silent());
    TestValidator.equals(
      "generic video only is published with its actual encoded SHA",
      [
        first.status,
        first.video,
        first.source.sha256,
        first.delivery.streams.audio.status,
        first.delivery.findings[0].outcome,
        first.profile,
      ],
      ["published", "film.mp4", originalDigest, "missing", "drawn", []],
    );

    // 7. A limited-range colour box blocks and keeps the conforming film.
    encodedBytes = silent(false);
    const limited = await rejected();
    const refused = await readReport();
    TestValidator.equals(
      "a limited-range file is refused with its field and values",
      [
        limited.includes("unsupported-video-profile.color"),
        refused.status,
        refused.source.sha256,
        refused.profile,
        (await fs.readFile(video)).equals(silent()),
      ],
      [
        true,
        "blocked",
        sha256(silent(false)),
        [
          {
            media: "video",
            field: "color.resolved.kind",
            expected: "srgb",
            observed: "absent",
          },
        ],
        true,
      ],
    );

    intent = {};
    sceneError = true;
    encodedBytes = silent(true, [1, 1]);
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
      ["blocked", null, sha256(silent(true, [1, 1])), 1, 1],
    );
    TestValidator.equals(
      "the previous accepted film survives both blockers",
      (await fs.readFile(video)).equals(silent()),
      true,
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
        (await fs.readFile(video)).equals(silent()),
      ],
      [true, 36_000, true],
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
      [48_000, 24_000],
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
    TestValidator.equals("every opened session closes", sessionsClosed, 8);
    TestValidator.equals(
      "no temporary output survives the attempts",
      (await fs.readdir(path.dirname(report))).sort((a, b) =>
        a.localeCompare(b),
      ),
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
        (await fs.readdir(path.dirname(report))).sort((a, b) =>
          a.localeCompare(b),
        ),
      ],
      [true, true, ["film.mp4", "render-report.json"]],
    );

    // 8. Lip-sync entries reach the report; only a failed verdict blocks.
    await fs.rm(report, { recursive: true });
    encodedBytes = silent();
    const lipSyncFixture = (
      lipSync: IAutoMovieDialogueLipSync[],
    ): Parameters<typeof renderAutoMovieVideo>[0] => ({
      ...fixture,
      host: {
        ...fixture.host,
        render: {
          ...fixture.host.render,
          // The host's own drawing, with the mixed sound record a sound list
          // would have produced handed to the encoder.
          renderAutoMovieDrawnVideo: (props) =>
            renderAutoMovieDrawnVideo({
              ...props,
              encode: (args, drawn) =>
                props.encode(args, { ...drawn, sound: soundRecord(lipSync) }),
            }),
        },
      },
    });
    const measured = (
      verdict: "pass" | "fail" | "inconclusive",
      lagFrames: number,
    ): IAutoMovieDialogueLipSync => ({
      line: verdict,
      actor: "ann",
      status: "measured",
      lagFrames,
      lagMilliseconds: lagFrames * 250,
      correlation: verdict === "inconclusive" ? 0.1 : 0.9,
      verdict,
    });
    let lateMessage: string = "published";
    try {
      await renderAutoMovieVideo(lipSyncFixture([measured("fail", 1)]), run);
    } catch (error) {
      lateMessage = error instanceof Error ? error.message : String(error);
    }
    const late = await readReport();
    const unmeasured: IAutoMovieDialogueLipSync = {
      line: "hum",
      actor: "ann",
      status: "unmeasured",
      reason: "envelope-jaw",
    };
    await renderAutoMovieVideo(
      lipSyncFixture([measured("inconclusive", 0), unmeasured]),
      run,
    );
    const listed = await readReport();
    TestValidator.equals(
      "a failed lip-sync line blocks; inconclusive and unmeasured lines publish",
      [
        lateMessage.includes("lip-sync fail"),
        late.status,
        listed.status,
        listed.sound.lipSync.map((entry: IAutoMovieDialogueLipSync): string =>
          entry.status === "measured" ? entry.verdict : entry.reason,
        ),
      ],
      [true, "blocked", "published", ["inconclusive", "envelope-jaw"]],
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}

/**
 * The mixed sound record of a silent one-second film with the given lip-sync
 * entries.
 */
function soundRecord(
  lipSync: IAutoMovieDialogueLipSync[],
): NonNullable<IAutoMovieDrawnVideoResult["sound"]> {
  return {
    file: "soundtrack.wav",
    sha256: "sha256:" + "0".repeat(64),
    receipts: [],
    analysis: {
      version: 2,
      sampleRate: 48_000,
      sampleFrames: 48_000,
      runtimeSeconds: 1,
      integratedLoudness: null,
      truePeakDbtp: null,
      samplePeak: 0,
      clippingSamples: 0,
      longestSilenceSeconds: 1,
      eventAlignment: [],
    },
    loudness: {
      intent: {
        integratedLufs: -23,
        toleranceLu: 0.5,
        maximumTruePeakDbtp: -1,
      },
      source: "ebu-r128-default",
      dialogueLufs: -23,
      ceilingDbtp: -2,
      lines: [],
      master: { mixLufs: null, gainDb: 0, limiterGainDb: 0 },
    },
    lipSync,
  };
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

/**
 * Pinned filter-log shape for four quarter-second frames with black after the
 * first.
 */
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
