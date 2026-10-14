import type {
  IAutoMovieFilmTimeline,
} from "@automovie/interface";
import { productionVisualDeliveryOccurrence } from "@automovie/render";
import {
  assembleProductionChunkVideoMp4,
  conformProductionVisualDeliveryVideoMp4,
} from "@automovie/render/node";
import { TestValidator } from "@nestia/e2e";
import { BoxParser, type Sample, type createFile } from "mp4box";

import { productionSampleMp4 } from "../internal/productionMedia/productionSampleMp4";
import { productionInterframeH264Mp4 } from "../internal/productionMedia/productionInterframeH264Mp4";
import { rewriteProductionH264Mp4 } from "../internal/productionMedia/rewriteProductionH264Mp4";

const WIDTH: number = 16;
const HEIGHT: number = 16;
const FPS: number = 2;

function digest(digit: string): string {
  return `sha256:${digit.repeat(64)}`;
}

type Lane = { lane: "deterministic" | "repainted"; bytes: Uint8Array };

function timeline(
  counts: number[],
  totalFrames: number = counts.reduce((sum: number, count: number): number => sum + count, 0),
): IAutoMovieFilmTimeline {
  let startFrame: number = 0;
  return {
    version: 1,
    builder: "automovie.production.builder.v5",
    inputFingerprint: digest("1"),
    sourceDigest: digest("2"),
    id: "conform",
    fps: FPS,
    totalFrames,
    segments: counts.map((count: number, index: number): IAutoMovieFilmTimeline["segments"][number] => {
      const segment: IAutoMovieFilmTimeline["segments"][number] = {
        shot: `shot-${index}`,
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
}

/** The refusal message of `task`, or null when it returned. */
function refusal(task: () => unknown): string | null {
  try {
    task();
    return null;
  } catch (error) {
    // The conform boundary throws nothing but Error refusals.
    if (error instanceof Error) return error.message;
    throw error;
  }
}

function conform(film: IAutoMovieFilmTimeline, lanes: Lane[]): Uint8Array {
  return conformProductionVisualDeliveryVideoMp4({
    timeline: film,
    sources: film.segments.map((segment: IAutoMovieFilmTimeline["segments"][number], index: number): Parameters<typeof conformProductionVisualDeliveryVideoMp4>[0]["sources"][number] => ({
      occurrence: productionVisualDeliveryOccurrence(segment, index),
      ...lanes[index]!,
    })),
  });
}

/**
 * Explicit visual-lane conform refuses every source population that is not
 * the exact current film, naming the occurrence it cannot place.
 *
 * Scenarios:
 *
 * 1. A source population that does not join the timeline occurrences one to
 *    one, a non-cut transition, and an empty timeline are refused.
 * 2. Deterministic lanes must cite one identical current feature and may only
 *    begin at a sync sample after a repainted lane; a repainted lane must
 *    supply exactly its full shot on the shared presentation contract.
 * 3. A film whose declared frame count exceeds its occurrences is refused
 *    before any sample is written.
 * 4. Occurrences that overlap are refused by index instead of duplicating one
 *    frame and dropping another.
 * 5. A deterministic range of a frame-reordered feature must present exactly
 *    its own frames: a decode-order range that would show a later segment's
 *    frame is refused, while a range closed under reordering is admitted.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises actual lane conform with eight population/transition/source/coverage refusals, an overlapping occurrence, an open presentation range and an admitted closed reordered range. Exact messages distinguish the responsible boundary; the admitted case asserts successful conform rather than inspecting every output sample.
 * @evidence contracts/testing.md#independent-expectations Authored segment counts, source byte identities, 16-square versus 8-square rasters, a non-sync encoded second frame and the explicit [0,2,1,3] presentation permutation define each expected refusal independently of conform output. Literal diagnostic strings locate the failing occurrence; constructed sample-table fixtures establish container rules, not decoded picture correctness.
 * @evidence contracts/testing.md#distinguishing-cases Preserves missing joins, dissolve, empty timeline, differing deterministic sources, non-sync repaint crossing, partial repaint, changed presentation contract, uncovered frames, overlap, open reorder range and valid closed range. Adjacent video profile/container tests own profile projections and malformed MP4 storage; complete output sample comparison and decoded pictures remain outside this test, and truthful sync metadata remains a parser premise.
 * @evidence contracts/testing.md#execution-ownership The named test_production_visual_delivery_conform_refusals owns five portable synchronous scenario groups using resident authored MP4 samples and one stored encoded interframe fixture. MP4Box rewrites timing/container metadata in memory; no encoder, process, filesystem, browser or GPU starts, and no visual appearance is claimed.
 */
export function test_production_visual_delivery_conform_refusals(): void {
    function sampleInput(frameCount: number, width: number = WIDTH, height: number = HEIGHT): Uint8Array {
      return productionSampleMp4({ width, height, fps: FPS, frameCount });
    }
    const three: Uint8Array = sampleInput(3);
    const two: Uint8Array = sampleInput(2);
    const narrow: Uint8Array = sampleInput(2, WIDTH - 8, HEIGHT - 8);
    const whole: Uint8Array = sampleInput(5);
    const one: Uint8Array = sampleInput(1);
    // The x264 fixture's second frame is a predicted frame, the only non-sync
    // sample used here. The authored sample-table inputs are all sync samples.
    const interframe: Uint8Array = productionInterframeH264Mp4();
    const assembled: Uint8Array = assembleProductionChunkVideoMp4({
      chunks: [three, two],
      frameFormat: { fps: FPS, width: WIDTH, height: HEIGHT },
      totalFrames: 5,
    });
    const film: IAutoMovieFilmTimeline = timeline([3, 2]);
    const deterministic: (bytes: Uint8Array) => Lane = (bytes: Uint8Array): Lane => ({
      lane: "deterministic",
      bytes,
    });
    const repainted: (bytes: Uint8Array) => Lane = (bytes: Uint8Array): Lane => ({
      lane: "repainted",
      bytes,
    });
    const dissolved: IAutoMovieFilmTimeline = {
      ...film,
      segments: film.segments.map(
        (segment: IAutoMovieFilmTimeline["segments"][number], index: number): IAutoMovieFilmTimeline["segments"][number] =>
          index === 1
            ? {
                ...segment,
                transitionIn: { kind: "dissolve", durationFrames: 1 },
              }
            : segment,
      ),
    };
    TestValidator.equals(
      "every source population that is not the exact current film is refused",
      {
        unjoined: refusal((): Uint8Array =>
          conformProductionVisualDeliveryVideoMp4({
            timeline: film,
            sources: film.segments.slice(1).map((segment: IAutoMovieFilmTimeline["segments"][number], index: number): Parameters<typeof conformProductionVisualDeliveryVideoMp4>[0]["sources"][number] => ({
              occurrence: productionVisualDeliveryOccurrence(segment, index),
              ...deterministic(assembled),
            })),
          }),
        ),
        dissolved: refusal((): Uint8Array =>
          conform(dissolved, [
            deterministic(assembled),
            deterministic(assembled),
          ]),
        ),
        empty: refusal((): Uint8Array => conform(timeline([]), [])),
        differingDeterministic: refusal((): Uint8Array =>
          conform(film, [deterministic(assembled), deterministic(whole)]),
        ),
        nonSyncCrossing: refusal((): Uint8Array =>
          conform(timeline([1, 1]), [
            repainted(one),
            deterministic(interframe),
          ]),
        ),
        partialShot: refusal((): Uint8Array =>
          conform(film, [repainted(two), deterministic(assembled)]),
        ),
        changedContract: refusal((): Uint8Array =>
          conform(film, [repainted(three), repainted(narrow)]),
        ),
        uncovered: refusal((): Uint8Array =>
          conform(timeline([3, 2], 6), [repainted(three), repainted(two)]),
        ),
      },
      {
        unjoined:
          "Visual delivery sources must exactly join the current timeline occurrences.",
        dissolved:
          "Mixed visual delivery currently requires cut-only editing at occurrence 1.",
        empty: "Mixed visual delivery requires a non-empty timeline.",
        differingDeterministic:
          "Every deterministic lane must cite the same exact current feature source.",
        nonSyncCrossing:
          "Deterministic occurrence 1 cannot begin losslessly at its declared lane crossing.",
        partialShot:
          "Repaint occurrence 0 must supply the exact full-shot clip.",
        changedContract:
          "Visual delivery occurrence 1 changes the exact video presentation contract.",
        uncovered: "Visual delivery sources do not cover the current film.",
      },
    );

    // Frames 1 and 2 are decoded in swapped order, as a B-frame stream does:
    // presentation is delayed one tick so no sample presents before it decodes,
    // and one edit starting at that tick keeps the presentation untransformed.
    const reorderedFrames: number[] = [0, 2, 1, 3];
    const reordered: Uint8Array = rewriteProductionH264Mp4(sampleInput(4), {
      retime: (_sample: Sample, index: number): { dts: number; cts: number } => ({
        dts: index,
        cts: reorderedFrames[index]! + 1,
      }),
      mutate: (file: ReturnType<typeof createFile>, track: number): void => {
        const edit: InstanceType<typeof BoxParser.box.edts> = file.getTrackById(track).addBox(new BoxParser.box.edts());
        edit.addBox(new BoxParser.box.elst()).entries = [
          {
            segment_duration: 4,
            media_time: 1,
            media_rate_integer: 1,
            media_rate_fraction: 0,
          },
        ];
      },
    });
    const sixFrames: Uint8Array = sampleInput(6);
    const sixFilm: IAutoMovieFilmTimeline = timeline([3, 3]);
    const overlapping: IAutoMovieFilmTimeline = {
      ...sixFilm,
      segments: sixFilm.segments.map(
        (segment: IAutoMovieFilmTimeline["segments"][number], index: number): IAutoMovieFilmTimeline["segments"][number] =>
          index === 1 ? { ...segment, startFrame: 2, endFrame: 5 } : segment,
      ),
    };
    TestValidator.equals(
      "occurrences must be contiguous and deterministic ranges closed",
      {
        overlapping: refusal((): Uint8Array =>
          conform(overlapping, [
            deterministic(sixFrames),
            deterministic(sixFrames),
          ]),
        ),
        openRange: refusal((): Uint8Array =>
          conform(timeline([2, 2]), [deterministic(reordered), repainted(two)]),
        ),
        closedRange: refusal((): Uint8Array =>
          conform(timeline([1, 3]), [
            deterministic(reordered),
            deterministic(reordered),
          ]),
        ),
      },
      {
        overlapping:
          "Visual delivery occurrence 1 does not occupy the next continuous film frames.",
        openRange:
          "Deterministic occurrence 0 does not present exactly its own frames in decode order.",
        closedRange: null,
      },
    );
  }
