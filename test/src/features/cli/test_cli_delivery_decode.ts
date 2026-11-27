import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliDelivery } from "automovie";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as nodePath from "node:path";

import { writeDeliveryMp4Header } from "../internal/writeDeliveryMp4Header";

/**
 * Reads the native video and audio evidence supplied by the delivery CLI.
 *
 * Scenarios:
 *
 * 1. The video plan preserves timestamps, runs both detectors once, and uses a
 *    null output. The audio plan emits f32le on stdout.
 * 2. A fractional presentation grid retains exact carrier and reference-frame
 *    times. Black closes at a nonblack frame and a freeze remains open at EOF.
 * 3. A suffix reporting a rounded EOF does not override decoded duration. Missing
 *    native frame duration or ambiguous freeze time makes the stream
 *    uncovered.
 * 4. The audio scan spans split floats and stereo frames, preserves exact silence
 *    bounds, and requires all channels to be quiet.
 * 5. Partial PCM, audio frame gaps and decoder refusal do not establish continuous
 *    coverage.
 * 6. A one-tick frame at 1 fps uses the exact native time base. An unsafe ratio
 *    that would round to one second per tick leaves the video uncovered.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the native evidence and clock behaviors checked by each case.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real delivery entry with a process runner fixture and feeds it split text and PCM exactly as the process owner does.
 * @evidence contracts/development/testing.md#independent-expectations Exact expected ticks follow from five literal 1001-tick frames at 1/30000 and six literal interleaved stereo sample frames at 8 kHz.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises native EOF, missing or ambiguous timing evidence, split float boundaries, a nonquiet second channel, and incomplete audio coverage.
 * @evidence contracts/development/testing.md#execution-ownership Uses synthetic FFmpeg text and PCM fixtures and starts no process or device. The audio pass reads a movie header written to its own temporary folder, presenting all six decoded sample frames, and the folder is removed afterwards.
 */
export async function test_cli_delivery_decode(): Promise<void> {
  const folder = await fs.mkdtemp(
    nodePath.join(os.tmpdir(), "automovie-delivery-decode-"),
  );
  try {
    await decodeDelivery(nodePath.join(folder, "film attempt.partial.mp4"));
  } finally {
    await fs.rm(folder, { recursive: true });
  }
}

/**
 * Runs every scenario against one delivery path holding a six-sample audio
 * movie header.
 */
async function decodeDelivery(path: string): Promise<void> {
  await fs.writeFile(
    path,
    writeDeliveryMp4Header({
      movieTimescale: 8000,
      timescale: 8000,
      samples: [[2, 3]],
    }),
  );
  const frameRate = [30000, 1001] as const;
  const thresholds: IAutoMovieDeliveryContentAudit.IThresholds = {
    black: {
      minimumDuration: { ticks: 1, timeBase: [1, 10] },
      minimumPictureRatio: 0.98,
      maximumPixelThreshold: 0.1,
    },
    frozen: {
      minimumDuration: { ticks: 1, timeBase: [1, 10] },
      maximumMeanDifference: 0.001,
    },
    silence: {
      minimumDuration: { ticks: 2, timeBase: [1, 8000] },
      maximumAmplitude: 0.05,
    },
  };
  const expected = { frameRate, frameCount: 5 };
  const headers = [
    "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'film attempt.partial.mp4':",
    "  Stream #0:0[0x1](und): Video: h264 (High)",
    "Stream mapping:",
    "  Stream #0:0 -> #0:0 (h264 (native) -> wrapped_avframe (native))",
    "[Parsed_showinfo_0 @ abc] config in time_base: 1/30000, frame_rate: 30000/1001",
  ];
  const picture = (index: number, pts: number, time: string): string =>
    "[Parsed_showinfo_0 @ abc] n: " +
    index +
    " pts: " +
    pts +
    " pts_time:" +
    time +
    " duration: 1001 duration_time:0.0333667 fmt:yuv420p";
  const tag = (
    index: number,
    pts: number,
    time: string,
    value: string,
  ): string[] => [
    "[Parsed_metadata_3 @ def] frame:" +
      index +
      " pts:" +
      pts +
      " pts_time:" +
      time,
    "[Parsed_metadata_3 @ def] " + value,
  ];
  const log = [
    ...headers,
    picture(0, 0, "0"),
    picture(1, 1001, "0.0333667"),
    ...tag(1, 1001, "0.0333667", "lavfi.black_start=0.0333667"),
    picture(2, 2002, "0.0667333"),
    picture(3, 3003, "0.1001"),
    ...tag(3, 3003, "0.1001", "lavfi.black_end=0.1001"),
    picture(4, 4004, "0.133467"),
    ...tag(4, 4004, "0.133467", "lavfi.freezedetect.freeze_start=0.0667333"),
    "[blackdetect @ abc] black_start:0.0333667 black_end:0.1001 black_duration:0.0667333",
  ].join("\n");
  const video = (ticks: number): IAutoMovieDeliveryContentAudit.ITimestamp => ({
    ticks,
    timeBase: [1, 30000],
  });
  const invocations: (readonly string[])[] = [];
  const pcm = Buffer.alloc(48);
  [0.1, 0.5, 0, 0, 0.01, -0.04, 0, -0.5, 0, 0, 0, 0].forEach((sample, index) =>
    pcm.writeFloatLE(sample, index * 4),
  );
  const sampleLines = [
    "[Parsed_ashowinfo_1 @ abc] n:0 pts:0 pts_time:0 fmt:flt channels:2 chlayout:stereo rate:8000 nb_samples:3 checksum:00",
    "[Parsed_ashowinfo_1 @ abc] n:1 pts:3 pts_time:0.000375 fmt:flt channels:2 chlayout:stereo rate:8000 nb_samples:3 checksum:00",
  ];
  const decode = (
    videoLog: string,
    lastFrame: string = sampleLines[1] ?? "",
    finalByte: number = pcm.length,
  ) =>
    AutoMovieCliDelivery.decode(
      "fixture-ffmpeg",
      path,
      expected,
      thresholds,
      async (binary, args, _accept, output) => {
        TestValidator.equals(
          "same resolved executable",
          binary,
          "fixture-ffmpeg",
        );
        invocations.push(args);
        if (args.includes("0:v:0")) return videoLog;
        output?.stdout?.(pcm.subarray(0, 5));
        const firstFrame = sampleLines[0] ?? "";
        output?.stderr?.(firstFrame.slice(0, 47));
        output?.stderr?.(firstFrame.slice(47) + "\n" + lastFrame);
        output?.stdout?.(pcm.subarray(5, 14));
        output?.stdout?.(pcm.subarray(14, 35));
        output?.stdout?.(pcm.subarray(35, finalByte));
        return "";
      },
    );
  const decoded = await decode(log);
  TestValidator.equals("video-only uses one decode", invocations.length, 1);
  TestValidator.equals(
    "fractional video clips use exact decoded ticks",
    decoded,
    {
      video: {
        status: "decoded",
        index: 0,
        start: video(0),
        end: video(5005),
        continuous: true,
        observations: [
          { detector: "black", start: video(1001), end: video(3003) },
          { detector: "frozen", start: video(2002), end: null },
        ],
      },
      audio: { status: "missing" },
    },
  );

  const audioListed = log.replace(
    "\nStream mapping:",
    "\n  Stream #0:1[0x2](und): Audio: aac (LC), 48000 Hz, stereo\nStream mapping:",
  );
  const audio = (ticks: number): IAutoMovieDeliveryContentAudit.ITimestamp => ({
    ticks,
    timeBase: [1, 8000],
  });
  const withAudio = await decode(audioListed);
  TestValidator.equals(
    "one extra pass only when audio was listed",
    invocations.length,
    3,
  );
  const videoArgs = invocations[0] ?? [];
  const audioArgs = invocations[2] ?? [];

  TestValidator.equals(
    "lossless input presentation clock",
    videoArgs.slice(3, 11),
    ["-xerror", "-copyts", "-i", path, "-map", "0:v:0", "-an", "-vf"],
  );
  TestValidator.equals(
    "one video decode uses exact frame logs and an earlier freeze primer",
    videoArgs[11],
    "showinfo=checksum=0,blackdetect=d=0:pic_th=0.98:pix_th=0.1,freezedetect=n=0.001:d=66632us,metadata=mode=print",
  );
  TestValidator.equals("video analysis writes no media", videoArgs.slice(-5), [
    "-fps_mode",
    "passthrough",
    "-f",
    "null",
    "-",
  ]);
  TestValidator.equals(
    "audio analysis pipes unpadded floats",
    audioArgs.slice(7),
    [
      "-map",
      "0:a:0",
      "-vn",
      "-af",
      "aformat=sample_fmts=flt,ashowinfo",
      "-c:a",
      "pcm_f32le",
      "-f",
      "f32le",
      "pipe:1",
    ],
  );
  TestValidator.equals(
    "actual decoded stereo silence keeps the sample clock",
    withAudio.audio,
    {
      status: "decoded",
      index: 1,
      sampleRate: 8000,
      start: audio(0),
      end: audio(6),
      continuous: true,
      observations: [
        { detector: "silence", start: audio(1), end: audio(3) },
        { detector: "silence", start: audio(4), end: null },
      ],
    },
  );

  const invalidVideo = await decode(
    log.replace("duration: 1001", "duration: 0"),
  );
  TestValidator.equals(
    "missing duration cannot be inferred from commissioned fps",
    invalidVideo.video.status,
    "uncovered",
  );
  const ambiguousVideo = await decode(
    log.replace("pts: 0 pts_time:0 ", "pts: 0 pts_time:0.0667333 "),
  );
  TestValidator.equals(
    "ambiguous native freeze timestamp marks coverage",
    ambiguousVideo.video.status,
    "uncovered",
  );

  const truncated = await decode(audioListed, sampleLines[1], pcm.length - 1);
  TestValidator.equals(
    "partial PCM cannot cover audio",
    truncated.audio.status,
    "uncovered",
  );
  const gap = await decode(
    audioListed,
    sampleLines[1]?.replace("pts:3 ", "pts:4 "),
  );
  TestValidator.equals("native PTS gap is retained", gap.audio, {
    status: "decoded",
    index: 1,
    sampleRate: 8000,
    start: audio(0),
    end: audio(7),
    continuous: false,
    observations: [],
  });
  const refused = await AutoMovieCliDelivery.decode(
    "fixture-ffmpeg",
    path,
    expected,
    thresholds,
    async () => {
      throw new Error("Decoder exited before EOF");
    },
  );
  TestValidator.equals("decode failure keeps its cause", refused.video, {
    status: "uncovered",
    reason: "Decoder exited before EOF",
  });

  const decodeOneFrame = (
    timeBase: string,
  ): Promise<IAutoMovieDeliveryContentAudit.IProps["streams"]> =>
    AutoMovieCliDelivery.decode(
      "fixture-ffmpeg",
      path,
      { frameRate: [1, 1], frameCount: 1 },
      thresholds,
      async (): Promise<string> =>
        [
          ...headers.slice(0, -1),
          `[Parsed_showinfo_0 @ abc] config in time_base: ${timeBase}, frame_rate: 1/1`,
          "[Parsed_showinfo_0 @ abc] n: 0 pts: 0 pts_time:0 duration: 1 duration_time:1 fmt:yuv420p",
        ].join("\n"),
    );
  TestValidator.equals(
    "one frame covers one exact tick",
    (await decodeOneFrame("1/1")).video,
    {
      status: "decoded",
      index: 0,
      start: { ticks: 0, timeBase: [1, 1] },
      end: { ticks: 1, timeBase: [1, 1] },
      continuous: true,
      observations: [],
    },
  );
  TestValidator.equals(
    "an unsafe time base leaves the frame uncovered",
    (await decodeOneFrame("9007199254740993/9007199254740992")).video,
    {
      status: "uncovered",
      reason: "Incomplete or invalid decoder frame evidence",
    },
  );
}
