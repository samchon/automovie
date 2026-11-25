import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";
import { auditAutoMovieDeliveryContent } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

type Audit = IAutoMovieDeliveryContentAudit.IProps;
type Timestamp = IAutoMovieDeliveryContentAudit.ITimestamp;

/**
 * Classifies measured delivery content by commissioned intent, the drawn
 * reference and native time.
 *
 * Scenarios:
 *
 * 1. Without a reference, an open black interval reaching verified video EOF is
 *    intentional where adjoining allowances cover its first frame and
 *    unclassified (blocking) after it; a one-frame freeze is below threshold.
 * 2. A freeze exactly at the minimum duration is reported inside its allowance,
 *    and a wholly allowed audit passes.
 * 3. Silence keeps its native audio clock and has no output-frame field. An absent
 *    stream is permitted for video-only delivery and blocked when sound is
 *    required.
 * 4. An exact 30000/1001 video clock accepts sound quantized to the nearest sample
 *    boundary and refuses a two-sample shortfall.
 * 5. Incomplete decode, bad stream coverage and an out-of-range measurement retain
 *    distinguishable findings, with required coverage deciding whether an
 *    incomplete stream blocks delivery.
 * 6. A complete reference splits black into a drawn part it also shows and an
 *    unexpected part it does not. Drawn blocks only when authored approval is
 *    required; unexpected always blocks. An allowance outranks the reference.
 * 7. A piece other than an intentional one that is shorter than the detector
 *    minimum, such as a boundary moved one frame by encoding, is not reported.
 * 8. Reference silence explains delivered silence on the audio clock, and a
 *    reference that stops short of the film explains nothing.
 */
export function test_render_delivery_audit_delivery_content_audit(): void {
  const video = (ticks: number): Timestamp => ({ ticks, timeBase: [1, 15360] });
  const audio = (ticks: number): Timestamp => ({ ticks, timeBase: [1, 48000] });
  const frame = (ticks: number): Timestamp => ({ ticks, timeBase: [1, 30] });
  const source = { file: "film.partial.mp4", sha256: "ad".repeat(32) };
  const thresholds: Audit["thresholds"] = {
    black: {
      minimumDuration: frame(1),
      minimumPictureRatio: 0.98,
      maximumPixelThreshold: 0.1,
    },
    frozen: { minimumDuration: frame(2), maximumMeanDifference: 0.001 },
    silence: { minimumDuration: audio(2400), maximumAmplitude: 0.001 },
  };
  const decodedVideo = {
    status: "decoded",
    index: 0,
    start: video(0),
    end: video(2048),
    continuous: true,
    observations: [],
  } as const;
  const base: Audit = {
    source,
    expected: { frameCount: 4, frameRate: [30, 1], audioRequired: false },
    thresholds,
    streams: { video: decodedVideo, audio: { status: "missing" } },
  };

  const black = auditAutoMovieDeliveryContent({
    ...base,
    expected: {
      ...base.expected,
      allowances: [
        { detector: "black", start: video(768), end: frame(2) },
        { detector: "black", start: frame(1), end: video(768) },
      ],
    },
    streams: {
      ...base.streams,
      video: {
        ...decodedVideo,
        observations: [
          { detector: "black", start: video(512), end: null },
          { detector: "frozen", start: video(0), end: video(512) },
        ],
      },
    },
  });
  TestValidator.equals("partial intent preserves native EOF", black.findings, [
    {
      kind: "content",
      outcome: "intentional",
      blocking: false,
      media: "video",
      streamIndex: 0,
      detector: "black",
      start: video(512),
      end: frame(2),
      firstOutputFrame: 1,
    },
    {
      kind: "content",
      outcome: "unclassified",
      blocking: true,
      media: "video",
      streamIndex: 0,
      detector: "black",
      start: frame(2),
      end: video(2048),
      firstOutputFrame: 2,
    },
  ]);
  TestValidator.equals("unclassified black blocks", black.passed, false);
  TestValidator.equals(
    "actual bytes and effective thresholds remain traceable",
    [black.source, black.expected.frameCount, black.thresholds],
    [source, 4, thresholds],
  );

  const held = auditAutoMovieDeliveryContent({
    ...base,
    expected: {
      ...base.expected,
      allowances: [{ detector: "frozen", start: frame(2), end: frame(4) }],
    },
    streams: {
      ...base.streams,
      video: {
        ...decodedVideo,
        observations: [{ detector: "frozen", start: video(1024), end: null }],
      },
    },
  });
  TestValidator.equals("exact minimum hold remains visible", held.findings, [
    {
      kind: "content",
      outcome: "intentional",
      blocking: false,
      media: "video",
      streamIndex: 0,
      detector: "frozen",
      start: video(1024),
      end: video(2048),
      firstOutputFrame: 2,
    },
  ]);
  TestValidator.equals("wholly allowed hold passes", held.passed, true);

  const decodedAudio = {
    status: "decoded",
    index: 1,
    start: audio(0),
    end: audio(6400),
    continuous: true,
    sampleRate: 48000,
    observations: [],
  } as const;
  const silence = auditAutoMovieDeliveryContent({
    ...base,
    expected: { ...base.expected, audioRequired: true },
    streams: {
      ...base.streams,
      audio: {
        ...decodedAudio,
        observations: [{ detector: "silence", start: audio(2400), end: null }],
      },
    },
  });
  TestValidator.equals(
    "sound never invents a delivery frame",
    silence.findings,
    [
      {
        kind: "content",
        outcome: "unclassified",
        blocking: true,
        media: "audio",
        streamIndex: 1,
        detector: "silence",
        start: audio(2400),
        end: audio(6400),
      },
    ],
  );
  TestValidator.equals(
    "video-only is valid",
    auditAutoMovieDeliveryContent(base).passed,
    true,
  );
  const missingAudio = auditAutoMovieDeliveryContent({
    ...base,
    expected: { ...base.expected, audioRequired: true },
  });
  TestValidator.equals(
    "commissioned audio cannot be missing",
    missingAudio.findings,
    [
      {
        kind: "missing-stream",
        blocking: true,
        media: "audio",
        reason: "The commissioned stream is absent",
      },
    ],
  );

  const fractional: Audit = {
    ...base,
    expected: { frameCount: 1, frameRate: [30000, 1001], audioRequired: true },
    streams: {
      video: { ...decodedVideo, end: { ticks: 1001, timeBase: [1, 30000] } },
      audio: { ...decodedAudio, end: audio(1602) },
    },
  };
  TestValidator.equals(
    "quantization to 1602 audio samples passes",
    auditAutoMovieDeliveryContent(fractional).passed,
    true,
  );
  const short = auditAutoMovieDeliveryContent({
    ...fractional,
    streams: {
      ...fractional.streams,
      audio: { ...decodedAudio, end: audio(1600) },
    },
  });
  TestValidator.equals("truncated audio is a timing failure", short.findings, [
    {
      kind: "timing-mismatch",
      blocking: true,
      media: "audio",
      streamIndex: 1,
      reason: "The decoded stream does not cover the commissioned presentation",
    },
  ]);

  const incomplete = auditAutoMovieDeliveryContent({
    ...base,
    streams: {
      video: { status: "uncovered", reason: "Decoder did not reach EOF" },
      audio: { status: "missing" },
    },
  });
  TestValidator.equals(
    "incomplete decode keeps its reason",
    incomplete.findings,
    [
      {
        kind: "uncovered",
        blocking: true,
        media: "video",
        reason: "Decoder did not reach EOF",
      },
    ],
  );
  const unavailable: Audit = {
    ...base,
    streams: {
      ...base.streams,
      audio: {
        status: "uncovered",
        reason: "No decoded audio sample evidence",
      },
    },
  };
  const optional = auditAutoMovieDeliveryContent(unavailable);
  const required = auditAutoMovieDeliveryContent({
    ...unavailable,
    expected: { ...unavailable.expected, audioRequired: true },
  });
  TestValidator.equals(
    "coverage requirement decides whether an uncovered stream blocks",
    [
      optional.passed,
      optional.findings[0]?.blocking,
      required.passed,
      required.findings[0]?.blocking,
    ],
    [true, false, false, true],
  );
  const invalid = auditAutoMovieDeliveryContent({
    ...base,
    streams: {
      ...base.streams,
      video: {
        ...decodedVideo,
        observations: [
          { detector: "black", start: video(512), end: video(4096) },
        ],
      },
    },
  });
  TestValidator.equals(
    "an interval cannot exceed verified EOF",
    invalid.findings,
    [
      {
        kind: "invalid-observation",
        blocking: true,
        media: "video",
        streamIndex: 0,
        reason: "The detector interval does not belong to the decoded stream",
      },
    ],
  );

  // Every reference case below yields only content findings; anything else fails.
  const content = (result: IAutoMovieDeliveryContentAudit.IResult) =>
    result.findings.map((finding) => {
      if (finding.kind !== "content")
        throw new Error("Unexpected " + finding.kind + " finding");
      return finding;
    });
  // The drawn frame sequence on its own 1/30 clock, black from frame 2 to EOF.
  const drawnVideo = {
    status: "decoded",
    index: 0,
    start: frame(0),
    end: frame(4),
    continuous: true,
    observations: [{ detector: "black", start: frame(2), end: null }],
  } as const;
  const encodedBlack: Audit = {
    ...base,
    streams: {
      ...base.streams,
      video: {
        ...decodedVideo,
        observations: [{ detector: "black", start: video(512), end: null }],
      },
    },
    reference: { video: drawnVideo },
  };
  const split = auditAutoMovieDeliveryContent(encodedBlack);
  TestValidator.equals(
    "the reference separates drawn black from encoded black",
    content(split).map(({ outcome, blocking, start, end }) => ({
      outcome,
      blocking,
      start,
      end,
    })),
    [
      {
        outcome: "unexpected",
        blocking: true,
        start: video(512),
        end: frame(2),
      },
      { outcome: "drawn", blocking: true, start: frame(2), end: video(2048) },
    ],
  );
  const waived = auditAutoMovieDeliveryContent({
    ...encodedBlack,
    expected: { ...encodedBlack.expected, contentRequired: false },
  });
  TestValidator.equals(
    "waived approval releases drawn black but never encoded black",
    [waived.findings.map((finding) => finding.blocking), waived.passed],
    [[true, false], false],
  );
  const allowedFirst = auditAutoMovieDeliveryContent({
    ...encodedBlack,
    expected: {
      ...encodedBlack.expected,
      allowances: [{ detector: "black", start: frame(2), end: frame(3) }],
    },
  });
  TestValidator.equals(
    "an allowance outranks the reference",
    content(allowedFirst).map(({ outcome, start, end }) => [
      outcome,
      start,
      end,
    ]),
    [
      ["unexpected", video(512), frame(2)],
      ["intentional", frame(2), frame(3)],
      ["drawn", frame(3), video(2048)],
    ],
  );

  const shifted = auditAutoMovieDeliveryContent({
    ...encodedBlack,
    expected: { ...encodedBlack.expected, contentRequired: false },
    thresholds: {
      ...thresholds,
      black: { ...thresholds.black, minimumDuration: frame(2) },
    },
  });
  TestValidator.equals(
    "a one-frame boundary shift below the detector minimum is not a finding",
    [content(shifted).map((finding) => finding.outcome), shifted.passed],
    [["drawn"], true],
  );

  const drawnAudio = {
    status: "decoded",
    index: 0,
    start: audio(0),
    end: audio(6400),
    continuous: true,
    sampleRate: 48000,
    observations: [{ detector: "silence", start: audio(0), end: audio(3200) }],
  } as const;
  const quiet: Audit = {
    ...base,
    expected: { ...base.expected, audioRequired: true, contentRequired: false },
    streams: {
      ...base.streams,
      audio: {
        ...decodedAudio,
        observations: [{ detector: "silence", start: audio(0), end: null }],
      },
    },
    reference: { video: drawnVideo, audio: drawnAudio },
  };
  TestValidator.equals(
    "the padded soundtrack explains only its own silence",
    content(auditAutoMovieDeliveryContent(quiet)).map(
      ({ outcome, blocking, start, end }) => [outcome, blocking, start, end],
    ),
    [
      ["drawn", false, audio(0), audio(3200)],
      ["unexpected", true, audio(3200), audio(6400)],
    ],
  );
  TestValidator.equals(
    "a reference that stops short of the film explains nothing",
    content(
      auditAutoMovieDeliveryContent({
        ...quiet,
        reference: { audio: { ...drawnAudio, end: audio(4800) } },
      }),
    ).map(({ outcome, blocking }) => [outcome, blocking]),
    [["unclassified", true]],
  );
}
