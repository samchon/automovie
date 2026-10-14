import {
  IAutoMovieFilmTimeline,
} from "@automovie/interface";
import { productionVisualDeliveryOccurrence } from "../../../../packages/render/src/film/productionVisualDeliveryOccurrence";
import { assembleProductionChunkVideoMp4 } from "../../../../packages/render/src/node/assembleProductionChunkVideoMp4";
import { assertProductionFeatureUsesRenditionVideo } from "../../../../packages/render/src/node/assertProductionFeatureUsesRenditionVideo";
import { conformProductionRenditionVideoMp4 } from "../../../../packages/render/src/node/conformProductionRenditionVideoMp4";
import { conformProductionVisualDeliveryVideoMp4 } from "../../../../packages/render/src/node/conformProductionVisualDeliveryVideoMp4";
import { probeProductionVideoMp4 } from "../../../../packages/render/src/node/probeProductionVideoMp4";
import { TestValidator } from "@nestia/e2e";
import type { Sample } from "mp4box";

import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { productionSampleMp4 } from "../internal/productionMedia/productionSampleMp4";
import { productionMpeg4Part2Mp4 } from "../internal/productionMedia/productionMpeg4Part2Mp4";
import { parseProductionMp4 } from "../internal/productionMedia/parseProductionMp4";

const WIDTH: number = 16;
const HEIGHT: number = 16;
const FPS: number = 2;

/** The chunk sizes one render job hands the final assembly, in play order. */
const CHUNK_FRAMES: readonly number[] = [3, 2, 1];
const TOTAL_FRAMES: number = CHUNK_FRAMES.reduce((sum: number, count: number): number => sum + count, 0);

const digest: (digit: string) => string = (digit: string): string =>
  `sha256:${digit.repeat(64)}`;

/**
 * The same ranges expressed as a cut-only edit for cross-consumer parity.
 * The expected payload order and clocks are independently stated by the test;
 * two writers sharing an append helper are not an independent numerical oracle.
 */
const rangeTimeline: () => IAutoMovieFilmTimeline = (): IAutoMovieFilmTimeline => {
  let startFrame: number = 0;
  return {
    version: 1,
    builder: "automovie.production.builder.v5",
    inputFingerprint: digest("1"),
    sourceDigest: digest("2"),
    id: "assembly",
    fps: FPS,
    totalFrames: TOTAL_FRAMES,
    segments: CHUNK_FRAMES.map((count: number, index: number): IAutoMovieFilmTimeline["segments"][number] => {
      const segment: IAutoMovieFilmTimeline["segments"][number] = {
        shot: `range-${index}`,
        sourceInFrame: 0,
        sourceOutFrame: count,
        startFrame,
        endFrame: startFrame + count,
        headHandleFrames: 0,
        tailHandleFrames: 0,
        transitionIn: { kind: "cut" as const },
        transitionOut: { kind: "cut" as const },
      };
      startFrame += count;
      return segment;
    }),
    omissions: [],
    tracks: { audio: [], captions: [], effects: [] },
  };
};

/**
 * A long film's final video is assembled from its existing chunk encodes without re-encoding its frames.
 *
 * The splice transports coded payloads and clocks; it does not prove an encoder's memory behavior, receipt publication or decoded-picture equality.
 *
 * This unit reads independently authored resident sample tables through the actual parser and splice writers. Real encoder interoperability requires a separate generated-consumer observation.
 *
 * Scenarios:
 *
 * 1. An assembly spanning one chunk is byte-identical to its input chunk,
 *    which is the whole film for a production short enough to do both ways.
 * 2. An assembly of many chunks carries every source sample unaltered, in play
 *    order, on one continuous clock, with an independent input-payload oracle
 *    and parity against the same ranges conformed through the repaint path.
 * 3. Assembling twice, and assembling again after an interrupted attempt, produce
 *    byte-identical films: the assembly is a pure function of the receipt-bound
 *    chunk bytes, so a resumed render publishes what an uninterrupted one would
 *    have.
 * 4. No chunks, a chunk that changes raster mid-film, a chunk that is not H.264, a
 *    frame total the chunks do not cover, and a runtime past the exact MP4
 *    clock are each refused rather than silently re-encoded.
 * 5. ISO-authored dependency, leading, redundancy and degradation flags survive
 *    normalization and a multi-chunk lossless assembly, including unknown zero.
 *
 * @evidence contracts/testing.md#behavioral-verification Lossless chunk assembly is exercised through parsed output samples, exact payloads and clock terms, independently authored dependency flags, singleton byte identity and indexed refusal messages; a sample-order change, clock drift or dropped flags fails the assertions.
 * @evidence contracts/testing.md#independent-expectations The authored chunk lengths three, two and one determine six frames and ordinal order 0,1,2,0,1,0; two ticks at four ticks per second determine three seconds. ISO sample-flags bit positions determine the literal metadata expectations. Comparison with the rendition writer is supplementary parity and does not serve as the independent oracle; decoder-valid pictures are outside this sample-table unit.
 * @evidence contracts/testing.md#distinguishing-cases Singleton and multiple chunks, different integral media clocks, interrupted iteration and deterministic retry cover successful transport; empty input, changed raster, wrong codec, incorrect totals and unsafe clock products distinguish refusal boundaries. Explicit nonzero and unknown-zero dependency values distinguish byte preservation from the writer's former sync-only defaults.
 * @evidence contracts/testing.md#execution-ownership The discoverable unit function constructs resident in-memory MP4 sample tables and calls product splice and probe functions; no native encoder, browser, process or GPU is started, and the function owns every asserted case directly.
 */
export function test_production_chunk_video_assembly(): void {
  const frameFormat: Parameters<typeof assembleProductionChunkVideoMp4>[0]["frameFormat"] = { fps: FPS, height: HEIGHT, width: WIDTH };
  const chunks: Uint8Array[] = [];
  for (const frameCount of CHUNK_FRAMES)
    chunks.push(
      productionSampleMp4({
        width: WIDTH,
        height: HEIGHT,
        fps: FPS,
        frameCount,
      }),
    );
  const flagged: Uint8Array = Uint8Array.from(chunks[0]!);
  const flagSource: ReturnType<typeof parseProductionMp4> = parseProductionMp4(flagged);
  const flagBits: readonly number[] = [0x06503456, 0x0991ffff, 0];
  const flagBytes: DataView = new DataView(flagged.buffer);
  for (let index: number = 0; index < flagBits.length; ++index) {
    const run: (typeof flagSource.file.moofs)[number]["trafs"][number]["truns"][number] = flagSource.file.moofs[index]!.trafs[0]!.truns[0]!;
    // ISO trun full header, sample count, data offset, duration and size precede
    // the first sample-flags word in these one-sample fragment inputs.
    flagBytes.setUint32(run.start! + 28, flagBits[index]!);
  }
  const transported: Uint8Array = assembleProductionChunkVideoMp4({
    chunks: [flagged, chunks[1]!],
    frameFormat,
    totalFrames: 5,
  });
  const flagResult: ReturnType<typeof parseProductionMp4> = parseProductionMp4(transported);
  TestValidator.equals(
    "lossless transport retains every independently authored ISO sample flag",
    flagResult.file.getTrackSamplesInfo(flagResult.movie.videoTracks[0]!.id).slice(0, 3).map((sample: Sample): number[] => [
      Number(sample.is_sync), sample.is_leading, sample.depends_on,
      sample.is_depended_on, sample.has_redundancy, sample.degradation_priority,
    ]),
    [[1, 1, 2, 1, 1, 0x3456], [0, 2, 1, 2, 1, 0xffff], [1, 0, 0, 0, 0, 0]],
  );
  const narrowChunk: Uint8Array = productionSampleMp4({
    width: WIDTH - 8,
    height: HEIGHT - 8,
    fps: FPS,
    frameCount: 2,
  });
  const whole: Uint8Array = productionSampleMp4({
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    frameCount: TOTAL_FRAMES,
  });
  const twoTickChunks: Uint8Array[] = CHUNK_FRAMES.map((frameCount: number): Uint8Array =>
    productionSampleMp4({
      width: WIDTH,
      height: HEIGHT,
      fps: FPS,
      frameCount,
      ticksPerFrame: 2,
    }),
  );
  const scaledClock: ReturnType<typeof probeProductionVideoMp4> = probeProductionVideoMp4(
    assembleProductionChunkVideoMp4({
      chunks: twoTickChunks,
      frameFormat,
      totalFrames: TOTAL_FRAMES,
    }),
  );
  TestValidator.equals(
    "the supported two-tick input really exposes six frames on twelve ticks",
    {
      frames: scaledClock.frameCount,
      mediaDuration: scaledClock.presentation.mediaDuration,
      timescale: scaledClock.samples.timescale,
      sampleDuration: scaledClock.samples.duration,
      frameRate: scaledClock.frameRate,
    },
    {
      frames: 6,
      mediaDuration: 12,
      timescale: 4,
      sampleDuration: 2,
      frameRate: { numerator: 2, denominator: 1 },
    },
  );
  TestValidator.predicate(
    "twelve ticks at four ticks per second retain the exact three-second runtime",
    nclose(scaledClock.runtimeSeconds, 3, 0),
  );

  const single: Uint8Array = assembleProductionChunkVideoMp4({
    chunks: [whole],
    frameFormat,
    totalFrames: TOTAL_FRAMES,
  });
  TestValidator.equals(
    "an assembly spanning one chunk preserves that exact input container",
    namedFacts([
      [
        "theSingleChunkAssemblyIsByteIdentical",
        (): boolean => Buffer.from(single).equals(Buffer.from(whole)),
      ],
      [
        "theSingleChunkAssemblyCarriesTheWholeFilm",
        (): boolean => probeProductionVideoMp4(single).frameCount === TOTAL_FRAMES,
      ],
    ]),
    {
      theSingleChunkAssemblyIsByteIdentical: true,
      theSingleChunkAssemblyCarriesTheWholeFilm: true,
    },
  );

  const assembled: Uint8Array = assembleProductionChunkVideoMp4({
    chunks,
    frameFormat,
    totalFrames: TOTAL_FRAMES,
  });
  const conformed: Uint8Array = conformProductionRenditionVideoMp4({
    timeline: rangeTimeline(),
    clips: new Map(
      CHUNK_FRAMES.map((_count: number, index: number): [string, Uint8Array] => [
        `range-${index}`,
        chunks[index]!,
      ]),
    ),
  });
  const probe: ReturnType<typeof probeProductionVideoMp4> = probeProductionVideoMp4(assembled);
  const parsedAssembly: ReturnType<typeof parseProductionMp4> = parseProductionMp4(assembled);
  const assembledSamples: Sample[] = parsedAssembly.file.getTrackSamplesInfo(
    parsedAssembly.movie.videoTracks[0]!.id,
  );
  // Each chunk's authored sample ordinal restarts at zero. This oracle comes
  // from the input construction, not another conform implementation.
  const inputOrdinals: readonly number[] = [0, 1, 2, 0, 1, 0];
  TestValidator.equals(
    "assembly preserves input sample bytes and rebases every clock tick",
    assembledSamples.map((sample: Sample): { payload: number[]; duration: number; dts: number; cts: number } => ({
      payload: Array.from(
        assembled.subarray(sample.offset, sample.offset + sample.size),
      ),
      duration: sample.duration,
      dts: sample.dts,
      cts: sample.cts,
    })),
    inputOrdinals.map((ordinal: number, index: number): { payload: number[]; duration: number; dts: number; cts: number } => ({
      payload: [0, 0, 0, 2, 0x65, ordinal],
      duration: 1,
      dts: index,
      cts: index,
    })),
  );
  const timeline: IAutoMovieFilmTimeline = rangeTimeline();
  const mixed: Uint8Array = conformProductionVisualDeliveryVideoMp4({
    timeline,
    sources: timeline.segments.map((segment: IAutoMovieFilmTimeline["segments"][number], index: number): Parameters<typeof conformProductionVisualDeliveryVideoMp4>[0]["sources"][number] => ({
      occurrence: productionVisualDeliveryOccurrence(segment, index),
      lane: index === 1 ? ("repainted" as const) : ("deterministic" as const),
      bytes: index === 1 ? chunks[index]! : assembled,
    })),
  });
  const mixedClockRefusal: boolean = throwsError((): void => {
    const changedTimeline: IAutoMovieFilmTimeline = {
      ...rangeTimeline(),
      fps: 2.000001,
      frameRate: { numerator: 2_000_001, denominator: 1_000_000 },
    };
    conformProductionVisualDeliveryVideoMp4({
      timeline: changedTimeline,
      sources: changedTimeline.segments.map((segment: IAutoMovieFilmTimeline["segments"][number], index: number): Parameters<typeof conformProductionVisualDeliveryVideoMp4>[0]["sources"][number] => ({
        occurrence: productionVisualDeliveryOccurrence(segment, index),
        lane: index === 1 ? ("repainted" as const) : ("deterministic" as const),
        bytes: index === 1 ? chunks[index]! : assembled,
      })),
    });
  }, "unsupported-video-profile.frameRate");
  TestValidator.equals(
    "a many-chunk assembly carries every source sample onto one continuous clock",
    namedFacts([
      ["theAssemblyCoversEveryFrame", (): boolean => probe.frameCount === TOTAL_FRAMES],
      ["theAssemblyKeepsTheRaster", (): boolean => probe.width === WIDTH],
      ["theAssemblyKeepsTheRasterHeight", (): boolean => probe.height === HEIGHT],
      ["theAssemblyKeepsTheFrameClock", (): boolean => Math.abs(probe.fps - FPS) < 1e-9],
      [
        "theAssemblyRunsTheWholeFilm",
        (): boolean => Math.abs(probe.runtimeSeconds - TOTAL_FRAMES / FPS) < 1e-9,
      ],
      [
        "theAssemblyIsSampleIdenticalToTheSameRangesConformed",
        (): boolean => {
          assertProductionFeatureUsesRenditionVideo({
            feature: assembled,
            renditionVideo: conformed,
          });
          return true;
        },
      ],
      [
        "theAssemblyIsNotOneChunkVerbatim",
        (): boolean => Buffer.from(assembled).equals(Buffer.from(chunks[0]!)) === false,
      ],
      [
        "explicitMixedLanesPreserveTheSameSamples",
        (): boolean => {
          assertProductionFeatureUsesRenditionVideo({
            feature: mixed,
            renditionVideo: assembled,
          });
          return true;
        },
      ],
      ["mixedLanesRequireTheExactRationalClock", (): boolean => mixedClockRefusal],
    ]),
    {
      theAssemblyCoversEveryFrame: true,
      theAssemblyKeepsTheRaster: true,
      theAssemblyKeepsTheRasterHeight: true,
      theAssemblyKeepsTheFrameClock: true,
      theAssemblyRunsTheWholeFilm: true,
      theAssemblyIsSampleIdenticalToTheSameRangesConformed: true,
      theAssemblyIsNotOneChunkVerbatim: true,
      explicitMixedLanesPreserveTheSameSamples: true,
      mixedLanesRequireTheExactRationalClock: true,
    },
  );

  const interrupted: boolean = throwsError(
    (): Uint8Array =>
      assembleProductionChunkVideoMp4({
        chunks: (function* (): Generator<Uint8Array, never, unknown> {
          yield chunks[0]!;
          throw new Error("the render worker was interrupted");
        })(),
        frameFormat,
        totalFrames: TOTAL_FRAMES,
      }),
    "the render worker was interrupted",
  );
  const resumed: Uint8Array = assembleProductionChunkVideoMp4({
    chunks,
    frameFormat,
    totalFrames: TOTAL_FRAMES,
  });
  TestValidator.equals(
    "a resumed assembly publishes exactly what an uninterrupted one would have",
    namedFacts([
      ["theInterruptedAttemptFailed", (): boolean => interrupted],
      [
        "theResumedAssemblyIsByteIdentical",
        (): boolean => Buffer.from(resumed).equals(Buffer.from(assembled)),
      ],
    ]),
    {
      theInterruptedAttemptFailed: true,
      theResumedAssemblyIsByteIdentical: true,
    },
  );

  const refuses: (props: Parameters<typeof assembleProductionChunkVideoMp4>[0], message: string) => boolean = (
    props: Parameters<typeof assembleProductionChunkVideoMp4>[0],
    message: string,
  ): boolean =>
    throwsError((): Uint8Array => assembleProductionChunkVideoMp4(props), message);
  TestValidator.equals(
    "an assembly refuses chunks it cannot splice without re-encoding them",
    namedFacts([
      [
        "noChunksIsRefused",
        (): boolean =>
          refuses(
            { chunks: [], frameFormat, totalFrames: TOTAL_FRAMES },
            "at least one encoded render chunk",
          ),
      ],
      [
        "aChangedRasterIsRefusedByIndex",
        (): boolean =>
          refuses(
            {
              chunks: [chunks[0]!, narrowChunk],
              frameFormat,
              totalFrames: TOTAL_FRAMES,
            },
            "Render chunk 1 does not share the assembled raster",
          ),
      ],
      [
        "aNonH264ChunkIsRefused",
        (): boolean =>
          refuses(
            {
              chunks: [productionMpeg4Part2Mp4()],
              frameFormat,
              totalFrames: TOTAL_FRAMES,
            },
            "is not an H.264/AVC sample entry",
          ),
      ],
      [
        "aSingleChunkShortOfTheFilmIsRefused",
        (): boolean =>
          refuses(
            { chunks: [whole], frameFormat, totalFrames: TOTAL_FRAMES + 1 },
            `Chunked video assembly covers ${TOTAL_FRAMES} frames; expected ${TOTAL_FRAMES + 1}.`,
          ),
      ],
      [
        "manyChunksShortOfTheFilmAreRefused",
        (): boolean =>
          refuses(
            { chunks, frameFormat, totalFrames: TOTAL_FRAMES - 1 },
            "Assembled chunk video parses as",
          ),
      ],
      [
        "aRuntimePastTheExactClockIsRefused",
        (): boolean =>
          refuses(
            {
              // The frame count is safe; two ticks per frame make the media
              // duration 2 * (2^53 - 1), outside the safe-integer clock.
              chunks: twoTickChunks,
              frameFormat,
              totalFrames: Number.MAX_SAFE_INTEGER,
            },
            "exceeds the exact MP4 clock range",
          ),
      ],
    ]),
    {
      noChunksIsRefused: true,
      aChangedRasterIsRefusedByIndex: true,
      aNonH264ChunkIsRefused: true,
      aSingleChunkShortOfTheFilmIsRefused: true,
      manyChunksShortOfTheFilmAreRefused: true,
      aRuntimePastTheExactClockIsRefused: true,
    },
  );
}
