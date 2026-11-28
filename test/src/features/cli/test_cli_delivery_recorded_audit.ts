import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";
import { AutoMovieRenderDelivery } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliDelivery } from "automovie";

import { deliveryDecodeRecordingFilter } from "../internal/deliveryDecodeRecordingFilter";
import { deliveryDecodeRecordings } from "../internal/deliveryDecodeRecordings";

type Audit = IAutoMovieDeliveryContentAudit.IProps;
type Timestamp = IAutoMovieDeliveryContentAudit.ITimestamp;

/**
 * Classifies real encoded deliveries against the drawn frames they were
 * encoded from, through the standard delivery decode, the reference decode of
 * the encoder's own input and the audit.
 *
 * Scenarios:
 * 1. An unchanged encode of a changing picture has no finding and delivers.
 * 2. Black painted over frames 4-7 during encoding is unexpected black and an unexpected freeze from 0.4 s to 0.8 s, and blocks even without declared intent.
 * 3. Frames 5-10 repeated during encoding are an unexpected freeze from 0.5 s to 1.1 s.
 * 4. A fade to black drawn by the film is drawn black and a drawn freeze from 0.8 s to the end: it delivers when authored approval is waived, blocks when it is required, and is intentional under a matching allowance.
 * 5. A held shot drawn by the film is a drawn freeze from 0.3 s to 0.9 s.
 * 6. A thirteenth encoded frame is a timing mismatch, and a video-only delivery cannot satisfy required sound.
 * 7. The reference decode reads the encoder's picture input and frame rate, and a lost reference leaves encoded black unclassified and blocking.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the clean encode, encoded black and freeze, authored fade and hold, missing sound, frame mismatch and lost-reference cases.
 * @evidence contracts/development/testing.md#behavioral-verification Runs delivery decode, reference decode and audit through a fixture process that returns recorded FFmpeg logs. Asserts each observation's source, epoch, blocking status and verdict, including the lost-reference path.
 * @evidence contracts/development/testing.md#independent-expectations Uses the known injected frame spans on a 10 fps clock, with 1024 MP4 ticks per frame and one image-sequence tick per frame. Explicit author approval and sound intent identify which fixture cases pass.
 */
export async function test_cli_delivery_recorded_audit(): Promise<void> {
  const expected = { frameCount: 12, frameRate: [10, 1] } as const;
  const thresholds: Audit["thresholds"] = {
    black: {
      minimumDuration: { ticks: 1, timeBase: [1, 5] },
      minimumPictureRatio: 0.98,
      maximumPixelThreshold: 0.1,
    },
    frozen: {
      minimumDuration: { ticks: 3, timeBase: [1, 10] },
      maximumMeanDifference: 0.001,
    },
    silence: {
      minimumDuration: { ticks: 1, timeBase: [1, 5] },
      maximumAmplitude: 0.001,
    },
  };
  const delivered = {
    "ok.mp4": deliveryDecodeRecordings.deliveredOk,
    "black.mp4": deliveryDecodeRecordings.deliveredBlack,
    "frozen.mp4": deliveryDecodeRecordings.deliveredFrozen,
    "fade.mp4": deliveryDecodeRecordings.deliveredFade,
    "hold.mp4": deliveryDecodeRecordings.deliveredHold,
    "long.mp4": deliveryDecodeRecordings.deliveredLong,
  } as const;
  const drawn = {
    "src-plain/frame_%05d.png": deliveryDecodeRecordings.sourcePlain,
    "src-fade/frame_%05d.png": deliveryDecodeRecordings.sourceFade,
    "src-hold/frame_%05d.png": deliveryDecodeRecordings.sourceHold,
  } as const;
  const run = async (_binary: string, args: readonly string[]) => {
    const input = args[args.indexOf("-i") + 1] ?? "";
    TestValidator.equals(
      "the plan uses the recorded filter chain " + input,
      args[args.indexOf("-vf") + 1],
      deliveryDecodeRecordingFilter,
    );
    const log =
      delivered[input as keyof typeof delivered] ??
      drawn[input as keyof typeof drawn];
    if (log === undefined) throw new Error("No recording for " + input);
    return log;
  };
  const encoder = (source: string): string[] => [
    "-v",
    "warning",
    "-y",
    "-framerate",
    "10",
    "-i",
    "src-" + source + "/frame_%05d.png",
    "-c:v",
    "libx264",
    "-frames:v",
    "12",
    "-map",
    "0:v:0",
    "-an",
    "-t",
    "1.2",
    "film.mp4",
  ];
  const deliver = async (
    file: keyof typeof delivered,
    source: string,
    policy: Partial<Audit["expected"]> = {},
  ) =>
    AutoMovieRenderDelivery.auditContent({
      source: { file, sha256: "ab".repeat(32) },
      expected: {
        ...expected,
        audioRequired: false,
        contentRequired: false,
        ...policy,
      },
      thresholds,
      streams: await AutoMovieCliDelivery.decode(
        "ffmpeg",
        file,
        expected,
        thresholds,
        run,
      ),
      reference: await AutoMovieCliDelivery.referenceDecode(
        "ffmpeg",
        encoder(source),
        expected,
        thresholds,
        run,
      ),
    });
  const mp4 = (frame: number): Timestamp => ({
    ticks: frame * 1024,
    timeBase: [1, 10240],
  });
  const content = (result: IAutoMovieDeliveryContentAudit.IResult) =>
    result.findings.flatMap((finding) =>
      finding.kind === "content"
        ? [
            [
              finding.detector,
              finding.outcome,
              finding.blocking,
              finding.start,
              finding.end,
            ] as const,
          ]
        : [],
    );

  const ok = await deliver("ok.mp4", "plain");
  TestValidator.equals(
    "a clean encode delivers",
    [ok.findings, ok.passed],
    [[], true],
  );

  const black = await deliver("black.mp4", "plain");
  TestValidator.equals("encoded black blocks without intent", content(black), [
    ["black", "unexpected", true, mp4(4), mp4(8)],
    ["frozen", "unexpected", true, mp4(4), mp4(8)],
  ]);
  TestValidator.equals("encoded black is refused", black.passed, false);

  const frozen = await deliver("frozen.mp4", "plain");
  TestValidator.equals("an encoded freeze blocks", content(frozen), [
    ["frozen", "unexpected", true, mp4(5), mp4(11)],
  ]);

  const fade = await deliver("fade.mp4", "fade");
  TestValidator.equals("a drawn fade is the film's own", content(fade), [
    ["black", "drawn", false, mp4(8), mp4(12)],
    ["frozen", "drawn", false, mp4(8), mp4(12)],
  ]);
  TestValidator.equals("a drawn fade delivers when waived", fade.passed, true);
  const approved = await deliver("fade.mp4", "fade", {
    contentRequired: true,
  });
  TestValidator.equals(
    "a drawn fade needs approval when intent is declared",
    approved.passed,
    false,
  );
  const allowed = await deliver("fade.mp4", "fade", {
    contentRequired: true,
    allowances: (["black", "frozen"] as const).map((detector) => ({
      detector,
      start: { ticks: 8, timeBase: [1, 10] },
      end: { ticks: 12, timeBase: [1, 10] },
    })),
  });
  TestValidator.equals(
    "an authored fade is intentional",
    [content(allowed).map(([, outcome]) => outcome), allowed.passed],
    [["intentional", "intentional"], true],
  );

  const hold = await deliver("hold.mp4", "hold");
  TestValidator.equals("a drawn hold is the film's own", content(hold), [
    ["frozen", "drawn", false, mp4(3), mp4(9)],
  ]);

  const long = await deliver("long.mp4", "plain");
  TestValidator.equals(
    "an extra encoded frame is a timing mismatch",
    long.findings.map(({ kind, blocking, media }) => [kind, blocking, media]),
    [["timing-mismatch", true, "video"]],
  );
  const silent = await deliver("ok.mp4", "plain", { audioRequired: true });
  TestValidator.equals(
    "required sound cannot be missing",
    silent.findings.map(({ kind, media }) => [kind, media]),
    [["missing-stream", "audio"]],
  );

  const plainReference = await AutoMovieCliDelivery.referenceDecode(
    "ffmpeg",
    encoder("plain"),
    expected,
    thresholds,
    async (_binary, args) => {
      TestValidator.equals(
        "the reference decodes the encoder's own picture input",
        args.slice(5, 9),
        ["-framerate", "10", "-i", "src-plain/frame_%05d.png"],
      );
      return deliveryDecodeRecordings.sourcePlain;
    },
  );
  TestValidator.equals(
    "the drawn sequence keeps its own clock and has no soundtrack",
    [plainReference.video, plainReference.audio],
    [
      {
        status: "decoded",
        index: 0,
        start: { ticks: 0, timeBase: [1, 10] },
        end: { ticks: 12, timeBase: [1, 10] },
        continuous: true,
        observations: [],
      },
      { status: "missing" },
    ],
  );
  const lost = AutoMovieRenderDelivery.auditContent({
    source: { file: "black.mp4", sha256: "ab".repeat(32) },
    expected: { ...expected, audioRequired: false, contentRequired: false },
    thresholds,
    streams: await AutoMovieCliDelivery.decode(
      "ffmpeg",
      "black.mp4",
      expected,
      thresholds,
      run,
    ),
    reference: await AutoMovieCliDelivery.referenceDecode(
      "ffmpeg",
      encoder("plain"),
      expected,
      thresholds,
      async () => {
        throw new Error("The drawn frames were already removed");
      },
    ),
  });
  TestValidator.equals(
    "a lost reference cannot excuse encoded black",
    content(lost).map(([detector, outcome, blocking]) => [
      detector,
      outcome,
      blocking,
    ]),
    [
      ["black", "unclassified", true],
      ["frozen", "unclassified", true],
    ],
  );
}
