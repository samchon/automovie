import type {
  IAutoMovieProductionAudioProbe,
  IAutoMovieProductionMediaProbe,
  IAutoMovieProductionVideoProbe,
} from "@automovie/interface";
import { assertProductionRenderedDeliverableFacts } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { throwsError as refused } from "../internal/predicates";

const video: () => IAutoMovieProductionVideoProbe = (): IAutoMovieProductionVideoProbe => ({
  kind: "video",
  container: "mp4",
  codec: "h264",
  width: 16,
  height: 16,
  runtimeSeconds: 1,
  frameCount: 24,
  fps: 24,
  frameRate: { numerator: 24, denominator: 1 },
  brands: { major: "isom", compatible: ["isom"] },
  coded: { width: 16, height: 16 },
  trackDisplay: { width16_16: 1_048_576, height16_16: 1_048_576 },
  trackMatrix: [65_536, 0, 0, 0, 65_536, 0, 0, 0, 1_073_741_824],
  pixelAspect: { kind: "implicit-square" },
  presentation: {
    movieTimescale: 24,
    mediaTimescale: 24,
    movieDuration: 24,
    mediaDuration: 24,
    edits: [],
  },
  samples: {
    count: 24,
    duration: 1,
    timescale: 24,
    firstDts: 0,
    lastDts: 23,
    firstCts: 0,
    lastCts: 23,
  },
  color: {
    container: {
      kind: "nclx",
      primaries: 1,
      transfer: 13,
      matrix: 1,
      fullRange: true,
    },
    resolved: { kind: "srgb", source: "container" },
  },
});

const audio: () => IAutoMovieProductionAudioProbe = (): IAutoMovieProductionAudioProbe => ({
  kind: "audio",
  container: "mp4",
  codec: "opus",
  runtimeSeconds: 1,
  channels: 2,
  sampleRate: 48_000,
  sampleCount: 50,
  primingSamples: 312,
  timebase: {
    movieTimescale: 1_000,
    mediaTimescale: 48_000,
    movieDuration: 1_000,
    mediaDuration: 48_312,
    edits: [
      {
        segmentDuration: 1_000,
        mediaTime: 312,
        mediaRateInteger: 1,
        mediaRateFraction: 0,
      },
    ],
  },
  sampleEntry: {
    kind: "opus",
    version: 0,
    outputChannelCount: 2,
    preSkip: 312,
    inputSampleRate: 48_000,
    outputGainQ7_8: 0,
    channelMapping: {
      family: 0,
      streamCount: null,
      coupledCount: null,
      mapping: [],
      channelOrder: ["front-left", "front-right"],
    },
  },
});

/**
 * Validate that every render-manifest scalar comes from its kind-matched probe.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual deliverable-fact admission for six admitted media associations and mismatched runtime/frame/codec/kind rows; synchronous refusal messages expose ignored scalar tuples or wrong media association.
 * @evidence contracts/testing.md#independent-expectations Authored one-second/24-frame H.264 and Opus probe records define the video/audio tuples, captions use the supplied current runtime, and pictures/evidence use null tuples. Complete typed metadata stands in for already-admitted parser output, without claiming this unit parses payloads, admits those records or decodes media; message matching is by fragment rather than exact whole error.
 * @evidence contracts/testing.md#distinguishing-cases Covers feature/guide/audio/captions/preview plus sound-evidence audio, individual mismatches, invented null-only scalars and missing feature facts, including zero/unsafe scalar values; parser validity, byte integrity and physical playback belong elsewhere.
 * @evidence contracts/testing.md#execution-ownership This named discoverable portable unit owns the local acceptance/refusal matrices and invokes the production gate directly without a renderer, filesystem, codec process or dynamic test registration.
 *
 * Scenarios:
 * 1. Feature, guide, audio, caption, preview, and evidence rows accept only
 *    their exact kind-specific tuple.
 * 2. Runtime, frame count, codec, caption runtime, and kind substitutions have
 *    independent refusing twins.
 */
export function test_production_render_manifest_media_facts(): void {
  const picture: IAutoMovieProductionVideoProbe = video();
  const feature: IAutoMovieProductionMediaProbe = {
    kind: "feature",
    video: picture,
    audio: audio(),
  };
  const accepts: Parameters<typeof assertProductionRenderedDeliverableFacts>[0][] = [
    {
      kind: "feature" as const,
      runtimeSeconds: 1,
      frameCount: 24,
      codec: "h264",
      expectedCaptionRuntimeSeconds: null,
      probe: feature,
    },
    {
      kind: "guide-pass" as const,
      runtimeSeconds: 1,
      frameCount: 24,
      codec: "h264",
      expectedCaptionRuntimeSeconds: null,
      probe: picture,
    },
    {
      kind: "audio-mix" as const,
      runtimeSeconds: 1,
      frameCount: null,
      codec: "opus",
      expectedCaptionRuntimeSeconds: null,
      probe: audio(),
    },
    {
      kind: "audio-mix" as const,
      runtimeSeconds: null,
      frameCount: null,
      codec: null,
      expectedCaptionRuntimeSeconds: null,
      probe: {
        kind: "sound-evidence" as const,
        evidence: {
          version: 2,
          plan: {
            version: 1,
            inputFingerprint: `sha256:${"1".repeat(64)}`,
            fps: 24,
            frameRate: { numerator: 24, denominator: 1 },
            totalFrames: 24,
            sampleRate: 48_000,
            channels: 2,
            events: [],
            cues: [],
            dialogue: [],
          },
          analysis: {
            version: 1,
            sampleRate: 48_000,
            sampleFrames: 48_000,
            runtimeSeconds: 1,
            integratedLoudness: null,
            samplePeak: 0,
            clippingSamples: 0,
            longestSilenceSeconds: 1,
            eventAlignment: [],
          },
          tts: [],
          audio: {
            path: "audio.mp4",
            mediaType: "audio/mp4",
            bytes: 128,
            digest: `sha256:${"2".repeat(64)}`,
          },
          measurement: {
            source: "pre-encode-pcm",
            algorithm: "automovie-production-sound-analysis-v1",
          },
        },
      },
    },
    {
      kind: "captions" as const,
      runtimeSeconds: 1,
      frameCount: null,
      codec: null,
      expectedCaptionRuntimeSeconds: 1,
      probe: {
        kind: "webvtt" as const,
        cueCount: 1,
        firstCueSeconds: 0,
        lastCueSeconds: 1,
        cues: [{ id: null, text: "Hello.", startMilliseconds: 0, endMilliseconds: 1_000 }],
        text: "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHello.\n",
      },
    },
    {
      kind: "preview" as const,
      runtimeSeconds: null,
      frameCount: null,
      codec: null,
      expectedCaptionRuntimeSeconds: null,
      probe: {
        kind: "png" as const,
        width: 16,
        height: 16,
        picture: {
          width: 16,
          height: 16,
          bitDepth: 8,
          color: "rgba",
          alpha: "straight",
          interlace: "none",
          colorSpace: "srgb",
          pixelAspect: { kind: "square" },
          orientation: "upright",
        },
      },
    },
  ];
  for (const value of accepts) assertProductionRenderedDeliverableFacts(value);
  TestValidator.equals(
    "kind-specific media tuples reject every scalar or association substitution",
    {
      runtime: refused(
        (): void =>
          assertProductionRenderedDeliverableFacts({
            ...accepts[0]!,
            runtimeSeconds: 2,
          }),
        "runtimeSeconds",
      ),
      frames: refused(
        (): void =>
          assertProductionRenderedDeliverableFacts({
            ...accepts[1]!,
            frameCount: 23,
          }),
        "frameCount",
      ),
      codec: refused(
        (): void =>
          assertProductionRenderedDeliverableFacts({
            ...accepts[2]!,
            codec: "aac",
          }),
        "codec",
      ),
      captionRuntime: refused(
        (): void =>
          assertProductionRenderedDeliverableFacts({
            ...accepts[4]!,
            runtimeSeconds: 0.5,
          }),
        "runtimeSeconds",
      ),
      kind: refused(
        (): void =>
          assertProductionRenderedDeliverableFacts({
            ...accepts[5]!,
            probe: audio(),
          }),
        "cannot carry parser facts",
      ),
    },
    {
      runtime: true,
      frames: true,
      codec: true,
      captionRuntime: true,
      kind: true,
    },
  );
  const scalarMatrix: Array<{
    label: string;
    row: Parameters<typeof assertProductionRenderedDeliverableFacts>[0];
    field: string;
  }> = [
    ...[1, 0, Number.MAX_SAFE_INTEGER + 1].map((runtimeSeconds: number): { label: string; row: Parameters<typeof assertProductionRenderedDeliverableFacts>[0]; field: string } => ({
      label: `preview runtime ${runtimeSeconds}`,
      row: { ...accepts[5]!, runtimeSeconds },
      field: "runtimeSeconds",
    })),
    ...[1, 0, Number.MAX_SAFE_INTEGER + 1].map((frameCount: number): { label: string; row: Parameters<typeof assertProductionRenderedDeliverableFacts>[0]; field: string } => ({
      label: `preview frame count ${frameCount}`,
      row: { ...accepts[5]!, frameCount },
      field: "frameCount",
    })),
    ...["h264", ""].map((codec: string): { label: string; row: Parameters<typeof assertProductionRenderedDeliverableFacts>[0]; field: string } => ({
      label: `preview codec ${JSON.stringify(codec)}`,
      row: { ...accepts[5]!, codec },
      field: "codec",
    })),
    {
      label: "caption invented frame count",
      row: { ...accepts[4]!, frameCount: 24 },
      field: "frameCount",
    },
    {
      label: "caption invented codec",
      row: { ...accepts[4]!, codec: "vtt" },
      field: "codec",
    },
    {
      label: "audio invented frame count",
      row: { ...accepts[2]!, frameCount: 48_000 },
      field: "frameCount",
    },
    {
      label: "feature missing runtime",
      row: { ...accepts[0]!, runtimeSeconds: null },
      field: "runtimeSeconds",
    },
    {
      label: "feature missing frames",
      row: { ...accepts[0]!, frameCount: null },
      field: "frameCount",
    },
    {
      label: "feature missing codec",
      row: { ...accepts[0]!, codec: null },
      field: "codec",
    },
    {
      label: "guide runtime mismatch",
      row: { ...accepts[1]!, runtimeSeconds: 0 },
      field: "runtimeSeconds",
    },
    {
      label: "guide frame mismatch",
      row: { ...accepts[1]!, frameCount: 0 },
      field: "frameCount",
    },
    {
      label: "guide codec mismatch",
      row: { ...accepts[1]!, codec: "avc1" },
      field: "codec",
    },
  ];
  TestValidator.predicate(
    "the complete five-kind scalar matrix fails at its exact field",
    scalarMatrix.every(({ row, field }: { label: string; row: Parameters<typeof assertProductionRenderedDeliverableFacts>[0]; field: string }): boolean =>
      refused((): void => assertProductionRenderedDeliverableFacts(row), field),
    ),
  );
}
