import { TestValidator } from "@nestia/e2e";
import { BoxParser, createFile, type Sample } from "mp4box";

import { normalizeProductionH264Mp4 } from "../../../../packages/render/src/node/normalizeProductionH264Mp4";
import { parseProductionMp4 } from "../internal/productionMedia/parseProductionMp4";

/**
 * H.264 container normalization preserves coded-sample metadata as well as bytes.
 *
 * Scenarios:
 *
 * 1. Nonzero leading, dependency, redundancy and degradation fields survive the
 *    color declaration rewrite instead of collapsing to sync-only defaults.
 * 2. A version-1 subsample entry retains its size, priority, discardability and
 *    codec-specific parameter word after normalization.
 * 3. The coded payload and sample clocks remain unchanged beside those fields.
 * 4. A negative composition offset keeps reordered presentation times signed
 *    instead of wrapping minus one into an unsigned 32-bit clock jump.
 *
 * @evidence contracts/testing.md#behavioral-verification The test normalizes independently authored MP4s and parses their outputs to assert dependency fields, subsample fields, coded payload and clock terms; dropped flags, a discarded subs box or an unsigned negative composition offset fails literal comparisons.
 * @evidence contracts/testing.md#independent-expectations The source trun word 0x06503456 follows ISO sample-flags bit positions, and the literal version-1 subs payload declares one six-byte partition with priority seven, discardability one and parameter word 0x12345678. Decode ordinals 0,1,2,3 and presentation ordinals 0,2,1,3 independently require composition offset minus one in the third sample, encoded as a signed version-1 trun under ISO/IEC 14496-12 section 8.8.8. Expected values are authored rather than copied from a product helper; no decoded-picture claim is made.
 * @evidence contracts/testing.md#distinguishing-cases Nonzero fields and an actual subs box distinguish preservation from mp4box's sync-only fragment defaults; reordered and ordinary presentation clocks distinguish signed negative offsets from zero and positive offsets. The chunk-assembly test owns unknown-zero fields, non-sync samples and cross-chunk clock transport.
 * @evidence contracts/testing.md#execution-ownership The discoverable unit function constructs and parses resident MP4 bytes with the public codec API and calls the product normalizer; it launches no encoder, browser, process or GPU and registers no external cases.
 */
export function test_production_mp4_sample_metadata(): void {
  const file: ReturnType<typeof createFile> = createFile();
  file.init({ brands: ["isom", "iso2", "mp41"], timescale: 2, duration: 1 });
  const track: number = file.addTrack({
    type: "avc1",
    hdlr: "vide",
    timescale: 2,
    media_duration: 1,
    duration: 1,
    width: 16,
    height: 16,
    // Parser-valid AVC configuration, not a decoder-valid picture claim.
    avcDecoderConfigRecord: Uint8Array.from([1, 66, 0, 10, 0xff, 0xe0, 0]).buffer,
  });
  file.addSample(track, Uint8Array.from([0, 0, 0, 2, 0x65, 0x2a]), {
    duration: 1,
    dts: 0,
    cts: 0,
    is_sync: true,
  });
  const fragment: (typeof file.moofs)[number] = file.moofs[0]!;
  const run: (typeof fragment.trafs)[number]["truns"][number] = fragment.trafs[0]!.truns[0]!;
  run.sample_flags[0] = 0x06503456;
  const subs: InstanceType<typeof BoxParser.box.subs> = new BoxParser.box.subs();
  subs.version = 1;
  // One entry, sample delta one, one partition, unsigned 32-bit partition size.
  subs.data = Uint8Array.from([
    0, 0, 0, 1, 0, 0, 0, 1, 0, 1,
    0, 0, 0, 6, 7, 1, 0x12, 0x34, 0x56, 0x78,
  ]);
  fragment.trafs[0]!.addBox(subs);
  fragment.computeSize();
  run.data_offset = fragment.size + 8;
  const source: Uint8Array = new Uint8Array(file.getBuffer().buffer);
  const normalized: Uint8Array = normalizeProductionH264Mp4(source);
  const parsed: ReturnType<typeof parseProductionMp4> = parseProductionMp4(normalized);
  const sample: Sample = parsed.file.getTrackSamplesInfo(parsed.movie.videoTracks[0]!.id)[0]!;
  TestValidator.predicate("subsample information survives the rewrite", sample.subsamples !== undefined);
  TestValidator.equals(
    "color normalization preserves independently authored sample metadata",
    {
      sync: sample.is_sync,
      leading: sample.is_leading,
      dependsOn: sample.depends_on,
      dependedOn: sample.is_depended_on,
      redundancy: sample.has_redundancy,
      priority: sample.degradation_priority,
      subsamples: sample.subsamples,
      payload: Array.from(normalized.subarray(sample.offset, sample.offset + sample.size)),
      duration: sample.duration,
      dts: sample.dts,
      cts: sample.cts,
    },
    {
      sync: true,
      leading: 1,
      dependsOn: 2,
      dependedOn: 1,
      redundancy: 1,
      priority: 0x3456,
      subsamples: [{ size: 6, priority: 7, discardable: 1, codec_specific_parameters: 0x12345678 }],
      payload: [0, 0, 0, 2, 0x65, 0x2a],
      duration: 1,
      dts: 0,
      cts: 0,
    },
  );
  const reordered: ReturnType<typeof createFile> = createFile();
  reordered.init({ brands: ["isom", "iso2", "mp41"], timescale: 2, duration: 4 });
  const reorderedTrack: number = reordered.addTrack({
    type: "avc1",
    hdlr: "vide",
    timescale: 2,
    media_duration: 4,
    duration: 4,
    width: 16,
    height: 16,
    avcDecoderConfigRecord: Uint8Array.from([1, 66, 0, 10, 0xff, 0xe0, 0]).buffer,
  });
  const presentation: readonly number[] = [0, 2, 1, 3];
  for (let index: number = 0; index < presentation.length; ++index) {
    reordered.addSample(reorderedTrack, Uint8Array.from([0, 0, 0, 2, 0x65, 0x30 + index]), {
      duration: 1,
      dts: index,
      cts: presentation[index]!,
      is_sync: true,
    });
    // Author the ISO signed offset representation independently of the adapter.
    reordered.moofs[index]!.trafs[0]!.truns[0]!.version = index === 2 ? 1 : 0;
  }
  const reorderedSource: Uint8Array = new Uint8Array(reordered.getBuffer().buffer);
  const reorderedInput: ReturnType<typeof parseProductionMp4> = parseProductionMp4(reorderedSource);
  TestValidator.equals(
    "independently authored signed input clock",
    reorderedInput.file.getTrackSamplesInfo(reorderedInput.movie.videoTracks[0]!.id).map((item: Sample): number[] => [item.dts, item.cts]),
    [[0, 0], [1, 2], [2, 1], [3, 3]],
  );
  const reorderedOutput: Uint8Array = normalizeProductionH264Mp4(reorderedSource);
  const reorderedResult: ReturnType<typeof parseProductionMp4> = parseProductionMp4(reorderedOutput);
  TestValidator.equals(
    "normalization preserves signed composition offsets and coded order",
    reorderedResult.file.getTrackSamplesInfo(reorderedResult.movie.videoTracks[0]!.id).map((item: Sample): { clock: number[]; payload: number[] } => ({
      clock: [item.duration, item.dts, item.cts],
      payload: Array.from(reorderedOutput.subarray(item.offset, item.offset + item.size)),
    })),
    [
      { clock: [1, 0, 0], payload: [0, 0, 0, 2, 0x65, 0x30] },
      { clock: [1, 1, 2], payload: [0, 0, 0, 2, 0x65, 0x31] },
      { clock: [1, 2, 1], payload: [0, 0, 0, 2, 0x65, 0x32] },
      { clock: [1, 3, 3], payload: [0, 0, 0, 2, 0x65, 0x33] },
    ],
  );
}
