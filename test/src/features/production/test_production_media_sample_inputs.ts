import { TestValidator } from "@nestia/e2e";

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
 */
export const test_production_media_sample_inputs = (): void => {
  const input = productionSampleMp4({width:16,height:8,fps:2,frameCount:1});
  const rewritten = rewriteProductionH264Mp4(input);
  const parsed = parseProductionMp4(rewritten);
  const track = parsed.movie.videoTracks[0]!;
  const sample = parsed.file.getTrackSamplesInfo(track.id)[0]!;
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
      () => productionSampleMp4({width:16,height:8,fps:2,frameCount:0}),
      "H.264 normalization requires resident video samples.",
    ),
  );
};
