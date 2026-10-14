import { TestValidator } from "@nestia/e2e";
import type { Sample, Track } from "mp4box";

import { throwsError } from "../internal/predicates";
import { parseProductionMp4 } from "../internal/productionMedia/parseProductionMp4";
import { productionSampleMp4 } from "../internal/productionMedia/productionSampleMp4";
import { rewriteProductionH264Mp4 } from "../internal/productionMedia/rewriteProductionH264Mp4";

/**
 * Native container units receive independently authored sample bytes and clock
 * ticks rather than paying for an encoder or copying its output as an oracle.
 * No input in this scenario certifies decoded H.264 pixels.
 *
 * Scenarios:
 *
 * 1. Read a one-sample raster and default public native writer rewrite, with
 *    independently specified payload, clocks and sample count preserved.
 * 2. Refuse a zero-sample input at the real normalization admission boundary.
 *
 * @evidence contracts/testing.md#behavioral-verification Authors one AVC container, rewrites it through the existing public MP4 writer fixture, parses the result and compares raster, sample population, exact payload and integer clocks; the adjacent empty population must reach the normalizer's refusal.
 * @evidence contracts/testing.md#independent-expectations Literal dimensions, ticks and length-prefixed payload come from the authored fixture protocol rather than another probe result. Its empty AVC parameter sets do not constitute decoder-valid pictures or prove native H.264 interoperability.
 * @evidence contracts/testing.md#distinguishing-cases One sampled input distinguishes preservation from corruption of payload or clocks, and zero samples distinguish admission from fabricated video. Multi-track, sample residency and broader timing cases belong to separate media units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous entry owns resident container allocation, rewriting and parsing through existing fixtures; no encoder process, file, renderer, browser or GPU is opened and no foreign method is replaced.
 */
export function test_production_media_sample_inputs(): void {
  const input: Uint8Array = productionSampleMp4({width:16,height:8,fps:2,frameCount:1});
  const rewritten: Uint8Array = rewriteProductionH264Mp4(input);
  const parsed: ReturnType<typeof parseProductionMp4> = parseProductionMp4(rewritten);
  const track: Track = parsed.movie.videoTracks[0]!;
  const sample: Sample = parsed.file.getTrackSamplesInfo(track.id)[0]!;
  TestValidator.equals(
    "the native sample inventory agrees with the authored independent input",
    {
      raster: track.video,
      count: track.nb_samples,
      timescale: track.timescale,
      duration: track.duration,
      payload: Array.from(rewritten.subarray(sample.offset,sample.offset+sample.size)),
      clocks: [sample.duration,sample.dts,sample.cts],
    },
    {
      raster: {width:16,height:8},
      count:1,
      timescale:2,
      duration:1,
      payload:[0,0,0,2,0x65,0],
      clocks:[1,0,0],
    },
  );
  TestValidator.predicate(
    "the adjacent empty inventory is refused before it becomes delivered video",
    throwsError(
      (): Uint8Array => productionSampleMp4({width:16,height:8,fps:2,frameCount:0}),
      "H.264 normalization requires resident video samples.",
    ),
  );
}
