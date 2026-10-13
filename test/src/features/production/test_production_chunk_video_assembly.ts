import {
  AutoMovieContentDigest,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";
import { productionVisualDeliveryOccurrence } from "@automovie/render";
import {
  assembleProductionChunkVideoMp4,
  assertProductionFeatureUsesRenditionVideo,
  conformProductionRenditionVideoMp4,
  conformProductionVisualDeliveryVideoMp4,
  probeProductionVideoMp4,
} from "@automovie/render/node";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { productionSampleMp4 } from "../internal/productionMedia/productionSampleMp4";
import { productionMpeg4Part2Mp4 } from "../internal/productionMedia/productionMpeg4Part2Mp4";
import { parseProductionMp4 } from "../internal/productionMedia/parseProductionMp4";

const WIDTH = 16;
const HEIGHT = 16;
const FPS = 2;

/** The chunk sizes one render job hands the final assembly, in play order. */
const CHUNK_FRAMES = [3, 2, 1];
const TOTAL_FRAMES = CHUNK_FRAMES.reduce((sum, count) => sum + count, 0);

const digest = (digit: string): AutoMovieContentDigest =>
  `sha256:${digit.repeat(64)}`;

/**
 * The same ranges expressed as a cut-only edit for cross-consumer parity.
 * The expected payload order and clocks are independently stated by the test;
 * two writers sharing an append helper are not an independent numerical oracle.
 */
const rangeTimeline = (): IAutoMovieFilmTimeline => {
  let startFrame = 0;
  return {
    version: 1,
    builder: "automovie.production.builder.v5",
    inputFingerprint: digest("1"),
    sourceDigest: digest("2"),
    id: "assembly",
    fps: FPS,
    totalFrames: TOTAL_FRAMES,
    segments: CHUNK_FRAMES.map((count, index) => {
      const segment = {
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
 * A long film's final video is assembled from the chunk encodes it already
 * committed, never re-encoded from the frames a second time.
 *
 * Re-encoding every frame of the film through one encoder is what bounded a
 * production: the cost grows with the frame count and the whole output has to
 * be resident inside a single encoder before anything can be published, so no
 * amount of patience finishes a long film. Each chunk was already encoded once,
 * probed, and published under a receipt, so the whole film is exactly those
 * samples in order. Copying them costs the bytes and nothing else, and it
 * cannot alter a reviewed pixel.
 *
 * This unit reads independently authored resident sample tables through the
 * actual parser and splice writers. It proves byte and clock transport; the
 * real encoder's decoded-picture interoperability is a separate generated
 * consumer observation.
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
 */
export const test_production_chunk_video_assembly = (): void => {
  const frameFormat = { fps: FPS, height: HEIGHT, width: WIDTH };
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
  const narrowChunk = productionSampleMp4({
    width: WIDTH - 8,
    height: HEIGHT - 8,
    fps: FPS,
    frameCount: 2,
  });
  const whole = productionSampleMp4({
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    frameCount: TOTAL_FRAMES,
  });
  const twoTickChunks = CHUNK_FRAMES.map((frameCount) =>
    productionSampleMp4({
      width: WIDTH,
      height: HEIGHT,
      fps: FPS,
      frameCount,
      ticksPerFrame: 2,
    }),
  );
  const scaledClock = probeProductionVideoMp4(
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

  const single = assembleProductionChunkVideoMp4({
    chunks: [whole],
    frameFormat,
    totalFrames: TOTAL_FRAMES,
  });
  TestValidator.equals(
    "an assembly spanning one chunk preserves that exact input container",
    namedFacts([
      [
        "theSingleChunkAssemblyIsByteIdentical",
        () => Buffer.from(single).equals(Buffer.from(whole)),
      ],
      [
        "theSingleChunkAssemblyCarriesTheWholeFilm",
        () => probeProductionVideoMp4(single).frameCount === TOTAL_FRAMES,
      ],
    ]),
    {
      theSingleChunkAssemblyIsByteIdentical: true,
      theSingleChunkAssemblyCarriesTheWholeFilm: true,
    },
  );

  const assembled = assembleProductionChunkVideoMp4({
    chunks,
    frameFormat,
    totalFrames: TOTAL_FRAMES,
  });
  const conformed = conformProductionRenditionVideoMp4({
    timeline: rangeTimeline(),
    clips: new Map(
      CHUNK_FRAMES.map((_count, index): [string, Uint8Array] => [
        `range-${index}`,
        chunks[index]!,
      ]),
    ),
  });
  const probe = probeProductionVideoMp4(assembled);
  const parsedAssembly = parseProductionMp4(assembled);
  const assembledSamples = parsedAssembly.file.getTrackSamplesInfo(
    parsedAssembly.movie.videoTracks[0]!.id,
  );
  // Each chunk's authored sample ordinal restarts at zero. This oracle comes
  // from the input construction, not another conform implementation.
  const inputOrdinals = [0, 1, 2, 0, 1, 0];
  TestValidator.equals(
    "assembly preserves input sample bytes and rebases every clock tick",
    assembledSamples.map((sample) => ({
      payload: Array.from(
        assembled.subarray(sample.offset, sample.offset + sample.size),
      ),
      duration: sample.duration,
      dts: sample.dts,
      cts: sample.cts,
    })),
    inputOrdinals.map((ordinal, index) => ({
      payload: [0, 0, 0, 2, 0x65, ordinal],
      duration: 1,
      dts: index,
      cts: index,
    })),
  );
  const timeline = rangeTimeline();
  const mixed = conformProductionVisualDeliveryVideoMp4({
    timeline,
    sources: timeline.segments.map((segment, index) => ({
      occurrence: productionVisualDeliveryOccurrence(segment, index),
      lane: index === 1 ? ("repainted" as const) : ("deterministic" as const),
      bytes: index === 1 ? chunks[index]! : assembled,
    })),
  });
  const mixedClockRefusal = throwsError(() => {
    const changedTimeline = {
      ...rangeTimeline(),
      fps: 2.000001,
      frameRate: { numerator: 2_000_001, denominator: 1_000_000 },
    };
    conformProductionVisualDeliveryVideoMp4({
      timeline: changedTimeline,
      sources: changedTimeline.segments.map((segment, index) => ({
        occurrence: productionVisualDeliveryOccurrence(segment, index),
        lane: index === 1 ? ("repainted" as const) : ("deterministic" as const),
        bytes: index === 1 ? chunks[index]! : assembled,
      })),
    });
  }, "unsupported-video-profile.frameRate");
  TestValidator.equals(
    "a many-chunk assembly carries every source sample onto one continuous clock",
    namedFacts([
      ["theAssemblyCoversEveryFrame", () => probe.frameCount === TOTAL_FRAMES],
      ["theAssemblyKeepsTheRaster", () => probe.width === WIDTH],
      ["theAssemblyKeepsTheRasterHeight", () => probe.height === HEIGHT],
      ["theAssemblyKeepsTheFrameClock", () => Math.abs(probe.fps - FPS) < 1e-9],
      [
        "theAssemblyRunsTheWholeFilm",
        () => Math.abs(probe.runtimeSeconds - TOTAL_FRAMES / FPS) < 1e-9,
      ],
      [
        "theAssemblyIsSampleIdenticalToTheSameRangesConformed",
        () => {
          assertProductionFeatureUsesRenditionVideo({
            feature: assembled,
            renditionVideo: conformed,
          });
          return true;
        },
      ],
      [
        "theAssemblyIsNotOneChunkVerbatim",
        () => Buffer.from(assembled).equals(Buffer.from(chunks[0]!)) === false,
      ],
      [
        "explicitMixedLanesPreserveTheSameSamples",
        () => {
          assertProductionFeatureUsesRenditionVideo({
            feature: mixed,
            renditionVideo: assembled,
          });
          return true;
        },
      ],
      ["mixedLanesRequireTheExactRationalClock", () => mixedClockRefusal],
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

  const interrupted = throwsError(
    () =>
      assembleProductionChunkVideoMp4({
        chunks: (function* () {
          yield chunks[0]!;
          throw new Error("the render worker was interrupted");
        })(),
        frameFormat,
        totalFrames: TOTAL_FRAMES,
      }),
    "the render worker was interrupted",
  );
  const resumed = assembleProductionChunkVideoMp4({
    chunks,
    frameFormat,
    totalFrames: TOTAL_FRAMES,
  });
  TestValidator.equals(
    "a resumed assembly publishes exactly what an uninterrupted one would have",
    namedFacts([
      ["theInterruptedAttemptFailed", () => interrupted],
      [
        "theResumedAssemblyIsByteIdentical",
        () => Buffer.from(resumed).equals(Buffer.from(assembled)),
      ],
    ]),
    {
      theInterruptedAttemptFailed: true,
      theResumedAssemblyIsByteIdentical: true,
    },
  );

  const refuses = (
    props: Parameters<typeof assembleProductionChunkVideoMp4>[0],
    message: string,
  ): boolean =>
    throwsError(() => assembleProductionChunkVideoMp4(props), message);
  TestValidator.equals(
    "an assembly refuses chunks it cannot splice without re-encoding them",
    namedFacts([
      [
        "noChunksIsRefused",
        () =>
          refuses(
            { chunks: [], frameFormat, totalFrames: TOTAL_FRAMES },
            "at least one encoded render chunk",
          ),
      ],
      [
        "aChangedRasterIsRefusedByIndex",
        () =>
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
        () =>
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
        () =>
          refuses(
            { chunks: [whole], frameFormat, totalFrames: TOTAL_FRAMES + 1 },
            `Chunked video assembly covers ${TOTAL_FRAMES} frames; expected ${TOTAL_FRAMES + 1}.`,
          ),
      ],
      [
        "manyChunksShortOfTheFilmAreRefused",
        () =>
          refuses(
            { chunks, frameFormat, totalFrames: TOTAL_FRAMES - 1 },
            "Assembled chunk video parses as",
          ),
      ],
      [
        "aRuntimePastTheExactClockIsRefused",
        () =>
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
};
